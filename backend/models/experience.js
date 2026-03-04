const mongoose = require('mongoose');

const experienceSchema = new mongoose.Schema({

  title:         { type: String, required: true },
  description:   { type: String },
  emoji:         { type: String, default: '🥽' },
  thumbClass:    { type: String, default: 'vrt-1' },
  compatibility: { type: String, default: 'Quest 2 & 3' },

  // ─── Stockage Cloudinary ───
  apkUrl:          { type: String, required: true }, 
  apkPublicId:     { type: String}, 
  apkOriginalName: { type: String },
  apkSize:         { type: String },
  apkVersion:      { type: String, default: 'v1.0.0' },
  apkAndroid:      { type: String, default: 'Android 10+' },

  appLabUrl: { type: String, default: null },

  // ─── Forfaits qui ont accès ───
  forfaits: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Forfait'
  }],

  respondents: { type: Number, default: 0 },
  avgTime:     { type: String, default: '—' },
  rating:      { type: Number, default: null },

}, { timestamps: true });

module.exports = mongoose.model('Experience', experienceSchema);