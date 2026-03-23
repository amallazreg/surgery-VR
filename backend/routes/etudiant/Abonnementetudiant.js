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

// ── GET /client/etudiant/abonnement/:userId
router.get('/abonnement/:userId',              protect, getMonAbonnement);

// ── GET /client/etudiant/historique/:userId
router.get('/historique/:userId',              protect, getHistoriqueAbonnements);

// ── GET /client/etudiant/factures/:userId
router.get('/factures/:userId',                protect, getMesFactures);

// ── GET /client/etudiant/facture/:paiementId/pdf
router.get('/facture/:paiementId/pdf',         protect, telechargerFacture);

// ── POST /client/etudiant/renouveler
router.post('/renouveler',                     protect, renouvelerAbonnement);

// ── POST /client/etudiant/upgrade
router.post('/upgrade',                        protect, upgradeAbonnement);

// ── GET /client/etudiant/forfaits-upgrade/:userId
router.get('/forfaits-upgrade/:userId',        protect, getForfaitsUpgrade);

// ── GET /client/etudiant/droits/:userId
router.get('/droits/:userId',                  protect, getMesDroits);

// ── GET /client/etudiant/experiences-forfait/:userId
router.get('/experiences-forfait/:userId',     protect, getMesExperiencesForfait);

module.exports = router;
