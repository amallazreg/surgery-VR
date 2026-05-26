import torch
import io
import base64
import os
import cv2
import numpy as np
from PIL import Image
from huggingface_hub import hf_hub_download
from diffusers import StableDiffusionInstructPix2PixPipeline
import gc

torch.set_num_threads(2)

# ============================================================
# CONFIG
# ============================================================
DEVICE     = "cuda" if torch.cuda.is_available() else "cpu"
HF_REPO_ID = "amallazreg/surgery-vr-models"
CACHE_DIR  = os.path.join(os.path.dirname(__file__), "models_cache")

PROCEDURE_CONFIG = {
    "rhinoplastie": {
        "model_file": "unet_nose_ep30.pth",
        "available":  True,
        "label":      "Rhinoplastie",
        "prompt": (
            "ONLY modify the nose shape: make it slightly smaller "
            "and more symmetric. Preserve all skin texture, blemishes, "
            "spots, and lighting. DO NOT change anything except the nose."
        ),
    },
    "blepharoplastie": {
        "model_file": "unet_Eyebrow_ep30.pth",
        "available":  True,
        "label":      "Blépharoplastie",
        "prompt": (
            "Keep the face completely identical. Only lift the eyebrows "
            "slightly upward and make them slightly thicker. "
            "Natural and subtle result."
        ),
    },
    "lifting":             {"model_file": None, "available": False, "label": "Lifting Facial",          "prompt": ""},
    "augmentation_levres": {"model_file": None, "available": False, "label": "Augmentation des lèvres", "prompt": ""},
    "aucune_intervention": {"model_file": None, "available": False, "label": "Aucune intervention",     "prompt": ""},
}

_pipe_cache = {}

# ============================================================
# TÉLÉCHARGEMENT MODÈLE UNET UNIQUEMENT
# ============================================================
def get_model_path(filename: str) -> str:
    os.makedirs(CACHE_DIR, exist_ok=True)
    local_path = os.path.join(CACHE_DIR, filename)

    if os.path.exists(local_path):
        print(f"[CACHE] Modèle trouvé : {filename}")
        return local_path

    print(f"[HF] Téléchargement UNet : {filename}")
    hf_hub_download(
        repo_id=HF_REPO_ID,
        filename=filename,
        local_dir=CACHE_DIR,
        token=os.getenv("HF_TOKEN"),
    )
    return local_path

# ============================================================
# CHARGEMENT PIPELINE
# Le modèle de base instruct-pix2pix est téléchargé
# une seule fois et mis en cache local HuggingFace
# ============================================================
def get_pipe(unet_path: str):
    if unet_path in _pipe_cache:
        print("[CACHE] Pipeline déjà en mémoire")
        return _pipe_cache[unet_path]

    print("[MODEL] Chargement pipeline instruct-pix2pix...")
    print("[MODEL] Premier lancement : téléchargement ~3 Go (une seule fois)")

    pipe = StableDiffusionInstructPix2PixPipeline.from_pretrained(
        "timbrooks/instruct-pix2pix",
        torch_dtype    = torch.float32,
        safety_checker = None,
        low_cpu_mem_usage = True,
    )

    pipe.enable_attention_slicing(slice_size=1)
    if hasattr(pipe, 'enable_vae_slicing'):
        pipe.enable_vae_slicing()
    pipe.set_progress_bar_config(disable=True)
    pipe = pipe.to("cpu")

    print("[MODEL] Chargement UNet fine-tuné...")
    state_dict = torch.load(unet_path, map_location="cpu", weights_only=True)
    pipe.unet.load_state_dict(state_dict)
    pipe.unet.eval()

    for param in pipe.unet.parameters():
        param.requires_grad = False

    _pipe_cache[unet_path] = pipe
    print("[MODEL] Pipeline prêt !")
    return pipe

