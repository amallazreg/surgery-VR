import pandas as pd
import numpy as np
import os

np.random.seed(42)
N = 800
BASE_DIR = os.path.dirname(__file__)

def recommander(row):
    # Rhinoplastie : nez large
    if row["nose_face_ratio"] > 0.28:
        return "rhinoplastie"
    # Blépharoplastie : yeux larges par rapport au visage
    elif row["eye_face_ratio"] > 0.65:
        return "blepharoplastie"
    # Lifting : symétrie faible
    elif row["symmetry_score"] < 0.80:
        return "lifting"
    # Augmentation lèvres
    elif row["mouth_face_ratio"] > 0.50:
        return "augmentation_levres"
    elif row["golden_ratio_score"] < 0.60:
        return "lifting"
    else:
        return "aucune_intervention"

# Valeurs réalistes basées sur de vrais visages
data = pd.DataFrame({
    "face_ratio":         np.random.uniform(0.55, 0.95, N),
    "nose_face_ratio":    np.random.uniform(0.20, 0.35, N),  # ← réaliste
    "mouth_face_ratio":   np.random.uniform(0.25, 0.55, N),
    "eye_face_ratio":     np.random.uniform(0.55, 0.80, N),  # ← réaliste
    "nose_mouth_ratio":   np.random.uniform(0.50, 0.90, N),
    "mouth_openness":     np.random.uniform(0.00, 0.15, N),
    "eye_symmetry":       np.random.uniform(0.90, 1.00, N),  # ← toujours élevé
    "symmetry_score":     np.random.uniform(0.65, 1.00, N),
    "golden_ratio_score": np.random.uniform(0.50, 1.00, N),
})

data["procedure"] = data.apply(recommander, axis=1)

data.to_csv(os.path.join(BASE_DIR, "dataset.csv"), index=False)

print("Dataset généré !")
print(f"Total : {len(data)}")
print("\nDistribution :")
print(data["procedure"].value_counts())