const ExperienceSurMesure = require('../models/experienceSurMesure');

const creerExperience = async (req, res) => {
  try {
    const data = req.body;

    // Validation minimale obligatoire
    if (
      !data.typeProjet ||
      !data.titreProjet ||
      !data.scenariosCliniques ||
      !data.objectifsPedagogiques ||
      !data.publicCible ||
      !data.niveauInteraction ||
      !data.niveauRealism ||
      !data.nomEtablissement ||
      !data.prenom ||
      !data.nom ||
      !data.fonction ||
      !data.emailProfessionnel ||
      !data.telephone ||
      !data.delaiRealisation ||
      data.consentement !== true
    ) {
      return res.status(400).json({
        message: "Tous les champs obligatoires doivent être remplis."
      });
    }

    const experience = new ExperienceSurMesure(data);
    await experience.save();

    res.status(201).json({
      message: "Votre expérience sur mesure a été envoyée avec succès",
      data: experience
    });

  } catch (error) {
    console.error('Erreur creerExperience:', error);
    res.status(500).json({
      message: "Erreur serveur",
      error: error.message
    });
  }
};

// Admin - Voir toutes les expériences
const getToutesExperiences = async (req, res) => {
  try {
    const experiences = await ExperienceSurMesure.find().sort({ dateCreation: -1 });
    res.status(200).json(experiences);
  } catch (error) {
    res.status(500).json({
      message: "Erreur serveur",
      error: error.message
    });
  }
};

module.exports = {
  creerExperience,
  getToutesExperiences
};
