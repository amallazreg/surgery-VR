const mongoose = require('mongoose');

const demandeDemoSchema = new mongoose.Schema({
  typeEtablissement: { 
    type: String, 
    required: true 
  },
  pays: { 
    type: String, 
    required: true 
  },
  ville: { 
    type: String, 
    required: true 
  },
  domaineInteret: { 
    type: String, 
    required: true 
  },
  objectifs: [{ 
    type: String 
  }],
  nomInstitution: { 
    type: String, 
    required: true 
  },
  emailProfessionnel: { 
    type: String, 
    required: true 
  },
  telephone: { 
    type: String, 
    required: true 
  },
  message: { 
    type: String 
  },
  consentement: { 
    type: Boolean, 
    required: true 
  },
  statut: {
    type: String,
    enum: ['nouvelle', 'contactee', 'cloturee'],
    default: 'nouvelle'
  },
  dateCreation: {
    type: Date,
    default: Date.now
  },
  dateContact: {
    type: Date
  },
  dateCloture: {
    type: Date
  },
  // Nouvelles propriétés pour tracker les vidéos envoyées
  videosEnvoyees: [{
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EchantillonVideo'
    },
    titre: String,
    urlVideo: String,
    dateEnvoi: {
      type: Date,
      default: Date.now
    }
  }],
  // Pour tracker les emails
  historiqueEmails: [{
    dateEnvoi: {
      type: Date,
      default: Date.now
    },
    messageId: String,
    nbVideos: Number,
    statut: {
      type: String,
      enum: ['envoye', 'erreur'],
      default: 'envoye'
    }
  }]
}, {
  timestamps: true
});

// Index pour recherche rapide
demandeDemoSchema.index({ statut: 1, dateCreation: -1 });
demandeDemoSchema.index({ emailProfessionnel: 1 });
demandeDemoSchema.index({ nomInstitution: 'text' });

module.exports = mongoose.model('DemandeDemo', demandeDemoSchema);