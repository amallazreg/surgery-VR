const mongoose = require('mongoose');

const abonnementSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Utilisateur',
    required: true
  },
  forfait: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Forfait',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'cancelled'],
    default: 'active'
  },
  cible: {
    type:    String,
    enum:    ['professionnel', 'etudiant'],
    default: 'professionnel',
  },


  experiencesRestantes: { type: Number, required: true },

  apkRestants: { type: Number, default: 0 }, 

  formationUtilisee: { type: Boolean, default: false }, 

  
  codesFormation: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CodeFormation'
  }],
  
  
    // ─── NOUVEAU : expériences dont l'APK a été téléchargé ───
  // Persisté en BDD → survit au rechargement de page
  experiencesDebloquees: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Experience'
  }],


  dateDebut: { type: Date, default: Date.now },
  dateFin:   { type: Date },

  stripeSessionId: { type: String },
}, { timestamps: true });


abonnementSchema.pre(['find', 'findOne'], async function (next) {
  try {
    const Utilisateur = mongoose.model('Utilisateur');

    // Récupérer tous les userIds référencés dans les abonnements
    const abonnements = await mongoose.model('Abonnement')
      .find({}, 'user')
      .lean();

    const userIds = [...new Set(abonnements.map(a => a.user?.toString()).filter(Boolean))];

    if (userIds.length === 0) return next();

    // Trouver lesquels n'existent plus
    const usersExistants = await Utilisateur.find(
      { _id: { $in: userIds } },
      '_id'
    ).lean();

    const idsExistants = new Set(usersExistants.map(u => u._id.toString()));
    const idsOrphelins = userIds.filter(id => !idsExistants.has(id));

    if (idsOrphelins.length > 0) {
      await mongoose.model('Abonnement').deleteMany({
        user: { $in: idsOrphelins }
      });
      console.log(` ${idsOrphelins.length} user(s) introuvable(s) → abonnements supprimés`);
    }

    next();
  } catch (err) {
    console.error('Erreur nettoyage abonnements orphelins:', err);
    next(); 
  }
});

module.exports = mongoose.model('Abonnement', abonnementSchema);