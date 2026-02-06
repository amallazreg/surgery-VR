const mongoose = require('mongoose');

const demandeDevisSchema = new mongoose.Schema({
  // Étape 1 - Établissement
  nomEtablissement: { type: String, required: true },
  typeEtablissement: { type: String, required: true },
  pays: { type: String, required: true },
  ville: { type: String, required: true },

  // Étape 2 - Besoins
  besoins: [{ type: String, required: true }],

  // Étape 3 - Dimensionnement
  nombreUtilisateurs: { type: String, required: true },
  nombreCasquesVR: { type: String, required: true },
  typeDeploiement: { type: String, required: true },
  delaiMiseEnOeuvre: { type: String, required: true },

  // Étape 4 - Contact
  prenom: { type: String, required: true },
  nom: { type: String, required: true },
  fonction: { type: String, required: true },
  emailProfessionnel: { type: String, required: true },
  telephone: { type: String, required: true },

  // Étape 5 - Finalisation
  budgetEstime: { type: String },
  message: { type: String },
  consentement: { type: Boolean, required: true },

  statut: {
    type: String,
    enum: ['nouvelle', 'en_cours', 'envoyee'],
    default: 'nouvelle'
  },

  dateCreation: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('DemandeDevis', demandeDevisSchema);
