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

const { protect } = require('../../middlewares/auth'); 


router.get('/mon-abonnement/:userId',protect,getMonAbonnement);
router.get('/historique/:userId',protect,getHistoriqueAbonnements);
router.get('/factures/:userId', getMesFactures);
router.get('/upgrade/disponibles/:userId',protect, getForfaitsUpgrade);
router.post('/renouveler',protect,renouvelerAbonnement);
router.post('/upgrade',protect,upgradeAbonnement);
router.get('/facture/:paiementId', telechargerFacture);
router.get('/droits/:userId',getMesDroits);  
router.post('/telechargerApk/:userId',telechargerApk);       
router.post('/formation/:userId',activerFormation);       



module.exports = router;