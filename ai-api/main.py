from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Surgery AI API", version="1.0.0")

# CORS pour que ton Angular puisse appeler cette API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "ok", "message": "Surgery AI API is running"}

@app.post("/analyze")
async def analyze(file: UploadFile = File(...)):
    # Pour l'instant on retourne juste le nom du fichier reçu
    return {
        "status": "received",
        "filename": file.filename,
        "message": "Image reçue avec succès - analyse IA à venir"
    }