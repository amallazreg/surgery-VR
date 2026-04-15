import os
import shutil
import random
from pathlib import Path

SOURCE_DIR = r"C:\Users\lazre\Desktop\HDA-PlasticSurgery"
OUTPUT_DIR = "data"
TRAIN_RATIO = 0.85
random.seed(42)

CATEGORIES = {
    "nose":        "rhinoplastie",
    "Eyelid":      "blepharoplastie",
    "facelift":    "lifting",
    "facialbones": "lifting",
    "Eyebrow":     "lifting",
}

def prepare():
    total_train = 0
    total_test = 0

    for folder, procedure in CATEGORIES.items():
        folder_path = os.path.join(SOURCE_DIR, folder)

        if not os.path.exists(folder_path):
            print(f"Dossier introuvable : {folder_path}")
            continue

        # Créer la structure des dossiers
        for split in ["train", "test"]:
            for phase in ["before", "after"]:
                Path(f"{OUTPUT_DIR}/{split}/{phase}").mkdir(parents=True, exist_ok=True)

        # Récupérer tous les fichiers .jpg
        all_files = [
            f for f in os.listdir(folder_path)
            if f.lower().endswith((".jpg", ".jpeg"))
        ]

        # Extraire les numéros de patients uniques
        patients = set()
        for f in all_files:
            # On prend tout ce qu'il y a avant le premier "_"
            num = f.split("_")[0]
            patients.add(num)

        patients = sorted(list(patients))
        random.shuffle(patients)

        split_idx = int(len(patients) * TRAIN_RATIO)
        train_patients = set(patients[:split_idx])
        test_patients = set(patients[split_idx:])

        print(f"\n{folder} ({procedure})")
        print(f"  Patients total : {len(patients)}")
        print(f"  Train patients : {len(train_patients)} | Test patients : {len(test_patients)}")

        # Copier les fichiers avec la bonne logique before/after
        copied_train = 0
        copied_test = 0

        for f in all_files:
            num = f.split("_")[0]
            name_lower = f.lower()

            # Déterminer le split
            split = "train" if num in train_patients else "test"

            # Déterminer before / after selon ta phrase
            if "_b" in name_lower:
                phase = "before"   # _b = before
            elif "_a" in name_lower:
                phase = "after"    # _a = after
            else:
                print(f"  Fichier ignoré (pas de _a ou _b) : {f}")
                continue

            # Renommer pour éviter les conflits de noms entre dossiers
            new_name = f"{folder}_{f}"
            dest_path = os.path.join(OUTPUT_DIR, split, phase, new_name)

            shutil.copy(os.path.join(folder_path, f), dest_path)

            if split == "train":
                copied_train += 1
            else:
                copied_test += 1

        print(f"  → Copiés : {copied_train} train | {copied_test} test")

        total_train += copied_train
        total_test += copied_test

    print("\n" + "="*50)
    print("RÉSUMÉ FINAL")
    print("="*50)
    print(f"Total images train : {total_train}")
    print(f"Total images test  : {total_test}")
    print(f"Structure créée dans : {OUTPUT_DIR}/")
    print("\nDataset prêt pour l'entraînement du GAN !")


if __name__ == "__main__":
    prepare()