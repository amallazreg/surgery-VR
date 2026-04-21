const express = require('express');
const router = express.Router();
const {creerDemandeDemo,getToutesDemandesDemo} = require('../controllers/demandeDemo');
const { protect, authorize } = require('../middlewares/auth');


// Créer une demande de démo
router.post('/demande-demo', creerDemandeDemo);

// Admin : récupérer toutes les demandes
router.get('/getToutes-demande-demo',protect, authorize('admin'), getToutesDemandesDemo);

module.exports = router;
