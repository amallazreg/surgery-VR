import torch
import io
import base64
import os
import cv2
import numpy as np

from PIL import Image
from huggingface_hub import hf_hub_download
from diffusers import StableDiffusionInstructPix2PixPipeline

# ============================================================
# CONFIG
# ============================================================

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
HF_REPO_ID = "amallazreg/surgery-vr-models"
CACHE_DIR = os.path.join(os.path.dirname(__file__), "models_cache")

# ============================================================
# CONFIG DES PROCÉDURES
# ============================================================

PROCEDURE_CONFIG = {
    "rhinoplastie": {
        "model_file": "unet_nose_ep30.pth",
        "available":  True,
        "label":      "Rhinoplastie",
        "prompt": (
            "ONLY modify the nose shape: make it slightly smaller and more symmetric. "
            "Preserve all skin texture, blemishes, spots, and lighting. "
            "DO NOT change anything except the nose geometry."
        ),
    },
    "blepharoplastie": {
        "model_file": "unet_Eyebrow_ep30.pth",
        "available":  True,
        "label":      "Blépharoplastie",
        "prompt": (
            "Keep the face completely identical. "
            "Do not change identity, skin, lighting, hair, eyes or background. "
            "Only lift the eyebrows slightly upward to increase the space between "
            "the eyes and the eyebrows, and make the eyebrows slightly thicker. "
            "Natural and subtle result."
        ),
    },
    "lifting": {
        "model_file": None,
        "available":  False,
        "label":      "Lifting Facial",
        "prompt":     "",
    },
    "augmentation_levres": {
        "model_file": None,
        "available":  False,
        "label":      "Augmentation des lèvres",
        "prompt":     "",
    },
    "aucune_intervention": {
        "model_file": None,
        "available":  False,
        "label":      "Aucune intervention",
        "prompt":     "",
    },
}

# ============================================================
# CACHE PIPELINES
# ============================================================

_pipe_cache = {}

# ============================================================
# DOWNLOAD / CACHE MODÈLE
# ============================================================

def get_model_path(filename: str) -> str:
    os.makedirs(CACHE_DIR, exist_ok=True)
    local_path = os.path.join(CACHE_DIR, filename)

    if os.path.exists(local_path):
        print(f"[CACHE] Modèle trouvé localement : {filename}")
        return local_path

    print(f"[HF] Téléchargement : {filename}")
    hf_hub_download(
        repo_id=HF_REPO_ID,
        filename=filename,
        local_dir=CACHE_DIR,
        token=os.getenv("HF_TOKEN"),
    )
    print(f"[HF] Téléchargement terminé : {filename}")
    return local_path

# ============================================================
# CHARGEMENT PIPELINE
# ============================================================

def get_pipe(unet_path: str):
    if unet_path in _pipe_cache:
        print("[CACHE] Pipeline déjà en mémoire")
        return _pipe_cache[unet_path]

    print("[MODEL] Chargement pipeline InstructPix2Pix...")
    pipe = StableDiffusionInstructPix2PixPipeline.from_pretrained(
        "timbrooks/instruct-pix2pix",
        torch_dtype=torch.float32,
        safety_checker=None,
        low_cpu_mem_usage=True,
    )
    print("[MODEL] Pipeline chargé")

    pipe.enable_attention_slicing()
    pipe.set_progress_bar_config(disable=True)
    pipe = pipe.to("cpu")

    print("[MODEL] Chargement UNet fine-tuné...")
    state_dict = torch.load(unet_path, map_location="cpu", weights_only=True)
    print("[MODEL] State dict chargé")

    pipe.unet.load_state_dict(state_dict)
    print("[MODEL] UNet injecté")
    pipe.unet.eval()

    if DEVICE == "cuda":
        print("[CUDA] Déplacement vers GPU...")
        pipe = pipe.to("cuda")
        print("[CUDA] GPU prêt !")

    _pipe_cache[unet_path] = pipe
    print("[MODEL] Pipeline prêt !")
    return pipe

# ============================================================
# MASQUE NASAL
# ============================================================

def apply_nose_only_fixed(
    before_img: Image.Image,
    generated_img: Image.Image,
    blend_strength: float = 0.7
) -> Image.Image:

    before_np    = np.array(before_img).astype(np.float32) / 255.0
    generated_np = np.array(generated_img).astype(np.float32) / 255.0
    h, w         = before_np.shape[:2]

    face_cascade = cv2.CascadeClassifier(
        cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
    )
    gray  = cv2.cvtColor((before_np * 255).astype(np.uint8), cv2.COLOR_RGB2GRAY)
    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5)

    if len(faces) == 0:
        print("[MASK-NOSE] Visage non détecté, fallback généré brut")
        return generated_img

    x, y, fw, fh = faces[0]

    nose_center_x = x + fw // 2
    nose_center_y = y + int(fh * 0.55)
    nose_radius_x = int(fw * 0.18)
    nose_radius_y = int(fh * 0.15)

    print(f"[MASK-NOSE] center=({nose_center_x},{nose_center_y}), "
          f"radius=({nose_radius_x},{nose_radius_y})")

    mask = np.zeros((h, w), dtype=np.float32)
    cv2.ellipse(
        mask,
        center     = (nose_center_x, nose_center_y),
        axes       = (nose_radius_x, nose_radius_y),
        angle      = 0,
        startAngle = 0,
        endAngle   = 360,
        color      = 1.0,
        thickness  = -1
    )
    mask     = cv2.GaussianBlur(mask, (15, 15), 7)
    mask_3ch = mask[:, :, np.newaxis]
    result   = before_np + (generated_np - before_np) * mask_3ch * blend_strength
    result   = np.clip(result * 255, 0, 255).astype(np.uint8)

    return Image.fromarray(result)

