
const express    = require('express');
const router     = express.Router();
const {verifierCode,activerCode,getCodesAbonnement,revoquerCode}   = require('../../controllers/clients/codeFormation');
const { protect, authorize } = require('../../middlewares/auth');


router.post('/verifier', protect, authorize('etudiant'), verifierCode);
router.post('/activer',protect, authorize('etudiant') , activerCode);
router.get('/abonnement/:abonnementId',protect,authorize('professionnel', 'admin'), getCodesAbonnement);
router.patch('/:codeId/revoquer',protect, authorize('professionnel', 'admin'),  revoquerCode);

module.exports = router;