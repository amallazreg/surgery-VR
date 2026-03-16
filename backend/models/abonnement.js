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
  cible: {
    type:    String,
    enum:    ['professionnel', 'etudiant'],
    default: 'professionnel',
  },


  experiencesRestantes: { type: Number, required: true },

  apkRestants: { type: Number, default: 0 }, 

  formationUtilisee: { type: Boolean, default: false }, 

  
  codesFormation: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CodeFormation'
  }],
  
  
    // ─── NOUVEAU : expériences dont l'APK a été téléchargé ───
  // Persisté en BDD → survit au rechargement de page
  experiencesDebloquees: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Experience'
  }],


  dateDebut: { type: Date, default: Date.now },
  dateFin:   { type: Date },

  stripeSessionId: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Abonnement', abonnementSchema);