# ============================================================
# MASQUES FACIAUX
# ============================================================
def apply_nose_mask(before: Image.Image, generated: Image.Image, strength=0.7) -> Image.Image:
    before_np    = np.array(before).astype(np.float32) / 255.0
    generated_np = np.array(generated).astype(np.float32) / 255.0
    h, w         = before_np.shape[:2]

    face_cascade = cv2.CascadeClassifier(
        cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
    )
    gray  = cv2.cvtColor((before_np * 255).astype(np.uint8), cv2.COLOR_RGB2GRAY)
    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5)

    if len(faces) == 0:
        return generated

    x, y, fw, fh = faces[0]
    mask = np.zeros((h, w), dtype=np.float32)
    cv2.ellipse(mask,
        center=(x + fw//2, y + int(fh*0.55)),
        axes=(int(fw*0.18), int(fh*0.15)),
        angle=0, startAngle=0, endAngle=360,
        color=1.0, thickness=-1
    )
    mask     = cv2.GaussianBlur(mask, (15, 15), 7)
    mask_3ch = mask[:, :, np.newaxis]
    result   = np.clip((before_np + (generated_np - before_np) * mask_3ch * strength) * 255, 0, 255).astype(np.uint8)
    return Image.fromarray(result)


def apply_eyebrow_mask(before: Image.Image, generated: Image.Image, strength=0.7) -> Image.Image:
    before_np    = np.array(before).astype(np.float32) / 255.0
    generated_np = np.array(generated).astype(np.float32) / 255.0
    h, w         = before_np.shape[:2]

    face_cascade = cv2.CascadeClassifier(
        cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
    )
    gray  = cv2.cvtColor((before_np * 255).astype(np.uint8), cv2.COLOR_RGB2GRAY)
    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5)

    if len(faces) == 0:
        return generated

    x, y, fw, fh = faces[0]
    mask = np.zeros((h, w), dtype=np.float32)

    for brow_x in [x + int(fw*0.27), x + int(fw*0.73)]:
        cv2.ellipse(mask,
            center=(brow_x, y + int(fh*0.26)),
            axes=(int(fw*0.22), int(fh*0.07)),
            angle=0, startAngle=0, endAngle=360,
            color=1.0, thickness=-1
        )

    mask     = cv2.GaussianBlur(mask, (15, 15), 7)
    mask_3ch = mask[:, :, np.newaxis]
    result   = np.clip((before_np + (generated_np - before_np) * mask_3ch * strength) * 255, 0, 255).astype(np.uint8)
    return Image.fromarray(result)


def apply_mask(procedure: str, before: Image.Image, generated: Image.Image) -> Image.Image:
    if procedure == "rhinoplastie":
        return apply_nose_mask(before, generated)
    elif procedure == "blepharoplastie":
        return apply_eyebrow_mask(before, generated)
    return generated

# ============================================================
# IMAGE → BASE64
# ============================================================
def image_to_base64(img: Image.Image) -> str:
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=90)
    return base64.b64encode(buf.getvalue()).decode("utf-8")

# ============================================================
# GÉNÉRATION — fonction unique et propre
# ============================================================
def generate_simulation(image_bytes: bytes, procedure: str) -> dict:

    config = PROCEDURE_CONFIG.get(procedure)

    if not config:
        return {"success": False, "error": f"Procédure inconnue : {procedure}"}

    if not config["available"]:
        return {
            "success":   False,
            "available": False,
            "procedure": procedure,
            "label":     config["label"],
            "message":   f"Simulation '{config['label']}' disponible prochainement."
        }

    try:
        # 1. Charger le modèle
        model_path = get_model_path(config["model_file"])
        pipe       = get_pipe(model_path)

        # 2. Préparer l'image — 128x128 pour économiser RAM
        input_img = (
            Image.open(io.BytesIO(image_bytes))
            .convert("RGB")
            .resize((128, 128))
        )

        print(f"[GEN] {procedure} — génération en cours...")

        # 3. Inférence
        with torch.inference_mode():
            generated = pipe(
                prompt               = config["prompt"],
                image                = input_img,
                num_inference_steps  = 15,
                image_guidance_scale = 1.5,
                guidance_scale       = 7.5,
            ).images[0]

        print("[GEN] Terminé !")

        # 4. Appliquer masque
        result = apply_mask(procedure, input_img, generated)

        # 5. Encoder
        before_b64 = image_to_base64(input_img)
        after_b64  = image_to_base64(result)

        # 6. Libérer mémoire
        del generated, result
        gc.collect()

        return {
            "success":    True,
            "available":  True,
            "procedure":  procedure,
            "label":      config["label"],
            "before_b64": before_b64,
            "after_b64":  after_b64,
        }

    except MemoryError:
        _pipe_cache.clear()
        gc.collect()
        return {"success": False, "error": "Mémoire insuffisante. Réessayez."}

    except Exception as e:
        print(f"[ERROR] {e}")
        _pipe_cache.clear()
        gc.collect()
        return {"success": False, "error": str(e)}