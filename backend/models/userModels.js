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


const deleteAbonnementsOnUserRemove = async function (next) {
  try {
    const Abonnement    = require('./abonnement');
    const CodeFormation = require('./codeFormation');

    // Trouver les abonnements liés à ce user
    const abonnements   = await Abonnement.find({ user: this._id }, '_id');
    const abonnementIds = abonnements.map(a => a._id);

    // Supprimer les codes de formation associés
    if (abonnementIds.length > 0) {
      await CodeFormation.deleteMany({ abonnement: { $in: abonnementIds } });
    }

    // Supprimer les abonnements
    await Abonnement.deleteMany({ user: this._id });

    console.log(`🗑️ User ${this._id} supprimé → ${abonnementIds.length} abonnement(s) nettoyé(s)`);
    next();
  } catch (err) {
    console.error('Erreur suppression abonnements du user:', err);
    next(err);
  }
};

userSchema.pre('deleteOne', { document: true, query: false }, deleteAbonnementsOnUserRemove);

userSchema.pre('remove', deleteAbonnementsOnUserRemove);

module.exports = mongoose.model('Utilisateur', userSchema);