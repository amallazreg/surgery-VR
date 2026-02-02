const express = require('express');
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;

// Connexion à la base de données

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Route de test
app.get('/api', (req, res) => {
  res.json({ message: 'API fonctionne!', database: 'MongoDB connecté' });
});

// Gestion des erreurs MongoDB
// Connexion à la base de données MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/surgeryvitrine')
  .then(() => {
    console.log('Connexion à la base de données réussie');
  })
  .catch((error) => {
    console.error('Erreur de connexion à la base de données:', error);
  });
// Définition d’une route de test
app.get('/', (req, res) => {
  res.send('Recrutement API is running!');
});


// Démarrage du serveur
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`✅ Serveur en cours d'exécution sur http://localhost:${port}`);
});
