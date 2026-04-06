const express = require('express');
const router = express.Router();
const multer = require('multer');
const { analyzeFace } = require('../services/aiService');

const upload = multer({ storage: multer.memoryStorage() });

router.post('/analyze', upload.single('photo'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Aucune image reçue' });
        }

        const result = await analyzeFace(req.file.buffer, req.file.originalname);
        res.json(result);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;