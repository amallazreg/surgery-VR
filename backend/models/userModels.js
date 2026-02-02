const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcrypt');



// Schéma principal du candidat
const UserSchema = new Schema({
  // Informations personnelles
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String },
  dateOfBirth: { type: Date },
  address: { type: String },
  nationality: { type: String },

  // Rôle utilisateur
  role: { type: String, enum: ['admin', 'user'], default: 'user' },


  // Date d’inscription
  createdAt: { type: Date, default: Date.now },
});

// Méthode de comparaison de mot de passe
UserSchema.methods.comparePassword = async function (userPassword) {
  try {
    const isMatch = await bcrypt.compare(userPassword, this.password);
    return isMatch;
  } catch (error) {
    console.error('Erreur lors de la comparaison du mot de passe :', error);
    return false;
  }
};

// Hashage du mot de passe avant sauvegarde
UserSchema.pre('save', function (next) {
  const user = this;
  if (!user.isModified('password')) return next();
  const saltRounds = 10;

  bcrypt.hash(user.password, saltRounds, function (err, hash) {
    if (err) return next(err);
    user.password = hash;
    next();
  });
});

module.exports = mongoose.model('User', UserSchema);
