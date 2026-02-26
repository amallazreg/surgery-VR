const Abonnement = require('../../models/abonnement');
const Paiement = require('../../models/paiement');
const Forfait = require('../../models/forfait');
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// ─────────────────────────────────────────
// 1. GET — Abonnement actif de l'utilisateur (avec détails forfait)
// ─────────────────────────────────────────
const getMonAbonnement = async (req, res) => {
  try {
    const { userId } = req.params;

    const abonnement = await Abonnement.findOne({ user: userId, status: 'active' })
      .populate('forfait')
      .populate('user', 'nom prenom email');

    if (!abonnement) {
      return res.status(404).json({ message: 'Aucun abonnement actif trouvé' });
    }

    res.json(abonnement);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─────────────────────────────────────────
// 2. GET — Historique de tous les abonnements
// ─────────────────────────────────────────
const getHistoriqueAbonnements = async (req, res) => {
  try {
    const { userId } = req.params;

    const abonnements = await Abonnement.find({ user: userId })
      .populate('forfait')
      .sort({ createdAt: -1 });

    res.json(abonnements);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─────────────────────────────────────────
// 3. GET — Factures de l'utilisateur
// ─────────────────────────────────────────
const getMesFactures = async (req, res) => {
  try {
    const { userId } = req.params;

    const paiements = await Paiement.find({ user: userId })
      .populate({
        path: 'abonnement',
        populate: { path: 'forfait', select: 'name price' }
      })
      .sort({ createdAt: -1 });

    res.json(paiements);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─────────────────────────────────────────
// 4. POST — Renouveler l'abonnement (même forfait)
// ─────────────────────────────────────────
const renouvelerAbonnement = async (req, res) => {
  try {
    const { userId, abonnementId } = req.body;

    const abonnement = await Abonnement.findById(abonnementId).populate('forfait');
    if (!abonnement) {
      return res.status(404).json({ message: 'Abonnement introuvable' });
    }

    const forfait = abonnement.forfait;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { name: `Renouvellement — ${forfait.name}` },
            unit_amount: forfait.price,
          },
          quantity: 1,
        },
      ],
      success_url: 'https://surgery-vr.vercel.app/client/abonnements?payment=success',
      cancel_url:  'https://surgery-vr.vercel.app/client/abonnements?payment=cancel',
      metadata: {
        userId,
        forfaitId: forfait._id.toString(),
        type: 'renouvellement'
      }
    });

    res.json({ url: session.url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─────────────────────────────────────────
// 5. POST — Upgrade vers un forfait supérieur
// ─────────────────────────────────────────
const upgradeAbonnement = async (req, res) => {
  try {
    const { userId, nouveauForfaitId } = req.body;

    const nouveauForfait = await Forfait.findById(nouveauForfaitId);
    if (!nouveauForfait) {
      return res.status(404).json({ message: 'Forfait introuvable' });
    }

  

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { name: `Upgrade — ${nouveauForfait.name}` },
            unit_amount: nouveauForfait.price,
          },
          quantity: 1,
        },
      ],
      success_url: 'https://surgery-vr.vercel.app/client/abonnements?payment=success',
      cancel_url:  'https://surgery-vr.vercel.app/client/abonnements?payment=cancel',
      metadata: {
        userId,
        forfaitId: nouveauForfaitId,
        type: 'upgrade'
      }
    });

    res.json({ url: session.url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─────────────────────────────────────────
// 6. GET — Forfaits disponibles pour upgrade
// ─────────────────────────────────────────
const getForfaitsUpgrade = async (req, res) => {
  try {
    const { userId } = req.params;

    // Récupérer le forfait actuel
    const abonnementActuel = await Abonnement.findOne({ 
      user: userId, 
      status: 'active' 
    }).populate('forfait');

    if (!abonnementActuel) {
      return res.status(404).json({ message: 'Aucun abonnement actif' });
    }

    const prixActuel = parseInt(abonnementActuel.forfait.price);

    // Retourner uniquement les forfaits plus chers
    const forfaitsSupérieurs = await Forfait.find({
      price: { $gt: prixActuel }
    }).sort({ price: 1 });

    res.json({
      forfaitActuel: abonnementActuel.forfait,
      forfaitsDisponibles: forfaitsSupérieurs
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getMonAbonnement,
  getHistoriqueAbonnements,
  getMesFactures,
  renouvelerAbonnement,
  upgradeAbonnement,
  getForfaitsUpgrade
};