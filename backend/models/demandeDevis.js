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

  // Statut de la demande
  statut: {
    type: String,
    enum: ['nouvelle', 'en_cours', 'envoyee'],
    default: 'nouvelle'
  },

  // ✨ NOUVEAUX CHAMPS POUR LE DEVIS
  devisCalcule: {
    // Détail du calcul
    coutLicences: { type: Number, default: 0 },
    coutCasquesVR: { type: Number, default: 0 },
    coutDeploiement: { type: Number, default: 0 },
    coutFormation: { type: Number, default: 0 },
    coutSupport: { type: Number, default: 0 },
    
    // Sous-total et remises
    sousTotal: { type: Number, default: 0 },
    remisePourcentage: { type: Number, default: 0 },
    montantRemise: { type: Number, default: 0 },
    
    // Total final
    totalHT: { type: Number, default: 0 },
    tauxTVA: { type: Number, default: 20 },
    montantTVA: { type: Number, default: 0 },
    totalTTC: { type: Number, default: 0 },
    
    // Métadonnées du calcul
    dateCalcul: { type: Date },
    formuleUtilisee: { type: String },
    parametresCalcul: { type: Object }
  },

  // Historique et tracking
  dateCreation: {
    type: Date,
    default: Date.now
  },
  
  dateTraitement: {
    type: Date
  },
  
  dateEnvoi: {
    type: Date
  },

  // Email envoyé
  historiqueEmails: [{
    dateEnvoi: {
      type: Date,
      default: Date.now
    },
    messageId: String,
    devisAttache: Boolean,
    statut: {
      type: String,
      enum: ['envoye', 'erreur'],
      default: 'envoye'
    }
  }],

  // Notes administrateur
  notesAdmin: { type: String }
}, {
  timestamps: true
});

// Index pour recherche rapide
demandeDevisSchema.index({ statut: 1, dateCreation: -1 });
demandeDevisSchema.index({ emailProfessionnel: 1 });
demandeDevisSchema.index({ nomEtablissement: 'text' });

module.exports = mongoose.model('DemandeDevis', demandeDevisSchema);