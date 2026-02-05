const express = require('express');
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose');

const userRoute = require('./routes/userRoutes');


const app = express();
const PORT = process.env.PORT || 3000;

// Connexion à la base de données

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: 'http://localhost:4200', // Autorise uniquement les requêtes venant de cette origine
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Méthodes autorisées
  allowedHeaders: ['Content-Type', 'Authorization'], 
}));


// Route de test
app.get('/api', (req, res) => {
  res.json({ message: 'API fonctionne!', database: 'MongoDB connecté' });
});

// Gestion des erreurs MongoDB
// Connexion à la base de données MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/SurgeryVitrine')
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

app.use('/user', userRoute); 

// Démarrage du serveur
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`✅ Serveur en cours d'exécution sur http://localhost:${port}`);
});
