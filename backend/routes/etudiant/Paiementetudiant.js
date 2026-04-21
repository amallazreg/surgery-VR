const express    = require('express');
const router     = express.Router();
const {createCheckoutSession} = require('../../controllers/etudiant/Paiementetudiant');

const { protect } = require('../../middlewares/auth'); 

router.use(protect);

router.post('/create-checkout-session', createCheckoutSession);

module.exports = router;