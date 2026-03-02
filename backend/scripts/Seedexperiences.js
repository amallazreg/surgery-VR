const mongoose   = require('mongoose');
const Experience = require('../models/experience');
require('dotenv').config({ path: '../.env' });

// ===============================
// SCRIPT D'INITIALISATION DES EXPÉRIENCES VR
// ===============================
// AVANT DE LANCER :
//   1. Crée un GitHub Release sur ton repo
//   2. Attache ton fichier RehabX.apk
//   3. Copie l'URL de téléchargement
//   4. Colle-la dans apkUrl ci-dessous
//   5. node scripts/seedExperiences.js

const experiencesInitiales = [
  {
    title:         'RehabX — Rééducation VR',
    description:   'Expérience de rééducation immersive en réalité virtuelle.',
    emoji:         '🏥',
    thumbClass:    'vrt-1',
    compatibility: 'Quest 2 & 3',
    apkVersion:    'v1.0.0',
    apkAndroid:    'Android 10+',
    apkSize:       '—',  // tu peux mettre la taille en Mo ici

    // ⚠️ REMPLACER par ton URL GitHub Release
    apkUrl:      'https://github.com/TON-USER/surveyvr-releases/releases/download/v1.0.0/RehabX.apk',
    apkFileName: 'RehabX.apk',

    // ⚠️ IDs de tes forfaits en BDD
    forfaits: [
      '699c4efe6026e418a522b400', // Pro
    ],

    respondents: 0,
    avgTime:     '—',
    rating:      null,
  },
];

const seedExperiences = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connexion MongoDB établie');

    const count = await Experience.countDocuments();
    if (count > 0) {
      console.log(`⚠️  ${count} expérience(s) déjà présente(s).`);
      console.log('Suppression dans 5 secondes... (Ctrl+C pour annuler)');
      await new Promise(resolve => setTimeout(resolve, 5000));
      await Experience.deleteMany({});
      console.log('🗑️  Expériences supprimées');
    }

    const resultats = await Experience.insertMany(experiencesInitiales);

    console.log(`\n✅ ${resultats.length} expérience(s) créée(s) :`);
    resultats.forEach((e, i) => {
      console.log(`   ${i + 1}. ${e.title}`);
      console.log(`      _id    : ${e._id}`);
      console.log(`      apkUrl : ${e.apkUrl}`);
    });

  } catch (error) {
    console.error('❌ Erreur :', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Connexion fermée');
    process.exit(0);
  }
};

setTimeout(() => { seedExperiences(); }, 2000);

module.exports = { seedExperiences, experiencesInitiales };