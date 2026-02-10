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
      telephone,
      role, 

      // champs professionnel
      typeProfessionnel,         
      fonctionResponsable,
      nomEtablissement,
      adresse,
      numeroOrdreProfessionnel, //pour un professionnel
      numeroImmatriculation, // pour un hopital par exemple

      // champs étudiant
      universite,
      specialite,
      niveauEtude,
      numeroInscription,

      objectif
    } = req.body;

    if (!prenom || !nom || !email || !motDePasse || !confirmPassword) {
      return res.status(400).json({ message: "Champs obligatoires manquants" });
    }

    if (motDePasse !== confirmPassword) {
      return res.status(400).json({ message: "Les mots de passe ne correspondent pas" });
    }

    // =======================
    // Vérifier si admin existe
    // =======================
    const adminExiste = await User.findOne({ role: 'admin' });

    let finalRole;
    let finalStatut;

    if (!adminExiste) {
      finalRole = 'admin';
      finalStatut = 'approuve';
    } else {
      finalRole = role; // 'etudiant' ou 'professionnel'
      finalStatut = 'en_attente';
    }

    // =======================
    // Vérifier email déjà existant
    // =======================
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Email déjà utilisé" });
    }

    // =======================
    // Gestion du document de vérification
    // =======================
let documentVerification = null;

if (finalRole !== 'admin') {
  if (!req.file) {
    return res.status(400).json({ message: "Document obligatoire" });
  }

  documentVerification = req.file.path; // URL Cloudinary ✅
}



    // =======================
    // Création de l'utilisateur
    // =======================
    const utilisateur = new User({
      prenom,
      nom,
      email,
      motDePasse,
      telephone,
      role: finalRole,
      statut: finalStatut,
      objectif,
      
      // Champs Professionnel
      typeProfessionnel,
      fonctionResponsable,
      nomEtablissement,
      adresse,
      numeroOrdreProfessionnel,
      numeroImmatriculation,
      documentProfessionnel: documentVerification,

      // Champs Étudiant
      universite,
      specialite,
      niveauEtude,
      numeroInscription,
      documentEtudiant: documentVerification
    });

    await utilisateur.save();

    res.status(201).json({
      message:
        finalRole === 'admin'
          ? "Compte admin créé avec succès"
          : "Inscription réussie. Compte en attente de validation.",
      userId: utilisateur._id,
      role: utilisateur.role,
      statut: utilisateur.statut
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