# ============================================================
# MASQUE SOURCILS
# ============================================================

def apply_eyebrow_only(
    before_img: Image.Image,
    generated_img: Image.Image,
    blend_strength: float = 0.7
) -> Image.Image:

    before_np    = np.array(before_img).astype(np.float32) / 255.0
    generated_np = np.array(generated_img).astype(np.float32) / 255.0
    h, w         = before_np.shape[:2]

    face_cascade = cv2.CascadeClassifier(
        cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
    )
    gray  = cv2.cvtColor((before_np * 255).astype(np.uint8), cv2.COLOR_RGB2GRAY)
    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5)

    if len(faces) == 0:
        print("[MASK-EYEBROW] Visage non détecté, fallback généré brut")
        return generated_img

    x, y, fw, fh = faces[0]

    brow_center_y = y + int(fh * 0.26)
    brow_radius_x = int(fw * 0.22)
    brow_radius_y = int(fh * 0.07)
    brow_left_x   = x + int(fw * 0.27)
    brow_right_x  = x + int(fw * 0.73)

    print(f"[MASK-EYEBROW] gauche=({brow_left_x},{brow_center_y}), "
          f"droit=({brow_right_x},{brow_center_y}), "
          f"radius=({brow_radius_x},{brow_radius_y})")

    mask = np.zeros((h, w), dtype=np.float32)

    # Sourcil gauche
    cv2.ellipse(
        mask,
        center     = (brow_left_x, brow_center_y),
        axes       = (brow_radius_x, brow_radius_y),
        angle      = 0,
        startAngle = 0,
        endAngle   = 360,
        color      = 1.0,
        thickness  = -1
    )
    # Sourcil droit
    cv2.ellipse(
        mask,
        center     = (brow_right_x, brow_center_y),
        axes       = (brow_radius_x, brow_radius_y),
        angle      = 0,
        startAngle = 0,
        endAngle   = 360,
        color      = 1.0,
        thickness  = -1
    )

    mask     = cv2.GaussianBlur(mask, (15, 15), 7)
    mask_3ch = mask[:, :, np.newaxis]
    result   = before_np + (generated_np - before_np) * mask_3ch * blend_strength
    result   = np.clip(result * 255, 0, 255).astype(np.uint8)

    return Image.fromarray(result)

# ============================================================
# DISPATCH MASQUE SELON PROCÉDURE
# ============================================================

def apply_mask(
    procedure: str,
    before_img: Image.Image,
    generated_img: Image.Image
) -> Image.Image:
    if procedure == "rhinoplastie":
        return apply_nose_only_fixed(before_img, generated_img)
    elif procedure == "blepharoplastie":
        return apply_eyebrow_only(before_img, generated_img)
    else:
        return generated_img

# ============================================================
# IMAGE -> BASE64
# ============================================================

def image_to_base64(img: Image.Image) -> str:
    buffer = io.BytesIO()
    img.save(buffer, format="JPEG", quality=90)
    return base64.b64encode(buffer.getvalue()).decode("utf-8")

# ============================================================
# GÉNÉRATION
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
            "message":   f"La simulation pour '{config['label']}' sera disponible prochainement."
        }

    try:
        # 1. Charger le modèle
        model_path = get_model_path(config["model_file"])
        pipe       = get_pipe(model_path)

        # 2. Préparer l'image
        input_img = (
            Image.open(io.BytesIO(image_bytes))
            .convert("RGB")
            .resize((256, 256))
        )

        print(f"[INFERENCE] Génération {procedure} en cours...")

        # 3. Inférence
        torch.manual_seed(42)

        with torch.inference_mode():
            if DEVICE == "cuda":
                with torch.autocast("cuda"):
                    generated = pipe(
                        prompt               = config["prompt"],
                        image                = input_img,
                        num_inference_steps  = 30,
                        image_guidance_scale = 1.5,
                        guidance_scale       = 7.5,
                    ).images[0]
            else:
                generated = pipe(
                    prompt               = config["prompt"],
                    image                = input_img,
                    num_inference_steps  = 30,
                    image_guidance_scale = 1.5,
                    guidance_scale       = 7.5,
                ).images[0]

        print("[INFERENCE] Génération terminée !")

        # 4. Appliquer masque selon procédure
        print(f"[MASK] Application masque {procedure}...")
        result = apply_mask(procedure, input_img, generated)
        print("[MASK] Masque appliqué !")

        return {
            "success":    True,
            "available":  True,
            "procedure":  procedure,
            "label":      config["label"],
            "before_b64": image_to_base64(input_img),
            "after_b64":  image_to_base64(result),
        }

    except Exception as e:
        print(f"[ERROR] generate_simulation : {e}")
        return {"success": False, "error": str(e)}