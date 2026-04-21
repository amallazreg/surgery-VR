const express = require('express');
const router  = express.Router();
const { protect }    = require('../../middlewares/auth');
const {
  getMonAbonnement,
  getHistoriqueAbonnements,
  getMesFactures,
  telechargerFacture,
  renouvelerAbonnement,
  upgradeAbonnement,
  getForfaitsUpgrade,
  getMesDroits,
  getMesExperiencesForfait,
} = require('../../controllers/etudiant/Abonnementetudiant ');



router.get('/abonnement/:userId',  protect, getMonAbonnement);

router.get('/historique/:userId', protect, getHistoriqueAbonnements);

router.get('/factures/:userId',  protect, getMesFactures);

router.get('/facture/:paiementId/pdf',  protect, telechargerFacture);

router.post('/renouveler', protect, renouvelerAbonnement);

router.post('/upgrade',  protect, upgradeAbonnement);

router.get('/forfaits-upgrade/:userId', protect, getForfaitsUpgrade);

router.get('/droits/:userId', protect, getMesDroits);

router.get('/experiences-forfait/:userId', protect, getMesExperiencesForfait);

module.exports = router;
