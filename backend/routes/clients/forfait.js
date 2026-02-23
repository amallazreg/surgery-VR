const express = require('express');
const router = express.Router();
const {getAllForfaits,getForfaitById,createForfait,updateForfait,deleteForfait} = require('../../controllers/clients/forfait');

// Routes CRUD
router.get('/getAllForfaits', getAllForfaits);          
router.get('/getForfaitById/:id', getForfaitById);      
router.post('/createForfait', createForfait);          
router.put('/updateForfait/:id', updateForfait);       
router.delete('/deleteForfait/:id', deleteForfait);    

module.exports = router;