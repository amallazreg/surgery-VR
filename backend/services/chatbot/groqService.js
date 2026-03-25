const Groq = require('groq-sdk');
const { SYSTEM_PROMPT } = require('../../prompts/systemPrompt');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

// ── Appel à Groq ──
const getChatResponse = async (messages) => {
  const response = await groq.chat.completions.create({
    model: 'llama-3.1-70b-versatile',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages
    ],
    max_tokens: 500,
    temperature: 0.7
  });

  return response.choices[0].message.content;
};

module.exports = { getChatResponse };