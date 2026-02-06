const express = require('express');
const router = express.Router();
const {creerDemandeDevis,getToutesDemandesDevis} = require('../controllers/demandeDevis');

router.post('/demande-devis', creerDemandeDevis);
router.get('/getToutes-demande-devis', getToutesDemandesDevis);

module.exports = router;
