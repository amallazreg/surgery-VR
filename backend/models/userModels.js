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

  telephone: { type: String },

  role: {
    type: String,
    enum: ['admin', 'professionnel', 'etudiant'],
    required: true
  },

  statut: {
    type: String,
    enum: ['en_attente', 'approuve', 'rejete'],
    default: 'en_attente'
  },

  // =========================
  // Champs Professionnel / Institution
  // =========================
  typeProfessionnel: {
    type: String,
    enum: ['professionnel', 'institution'] 
  },
  fonctionResponsable: String,        
  nomEtablissement: String,           
  adresse: String,                    
  numeroOrdreProfessionnel: String,  
  numeroImmatriculation: String,      
  documentProfessionnel: String,      

  // =========================
  // Champs Étudiant
  // =========================
  universite: String,                  
  specialite: String,                 
  niveauEtude: String,                
  numeroInscription: String,           
  documentEtudiant: String,            

  createdAt: {
    type: Date,
    default: Date.now
  }

});


userSchema.pre('save', async function () {
  if (!this.isModified('motDePasse')) return;

  const salt = await bcrypt.genSalt(10);
  this.motDePasse = await bcrypt.hash(this.motDePasse, salt);
});


userSchema.methods.comparePassword = function (motDePassePlain) {
  return bcrypt.compare(motDePassePlain, this.motDePasse);
};



module.exports = mongoose.model('Utilisateur', userSchema);