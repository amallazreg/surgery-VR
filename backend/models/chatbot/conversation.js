const mongoose = require('mongoose');

// ── Schéma d'un message ──
const MessageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// ── Schéma d'une conversation ──
const ConversationSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true
    },

    title: {
      type: String,
      default: 'Nouvelle conversation'
    },

    isActive: {
      type: Boolean,
      default: true
    },

    messages: [MessageSchema]
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Conversation', ConversationSchema);