const express    = require('express');
const cors       = require('cors');
require('dotenv').config();
const mongoose   = require('mongoose');
const Stripe     = require('stripe');
const stripe     = Stripe(process.env.STRIPE_SECRET_KEY);

const chatRoutes = require('./routes/chatbot/chat');
const { initRAG } = require('././services/chatbot/ragService');


const User       = require('./models/userModels');
const Forfait    = require('./models/forfait');
const Abonnement = require('./models/abonnement');
const Paiement   = require('./models/paiement');

const demandeDemoRoutes  = require('./routes/demandeDemo');
const demandeDevisRoutes = require('./routes/demandeDevis');
const authRoute          = require('./routes/authRoutes');
const adminRoute         = require('./routes/adminRoutes');
const adminDemoRoute     = require('./routes/admin/demandeDemo');
const adminDevisRoute    = require('./routes/admin/demandeDevis');
const paymentRoute       = require('./routes/clients/paiement');
const forfaitRoutes      = require('./routes/clients/forfait');
const abonnementRoutes   = require('./routes/clients/abonnement');
const experienceRoutes = require('./routes/clients/experience');
const codeFormationRoutes = require('./routes/clients/codeFormation');
const accesEtudiantRoutes = require('./routes/etudiant/accesEtudiant') ; 
const paiementEtudiantRoutes = require('./routes/etudiant/Paiementetudiant') ; 
const abonnementEtudiantRoutes = require('./routes/etudiant/Abonnementetudiant') ; 


const app  = express();
const PORT = process.env.PORT || 3000;




const allowedOrigins = [
  'http://localhost:4200',
  'https://surgery-vr.vercel.app'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (!allowedOrigins.includes(origin)) {
      return callback(new Error('Origine non autorisée par CORS'), false);
    }
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT','PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));




const getDateFin = () => {
  const date = new Date();
  date.setMonth(date.getMonth() + 1);
  return date;
};




const buildAbonnementData = (userId, forfaitId, forfait, sessionId) => ({
  user:                  userId,
  forfait:               forfaitId,
  status:                'active',
  experiencesRestantes:  forfait.nbExperiences,
  apkRestants:           forfait.nbApk,     
  formationUtilisee:     false,              
  codesAcces:            [],               
  stripeSessionId:       sessionId,
  dateDebut:             new Date(),
  dateFin:               getDateFin()
});




app.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {

    const sig = req.headers['stripe-signature'];

    try {
      const event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );

      console.log('Webhook reçu :', event.type);

      if (event.type === 'checkout.session.completed') {
        const session = event.data.object;

        const userId    = session.metadata.userId;
        const forfaitId = session.metadata.forfaitId;
        const type      = session.metadata.type  || 'nouveau';
        const cible     = session.metadata.cible || 'professionnel'; // ← NOUVEAU

        if (!userId || !forfaitId) {
          console.log('Metadata manquante !');
          return res.json({ received: true });
        }

        const forfait = await Forfait.findById(forfaitId);
        if (!forfait) {
          console.log('Forfait introuvable !');
          return res.json({ received: true });
        }

        console.log(`📦 Traitement abonnement — cible: ${cible}, type: ${type}`);

        // ── buildData unifié selon la cible ────────────────
        const buildData = () => {
          const dateFin = new Date();

          if (cible === 'etudiant') {
            // Étudiant : durée basée sur dureeJours du forfait
            dateFin.setDate(dateFin.getDate() + (forfait.dureeJours || 30));
          } else {
            // Institution : 30 jours par défaut (comme avant)
            dateFin.setDate(dateFin.getDate() + 30);
          }

          return {
            user:                 userId,
            forfait:              forfaitId,
            cible,                                             // ← 'etudiant' ou 'professionnel'
            status:               'active',
            dateDebut:            new Date(),
            dateFin,
            experiencesRestantes: forfait.nbExperiences || 0,
            apkRestants:          cible === 'professionnel' ? (forfait.nbApk || 0) : 0,
            stripeSessionId:      session.id,
          };
        };

        // ──────────────────────────────────────
        // CAS 1 : Nouvel abonnement
        // ──────────────────────────────────────
        if (type === 'nouveau') {

          const abonnement = await Abonnement.create(buildData());

          await Paiement.create({
            user:            userId,
            abonnement:      abonnement._id,
            amount:          session.amount_total / 100,
            currency:        session.currency,
            stripeSessionId: session.id,
            status:          'paid',
          });

          console.log(`✅ Nouvel abonnement ${cible} créé !`);
        }

        // ──────────────────────────────────────
        // CAS 2 : Renouvellement (même forfait)
        // ──────────────────────────────────────
        else if (type === 'renouvellement') {

          const abonnement = await Abonnement.findOneAndUpdate(
            { user: userId, forfait: forfaitId, cible }, // ← filtre par cible
            buildData(),
            { new: true }
          );

          await Paiement.create({
            user:            userId,
            abonnement:      abonnement._id,
            amount:          session.amount_total / 100,
            currency:        session.currency,
            stripeSessionId: session.id,
            status:          'paid',
          });

          console.log(`✅ Abonnement ${cible} renouvelé !`);
        }

        // ──────────────────────────────────────
        // CAS 3 : Upgrade vers forfait supérieur
        // ──────────────────────────────────────
        else if (type === 'upgrade') {

          // Annuler l'ancien abonnement actif de la même cible
          await Abonnement.findOneAndUpdate(
            { user: userId, cible, status: 'active' }, // ← filtre par cible
            { status: 'cancelled' }
          );

          const nouvelAbonnement = await Abonnement.create(buildData());

          await Paiement.create({
            user:            userId,
            abonnement:      nouvelAbonnement._id,
            amount:          session.amount_total / 100,
            currency:        session.currency,
            stripeSessionId: session.id,
            status:          'paid',
          });

          console.log(`✅ Abonnement ${cible} upgradé !`);
        }
      }

      res.json({ received: true });

    } catch (err) {
      console.error('Erreur webhook:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
  }
);




app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ extended: true, limit: '500mb' }));

app.get('/', (req, res) => {
  res.send('API is running!');
});

app.get('/api', (req, res) => {
  res.json({ message: 'API fonctionne!', database: 'MongoDB connecté' });
});



mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Connexion à la base de données réussie'))
  .catch((error) => console.error('❌ Erreur de connexion à la base de données:', error));


app.use('/chatbot', chatRoutes);


app.use('/admin/demande',   demandeDemoRoutes);
app.use('/admin/demande',   demandeDevisRoutes);
app.use('/auth',            authRoute);
app.use('/admin',           adminRoute);
app.use('/adminDemoRoute',  adminDemoRoute);
app.use('/adminDevisRoute', adminDevisRoute);

app.use('/client/forfaits',      forfaitRoutes);
app.use('/client/payment',       paymentRoute);
app.use('/client/abonnements',   abonnementRoutes);

app.use('/admin/experiences',  experienceRoutes);
app.use('/client/experiences', experienceRoutes);

app.use('/client/codes', codeFormationRoutes);
app.use('/client/acces', accesEtudiantRoutes);


app.use('/client/etudiant/paiement', paiementEtudiantRoutes);
app.use('/client/etudiant', abonnementEtudiantRoutes);




app.use((err, req, res, next) => {
  console.error('Erreur globale:', err.message);
  res.status(err.status || 500).json({
    message: err.message || 'Erreur interne serveur'
  });
});




app.listen(PORT, async () => {
  console.log(`🚀 Serveur en cours d'exécution sur le port ${PORT}`);
  await initRAG();
});