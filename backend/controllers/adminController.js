const Client = require('../models/clientModel');

// 🔹 Lister tous les comptes
const listerTous = async (req, res) => {
  try {
    const clients = await Client.find().sort({ dateCreation: -1 });
    res.json(clients);
  } catch (erreur) {
    res.status(500).json({ message: 'Erreur lors de la récupération des comptes' });
  }
};

// 🔹 Lister par statut
const listerParStatut = async (req, res) => {
  try {
    const { statut } = req.params;

    const clients = await Client.find({ statut }).sort({ dateCreation: -1 });

    res.json(clients);
  } catch (erreur) {
    res.status(500).json({ message: 'Erreur lors du filtrage des comptes' });
  }
};

// ✅ Approuver un compte
const approuverCompte = async (req, res) => {
  try {
    const { id } = req.params;

    const client = await Client.findById(id);
    if (!client) {
      return res.status(404).json({ message: 'Client introuvable' });
    }

    if (client.statut !== 'en_attente') {
      return res.status(400).json({
        message: 'Ce compte a déjà été traité'
      });
    }

    client.statut = 'approuve';
    client.motifRefus = null;
    client.dateValidation = new Date();

    await client.save();

    res.json({
      message: 'Compte approuvé avec succès',
      client
    });

  } catch (erreur) {
    res.status(500).json({ message: 'Erreur lors de l’approbation du compte' });
  }
};

// ❌ Rejeter un compte
 const rejeterCompte = async (req, res) => {
  try {
    const { id } = req.params;
    const { motifRefus } = req.body;

    const client = await Client.findById(id);
    if (!client) {
      return res.status(404).json({ message: 'Client introuvable' });
    }

    if (client.statut !== 'en_attente') {
      return res.status(400).json({
        message: 'Ce compte a déjà été traité'
      });
    }

    client.statut = 'rejete';
    client.motifRefus = motifRefus || 'Non spécifié';
    client.dateValidation = new Date();

    await client.save();

    res.json({
      message: 'Compte rejeté',
      client
    });

  } catch (erreur) {
    res.status(500).json({ message: 'Erreur lors du rejet du compte' });
  }
};


module.exports = { 
    listerTous,
    listerParStatut,
    approuverCompte,
    rejeterCompte
}