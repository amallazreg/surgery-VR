const mongoose = require('mongoose');

const paiementSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Utilisateur'
  },
  abonnement: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Abonnement'
  },
  amount: Number,
  currency: String,
  stripeSessionId: String,
  status: String
}, { timestamps: true });

module.exports = mongoose.model('Paiement', paiementSchema);