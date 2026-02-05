const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const Schema = mongoose.Schema;

// Schéma principal de l'utilisateur
const UserSchema = new Schema({
  // Informations personnelles
  name: { type: String, required: true, trim: true },

  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true,
    trim: true
  },

  password: { type: String, required: true },

  phone: { type: String, trim: true },
 
  // Rôle utilisateur
  role: { 
    type: String, 
    enum: ['admin', 'user'], 
    default: 'user' 
  },

  // Date d’inscription
  createdAt: { type: Date, default: Date.now },
});


// ===============================
// Méthode de comparaison de mot de passe
// ===============================
UserSchema.methods.comparePassword = async function (userPassword) {
  try {
    return await bcrypt.compare(userPassword, this.password);
  } catch (error) {
    console.error('Erreur lors de la comparaison du mot de passe :', error);
    return false;
  }
};


// ===============================
// Hashage du mot de passe avant sauvegarde
// ===============================
UserSchema.pre('save', async function () {
  try {
    // Si le mot de passe n'a pas été modifié, ne rien faire
    if (!this.isModified('password')) return;

    const saltRounds = 10;
    const hash = await bcrypt.hash(this.password, saltRounds);

    this.password = hash;
  } catch (err) {
    throw err;
  }
});


// Export du modèle
module.exports = mongoose.model('User', UserSchema);
