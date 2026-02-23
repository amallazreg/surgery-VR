const mongoose = require('mongoose');

const featureSchema = new mongoose.Schema({
  text: { type: String, required: true },
  yes: { type: Boolean, default: false },
});

const forfaitSchema = new mongoose.Schema({
  name: { type: String, required: true },
  tagline: { type: String },
  price: { type: String },
  priceYearly: { type: String },
  priceSub: { type: String },
  desc: { type: String },
  experiences: { type: String },
  apk: { type: String },
  features: [featureSchema],
}, { timestamps: true });

module.exports = mongoose.model('Forfait', forfaitSchema);