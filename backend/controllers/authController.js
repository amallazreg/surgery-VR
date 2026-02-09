const User = require('../models/userModels');
const jwt = require('jsonwebtoken');


const signup = async (req, res) => {
  try {
    const {
      prenom,
      nom,
      email,
      motDePasse,
      confirmPassword,
      phone,
      role, 

      // champs medecin
      specialite,
      etablissement,
      ville,
      numeroOrdre,

      // champs etudiant
      universite,
      anneeEtude,
      encadrant,

      objectif
    } = req.body;


    if (!prenom || !nom || !email || !motDePasse || !confirmPassword) {
      return res.status(400).json({ message: "Champs obligatoires manquants" });
    }

    if (motDePasse !== confirmPassword) {
      return res.status(400).json({ message: "Les mots de passe ne correspondent pas" });
    }

    const adminExiste = await User.findOne({ role: 'admin' });

    let finalRole;
    let finalStatut;

    if (!adminExiste) {
      finalRole = 'admin';
      finalStatut = 'approuve';
    } else {
      // Médecin ou étudiant
      finalRole = role; // medecin | etudiant
      finalStatut = 'en_attente';
    }

    
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Email déjà utilisé" });
    }

    let documentVerification = null;
    if (finalRole !== 'admin') {
      if (!req.file) {
        return res.status(400).json({
          message: "Document de vérification obligatoire"
        });
      }
      documentVerification = req.file.path;
    }

 
    const user = new User({
      prenom,
      nom,
      email,
      motDePasse,
      phone,
      role: finalRole,
      statut: finalStatut,

      // médecin
      specialite,
      etablissement,
      ville,
      numeroOrdre,

      // étudiant
      universite,
      anneeEtude,
      encadrant,

      objectif,
      documentVerification
    });

    await user.save();

    res.status(201).json({
      message:
        finalRole === 'admin'
          ? "Compte admin créé avec succès"
          : "Inscription réussie. Compte en attente de validation.",
      userId: user._id,
      role: user.role,
      statut: user.statut
    });

  } catch (err) {
    console.error("Erreur signup:", err);
    res.status(500).json({ message: "Erreur serveur lors de l'inscription" });
  }
};


const signin = async (req, res) => {
  try {
    const { email, motDePasse } = req.body;

    if (!email || !motDePasse) {
      return res.status(400).json({
        message: "Email et mot de passe obligatoires"
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Email ou mot de passe incorrect" });
    }

    const isValid = await user.comparePassword(motDePasse);
    if (!isValid) {
      return res.status(401).json({ message: "Email ou mot de passe incorrect" });
    }

    // 🔒 Blocage si pas approuvé (sauf admin)
    if (user.role !== 'admin' && user.statut !== 'approuve') {
      return res.status(403).json({
        message: "Votre compte est en attente de validation par l'administrateur"
      });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: "Connexion réussie",
      token,
      user: {
        id: user._id,
        prenom: user.prenom,
        nom: user.nom,
        email: user.email,
        role: user.role,
        statut: user.statut
      }
    });

  } catch (err) {
    console.error("Erreur signin:", err);
    res.status(500).json({ message: "Erreur serveur lors de la connexion" });
  }
};



module.exports = {
  signup,
  signin
}