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

const { protect } = require('../../middlewares/auth'); 

router.use(protect);

// ── Conversations ──
router.post('/new',  createConversation);  
router.get('/conversations/:userId',getConversations);    
router.put('/switch/:conversationId' ,switchConversation); 

// ── Messages ──   
router.post('/message',                 sendMessage);        
router.get('/history/:userId',         getHistory);          
router.delete('/clear/:userId',      clearHistory);        

module.exports = router;