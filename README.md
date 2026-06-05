# SurgeryVitrine

Site vitrine de présentation de la solution **VR SurgeryVitrine**, une plateforme dédiée à la simulation et à la visualisation de procédures chirurgicales assistées par la réalité virtuelle et l'intelligence artificielle.

---

## 📋 Prérequis

Avant de démarrer le projet, assurez-vous d'avoir installé :

- Node.js
- Angular CLI
- Python 3.x
- FastAPI
- Uvicorn

---

## 🚀 Lancement du Backend

```bash
cd backend
nodemon server.js
```

Le serveur backend sera accessible sur le port configuré dans le projet.

---

## 🎨 Lancement du Frontend

```bash
cd frontend
ng serve
```

L'application Angular sera disponible à l'adresse :

```text
http://localhost:4200
```

---

## 🤖 Lancement du Module de Simulation Esthétique (IA)

```bash
cd ai-api

# Activation de l'environnement virtuel (Windows)
venv\Scripts\activate

# Démarrage de l'API FastAPI
uvicorn main_local:app --reload
```

L'API sera accessible sur :

```text
http://127.0.0.1:8000
```

---

## ☁️ Exécution du Modèle sur Google Colab

Pour exécuter le modèle d'intelligence artificielle sur Google Colab :

1. Ouvrir le notebook suivant :
   https://colab.research.google.com/drive/1wYGA6VmMrh5xkHFAmy8NMIKffykDoGN9

2. Sélectionner :
   - **Exécution** → **Modifier le type d'exécution**
   - **Accélérateur matériel** → **GPU T4**

3. Exécuter toutes les cellules du notebook.

---

## 🏗️ Architecture du Projet

```text
surgery-vitrine/
│
├── backend/        # API Node.js / Express
├── frontend/       # Application Angular
├── ai-api/         # API FastAPI pour la simulation esthétique
└── README.md
```

---

## 👩‍💻 Technologies Utilisées

- Angular
- Node.js
- Express.js
- MongoDB
- FastAPI
- Python
- Google Colab
- Intelligence Artificielle
- Réalité Virtuelle (VR)

---
