import torch
import requests
from contextlib import asynccontextmanager

from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from core.face_analyzer import analyze_face
from core.features import calculate_features
from mlp.mlp_model import predict_procedure

from gan.gan_service import (
    generate_simulation,
    get_model_path,
    get_pipe,
    _pipe_cache,
)

# ============================================================
# TIMEOUT HUGGINGFACE — évite RemoteDisconnected
# ============================================================

from huggingface_hub import configure_http_backend

def backend_factory() -> requests.Session:
    session = requests.Session()
    session.timeout = 600  # 10 minutes
    return session

configure_http_backend(backend_factory=backend_factory)

# ============================================================
# PRELOAD AU DÉMARRAGE
# ============================================================

@asynccontextmanager
async def lifespan(app: FastAPI):

    print("=" * 50)
    print("Démarrage Surgery AI API")
    print("=" * 50)

    # 1. Télécharger les fichiers .pth uniquement (pas charger en RAM)
    for filename in ["unet_nose_ep30.pth", "unet_Eyebrow_ep30.pth"]:
        try:
            get_model_path(filename)
            print(f"✅ {filename} : prêt")
        except Exception as e:
            print(f"[ERROR] {filename} : {e}")

    # 2. Précharger le pipeline de base instruct-pix2pix en cache HF
    #    (télécharge ~3GB une seule fois, mis en cache HuggingFace local)
    try:
        from diffusers import StableDiffusionInstructPix2PixPipeline
        print("📥 Vérification cache pipeline instruct-pix2pix...")
        StableDiffusionInstructPix2PixPipeline.from_pretrained(
            "timbrooks/instruct-pix2pix",
            torch_dtype=torch.float32,
            safety_checker=None,
            low_cpu_mem_usage=True,
        )
        print("✅ Pipeline instruct-pix2pix : prêt")
    except Exception as e:
        print(f"[ERROR] Pipeline : {e}")

    print("=" * 50)
    print("API prête !")
    print("=" * 50)

    yield

    # Libérer la mémoire à l'arrêt
    _pipe_cache.clear()
    print("Cache mémoire vidé")

# ============================================================
# FASTAPI APP
# ============================================================

app = FastAPI(
    title="Surgery AI API",
    version="1.0.0",
    lifespan=lifespan
)

# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/health")
def health_check():
    return {
        "status":  "ok",
        "message": "Surgery AI API is running",
        "cache":   list(_pipe_cache.keys()),  # modèles actuellement en RAM
    }

# ============================================================
# ANALYSE VISAGE
# ============================================================

@app.post("/analyze-face")
async def analyze_face_endpoint(
    file: UploadFile = File(...)
):
    image_bytes = await file.read()
    result      = analyze_face(image_bytes)

    if result.get("face_detected"):
        result["features"]       = calculate_features(result["landmarks"])
        result["recommendation"] = predict_procedure(result["features"])

    return result

# ============================================================
# GÉNÉRATION SIMULATION
# ============================================================

@app.post("/generate-simulation")
async def generate_simulation_endpoint(
    file:      UploadFile = File(...),
    procedure: str        = Form(...)
):
    try:
        image_bytes = await file.read()
        result      = generate_simulation(image_bytes, procedure)
        return JSONResponse(content=result)

    except Exception as e:
        print(f"[ERROR] /generate-simulation : {e}")
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": str(e)}
        )