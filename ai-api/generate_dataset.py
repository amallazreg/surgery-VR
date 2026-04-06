import pandas as pd
import numpy as np

np.random.seed(42)
N = 800

def recommander(row):
    if row["nose_face_ratio"] > 0.35 and row["symmetry_score"] > 0.75:
        return "rhinoplastie"
    elif row["eye_symmetry"] < 0.75:
        return "blepharoplastie"
    elif row["symmetry_score"] < 0.80:
        return "lifting"
    elif row["mouth_face_ratio"] > 0.50:
        return "augmentation_levres"
    elif row["golden_ratio_score"] < 0.60:
        return "lifting"
    else:
        return "aucune_intervention"

data = pd.DataFrame({
    "face_ratio":          np.random.uniform(0.55, 0.95, N),
    "nose_face_ratio":     np.random.uniform(0.20, 0.45, N),
    "mouth_face_ratio":    np.random.uniform(0.25, 0.55, N),
    "eye_face_ratio":      np.random.uniform(0.45, 0.75, N),
    "nose_mouth_ratio":    np.random.uniform(0.50, 0.90, N),
    "mouth_openness":      np.random.uniform(0.00, 0.15, N),
    "eye_symmetry":        np.random.uniform(0.60, 1.00, N),
    "symmetry_score":      np.random.uniform(0.65, 1.00, N),
    "golden_ratio_score":  np.random.uniform(0.50, 1.00, N),
})

data["procedure"] = data.apply(recommander, axis=1)

data.to_csv("dataset.csv", index=False)

print("Dataset généré avec succès !")
print(f"Total exemples : {len(data)}")
print("\nDistribution des procédures :")
print(data["procedure"].value_counts())