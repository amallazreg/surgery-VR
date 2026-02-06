const DemandeDevis = require('../models/demandeDevis');

const creerDemandeDevis = async (req, res) => {
  try {
    const data = req.body;

    // Validation minimale
    if (
      !data.nomEtablissement ||
      !data.typeEtablissement ||
      !data.pays ||
      !data.ville ||
      !data.besoins?.length ||
      !data.nombreUtilisateurs ||
      !data.nombreCasquesVR ||
      !data.typeDeploiement ||
      !data.delaiMiseEnOeuvre ||
      !data.prenom ||
      !data.nom ||
      !data.fonction ||
      !data.emailProfessionnel ||
      !data.telephone ||
      data.consentement !== true
    ) {
      return res.status(400).json({
        message: "Tous les champs obligatoires doivent être remplis."
      });
    }

    const demande = new DemandeDevis(data);
    await demande.save();

    res.status(201).json({
      message: "Demande de devis envoyée avec succès",
      data: demande
    });

  } catch (error) {
    console.error('Erreur creerDemandeDevis:', error);
    res.status(500).json({
      message: "Erreur serveur",
      error: error.message
    });
  }
};


// Admin - Voir toutes les demandes
const  getToutesDemandesDevis = async (req, res) => {
  try {
    const demandes = await DemandeDevis.find().sort({ dateCreation: -1 });
    res.status(200).json(demandes);
  } catch (error) {
    res.status(500).json({
      message: "Erreur serveur",
      error: error.message
    });
  }
};

module.exports ={
    creerDemandeDevis,
    getToutesDemandesDevis
}
