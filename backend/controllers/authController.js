const Client = require('../models/clientModel');
const bcrypt = require('bcrypt');

const inscription = async (req, res) => {
  try {
    const data = req.body;

    if (!req.file) {
      return res.status(400).json({
        message: 'Le document de vérification est obligatoire'
      });
    }

    // Vérifier email
    const clientExistant = await Client.findOne({ email: data.email });
    if (clientExistant) {
      return res.status(400).json({
        message: 'Cet email est déjà utilisé'
      });
    }

    const motDePasseHash = await bcrypt.hash(data.motDePasse, 10);

    const nouvelClient = new Client({
      typeCompte: data.typeCompte,
      prenom: data.prenom,
      nom: data.nom,
      email: data.email,
      motDePasse: motDePasseHash,

      // Médecin
      specialite: data.specialite,
      etablissement: data.etablissement,
      ville: data.ville,
      numeroOrdre: data.numeroOrdre,

      // Étudiant
      universite: data.universite,
      anneeEtude: data.anneeEtude,
      encadrant: data.encadrant,

      objectif: data.objectif,
      documentVerification: req.file.path,

      statut: 'en_attente'
    });

    await nouvelClient.save();

    res.status(201).json({
      message: 'Inscription réussie. Votre compte est en attente de validation.',
      idClient: nouvelClient._id
    });

  } catch (erreur) {
    console.error(erreur);
    res.status(500).json({
      message: 'Erreur serveur lors de l’inscription'
    });
  }
};


module.exports = {
    inscription
}
