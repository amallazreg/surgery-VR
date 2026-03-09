const mongoose = require('mongoose');

/**
 * CodeFormation
 * ─────────────────────────────────────────────────────────────
 * Généré automatiquement lors de l'activation de la formation
 * par une institution (activerFormation).
 *
 * Un code = un étudiant autorisé à accéder aux expériences VR
 * de l'abonnement de l'institution.
 *
 * Règle clé : si l'abonnement de l'institution expire ou est
 * annulé → l'accès étudiant est bloqué en temps réel
 * (on vérifie abonnement.status + abonnement.dateFin à chaque requête).
 */
const codeFormationSchema = new mongoose.Schema({

  // Code unique saisi par l'étudiant (ex: "A3F2C1B0")
  code: {
    type:     String,
    required: true,
    unique:   true,
    uppercase: true,
    trim:     true,
    index:    true,   // recherche rapide par code
  },

  // Abonnement de l'institution qui a généré ce code
  abonnement: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'Abonnement',
    required: true,
  },

  // Institution propriétaire (dénormalisé pour simplifier les requêtes)
  institution: {
    type: mongoose.Schema.Types.ObjectId,
    ref:  'Utilisateur',
    required: true,
  },

  statut: {
    type:    String,
    enum:    ['disponible', 'utilise', 'expire', 'revoque'],
    default: 'disponible',
  },

  // Étudiant qui a activé ce code (null tant que non utilisé)
  etudiant: {
    type:    mongoose.Schema.Types.ObjectId,
    ref:     'Utilisateur',
    default: null,
  },

  // Rempli au moment de l'activation par l'étudiant
  dateUtilisation: {
    type:    Date,
    default: null,
  },

  // Héritée de abonnement.dateFin au moment de la génération
  dateExpiration: {
    type:     Date,
    required: true,
  },

}, { timestamps: true });

module.exports = mongoose.model('CodeFormation', codeFormationSchema);