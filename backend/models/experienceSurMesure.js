const mongoose = require('mongoose');

const experienceSurMesureSchema = new mongoose.Schema({
  // Étape 1 - Projet
  typeProjet: { type: String, required: true },       // projectType
  titreProjet: { type: String, required: true },      // projectTitle

  // Étape 2 - Scénarios
  scenariosCliniques: { type: String, required: true },   // clinicalScenarios
  objectifsPedagogiques: { type: String, required: true },// learningObjectives
  publicCible: { type: String, required: true },         // targetAudience

  // Étape 3 - Spécificités Médicales
  elementsMedicaux: [{ type: String }],                   // medicalFeatures

  // Étape 4 - Exigences Techniques
  niveauInteraction: { type: String, required: true },    // interactionLevel
  niveauRealism: { type: String, required: true },       // realism
  fonctionnalitésTechniques: [{ type: String }],         // technicalFeatures

  // Étape 5 - Contact
  nomEtablissement: { type: String, required: true },     // institutionName
  prenom: { type: String, required: true },              // firstName
  nom: { type: String, required: true },                 // lastName
  fonction: { type: String, required: true },            // position
  emailProfessionnel: { type: String, required: true },  // email
  telephone: { type: String, required: true },           // phone

  // Étape 6 - Vision & Contraintes
  inspirations: { type: String },                        // inspiration
  contraintes: { type: String },                         // constraints
  delaiRealisation: { type: String, required: true },    // timeline
  informationsComplementaires: { type: String },         // additionalInfo

  consentement: { type: Boolean, required: true },       // consent

  statut: {
    type: String,
    enum: ['nouvelle', 'en_cours', 'envoyee'],
    default: 'nouvelle'
  },

  dateCreation: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('ExperienceSurMesure', experienceSurMesureSchema);
