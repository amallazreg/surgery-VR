const Stripe  = require('stripe');
const stripe  = Stripe(process.env.STRIPE_SECRET_KEY);
const Forfait = require('../../models/forfait');


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
            unit_amount:  forfait.price * 100,
          },
          quantity: 1,
        },
      ],
      success_url: 'https://surgery-vr.vercel.app/etudiant/mesExperiencesVR?payment=success',
      cancel_url:  'https://surgery-vr.vercel.app/etudiant/mesExperiencesVR?payment=cancel',
      metadata: {
        userId,
        forfaitId,
        type,
        cible: 'etudiant',  // ← OBLIGATOIRE — lu par le webhook pour créer cible:'etudiant'
      },
    });

    res.json({ url: session.url });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { createCheckoutSession };