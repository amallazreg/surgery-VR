const express = require('express');
const router = express.Router();
const {getAllForfaits,getForfaitById,createForfait,updateForfait,deleteForfait,getForfaitsByCible} = require('../../controllers/clients/forfait');
const { protect, authorize } = require('../../middlewares/auth'); 

router.get('/getAllForfaits', protect,authorize('admin'),getAllForfaits);          
router.get('/getForfaitById/:id', protect,getForfaitById);      
router.post('/createForfait', protect,authorize('admin'),createForfait);          
router.put('/updateForfait/:id',protect,authorize('admin'), updateForfait);       
router.delete('/deleteForfait/:id', protect,authorize('admin'),deleteForfait);    
router.get('/cible/:cible',protect, getForfaitsByCible);


module.exports = router;