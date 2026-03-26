// routes/chat.routes.js

const express = require('express');
const router = express.Router();
const {
  createConversation,
  sendMessage,
  getConversations,
  getHistory,
  clearHistory,
  switchConversation
} = require('../../controllers/chatbot/chat');

// ── Conversations ──
router.post('/new',                        createConversation);  // Nouvelle conversation
router.get('/conversations/:userId',       getConversations);    // Liste conversations
router.put('/switch/:conversationId',      switchConversation);  // Switcher conversation

// ── Messages ──   
router.post('/message',                    sendMessage);         // Envoyer message
router.get('/history/:userId',             getHistory);          // Historique actif
router.delete('/clear/:userId',            clearHistory);        // Supprimer conversation

module.exports = router;