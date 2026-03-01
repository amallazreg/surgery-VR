const express = require('express');
const router = express.Router();
const {
  getMonAbonnement,
  getHistoriqueAbonnements,
  getMesFactures,
  renouvelerAbonnement,
  upgradeAbonnement,
  getForfaitsUpgrade,
  telechargerFacture,
  getMesDroits,
  telechargerApk,
  activerFormation
} = require('../../controllers/clients/abonnement');

router.get('/mon-abonnement/:userId',getMonAbonnement);
router.get('/historique/:userId',getHistoriqueAbonnements);
router.get('/factures/:userId', getMesFactures);
router.get('/upgrade/disponibles/:userId', getForfaitsUpgrade);
router.post('/renouveler',renouvelerAbonnement);
router.post('/upgrade',upgradeAbonnement);
router.get('/facture/:paiementId', telechargerFacture);
router.get('/droits/:userId',getMesDroits);  
router.post('/telechargerApk/:userId',telechargerApk);       
router.post('/formation/:userId',activerFormation);       



module.exports = router;