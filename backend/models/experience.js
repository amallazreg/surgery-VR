const mongoose = require('mongoose');

const experienceSchema = new mongoose.Schema({
  title:         { type: String, required: true },
  description:   { type: String },
  emoji:         { type: String, default: '🥽' },
  thumbClass:    { type: String, default: 'vrt-1' },
  compatibility: { type: String, default: 'Quest 2 & 3' },

  // Liens APK / App Lab (seul App Lab requis)
  apkUrl:        { type: String },           // optionnel
  appLabUrl:     { type: String, required: true }, // obligatoire

  // Forfaits qui ont accès
  forfaits: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Forfait'
  }],

  // Stats
  respondents: { type: Number, default: 0 },
  avgTime:     { type: String, default: '—' },
  rating:      { type: Number, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Experience', experienceSchema);