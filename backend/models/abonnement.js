const mongoose = require('mongoose');

const abonnementSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Utilisateur',
    required: true
  },
  forfait: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Forfait',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'cancelled'],
    default: 'active'
  },
  experiencesRestantes: {
    type: Number,
    required: true
  },
  dateDebut: {
    type: Date,
    default: Date.now
  },
  dateFin: {
    type: Date
  },
  stripeSessionId: String
}, { timestamps: true });

module.exports = mongoose.model('Abonnement', abonnementSchema);