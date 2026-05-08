#!/bin/bash

# Installer les dépendances système pour mediapipe
apt-get install -y libgles2 libgl1-mesa-glx libglib2.0-0 2>/dev/null || true

# Démarrer FastAPI en arrière-plan
cd ai-api
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 &

# Démarrer Node.js
cd ../backend
node server.js