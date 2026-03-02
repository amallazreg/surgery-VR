const express    = require('express');
const multer     = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const path       = require('path');
const router     = express.Router();
const upload = require('../../middlewares/upload')

const {
  createExperience,
  getAllExperiences,
  deleteExperience,
  getMesExperiences,
  downloadExperienceApk,
} = require('../../controllers/clients/experience');


// ── Cloudinary Storage ──────────────────────────────────────
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder:        'surveyvr/apks',  // dossier dans Cloudinary
    resource_type: 'raw',            // OBLIGATOIRE pour les .apk
    public_id: (req, file) => {
      const name = path.basename(file.originalname, path.extname(file.originalname));
      return `${name}-${Date.now()}`;
    },
  },
});



// ── Routes ADMIN ────────────────────────────────────────────
router.post('/',      upload.single('apk'), createExperience);
router.get('/',       getAllExperiences);
router.delete('/:id', deleteExperience);

// ── Routes CLIENT ───────────────────────────────────────────
router.get('/mes-experiences/:userId',         getMesExperiences);
router.post('/download/:userId/:experienceId', downloadExperienceApk);

module.exports = router;