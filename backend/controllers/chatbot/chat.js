const Conversation = require('../../models/chatbot/conversation');
const { getChatResponse } = require('../../services/chatbot/groqService');

// ──────────────────────────────────────────
// Envoyer un message et recevoir une réponse
// ──────────────────────────────────────────
const sendMessage = async (req, res) => {
  try {
    const { userId, message } = req.body;

    // 1. Validation
    if (!userId || !message) {
      return res.status(400).json({
        success: false,
        error: 'userId et message sont obligatoires'
      });
    }

    if (message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Le message ne peut pas être vide'
      });
    }

    // 2. Chercher ou créer la conversation en base
    let conversation = await Conversation.findOne({ userId });
    if (!conversation) {
      conversation = new Conversation({ userId, messages: [] });
    }

    // 3. Ajouter le message utilisateur
    conversation.messages.push({
      role: 'user',
      content: message
    });

    // 4. Préparer l'historique pour Groq
    // On garde seulement les 20 derniers messages pour économiser les tokens
    const recentMessages = conversation.messages
      .slice(-20)
      .map(msg => ({
        role: msg.role,
        content: msg.content
      }));

    // 5. Appeler Groq
    const aiResponse = await getChatResponse(recentMessages);

    // 6. Sauvegarder la réponse en base
    conversation.messages.push({
      role: 'assistant',
      content: aiResponse
    });
    await conversation.save();

    // 7. Retourner la réponse
    return res.status(200).json({
      success: true,
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

// ──────────────────────────────────────────
// Récupérer l'historique d'un utilisateur
// ──────────────────────────────────────────
const getHistory = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId est obligatoire'
      });
    }

    const conversation = await Conversation.findOne({ userId });

    if (!conversation) {
      return res.status(200).json({
        success: true,
        messages: []
      });
    }

    return res.status(200).json({
      success: true,
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
// Effacer l'historique d'un utilisateur
// ──────────────────────────────────────────
const clearHistory = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId est obligatoire'
      });
    }

    await Conversation.findOneAndDelete({ userId });

    return res.status(200).json({
      success: true,
      message: 'Historique effacé avec succès'
    });

  } catch (error) {
    console.error('[ChatController] clearHistory error:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
};

module.exports = {
  sendMessage,
  getHistory,
  clearHistory
};