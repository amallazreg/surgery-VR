const DemandeDemo = require('../models/demandeDemo');

const creerDemandeDemo = async (req, res) => {
  try {
    const {
      typeEtablissement,
      pays,
      ville,
      domaineInteret,
      objectifs,
      nomInstitution,
      emailProfessionnel,
      telephone,
      message,
      consentement
    } = req.body;

    // Validation simple
    if (
      !typeEtablissement ||
      !pays ||
      !ville ||
      !domaineInteret ||
      !nomInstitution ||
      !emailProfessionnel ||
      !telephone ||
      consentement !== true
    ) {
      return res.status(400).json({
        message: "Tous les champs obligatoires doivent être remplis."
      });
    }

    const demande = new DemandeDemo({
      typeEtablissement,
      pays,
      ville,
      domaineInteret,
      objectifs,
      nomInstitution,
      emailProfessionnel,
      telephone,
      message,
      consentement
    });

    await demande.save();

    res.status(201).json({
      message: "Demande de démo envoyée avec succès",
      data: demande
    });

  } catch (error) {
    console.error('Erreur creerDemandeDemo:', error);
    res.status(500).json({
      message: "Erreur serveur",
      error: error.message
    });
  }
};


// (Admin) Voir toutes les demandes
const getToutesDemandesDemo = async (req, res) => {
  try {
    const demandes = await DemandeDemo.find().sort({ dateCreation: -1 });
    res.status(200).json(demandes);
  } catch (error) {
    res.status(500).json({
      message: "Erreur serveur",
      error: error.message
    });
  }
};

module.exports = {
    creerDemandeDemo,
    getToutesDemandesDemo
}
