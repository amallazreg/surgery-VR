const mongoose = require('mongoose');

const featureSchema = new mongoose.Schema({
  text: { type: String, required: true },
  yes:  { type: Boolean, default: false },
});

const formationSchema = new mongoose.Schema({
  incluse:      { type: Boolean, default: false },
  dureeHeures:  { type: Number,  default: 0 },   
  maxEtudiants: { type: Number,  default: 0 },  
  detaillee:    { type: Boolean, default: false },
});

const forfaitSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  tagline:     { type: String },
  price:       { type: Number },   
  priceYearly: { type: String },
  priceSub:    { type: String },
  desc:        { type: String },
  experiences: { type: String },
  nbExperiences:{ type: Number },
  apk:         { type: String },

  // ─── Nouvelles fonctionnalités structurées ───
  nbApk:               { type: Number,  default: 0     }, 
  formation:           { type: formationSchema, default: () => ({}) },
  simulationEsthetique:{ type: Boolean, default: false },

  features: [featureSchema],

    cible: {
    type:    String,
    enum:    ['professionnel', 'etudiant'],
    default: 'professionnel',
  },

    dureeJours: {
    type:    Number,
    default: 30,
  },
},

{ timestamps: true });



module.exports = mongoose.model('Forfait', forfaitSchema);