const express = require("express");
const router = express.Router();
const { protect } = require('../../middlewares/auth');

const {getSessionForEtudiant,
    getResumeForEtudiant,
    getDetailsSession,
    getAllCertificatForEtudiant} = require("../../controllers/etudiant/formation")

router.get("/:userId",protect,getSessionForEtudiant );

router.get("/:userId/summary",protect,getResumeForEtudiant );

router.get("/:userId/session/:operationId",protect,getDetailsSession );

router.get("/:userId/certifications",protect,getAllCertificatForEtudiant);

module.exports = router;