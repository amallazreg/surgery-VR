const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const User = require('../../models/userModels'); 
const Forfait = require('../../models/forfait')

const createCheckoutSession = async (req, res) => {
  try {
    const { userId, forfaitId } = req.body;

    // Récupérer le forfait choisi
    const forfait = await Forfait.findById(forfaitId);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: forfait.name,
            },
            unit_amount: forfait.price,
          },
          quantity: 1,
        },
      ],
      success_url: 'https://surgery-vr.vercel.app/success',
      cancel_url: 'https://surgery-vr.vercel.app/cancel',
      metadata: {
        userId,
        forfaitId
      }
    });

    res.json({ url: session.url });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
    createCheckoutSession
}