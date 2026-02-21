const express = require('express');
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose');

const demandeDemoRoutes = require('./routes/demandeDemo');
const demandeDevisRoutes = require('./routes/demandeDevis');
const authRoute = require('./routes/authRoutes');
const adminRoute = require('./routes/adminRoutes');
const adminDemoRoute = require('./routes/admin/demandeDemo');
const adminDevisRoute = require('./routes/admin/demandeDevis');

const app = express();
const PORT = process.env.PORT || 3000;

/* ========================
   CONFIGURATION CORS
======================== */

const allowedOrigins = [
  'http://localhost:4200',
  'https://surgery-czdnp0r4u-amals-projects-e7d165d9.vercel.app'
];

app.use(cors({
  origin: function (origin, callback) {
    // Autorise les requêtes sans origin (Postman, mobile apps, etc.)
    if (!origin) return callback(null, true);

    if (!allowedOrigins.includes(origin)) {
      return callback(new Error('Origine non autorisée par CORS'), false);
    }

    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

/* ========================
   MIDDLEWARES
======================== */

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ========================
   ROUTES TEST
======================== */

app.get('/', (req, res) => {
  res.send('API is running!');
});

app.get('/api', (req, res) => {
  res.json({ message: 'API fonctionne!', database: 'MongoDB connecté' });
});

/* ========================
   CONNEXION MONGODB
======================== */

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ Connexion à la base de données réussie');
  })
  .catch((error) => {
    console.error('❌ Erreur de connexion à la base de données:', error);
  });

/* ========================
   ROUTES PRINCIPALES
======================== */

app.use('/admin/demande', demandeDemoRoutes);
app.use('/admin/demande', demandeDevisRoutes);
app.use('/auth', authRoute);
app.use('/admin', adminRoute);
app.use('/adminDemoRoute', adminDemoRoute);
app.use('/adminDevisRoute', adminDevisRoute);

/* ========================
   GESTION DES ERREURS
======================== */

app.use((err, req, res, next) => {
  console.error("Erreur globale:", err.message);

  res.status(err.status || 500).json({
    message: err.message || "Erreur interne serveur"
  });
});

/* ========================
   LANCEMENT SERVEUR
======================== */

app.listen(PORT, () => {
  console.log(`🚀 Serveur en cours d'exécution sur le port ${PORT}`);
});