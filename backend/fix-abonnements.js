require('dotenv').config();
const mongoose = require('mongoose');
const Abonnement = require('./models/abonnement');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  console.log('✅ Connecté');

  // Trouver tous les abonnements sans dateFin
  const abonnements = await Abonnement.find({ dateFin: { $exists: false } });
  console.log(`${abonnements.length} abonnements sans dateFin trouvés`);

  for (const ab of abonnements) {
    const dateDebut = ab.dateDebut || ab.createdAt || new Date();
    const dateFin = new Date(dateDebut);
    dateFin.setMonth(dateFin.getMonth() + 1);

    await Abonnement.findByIdAndUpdate(ab._id, {
      dateDebut: dateDebut,
      dateFin: dateFin
    });

    console.log(`✅ Mis à jour: ${ab._id} → dateFin: ${dateFin}`);
  }

  console.log('🎉 Migration terminée !');
  mongoose.disconnect();
});