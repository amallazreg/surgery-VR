const Client = require('../models/clientModel');

const {envoyerEmailApprobation,envoyerEmailRejet} = require('../services/emailService');


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
      return res.status(404).json({ message: 'client introuvable' });
    }

    if (client.statut !== 'en_attente') {
      return res.status(400).json({
        message: 'Ce compte a déjà été traité'
      });
    }

    // ✅ Mise à jour du statut
    client.statut = 'approuve';
    client.motifRefus = null;
    client.dateValidation = new Date();
    await client.save();

    console.log('✅ Compte approuvé pour:', client.email);

    // 📧 Envoi email (avec logs détaillés)
    try {
      await envoyerEmailApprobation(client);
      console.log('📧 Email d’approbation envoyé avec succès à:', client.email);
    } catch (emailError) {
      console.error('❌ Erreur lors de l’envoi de l’email:');
      console.error('Message:', emailError.message);
      console.error('Code:', emailError.code);
      console.error('Response:', emailError.response);
      console.error('Stack:', emailError.stack);

      // IMPORTANT : on ne bloque pas l’approbation
      return res.status(200).json({
        message: 'Compte approuvé MAIS email non envoyé',
        emailError: emailError.message,
        client
      });
    }

    res.json({
      message: 'Compte approuvé et email envoyé',
      client
    });

  } catch (erreur) {
    console.error('❌ Erreur globale approuverCompte:', erreur);
    res.status(500).json({
      message: 'Erreur lors de l’approbation du compte'
    });
  }
};


// ❌ Rejeter un compte
const rejeterCompte = async (req, res) => {
  try {
    const { id } = req.params;
    
    // ✅ Vérification et extraction sécurisée
    const motifRefus = req.body?.motifRefus || 'Non spécifié';

    console.log('📝 Données reçues pour rejet:');
    console.log('ID:', id);
    console.log('Motif:', motifRefus);
    console.log('Body complet:', req.body);

    const client = await Client.findById(id);
    if (!client) {
      return res.status(404).json({ message: 'Client introuvable' });
    }

    if (client.statut !== 'en_attente') {
      return res.status(400).json({
        message: 'Ce compte a déjà été traité'
      });
    }

    // ✅ Mise à jour du statut
    client.statut = 'rejete';
    client.motifRefus = motifRefus;
    client.dateValidation = new Date();
    await client.save();

    console.log('✅ Compte rejeté pour:', client.email);

    // 📧 Envoi email (avec gestion d'erreur)
    try {
      await envoyerEmailRejet(client);
      console.log('📧 Email de rejet envoyé avec succès à:', client.email);
    } catch (emailError) {
      console.error('❌ Erreur lors de lenvoi de lemail:');
      console.error('Message:', emailError.message);
      console.error('Code:', emailError.code);
      console.error('Response:', emailError.response);

      // IMPORTANT : on ne bloque pas le rejet
      return res.status(200).json({
        message: 'Compte rejeté MAIS email non envoyé',
        emailError: emailError.message,
        client
      });
    }

    res.json({
      message: 'Compte rejeté et email envoyé',
      client
    });

  } catch (erreur) {
    console.error('❌ Erreur globale rejeterCompte:', erreur);
    res.status(500).json({
      message: 'Erreur lors du rejet du compte',
      erreur: erreur.message
    });
  }
};



module.exports = { 
    listerTous,
    listerParStatut,
    approuverCompte,
    rejeterCompte
}