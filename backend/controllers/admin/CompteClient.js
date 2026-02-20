const mongoose = require('mongoose');
const User = mongoose.model('Utilisateur'); 
const { envoyerEmailApprobation, envoyerEmailRejet } = require('../../services/emailCompteClient');

// ===============================
// Lister tous les comptes (hors admin)
// ===============================
const listerTous = async (req, res) => {
  try {
    const users = await User.find({ role: { $ne: 'admin' } }).sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    console.error("🔥 ERREUR LISTER TOUS :", err); 
    res.status(500).json({ 
      message: "Erreur récupération comptes", 
      error: err.message 
    });
  }
};

// ===============================
// Lister par statut
// ===============================
const listerParStatut = async (req, res) => {
  try {
    const { statut } = req.params;

    const users = await User.find({
      statut,
      role: { $ne: 'admin' }
    }).sort({ createdAt: -1 });

    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Erreur filtrage comptes" });
  }
};

// ===============================
// Approuver compte
// ===============================
const approuverCompte = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "Compte introuvable" });

    if (user.statut !== 'en_attente') {
      return res.status(400).json({ message: "Compte déjà traité" });
    }

    user.statut = 'approuve';
    await user.save();

    await envoyerEmailApprobation(user);

    res.json({ message: "Compte approuvé", user });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur approbation" });
  }
};

// ===============================
// Rejeter compte
// ===============================
const rejeterCompte = async (req, res) => {
  try {
    const { id } = req.params;
    const motifRefus = req.body?.motifRefus || "Non spécifié";

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "Compte introuvable" });

    if (user.statut !== 'en_attente') {
      return res.status(400).json({ message: "Compte déjà traité" });
    }

    user.statut = 'rejete';
    user.motifRefus = motifRefus;
    await user.save();

    await envoyerEmailRejet(user);

    res.json({ message: "Compte rejeté", user });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur rejet" });
  }
};

module.exports = {
  listerTous,
  listerParStatut,
  approuverCompte,
  rejeterCompte
};
