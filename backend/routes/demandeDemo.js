const express = require('express');
const router = express.Router();
const {creerDemandeDemo,getToutesDemandesDemo} = require('../controllers/demandeDemo');

// Créer une demande de démo
router.post('/demande-demo', creerDemandeDemo);

// Admin : récupérer toutes les demandes
router.get('/getToutes-demande-demo', getToutesDemandesDemo);

module.exports = router;
