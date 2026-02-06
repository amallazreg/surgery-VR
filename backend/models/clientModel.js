const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  typeCompte: {
    type: String,
    enum: ['medecin', 'etudiant'],
    required: true
  },

  prenom: { type: String, required: true },
  nom: { type: String, required: true },
  email: { type: String, required: true, unique: true },

  motDePasse: { type: String, required: true },

  // Champs Médecin
  specialite: String,
  etablissement: String,
  ville: String,
  numeroOrdre: String,

  // Champs Étudiant
  universite: String,
  anneeEtude: String,
  encadrant: String,

  // Commun
  objectif: { type: String, required: true },

  documentVerification: {
    type: String,
    required: true
  },

  statut: {
    type: String,
    enum: ['en_attente', 'approuve', 'rejete'],
    default: 'en_attente'
  },

  dateCreation: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Client', clientSchema);
