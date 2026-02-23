const express = require('express');
const router = express.Router();
const paymentController = require('../../controllers/clients/payment'); // <- module complet

router.post('/create-checkout-session', paymentController.createCheckoutSession); // ✅ sans parenthèses

module.exports = router;