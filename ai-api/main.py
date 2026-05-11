from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from core.face_analyzer import analyze_face
from core.features import calculate_features
from mlp.mlp_model import predict_procedure
from gan.gan_service import generate_simulation

app = FastAPI(title="Surgery AI API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "ok", "message": "Surgery AI API is running"}

@app.post("/analyze-face")
async def analyze_face_endpoint(file: UploadFile = File(...)):
    image_bytes = await file.read()
    result      = analyze_face(image_bytes)

    if result.get("face_detected"):
        result["features"]       = calculate_features(result["landmarks"])
        result["recommendation"] = predict_procedure(result["features"])

    return result

@app.post("/generate-simulation")
async def generate_simulation_endpoint(
    file:      UploadFile = File(...),
    procedure: str        = Form(...)
):
    image_bytes = await file.read()
    result      = generate_simulation(image_bytes, procedure)
    return result