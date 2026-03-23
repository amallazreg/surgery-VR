const express    = require('express');
const router     = express.Router();
const paiementEtudiantController = require('../../controllers/etudiant/Paiementetudiant');


router.post('/create-checkout-session', paiementEtudiantController.createCheckoutSession);

module.exports = router;