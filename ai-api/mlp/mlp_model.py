import pickle
import numpy as np
import os

BASE_DIR = os.path.dirname(__file__)

with open(os.path.join(BASE_DIR, "mlp_model.pkl"), "rb") as f:
    mlp = pickle.load(f)

with open(os.path.join(BASE_DIR, "scaler.pkl"), "rb") as f:
    scaler = pickle.load(f)

FEATURE_ORDER = [
    "face_ratio", "nose_face_ratio", "mouth_face_ratio",
    "eye_face_ratio", "nose_mouth_ratio", "mouth_openness",
    "eye_symmetry", "symmetry_score", "golden_ratio_score"
]

REASONS = {
    "rhinoplastie":        "Ratio nez/visage élevé détecté",
    "blepharoplastie":     "Asymétrie oculaire détectée",
    "lifting":             "Score de symétrie faciale faible",
    "augmentation_levres": "Ratio bouche/visage élevé détecté",
    "aucune_intervention": "Proportions faciales dans les normes"
}

def predict_procedure(features: dict) -> dict:
    ratios = features.get("ratios", {})
    scores = features.get("scores", {})

    combined = {**ratios, **scores}

    vector = []
    for key in FEATURE_ORDER:
        value = combined.get(key)
        if value is None:
            return {"error": f"Feature manquante : {key}"}
        vector.append(value)

    X = np.array(vector).reshape(1, -1)
    X_scaled = scaler.transform(X)

    procedure   = mlp.predict(X_scaled)[0]
    probabilities = mlp.predict_proba(X_scaled)[0]
    confidence  = round(float(max(probabilities)), 4)

    all_procs = mlp.classes_
    alternatives = [
        {"procedure": p, "confidence": round(float(prob), 4)}
        for p, prob in sorted(
            zip(all_procs, probabilities),
            key=lambda x: x[1],
            reverse=True
        )
        if p != procedure
    ][:2]

    return {
        "procedure":    procedure,
        "confidence":   confidence,
        "reason":       REASONS.get(procedure, ""),
        "alternatives": alternatives
    }