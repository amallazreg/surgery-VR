const mongoose = require('mongoose');

const demandeDemoSchema = new mongoose.Schema({
  typeEtablissement: { type: String, required: true },
  pays: { type: String, required: true },
  ville: { type: String, required: true },

  domaineInteret: { type: String, required: true },

  objectifs: [{ type: String }], // checkbox

  nomInstitution: { type: String, required: true },
  emailProfessionnel: { type: String, required: true },
  telephone: { type: String, required: true },

  message: { type: String },
  consentement: { type: Boolean, required: true },

  statut: {
    type: String,
    enum: ['nouvelle', 'contactee', 'cloturee'],
    default: 'nouvelle'
  },

  dateCreation: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('DemandeDemo', demandeDemoSchema);
