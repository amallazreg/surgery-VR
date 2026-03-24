const express    = require('express');
const router     = express.Router();
const {createCheckoutSession} = require('../../controllers/etudiant/Paiementetudiant');


router.post('/create-checkout-session', createCheckoutSession);

module.exports = router;