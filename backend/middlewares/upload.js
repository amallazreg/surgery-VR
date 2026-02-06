const multer = require('multer');
const path = require('path');
const fs = require('fs');

const dossierUpload = 'uploads/verifications';

// Créer le dossier s'il n'existe pas
if (!fs.existsSync(dossierUpload)) {
  fs.mkdirSync(dossierUpload, { recursive: true });
}

const stockage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, dossierUpload);
  },
  filename: (req, file, cb) => {
    const nomUnique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, nomUnique + path.extname(file.originalname));
  }
});

const filtreFichier = (req, file, cb) => {
  const typesAutorises = /pdf|jpg|jpeg|png/;
  const extensionValide = typesAutorises.test(
    path.extname(file.originalname).toLowerCase()
  );

  if (extensionValide) cb(null, true);
  else cb(new Error('Type de fichier non autorisé (PDF, JPG, PNG uniquement)'));
};

module.exports = multer({
  storage: stockage,
  fileFilter: filtreFichier
});
