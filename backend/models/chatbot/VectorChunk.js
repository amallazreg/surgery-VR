const mongoose = require('mongoose');

const VectorChunkSchema = new mongoose.Schema({

  content: {
    type: String,
    required: true
  },

  embedding: {
    type: [Number],
    required: true
  },

  // Métadonnées pour savoir d'où vient ce chunk
  metadata: {
    source: String,   // ex: "module-01-appendicectomie.md"
    module: String    // ex: "module-01-appendicectomie"
  }

}, {
  timestamps: true
});

module.exports = mongoose.model('VectorChunk', VectorChunkSchema);