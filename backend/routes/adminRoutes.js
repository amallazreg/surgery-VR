const express = require('express');
const router = express.Router();
const {listerTous,listerParStatut,approuverCompte,rejeterCompte} = require('../controllers/admin/CompteClient');
const { protect, authorize } = require('../middlewares/auth'); 


router.use(protect, authorize('admin'));

// 📋 Tous les comptes
router.get('/Tousclients', listerTous);

// ⏳ Comptes par statut
router.get('/clients/statut/:statut', listerParStatut);

// ✅ Approuver
router.put('/clients/:id/approuver', approuverCompte);

// ❌ Rejeter
router.put('/clients/:id/rejeter', rejeterCompte);

module.exports = router;
