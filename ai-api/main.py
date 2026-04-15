from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from core.face_analyzer import analyze_face
from core.features import calculate_features
from mlp.mlp_model import predict_procedure

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
    result = analyze_face(image_bytes)

    if result.get("face_detected"):
        result["features"] = calculate_features(result["landmarks"])
        result["recommendation"] = predict_procedure(result["features"])

    return result