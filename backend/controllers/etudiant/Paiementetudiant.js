const Stripe      = require('stripe');
const stripe      = Stripe(process.env.STRIPE_SECRET_KEY);
const Forfait     = require('../../models/forfait');
const Abonnement  = require('../../models/abonnement');
const Paiement    = require('../../models/paiement'); 

const buildAbonnementEtudiantData = (userId, forfaitId, forfait, sessionId) => {
  const dateFin = new Date();
  dateFin.setDate(dateFin.getDate() + (forfait.dureeJours || 30));

  return {
    utilisateur:           userId,
    forfait:               forfaitId,
    cible:                 'etudiant',      
    status:                'active',
    dateDebut:             new Date(),
    dateFin:               dateFin,
    stripePaymentIntentId: sessionId,
  };
};


const createCheckoutSession = async (req, res) => {
  try {
    const { userId, forfaitId, type = 'nouveau' } = req.body;

    if (!userId || !forfaitId) {
      return res.status(400).json({ error: 'userId et forfaitId sont requis' });
    }

    const forfait = await Forfait.findOne({ _id: forfaitId, cible: 'etudiant' });
    if (!forfait) {
      return res.status(404).json({ error: 'Forfait étudiant introuvable' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode:                 'payment',
      line_items: [
        {
          price_data: {
            currency:     'usd',
            product_data: { name: `Forfait Étudiant — ${forfait.name}` },
            unit_amount:  forfait.price * 100, // en centimes
          },
          quantity: 1,
        },
      ],
      success_url: 'https://surgery-vr.vercel.app/etudiant/forfaits?payment=success',
      cancel_url:  'https://surgery-vr.vercel.app/etudiant/forfaits?payment=cancel',
      metadata: { userId, forfaitId, type }, // type: nouveau | renouvellement | upgrade
    });

    res.json({ url: session.url });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { createCheckoutSession };