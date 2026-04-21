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
  getExperiencesByForfait,
  updateExperience,
  getExperiencesForEtudiant,     
  getExperiencesForProfessionnel,
} = require('../../controllers/clients/experience');

const { protect, authorize } = require('../../middlewares/auth'); 



// ── Cloudinary Storage ──────────────────────────────────────
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder:        'surveyvr/apks',  // dossier dans Cloudinary
    resource_type: 'raw',            
    public_id: (req, file) => {
      const name = path.basename(file.originalname, path.extname(file.originalname));
      return `${name}-${Date.now()}`;
    },
  },
});



// ── Routes ADMIN 
router.post('/', protect, authorize('admin'),  createExperience);
router.get('/',     protect, authorize('admin'),  getAllExperiences);
router.put('/:id', protect, authorize('admin'),   updateExperience);   
router.delete('/:id', protect, authorize('admin'),deleteExperience);
router.get('/etudiants', protect, authorize('admin'),     getExperiencesForEtudiant);
router.get('/professionnels', protect, authorize('admin'),getExperiencesForProfessionnel);


// ── Routes CLIENT 
router.get('/mes-experiences/:userId',   protect  ,    getMesExperiences);
router.post('/download/:userId/:experienceId',protect, downloadExperienceApk);
router.get('/by-forfait/:forfaitId',         protect  , getExperiencesByForfait); 



module.exports = router;