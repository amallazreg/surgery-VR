#!/bin/bash

# Installer et démarrer FastAPI Python
cd ai-api
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 &

# Démarrer Node.js
cd ../backend
npm install
node server.js