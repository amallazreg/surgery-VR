const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({

  // =========================
  // Commun à TOUS
  // =========================
  prenom: { type: String, required: true },
  nom: { type: String, required: true },

  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true,
    trim: true
  },

  motDePasse: { type: String, required: true },

  phone: { type: String },

  role: {
    type: String,
    enum: ['admin', 'medecin', 'etudiant'],
    required: true
  },

  statut: {
    type: String,
    enum: ['en_attente', 'approuve', 'rejete'],
    default: 'en_attente'
  },

  // =========================
  // Champs Médecin
  // =========================
  specialite: String,
  etablissement: String,
  ville: String,
  numeroOrdre: String,

  // =========================
  // Champs Étudiant
  // =========================
  universite: String,
  anneeEtude: String,
  encadrant: String,

  // =========================
  // Vérification
  // =========================
  objectif: String,

  documentVerification: String,

  createdAt: {
    type: Date,
    default: Date.now
  }

});


// ===============================
// Hash mot de passe
// ===============================
userSchema.pre('save', async function () {
  if (!this.isModified('motDePasse')) return;

  const salt = await bcrypt.genSalt(10);
  this.motDePasse = await bcrypt.hash(this.motDePasse, salt);
});


// ===============================
// Compare mot de passe
// ===============================
userSchema.methods.comparePassword = function (plainPassword) {
  return bcrypt.compare(plainPassword, this.motDePasse);
};


module.exports = mongoose.model('User', userSchema);
