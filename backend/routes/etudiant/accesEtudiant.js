const express  = require('express');
const router     = express.Router();
const {getMesExperiences,getUnAcces,getAccesParAbonnement}  = require('../../controllers/etudiant/accesEtudiant');
const { protect, authorize } = require('../../middlewares/auth');


router.get('/mes-experiences',   protect, authorize('etudiant'), getMesExperiences);
router.get('/:accesId',  protect, authorize('etudiant'), getUnAcces);
router.get('/abonnement/:abonnementId',  protect, authorize('etudiant','professionnel', 'admin'), getAccesParAbonnement);

module.exports = router;