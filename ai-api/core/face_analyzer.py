import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
import numpy as np
import urllib.request
import os

import os

# Chemin compatible Windows et Linux
MODEL_PATH = os.path.join(os.path.dirname(__file__), "face_landmarker.task")
MODEL_URL = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task"

def download_model():
    if not os.path.exists(MODEL_PATH):
        print("📥 Téléchargement du modèle face_landmarker...")
        urllib.request.urlretrieve(MODEL_URL, MODEL_PATH)
        print("✅ Modèle téléchargé")

def analyze_face(image_bytes: bytes) -> dict:
    download_model()
    
    import cv2
    nparr = np.frombuffer(image_bytes, np.uint8)
    frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    if frame is None:
        return {"face_detected": False, "error": "Image invalide"}
    
    h, w = frame.shape[:2]
    
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    mp_image = mp.Image(
        image_format=mp.ImageFormat.SRGB,
        data=rgb
    )
    
    base_options = python.BaseOptions(model_asset_path=MODEL_PATH)
    options = vision.FaceLandmarkerOptions(
        base_options=base_options,
        num_faces=1
    )
    
    detector = vision.FaceLandmarker.create_from_options(options)
    result = detector.detect(mp_image)
    
    if not result.face_landmarks:
        return {"face_detected": False, "total_landmarks": 0,
                "image_size": {"width": w, "height": h}}
    
    landmarks = [
        {"x": lm.x * w, "y": lm.y * h, "z": lm.z}
        for lm in result.face_landmarks[0]
    ]
    
    return {
        "face_detected": True,
        "total_landmarks": len(landmarks),
        "image_size": {"width": w, "height": h},
        "landmarks": landmarks
    }