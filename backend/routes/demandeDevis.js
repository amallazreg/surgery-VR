const express = require('express');
const router = express.Router();
const {creerDemandeDevis,getToutesDemandesDevis} = require('../controllers/demandeDevis');
const { protect, authorize } = require('../middlewares/auth'); // adapte le chemin


router.post('/demande-devis', creerDemandeDevis);
router.get('/getToutes-demande-devis',protect, authorize('admin'), getToutesDemandesDevis);

module.exports = router;
