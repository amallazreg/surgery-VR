const fs = require('fs');
const path = require('path');
const { pipeline } = require('@xenova/transformers');
const VectorChunk = require('../../models/chatbot/VectorChunk');

// ── Chemin vers les fichiers modules ──
const MODULES_PATH = path.join(__dirname, '../../data/modules');

// ── Modèle d'embeddings (converti texte → vecteur) ──
let embeddingModel = null;

const getEmbeddingModel = async () => {
  if (!embeddingModel) {
    console.log('⏳ Chargement du modèle d\'embeddings...');
    embeddingModel = await pipeline(
      'feature-extraction',
      'Xenova/all-MiniLM-L6-v2'
    );
    console.log('✅ Modèle d\'embeddings chargé');
  }
  return embeddingModel;
};

// ──────────────────────────────────────────
// Convertir un texte en vecteur
// ──────────────────────────────────────────
const textToVector = async (text) => {
  const model = await getEmbeddingModel();
  const output = await model(text, {
    pooling: 'mean',
    normalize: true
  });
  return Array.from(output.data);
};

// ──────────────────────────────────────────
// Découper un texte en chunks
// ──────────────────────────────────────────
const splitIntoChunks = (text, chunkSize = 500, overlap = 50) => {
  const chunks = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end));
    start += chunkSize - overlap;
  }

  return chunks;
};

// ──────────────────────────────────────────
// Initialiser le RAG
// Charge les fichiers .md et stocke les vecteurs dans MongoDB
// ──────────────────────────────────────────
const initRAG = async () => {
  try {
    console.log('🚀 Initialisation du RAG...');

    // Si les vecteurs existent déjà → pas besoin de réindexer
    const existingCount = await VectorChunk.countDocuments();
    if (existingCount > 0) {
      console.log(`✅ RAG déjà initialisé (${existingCount} chunks en base)`);
      return;
    }

    // Lire les fichiers .md
    const files = fs.readdirSync(MODULES_PATH).filter(f => f.endsWith('.md'));
    console.log(`📚 Chargement de ${files.length} modules...`);

    for (const file of files) {
      const filePath = path.join(MODULES_PATH, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const moduleName = file.replace('.md', '');

      // Découper en chunks
      const chunks = splitIntoChunks(content);
      console.log(`  📄 ${file} → ${chunks.length} chunks`);

      // Créer un vecteur pour chaque chunk et sauvegarder en MongoDB
      for (const chunk of chunks) {
        const embedding = await textToVector(chunk);

        await VectorChunk.create({
          content: chunk,
          embedding: embedding,
          metadata: {
            source: file,
            module: moduleName
          }
        });
      }

      console.log(`  ✅ ${file} indexé`);
    }

    const total = await VectorChunk.countDocuments();
    console.log(`✅ RAG initialisé ! ${total} chunks stockés dans MongoDB`);

  } catch (error) {
    console.error('❌ Erreur initialisation RAG:', error.message);
    throw error;
  }
};

// ──────────────────────────────────────────
// Calculer la similarité cosinus entre deux vecteurs
// Plus le score est proche de 1 = plus c'est pertinent
// ──────────────────────────────────────────
const cosineSimilarity = (vecA, vecB) => {
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const normA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const normB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dotProduct / (normA * normB);
};

// ──────────────────────────────────────────
// Rechercher les chunks les plus pertinents
// pour une question donnée
// ──────────────────────────────────────────
const searchRelevantContent = async (question) => {
  try {
    // 1. Convertir la question en vecteur
    const questionVector = await textToVector(question);

    // 2. Récupérer tous les chunks depuis MongoDB
    const allChunks = await VectorChunk.find({}, 'content embedding metadata');

    // 3. Calculer la similarité avec chaque chunk
    const scored = allChunks.map(chunk => ({
      content: chunk.content,
      module: chunk.metadata.module,
      score: cosineSimilarity(questionVector, chunk.embedding)
    }));

    // 4. Trier par score et garder les 3 meilleurs
    const top3 = scored
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    console.log(`🔍 Top résultats pour : "${question}"`);
    top3.forEach(r => console.log(`  → ${r.module} (score: ${r.score.toFixed(3)})`));

    // 5. Assembler le contexte à envoyer à Groq
    const context = top3
      .map(r => `[${r.module}]\n${r.content}`)
      .join('\n\n---\n\n');

    return context;

  } catch (error) {
    console.error('❌ Erreur recherche RAG:', error.message);
    return ''; // Si erreur → continuer sans RAG
  }
};

// ──────────────────────────────────────────
// Réinitialiser le RAG
// Utile quand tu ajoutes de nouveaux modules
// ──────────────────────────────────────────
const resetRAG = async () => {
  await VectorChunk.deleteMany({});
  console.log('🗑️  Anciens chunks supprimés');
  await initRAG();
};

module.exports = { initRAG, searchRelevantContent, resetRAG };