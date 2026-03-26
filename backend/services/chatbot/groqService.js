const Groq = require('groq-sdk');
const { SYSTEM_PROMPT } = require('../../prompts/systemPrompt');
const { searchRelevantContent } = require('../chatbot/ragService');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

// ──────────────────────────────────────────
// Appel à Groq AVEC le contexte RAG
// ──────────────────────────────────────────
const getChatResponse = async (messages) => {

  // 1. Récupérer la dernière question de l'utilisateur
  const lastUserMessage = messages
    .filter(m => m.role === 'user')
    .at(-1)?.content || '';

  // 2. Chercher le contenu pertinent dans les modules
  const ragContext = await searchRelevantContent(lastUserMessage);

  // 3. Construire le prompt enrichi avec le contexte RAG
  const enrichedSystemPrompt = ragContext
    ? `${SYSTEM_PROMPT}

════════════════════════════════════════
CONTEXTE TIRÉ DE LA BASE DE DONNÉES SURGERYVR
(Utilise ces informations pour répondre avec précision)
════════════════════════════════════════
${ragContext}
════════════════════════════════════════
`
    : SYSTEM_PROMPT;

  // 4. Appeler Groq avec le contexte enrichi
  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: enrichedSystemPrompt },
      ...messages
    ],
    max_tokens: 500,
    temperature: 0.7
  });

  return response.choices[0].message.content;
};

module.exports = { getChatResponse };