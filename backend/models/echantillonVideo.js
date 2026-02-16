const mongoose = require('mongoose');

// ===============================
// Modèle pour les échantillons vidéo de démo
// ===============================
const echantillonVideoSchema = new mongoose.Schema({
  titre: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  urlVideo: {
    type: String,
    required: true
  },
  cloudinaryPublicId: {
    type: String,
    required: true
  },
  duree: {
    type: Number, // Durée en secondes
    default: 5
  },
  categorie: {
    type: String,
    enum: ['chirurgie', 'urgences', 'formation médicale', 'mixte'],
    default: 'autre'
  },

  actif: {
    type: Boolean,
    default: true
  },
  ordre: {
    type: Number,
    default: 0
  },
  dateAjout: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index pour recherche rapide
echantillonVideoSchema.index({ actif: 1, ordre: 1 });

module.exports = mongoose.model('EchantillonVideo', echantillonVideoSchema);