const express = require('express');
const router = express.Router();
const { creerExperience, getToutesExperiences } = require('../controllers/experienceSurMesure');

router.post('/experience-sur-mesure', creerExperience);
router.get('/toutes-experiences-sur-mesure', getToutesExperiences);

module.exports = router;
