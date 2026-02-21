const mongoose = require('mongoose');
const EchantillonVideo = require('../models/echantillonVideo'); 
require('dotenv').config({ path: '../.env' });
// ===============================
// SCRIPT D'INITIALISATION DES ÉCHANTILLONS VIDÉO
// ===============================
// Ce script permet d'ajouter vos 8 vidéos Cloudinary dans la base de données

const echantillonsInitiaux = [
  {
    titre: "Chirurgie Cardiaque Avancée",
    description: "Découvrez une simulation réaliste des scénarios médicaux simulés qui pourraient inclure urgences ou gestes chirurgicaux",
    urlVideo: "https://res.cloudinary.com/dfxu0bo9o/raw/upload/v1771237387/watch_h880a0", 
    cloudinaryPublicId: "watch_h880a0", 
    duree: 10,
    categorie: "chirurgie",
    ordre: 1,
    actif: true
  },
  {
    titre: "Urgences Médicales",
    description: "Formation aux gestes d'urgence et premiers secours en environnement immersif",
    urlVideo: "https://res.cloudinary.com/dfxu0bo9o/raw/upload/so_14,du_10/v1771237899/watch_vtt2pq",
    cloudinaryPublicId: "watch_vtt2pq",
    duree: 10,
    categorie: "formation médicale",
    ordre: 2,
    actif: true
  },
  {
    titre: "une simulation clinique de radiographie",
    description: "une simulation de formation en radiographie en réalité virtuelle (VR)",
    urlVideo: "https://res.cloudinary.com/dfxu0bo9o/raw/upload/v1771238038/watch_eqvii0",
    cloudinaryPublicId: "watch_eqvii0",
    duree: 10,
    categorie: "mixte",
    ordre: 3,
    actif: true
  },
  {
    titre: "Human Anatomy VR",
    description: "une expérience immersive de réalité virtuelle (VR) qui permet d’explorer le corps humain en 3D de façon interactive",
    urlVideo: "https://res.cloudinary.com/dfxu0bo9o/raw/upload/v1771238489/watch_ztehj8",
    cloudinaryPublicId: "watch_ztehj8",
    duree: 10,
    categorie: "mixte",
    ordre: 4,
    actif: true
  },
  {
    titre: "Lipix VR Medical Simulation",
    description: "Ce type de contenu est utilisé pour apprendre des gestes, des procédures ou des étapes cliniques dans un environnement sûr",
    urlVideo: "https://res.cloudinary.com/dfxu0bo9o/raw/upload/v1771238622/watch_cmamg5",
    cloudinaryPublicId: "watch_cmamg5",
    duree: 10,
    categorie: "chirurgie",
    ordre: 5,
    actif: true
  },
  {
    titre: "Diagnostic Médical Avancé",
    description: "Développez vos compétences en diagnostic avec des cas cliniques réalistes",
    urlVideo: "https://res.cloudinary.com/dfxu0bo9o/raw/upload/v1771238801/PK7MIQxVUVw_lp76sd",
    cloudinaryPublicId: "PK7MIQxVUVw_lp76sd",
    duree: 10,
    categorie: "formation médicale",
    ordre: 6,
    actif: true
  },
  {
    titre: "Soins Intensifs en VR",
    description: "Formation immersive aux soins intensifs et réanimation",
    urlVideo: "https://res.cloudinary.com/dfxu0bo9o/raw/upload/v1771238888/T1oE4GL-cQI_ilxuqx",
    cloudinaryPublicId: "T1oE4GL-cQI_ilxuqx",
    duree: 10,
    categorie: "urgences",
    ordre: 7,
    actif: true
  },
  {
    titre: "Techniques Chirurgicales Modernes",
    description: "Découvrez les dernières techniques chirurgicales en réalité virtuelle",
    urlVideo: "https://res.cloudinary.com/dfxu0bo9o/raw/upload/v1771239035/soJgQsSjqhI_mm8elh",
    cloudinaryPublicId: "soJgQsSjqhI_mm8elh",
    duree: 10,
    categorie: "chirurgie",
    ordre: 8,
    actif: true
  }
];

// ===============================
// FONCTION D'INITIALISATION
// ===============================
const initialiserEchantillons = async () => {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGO_URI);

    console.log('✅ Connexion à MongoDB établie');

    // Vérifier si des échantillons existent déjà
    const count = await EchantillonVideo.countDocuments();
    
    if (count > 0) {
      console.log(`⚠️  ${count} échantillon(s) déjà présent(s) dans la base.`);
      console.log('Voulez-vous les supprimer et réinitialiser ? (Ctrl+C pour annuler)');
      
      // Attendre 5 secondes avant de continuer
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Supprimer les échantillons existants
      await EchantillonVideo.deleteMany({});
      console.log('🗑️  Échantillons existants supprimés');
    }

    // Insérer les nouveaux échantillons
    const resultats = await EchantillonVideo.insertMany(echantillonsInitiaux);
    
    console.log(`✅ ${resultats.length} échantillons ajoutés avec succès !`);
    console.log('\n📋 Liste des échantillons créés:');
    resultats.forEach((e, i) => {
      console.log(`   ${i + 1}. ${e.titre} (ID: ${e._id})`);
    });

    console.log('\n⚠️  IMPORTANT: N\'oubliez pas de remplacer les URLs Cloudinary par vos vraies URLs !');
    console.log('   - Éditez le fichier avec vos vrais liens vidéo');
    console.log('   - Relancez ce script pour mettre à jour');

  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error);
  } finally {
    // Fermer la connexion
    await mongoose.connection.close();
    console.log('\n👋 Connexion MongoDB fermée');
    process.exit(0);
  }
};


// Attendre 3 secondes avant de lancer
setTimeout(() => {
  initialiserEchantillons();
}, 3000);

// ===============================
// EXPORT POUR UTILISATION DIRECTE
// ===============================
module.exports = {
  initialiserEchantillons,
  echantillonsInitiaux
};