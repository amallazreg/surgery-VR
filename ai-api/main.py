from contextlib import asynccontextmanager

from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware

from core.face_analyzer import analyze_face
from core.features import calculate_features
from mlp.mlp_model import predict_procedure

from gan.gan_service import (
    generate_simulation,
    get_model_path,
    get_pipe,
)

# ============================================================
# PRELOAD MODEL AU DÉMARRAGE
# ============================================================

@asynccontextmanager
async def lifespan(app: FastAPI):

    print("Préchargement du modèle GAN au démarrage...")

    try:
        model_path = get_model_path("unet_nose_ep30.pth")
        get_pipe(model_path)

        print("Modèle GAN prêt !")

    except Exception as e:
        print(f"[ERROR] Préchargement GAN : {e}")

    yield

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
        "status": "ok"
    }

# ============================================================
# ANALYSE VISAGE
# ============================================================

@app.post("/analyze-face")
async def analyze_face_endpoint(
    file: UploadFile = File(...)
):

    image_bytes = await file.read()

    result = analyze_face(image_bytes)

    if result.get("face_detected"):

        result["features"] = calculate_features(
            result["landmarks"]
        )

        result["recommendation"] = predict_procedure(
            result["features"]
        )

    return result

# ============================================================
# GÉNÉRATION SIMULATION
# ============================================================

@app.post("/generate-simulation")
async def generate_simulation_endpoint(
    file: UploadFile = File(...),
    procedure: str = Form(...)
):

    image_bytes = await file.read()

    return generate_simulation(
        image_bytes,
        procedure
    )