const express = require('express');
const router = express.Router();
const { sendMessage, getHistory, clearHistory} = require('../../controllers/chatbot/chat');


router.post('/message',           sendMessage);
router.get('/history/:userId',    getHistory);
router.delete('/clear/:userId',   clearHistory);

module.exports = router;