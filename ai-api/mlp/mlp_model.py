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
    "aucune_intervention": "Proportions faciales dans les normes esthétiques"
}


def rule_based_procedure(ratios: dict, scores: dict) -> tuple[str, str]:

    nose_face = ratios.get("nose_face_ratio", 0)
    eye_face  = ratios.get("eye_face_ratio", 0)
    mouth_face = ratios.get("mouth_face_ratio", 0)
    symmetry  = scores.get("symmetry_score", 1)

    print(f"[MLP] nose_face_ratio : {nose_face:.4f}")
    print(f"[MLP] eye_face_ratio  : {eye_face:.4f}")
    print(f"[MLP] symmetry_score  : {symmetry:.4f}")

    scores_list = []

    if nose_face > 0.28:
        scores_list.append(("rhinoplastie", nose_face - 0.28))

    if eye_face > 0.65:
        scores_list.append(("blepharoplastie", eye_face - 0.65))

    if symmetry < 0.70:
        scores_list.append(("lifting", 1 - symmetry))

    if mouth_face < 0.28:
        scores_list.append(("augmentation_levres", 0.28 - mouth_face))

    if not scores_list:
        return "aucune_intervention", REASONS["aucune_intervention"]

    procedure = max(scores_list, key=lambda x: x[1])[0]
    return procedure, REASONS[procedure]
    nose_face    = ratios.get("nose_face_ratio", 0)
    mouth_face   = ratios.get("mouth_face_ratio", 0)
    eye_symmetry = ratios.get("eye_symmetry", 1)
    symmetry     = scores.get("symmetry_score", 1)

    # ── DEBUG temporaire ──────────────────────────────────
    print(f"[MLP] nose_face_ratio  : {nose_face:.4f}")
    print(f"[MLP] eye_symmetry     : {eye_symmetry:.4f}")
    print(f"[MLP] symmetry_score   : {symmetry:.4f}")
    print(f"[MLP] mouth_face_ratio : {mouth_face:.4f}")
    # ──────────────────────────────────────────────────────

    scores_list = []

    # Rhinoplastie : seuil relevé 0.20 → 0.28
    if nose_face > 0.28:
        scores_list.append(("rhinoplastie", nose_face - 0.28))

    # Blépharoplastie : seuil abaissé 0.85 → 0.75 + boost x2
    if eye_symmetry < 0.75:
        scores_list.append(("blepharoplastie", (1 - eye_symmetry) * 2))

    # Lifting
    if symmetry < 0.70:
        scores_list.append(("lifting", 1 - symmetry))

    # Augmentation lèvres
    if mouth_face < 0.28:
        scores_list.append(("augmentation_levres", 0.28 - mouth_face))

    if not scores_list:
        return "aucune_intervention", REASONS["aucune_intervention"]

    procedure = max(scores_list, key=lambda x: x[1])[0]
    return procedure, REASONS[procedure]


def predict_procedure(features: dict) -> dict:
    ratios = features.get("ratios", {})
    scores = features.get("scores", {})

    combined = {**ratios, **scores}

    # 1. Règles métier
    procedure, reason = rule_based_procedure(ratios, scores)

    # 2. MLP pour les probabilités
    vector = []
    for key in FEATURE_ORDER:
        value = combined.get(key)
        if value is None:
            return {"error": f"Feature manquante : {key}"}
        vector.append(value)

    X        = np.array(vector).reshape(1, -1)
    X_scaled = scaler.transform(X)

    probabilities = mlp.predict_proba(X_scaled)[0]

    confidence = 0.85 if procedure != "aucune_intervention" else round(float(max(probabilities)), 4)

    # 3. Alternatives
    nose_face    = ratios.get("nose_face_ratio", 0)
    mouth_face   = ratios.get("mouth_face_ratio", 0)
    eye_symmetry = ratios.get("eye_symmetry", 1)
    symmetry     = scores.get("symmetry_score", 1)

    alt_candidates = {
        "rhinoplastie":        max(0, nose_face - 0.28),
        "blepharoplastie":     max(0, (1 - eye_symmetry - 0.25) * 2),
        "lifting":             max(0, 1 - symmetry - 0.30),
        "augmentation_levres": max(0, 0.28 - mouth_face),
    }

    alternatives = [
        {"procedure": p, "confidence": round(min(0.5 + score, 0.9), 4)}
        for p, score in sorted(alt_candidates.items(), key=lambda x: x[1], reverse=True)
        if score > 0 and p != procedure
    ][:2]

    print(f"[MLP] → procédure recommandée : {procedure}")

    return {
        "procedure":    procedure,
        "confidence":   confidence,
        "reason":       reason,
        "alternatives": alternatives
    }