const Conversation = require('../../models/chatbot/conversation');
const { getChatResponse } = require('../../services/chatbot/groqService');

// Generer un titre depuis le 1er message
const generateTitle = (message) => {
  const clean = message.trim();
  return clean.length > 50
    ? clean.substring(0, 50) + '...'
    : clean;
};

// POST /chatbot/new
// Créer une nouvelle conversation vide
const createConversation = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId est obligatoire'
      });
    }

    // Désactiver toutes les conversations actives de cet utilisateur
    await Conversation.updateMany(
      { userId, isActive: true },
      { isActive: false }
    );

    // Créer une nouvelle conversation active
    const conversation = await Conversation.create({
      userId,
      title: 'Nouvelle conversation',
      isActive: true,
      messages: []
    });

    return res.status(201).json({
      success: true,
      conversationId: conversation._id,
      title: conversation.title
    });

  } catch (error) {
    console.error('[ChatController] createConversation error:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
};

// POST /chatbot/message
// Envoyer un message dans la conversation active
const sendMessage = async (req, res) => {
  try {
    const { userId, message, conversationId } = req.body;

    // 1. Validation
    if (!userId || !message) {
      return res.status(400).json({
        success: false,
        error: 'userId et message sont obligatoires'
      });
    }

    // 2. Trouver la conversation
    // → Si conversationId fourni : utiliser cette conversation
    // → Sinon : chercher la conversation active
    // → Si aucune : en créer une nouvelle automatiquement
    let conversation;

    if (conversationId) {
      conversation = await Conversation.findById(conversationId);
    } else {
      conversation = await Conversation.findOne({
        userId,
        isActive: true
      });
    }

    if (!conversation) {
      conversation = await Conversation.create({
        userId,
        title: generateTitle(message),
        isActive: true,
        messages: []
      });
    }

    // 3. Générer le titre si c'est le 1er message
    if (conversation.messages.length === 0) {
      conversation.title = generateTitle(message);
    }

    // 4. Ajouter le message utilisateur
    conversation.messages.push({
      role: 'user',
      content: message
    });

    // 5. Préparer l'historique pour Groq (20 derniers messages)
    const recentMessages = conversation.messages
      .slice(-20)
      .map(msg => ({
        role: msg.role,
        content: msg.content
      }));

    // 6. Appeler Groq
    const aiResponse = await getChatResponse(recentMessages);

    // 7. Sauvegarder la réponse
    conversation.messages.push({
      role: 'assistant',
      content: aiResponse
    });

    await conversation.save();

    return res.status(200).json({
      success: true,
      conversationId: conversation._id,
      title: conversation.title,
      response: aiResponse
    });

  } catch (error) {
    console.error('[ChatController] sendMessage error:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Erreur serveur, réessayez plus tard'
    });
  }
};

// GET /chatbot/conversations/:userId
// Récupérer toutes les conversations d'un utilisateur
const getConversations = async (req, res) => {
  try {
    const { userId } = req.params;

    const conversations = await Conversation.find(
      { userId },
      'title isActive createdAt updatedAt messages'
    ).sort({ updatedAt: -1 }); // Plus récente en premier

    // Formater pour le frontend
    const formatted = conversations.map(conv => ({
      id: conv._id,
      title: conv.title,
      isActive: conv.isActive,
      messageCount: conv.messages.length,
      lastMessage: conv.messages.length > 0
        ? conv.messages[conv.messages.length - 1].content.substring(0, 60) + '...'
        : '',
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt
    }));

    return res.status(200).json({
      success: true,
      conversations: formatted
    });

  } catch (error) {
    console.error('[ChatController] getConversations error:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
};

// GET /chatbot/history/:userId
// Récupérer les messages de la conversation active
const getHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const { conversationId } = req.query;

    let conversation;

    if (conversationId) {
      conversation = await Conversation.findById(conversationId);
    } else {
      conversation = await Conversation.findOne({
        userId,
        isActive: true
      });
    }

    if (!conversation) {
      return res.status(200).json({
        success: true,
        messages: [],
        conversationId: null,
        title: null
      });
    }

    return res.status(200).json({
      success: true,
      conversationId: conversation._id,
      title: conversation.title,
      messages: conversation.messages
    });

  } catch (error) {
    console.error('[ChatController] getHistory error:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
};

// ──────────────────────────────────────────
// DELETE /chatbot/clear/:userId
// Effacer une conversation spécifique
// ──────────────────────────────────────────
const clearHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const { conversationId } = req.query;

    if (conversationId) {
      // Supprimer une conversation spécifique
      await Conversation.findByIdAndDelete(conversationId);
    } else {
      // Supprimer la conversation active
      await Conversation.findOneAndDelete({
        userId,
        isActive: true
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Conversation supprimée avec succès'
    });

  } catch (error) {
    console.error('[ChatController] clearHistory error:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
};

// ──────────────────────────────────────────
// PUT /chatbot/switch/:conversationId
// Switcher vers une autre conversation
// ──────────────────────────────────────────
const switchConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { userId } = req.body;

    // Désactiver toutes les conversations de cet utilisateur
    await Conversation.updateMany(
      { userId, isActive: true },
      { isActive: false }
    );

    // Activer la conversation sélectionnée
    const conversation = await Conversation.findByIdAndUpdate(
      conversationId,
      { isActive: true },
      { new: true }
    );

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation introuvable'
      });
    }

    return res.status(200).json({
      success: true,
      conversationId: conversation._id,
      title: conversation.title,
      messages: conversation.messages
    });

  } catch (error) {
    console.error('[ChatController] switchConversation error:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
};

module.exports = {
  createConversation,
  sendMessage,
  getConversations,
  getHistory,
  clearHistory,
  switchConversation
};