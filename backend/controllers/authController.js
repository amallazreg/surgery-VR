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

const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    // Champs interdits à modifier directement
    const champsInterdits = ['email', 'motDePasse', 'role', 'statut', 
                             'documentProfessionnel', 'documentEtudiant',
                             'numeroOrdreProfessionnel', 'numeroImmatriculation', 'numeroInscription'];
    for (const champ of champsInterdits) {
      if (req.body[champ] !== undefined) {
        return res.status(400).json({ message: `Le champ "${champ}" ne peut pas être modifié ici` });
      }
    }

    const utilisateur = await User.findById(userId);
    if (!utilisateur) {
      return res.status(404).json({ message: "Utilisateur introuvable" });
    }

    // ========================
    // Champs communs (tous rôles)
    // ========================
    const champsCommuns = ['prenom', 'nom', 'telephone'];
    champsCommuns.forEach(champ => {
      if (req.body[champ] !== undefined) utilisateur[champ] = req.body[champ];
    });

    // ========================
    // Champs selon le rôle
    // ========================
    if (utilisateur.role === 'professionnel') {
      const champsPro = [
        'typeProfessionnel',
        'fonctionResponsable',
        'nomEtablissement',
        'adresse'
      ];
      champsPro.forEach(champ => {
        if (req.body[champ] !== undefined) utilisateur[champ] = req.body[champ];
      });

      // Empêcher qu'un professionnel envoie des champs étudiant
      const champsEtudiant = ['universite', 'specialite', 'niveauEtude'];
      for (const champ of champsEtudiant) {
        if (req.body[champ] !== undefined) {
          return res.status(400).json({ message: `Champ "${champ}" non autorisé pour un professionnel` });
        }
      }

    } else if (utilisateur.role === 'etudiant') {
      const champsEtu = [
        'universite',
        'specialite',
        'niveauEtude'
      ];
      champsEtu.forEach(champ => {
        if (req.body[champ] !== undefined) utilisateur[champ] = req.body[champ];
      });

      // Empêcher qu'un étudiant envoie des champs professionnel
      const champsPro = ['typeProfessionnel', 'fonctionResponsable', 'nomEtablissement', 'adresse'];
      for (const champ of champsPro) {
        if (req.body[champ] !== undefined) {
          return res.status(400).json({ message: `Champ "${champ}" non autorisé pour un étudiant` });
        }
      }
    }

    // Pas de hash mot de passe → utiliser save() directement sans déclencher le pre-save hook inutilement
    utilisateur.markModified('prenom'); // force save même si rien n'a changé côté Mongoose
    await utilisateur.save();

    // Retourner sans le mot de passe
    const { motDePasse, ...userSansMotDePasse } = utilisateur.toObject();

    res.json({
      message: "Profil mis à jour avec succès",
      user: userSansMotDePasse
    });

  } catch (err) {
    console.error("Erreur updateProfile:", err);
    res.status(500).json({ message: "Erreur serveur lors de la mise à jour" });
  }
};

// Changer le mot de passe
const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { ancienMotDePasse, nouveauMotDePasse, confirmNouveauMotDePasse } = req.body;

    if (!ancienMotDePasse || !nouveauMotDePasse || !confirmNouveauMotDePasse) {
      return res.status(400).json({ message: "Tous les champs sont obligatoires" });
    }

    if (nouveauMotDePasse !== confirmNouveauMotDePasse) {
      return res.status(400).json({ message: "Les nouveaux mots de passe ne correspondent pas" });
    }

    if (nouveauMotDePasse.length < 6) {
      return res.status(400).json({ message: "Le nouveau mot de passe doit faire au moins 6 caractères" });
    }

    const utilisateur = await User.findById(userId);
    if (!utilisateur) {
      return res.status(404).json({ message: "Utilisateur introuvable" });
    }

    const isValid = await utilisateur.comparePassword(ancienMotDePasse);
    if (!isValid) {
      return res.status(401).json({ message: "Ancien mot de passe incorrect" });
    }

    utilisateur.motDePasse = nouveauMotDePasse; // le hash se fait dans le model (pre-save hook)
    await utilisateur.save();

    res.json({ message: "Mot de passe changé avec succès" });

  } catch (err) {
    console.error("Erreur changePassword:", err);
    res.status(500).json({ message: "Erreur serveur lors du changement de mot de passe" });
  }
};



module.exports = {
  signup,
  signin,
  updateProfile,
  changePassword
}