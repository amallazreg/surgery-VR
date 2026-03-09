const mongoose = require('mongoose');

/**
 * AccesEtudiant
 * ─────────────────────────────────────────────────────────────
 * Créé automatiquement quand un étudiant active un CodeFormation
 *
 * Représente la session d'accès de l'étudiant aux expériences VR
 * de l'abonnement de son institution.
 *
 * Règle clé : l'accès est conditionné par l'abonnement parent.
 * → Si abonnement.status !== 'active' ou dateFin dépassée
 *   → l'étudiant est bloqué automatiquement (vérifié en temps réel).
 */
const accesEtudiantSchema = new mongoose.Schema({

  // L'étudiant qui a activé le code
  etudiant: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'Utilisateur',
    required: true,
  },

  // Le code utilisé pour obtenir cet accès
  codeFormation: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'CodeFormation',
    required: true,
    unique:   true, // un code ne peut ouvrir qu'un seul accès
  },

  // L'abonnement de l'institution (source de vérité pour l'expiration)
  abonnement: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'Abonnement',
    required: true,
  },

  // Snapshot des expériences au moment de l'activation
  // (si le forfait évolue après, l'étudiant garde ce qui était inclus)
  experiences: [{
    type: mongoose.Schema.Types.ObjectId,
    ref:  'Experience',
  }],

  statut: {
    type:    String,
    enum:    ['actif', 'expire', 'revoque'],
    default: 'actif',
  },

  dateActivation: {
    type:    Date,
    default: Date.now,
  },

  // Copie de abonnement.dateFin au moment de l'activation
  dateExpiration: {
    type:     Date,
    required: true,
  },

}, { timestamps: true });

// Index composé : un étudiant ne peut pas avoir deux accès
// actifs sur le même abonnement
accesEtudiantSchema.index({ etudiant: 1, abonnement: 1 }, { unique: true });

module.exports = mongoose.model('AccesEtudiant', accesEtudiantSchema);