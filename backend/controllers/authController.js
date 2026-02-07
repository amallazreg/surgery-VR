const Client = require('../models/clientModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');


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


const login = async (req, res) => {
  try {
    const { email, motDePasse } = req.body;

    if (!email || !motDePasse) {
      return res.status(400).json({
        message: 'Email et mot de passe sont obligatoires'
      });
    }

    // Vérifier si le client existe
    const client = await Client.findOne({ email });
    if (!client) {
      return res.status(404).json({
        message: 'Email ou mot de passe incorrect'
      });
    }

    // Vérifier mot de passe
    const motDePasseValide = await bcrypt.compare(motDePasse, client.motDePasse);
    if (!motDePasseValide) {
      return res.status(401).json({
        message: 'Email ou mot de passe incorrect'
      });
    }

    // 🔒 Vérifier statut
    if (client.statut !== 'approuve') {
      return res.status(403).json({
        message: 'Votre compte n’est pas encore approuvé par l’administrateur'
      });
    }

    // 🔑 Générer JWT
    const token = jwt.sign(
      {
        id: client._id,
        email: client.email,
        typeCompte: client.typeCompte,
        role: 'client'
      },
      process.env.JWT_SECRET || 'SECRET_KEY_DEV',
      { expiresIn: '1d' }
    );

    res.json({
      message: 'Connexion réussie',
      token,
      client: {
        id: client._id,
        prenom: client.prenom,
        nom: client.nom,
        email: client.email,
        typeCompte: client.typeCompte,
        statut: client.statut
      }
    });

  } catch (erreur) {
    console.error(erreur);
    res.status(500).json({
      message: 'Erreur serveur lors de la connexion'
    });
  }
};


module.exports = {
    inscription,
    login
}
