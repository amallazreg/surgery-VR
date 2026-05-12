import torch
import io
import base64
import os

from PIL import Image
from huggingface_hub import hf_hub_download
from diffusers import StableDiffusionInstructPix2PixPipeline

# ============================================================
# CONFIG
# ============================================================

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

HF_REPO_ID = "amallazreg/surgery-vr-models"

CACHE_DIR = os.path.join(
    os.path.dirname(__file__),
    "models_cache"
)

# ============================================================
# CONFIG DES PROCÉDURES
# ============================================================

PROCEDURE_CONFIG = {
    "rhinoplastie": {
        "model_file": "unet_nose_ep30.pth",
        "available": True,
        "label": "Rhinoplastie",
        "prompt": (
            "make the nose smaller and more refined, "
            "natural rhinoplasty result, realistic"
        ),
    },

    "blepharoplastie": {
        "model_file": None,
        "available": False,
        "label": "Blépharoplastie",
        "prompt": "",
    },

    "lifting": {
        "model_file": None,
        "available": False,
        "label": "Lifting Facial",
        "prompt": "",
    },

    "augmentation_levres": {
        "model_file": None,
        "available": False,
        "label": "Augmentation des lèvres",
        "prompt": "",
    },

    "aucune_intervention": {
        "model_file": None,
        "available": False,
        "label": "Aucune intervention",
        "prompt": "",
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

    # Déjà téléchargé
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

    # Pipeline déjà chargé
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

    # Optimisation mémoire
    pipe.enable_attention_slicing()

    # Désactive les barres tqdm
    pipe.set_progress_bar_config(disable=True)

    # IMPORTANT :
    # Charger sur CPU d'abord
    pipe = pipe.to("cpu")

    print("[MODEL] Chargement UNet fine-tuné...")

    state_dict = torch.load(
        unet_path,
        map_location="cpu",
        weights_only=True
    )

    print("[MODEL] State dict chargé")

    # Injection UNet entraîné
    pipe.unet.load_state_dict(state_dict)

    print("[MODEL] UNet injecté")

    pipe.unet.eval()

    # GPU seulement après chargement
    if DEVICE == "cuda":
        print("[CUDA] Déplacement vers GPU...")
        pipe = pipe.to("cuda")
        print("[CUDA] GPU prêt !")

    # Cache mémoire
    _pipe_cache[unet_path] = pipe

    print("[MODEL] Pipeline prêt !")

    return pipe

# ============================================================
# IMAGE -> BASE64
# ============================================================

def image_to_base64(img: Image.Image) -> str:

    buffer = io.BytesIO()

    img.save(
        buffer,
        format="JPEG",
        quality=90
    )

    return base64.b64encode(
        buffer.getvalue()
    ).decode("utf-8")

# ============================================================
# GÉNÉRATION
# ============================================================

def generate_simulation(
    image_bytes: bytes,
    procedure: str
) -> dict:

    config = PROCEDURE_CONFIG.get(procedure)

    # --------------------------------------------------------
    # Procédure inconnue
    # --------------------------------------------------------

    if not config:
        return {
            "success": False,
            "error": f"Procédure inconnue : {procedure}"
        }

    # --------------------------------------------------------
    # Procédure indisponible
    # --------------------------------------------------------

    if not config["available"]:
        return {
            "success": False,
            "available": False,
            "procedure": procedure,
            "label": config["label"],
            "message": (
                f"La simulation pour "
                f"'{config['label']}' "
                f"sera disponible prochainement."
            )
        }

    try:

        # ----------------------------------------------------
        # Chargement modèle
        # ----------------------------------------------------

        model_path = get_model_path(
            config["model_file"]
        )

        pipe = get_pipe(model_path)

        # ----------------------------------------------------
        # Préparation image
        # ----------------------------------------------------

        input_img = (
            Image.open(io.BytesIO(image_bytes))
            .convert("RGB")
            .resize((512, 512))
        )

        print("[INFERENCE] Génération en cours...")

        # ----------------------------------------------------
        # Inference
        # ----------------------------------------------------

        with torch.inference_mode():

            output = pipe(
                prompt=config["prompt"],
                image=input_img,
                num_inference_steps=10,
                image_guidance_scale=1.5,
                guidance_scale=7.0,
            ).images[0]

        print("[INFERENCE] Génération terminée !")

        # ----------------------------------------------------
        # Réponse API
        # ----------------------------------------------------

        return {
            "success": True,
            "available": True,
            "procedure": procedure,
            "label": config["label"],
            "before_b64": image_to_base64(input_img),
            "after_b64": image_to_base64(output),
        }

    except Exception as e:

        print(f"[ERROR] generate_simulation : {e}")

        return {
            "success": False,
            "error": str(e)
        }