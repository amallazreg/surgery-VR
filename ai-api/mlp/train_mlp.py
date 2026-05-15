import pandas as pd
import numpy as np
import pickle
from sklearn.neural_network import MLPClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import (classification_report, 
                             confusion_matrix, 
                             accuracy_score,
                             roc_auc_score)
import warnings
warnings.filterwarnings("ignore")

# 1. Charger le dataset
print("Chargement du dataset...")
data = pd.read_csv("dataset.csv")

X = data.drop("procedure", axis=1) # 9 colonne numérique (features)
y = data["procedure"]

print(f"Features : {list(X.columns)}")
print(f"Procédures : {list(y.unique())}")

# 2. Split train/test (80% / 20%)
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)
print(f"\nTrain : {len(X_train)} exemples")
print(f"Test  : {len(X_test)} exemples")

# 3. Normalisation
print("\nNormalisation des features...")
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled  = scaler.transform(X_test)

# 4. Entraîner le MLP
print("Entraînement du MLP...")
mlp = MLPClassifier(
    hidden_layer_sizes=(64, 32, 16),
    activation="relu",
    max_iter=500,
    random_state=42,
    verbose=False
)
mlp.fit(X_train_scaled, y_train)
print("Entraînement terminé !")

# 5. Évaluation
y_pred = mlp.predict(X_test_scaled)

accuracy = accuracy_score(y_test, y_pred)

print("\n" + "="*50)
print("MÉTRIQUES D'ÉVALUATION")
print("="*50)

print(f"\nAccuracy : {accuracy*100:.2f}%")

print("\nClassification Report :")
print(classification_report(y_test, y_pred))

print("Confusion Matrix :")
cm = confusion_matrix(y_test, y_pred, labels=mlp.classes_)
cm_df = pd.DataFrame(cm, index=mlp.classes_, columns=mlp.classes_)
print(cm_df)

# AUC-ROC
y_proba = mlp.predict_proba(X_test_scaled)
auc = roc_auc_score(y_test, y_proba, multi_class="ovr", average="weighted")
print(f"\nAUC-ROC Score : {auc:.4f}")

print("\n" + "="*50)
print("INTERPRÉTATION")
print("="*50)
print(f"Accuracy {accuracy*100:.1f}% → ", end="")
if accuracy >= 0.90:
    print("Excellent !")
elif accuracy >= 0.80:
    print("Très bien !")
elif accuracy >= 0.70:
    print("Correct, améliorable")
else:
    print("À améliorer")

print(f"AUC-ROC {auc:.4f} → ", end="")
if auc >= 0.95:
    print("Excellent !")
elif auc >= 0.85:
    print("Très bien !")
else:
    print("Correct")

# 6. Sauvegarder le modèle et le scaler
print("\nSauvegarde du modèle...")
with open("mlp_model.pkl", "wb") as f:
    pickle.dump(mlp, f)

with open("scaler.pkl", "wb") as f:
    pickle.dump(scaler, f)

print("Modèle sauvegardé : mlp_model.pkl")
print("Scaler sauvegardé : scaler.pkl")
print("\nPhase 3.2 terminée avec succès !")