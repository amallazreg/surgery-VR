const express = require('express');
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose');
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const User = require('./models/userModels');
const Forfait = require('./models/forfait');
const Abonnement = require ('./models/abonnement') ; 
const Paiement = require('./models/paiement')

const demandeDemoRoutes = require('./routes/demandeDemo');
const demandeDevisRoutes = require('./routes/demandeDevis');
const authRoute = require('./routes/authRoutes');
const adminRoute = require('./routes/adminRoutes');
const adminDemoRoute = require('./routes/admin/demandeDemo');
const adminDevisRoute = require('./routes/admin/demandeDevis');
const paymentRoute = require('./routes/clients/paiement')
const forfaitRoutes = require('./routes/clients/forfait');
const abonnementRoutes = require('./routes/clients/abonnement');



const app = express();
const PORT = process.env.PORT || 3000;

/* ========================
   CONFIGURATION CORS
======================== */

const allowedOrigins = [
  'http://localhost:4200',
  'https://surgery-vr.vercel.app'
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
  methods: ['GET', 'POST', 'PUT', 'DELETE' , 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

const getDateFin = () => {
  const date = new Date();
  date.setMonth(date.getMonth() + 1); // +1 mois
  return date;
};


app.post('/webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {

    const sig = req.headers['stripe-signature'];

    try {
      const event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );

      console.log("Webhook reçu :", event.type);

      if (event.type === 'checkout.session.completed') {
        const session = event.data.object;

        const userId    = session.metadata.userId;
        const forfaitId = session.metadata.forfaitId;
        const type      = session.metadata.type || 'nouveau'; // nouveau | renouvellement | upgrade

        if (!userId || !forfaitId) {
          console.log("Metadata manquante !");
          return res.json({ received: true });
        }

        const forfait = await Forfait.findById(forfaitId);
        if (!forfait) {
          console.log("Forfait introuvable !");
          return res.json({ received: true });
        }

        // ─────────────────────────────────────────
        // CAS 1 : Nouvel abonnement
        // ─────────────────────────────────────────
        if (type === 'nouveau') {
          const abonnement = await Abonnement.create({
            user: userId,
            forfait: forfaitId,
            experiencesRestantes: forfait.nbExperiences,
            stripeSessionId: session.id,
            status: 'active',
            dateDebut: new Date(),        
            dateFin: getDateFin()
          });

          await Paiement.create({
            user: userId,
            abonnement: abonnement._id,
            amount: session.amount_total / 100,
            currency: session.currency,
            stripeSessionId: session.id,
            status: 'paid'
          });

          console.log("✅ Nouvel abonnement créé !");
        }

        // ─────────────────────────────────────────
        // CAS 2 : Renouvellement (même forfait)
        // ─────────────────────────────────────────
        else if (type === 'renouvellement') {

          // Remettre l'abonnement existant à active + reset experiences
          const abonnement = await Abonnement.findOneAndUpdate(
            { user: userId, forfait: forfaitId },
            {
              status: 'active',
              experiencesRestantes: forfait.nbExperiences,
              dateDebut: new Date(),        
              dateFin: getDateFin(),
              stripeSessionId: session.id
            },
            { new: true }
          );

          await Paiement.create({
            user: userId,
            abonnement: abonnement._id,
            amount: session.amount_total / 100,
            currency: session.currency,
            stripeSessionId: session.id,
            status: 'paid'
          });

          console.log("✅ Abonnement renouvelé !");
        }

        // ─────────────────────────────────────────
        // CAS 3 : Upgrade vers forfait supérieur
        // ─────────────────────────────────────────
        else if (type === 'upgrade') {

          // Annuler l'ancien abonnement actif
          await Abonnement.findOneAndUpdate(
            { user: userId, status: 'active' },
            { status: 'cancelled' }
          );

          // Créer le nouvel abonnement avec le nouveau forfait
          const nouvelAbonnement = await Abonnement.create({
            user: userId,
            forfait: forfaitId,
            experiencesRestantes: forfait.nbExperiences,
            stripeSessionId: session.id,
            dateDebut: new Date(),        
            dateFin: getDateFin(),
            status: 'active'
          });

          await Paiement.create({
            user: userId,
            abonnement: nouvelAbonnement._id,
            amount: session.amount_total / 100,
            currency: session.currency,
            stripeSessionId: session.id,
            status: 'paid'
          });

          console.log("✅ Abonnement upgradé !");
        }
      }

      res.json({ received: true });

    } catch (err) {
      console.error("Erreur webhook:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
});

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

app.use('/client/forfaits', forfaitRoutes);
app.use('/client/payment',paymentRoute) ; 
app.use('/client/abonnements', abonnementRoutes);







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