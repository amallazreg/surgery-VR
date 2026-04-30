const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const User = require('../../models/userModels'); 
const Forfait = require('../../models/forfait');
const Abonnement = require('../../models/abonnement'); // ← AJOUTER

const createCheckoutSession = async (req, res) => {
  try {
    const { userId, forfaitId } = req.body;

    // ── Vérifier si un abonnement actif existe déjà ──────────────
    const abonnementActif = await Abonnement.findOne({ user: userId, status: 'active' })
      .populate('forfait', 'name');

    if (abonnementActif) {
      return res.status(409).json({
        message: `Vous avez déjà un abonnement actif (${abonnementActif.forfait?.name}). Veuillez utiliser le renouvellement ou l'upgrade.`,
        abonnementId: abonnementActif._id,
        dateFin: abonnementActif.dateFin,
      });
    }

    // ── Créer la session Stripe normalement ──────────────────────
    const forfait = await Forfait.findById(forfaitId);
    if (!forfait) {
      return res.status(404).json({ message: 'Forfait introuvable' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { name: forfait.name },
            unit_amount: forfait.price,
          },
          quantity: 1,
        },
      ],
      success_url: 'https://surgery-vr.vercel.app/client/abonnements?payment=success',
      cancel_url:  'https://surgery-vr.vercel.app/client/abonnements?payment=cancel',
      metadata: { userId, forfaitId }
    });

    res.json({ url: session.url });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { createCheckoutSession };