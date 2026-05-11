const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const { analyzeFace, generateSimulation } = require('../services/aiService');

const upload = multer({ storage: multer.memoryStorage() });

router.post('/analyze', upload.single('photo'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Aucune image reçue' });
        }
        const result = await analyzeFace(
            req.file.buffer,
            req.file.originalname
        );
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/simulate', upload.single('photo'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Aucune image reçue' });
        }
        const procedure = req.body.procedure;
        if (!procedure) {
            return res.status(400).json({ error: 'Procédure manquante' });
        }
        const result = await generateSimulation(
            req.file.buffer,
            req.file.originalname,
            procedure
        );
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;