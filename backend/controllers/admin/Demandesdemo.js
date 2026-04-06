const DemandeDemo = require('../../models/demandeDemo');
const EchantillonVideo = require('../../models/echantillonVideo');
const { envoyerEmailDemo } = require('../../services/emailDemo');

// ===============================
// Lister toutes les demandes de démo
// ===============================
const listerToutesDemandes = async (req, res) => {
  try {
    const demandes = await DemandeDemo.find()
      .sort({ dateCreation: -1 });

    res.json(demandes);
  } catch (err) {
    console.error('Erreur récupération demandes:', err);
    res.status(500).json({ message: "Erreur récupération demandes" });
  }
};

// ===============================
// Lister demandes par statut
// ===============================
const listerDemandesParStatut = async (req, res) => {
  try {
    const { statut } = req.params;

    if (!['nouvelle', 'contactee', 'cloturee'].includes(statut)) {
      return res.status(400).json({ message: "Statut invalide" });
    }

    const demandes = await DemandeDemo.find({ statut })
      .sort({ dateCreation: -1 });

    res.json(demandes);
  } catch (err) {
    console.error('Erreur filtrage demandes:', err);
    res.status(500).json({ message: "Erreur filtrage demandes" });
  }
};

// ===============================
// Obtenir les statistiques
// ===============================
const obtenirStatistiques = async (req, res) => {
  try {
    const [totalNouvelle, totalContactee, totalCloturee, totalDemandes] = await Promise.all([
      DemandeDemo.countDocuments({ statut: 'nouvelle' }),
      DemandeDemo.countDocuments({ statut: 'contactee' }),
      DemandeDemo.countDocuments({ statut: 'cloturee' }),
      DemandeDemo.countDocuments()
    ]);

    res.json({
      totalNouvelle,
      totalContactee,
      totalCloturee,
      totalDemandes
    });
  } catch (err) {
    console.error('Erreur statistiques:', err);
    res.status(500).json({ message: "Erreur calcul statistiques" });
  }
};

// ===============================
// Sélectionner 5 vidéos aléatoires parmi 8
// ===============================
const selectionnerVideosAleatoires = async () => {
  try {
    // Récupérer toutes les vidéos actives
    const toutesVideos = await EchantillonVideo.find({ actif: true });

    if (toutesVideos.length < 5) {
      throw new Error('Pas assez de vidéos disponibles (minimum 5 requis)');
    }

    // Mélanger le tableau (Fisher-Yates shuffle)
    const videosMelangees = [...toutesVideos];
    for (let i = videosMelangees.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [videosMelangees[i], videosMelangees[j]] = [videosMelangees[j], videosMelangees[i]];
    }

    // Prendre les 5 premières
    const videosSelectionnees = videosMelangees.slice(0, 5);

    return videosSelectionnees;
  } catch (err) {
    console.error('Erreur sélection vidéos:', err);
    throw err;
  }
};

// ===============================
// Contacter une demande (envoyer email avec 5 vidéos)
// ===============================
const contacterDemande = async (req, res) => {
  try {
    const { id } = req.params;
    const { messageEmail } = req.body;

    // Validation
    if (!messageEmail || messageEmail.trim() === '') {
      return res.status(400).json({ message: "Le message est requis" });
    }

    // Récupérer la demande
    const demande = await DemandeDemo.findById(id);
    if (!demande) {
      return res.status(404).json({ message: "Demande introuvable" });
    }

    // Vérifier le statut
    if (demande.statut !== 'nouvelle') {
      return res.status(400).json({ 
        message: "Cette demande a déjà été contactée" 
      });
    }

    // Sélectionner 5 vidéos aléatoires
    const videosSelectionnees = await selectionnerVideosAleatoires();

    if (videosSelectionnees.length !== 5) {
      return res.status(500).json({ 
        message: `Impossible de sélectionner 5 vidéos (disponibles : ${videosSelectionnees.length})` 
      });
    }

    // Envoyer l'email
    await envoyerEmailDemo({
      demande,
      messageEmail,
      videos: videosSelectionnees
    });

    // Mettre à jour la demande
    demande.statut = 'contactee';
    demande.dateContact = new Date();
    demande.videosEnvoyees = videosSelectionnees.map(v => ({
      id: v._id,
      titre: v.titre,
      urlVideo: v.urlVideo,
      dateEnvoi: new Date()
    }));

    await demande.save();

    // Réponse claire avec la demande mise à jour
    res.json({ 
      message: "Email envoyé avec succès", 
      demande: demande,                    // ← Important pour le frontend
      nbVideosEnvoyees: videosSelectionnees.length
    });

  } catch (err) {
    console.error('Erreur envoi email démonstration:', err);
    res.status(500).json({ 
      message: "Erreur lors de l'envoi de l'email",
      error: err.message 
    });
  }
};

// ===============================
// Clôturer une demande
// ===============================
const cloturerDemande = async (req, res) => {
  try {
    const { id } = req.params;

    const demande = await DemandeDemo.findById(id);
    if (!demande) {
      return res.status(404).json({ message: "Demande introuvable" });
    }

    if (demande.statut === 'cloturee') {
      return res.status(400).json({ 
        message: "Cette demande est déjà clôturée" 
      });
    }

    demande.statut = 'cloturee';
    demande.dateCloture = new Date();
    await demande.save();

    res.json({ 
      message: "Demande clôturée avec succès", 
      demande 
    });

  } catch (err) {
    console.error('Erreur clôture demande:', err);
    res.status(500).json({ message: "Erreur lors de la clôture" });
  }
};

// ===============================
// CRUD Échantillons Vidéo (pour admin)
// ===============================

// Lister tous les échantillons
const listerEchantillons = async (req, res) => {
  try {
    const echantillons = await EchantillonVideo.find()
      .sort({ ordre: 1, dateAjout: -1 });

    res.json(echantillons);
  } catch (err) {
    console.error('Erreur récupération échantillons:', err);
    res.status(500).json({ message: "Erreur récupération échantillons" });
  }
};

// Ajouter un échantillon
const ajouterEchantillon = async (req, res) => {
  try {
    const {
      titre,
      description,
      urlVideo,
      cloudinaryPublicId,
      duree,
      categorie,
      vignette,
      ordre
    } = req.body;

    const nouvelEchantillon = new EchantillonVideo({
      titre,
      description,
      urlVideo,
      cloudinaryPublicId,
      duree,
      categorie,
      vignette,
      ordre
    });

    await nouvelEchantillon.save();

    res.status(201).json({ 
      message: "Échantillon ajouté avec succès", 
      echantillon: nouvelEchantillon 
    });

  } catch (err) {
    console.error('Erreur ajout échantillon:', err);
    res.status(500).json({ message: "Erreur ajout échantillon" });
  }
};

// Modifier un échantillon
const modifierEchantillon = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const echantillon = await EchantillonVideo.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    );

    if (!echantillon) {
      return res.status(404).json({ message: "Échantillon introuvable" });
    }

    res.json({ 
      message: "Échantillon modifié avec succès", 
      echantillon 
    });

  } catch (err) {
    console.error('Erreur modification échantillon:', err);
    res.status(500).json({ message: "Erreur modification échantillon" });
  }
};

// Supprimer un échantillon
const supprimerEchantillon = async (req, res) => {
  try {
    const { id } = req.params;

    const echantillon = await EchantillonVideo.findByIdAndDelete(id);

    if (!echantillon) {
      return res.status(404).json({ message: "Échantillon introuvable" });
    }

    // Note: Vous pouvez aussi supprimer de Cloudinary ici si nécessaire
    // await cloudinary.uploader.destroy(echantillon.cloudinaryPublicId);

    res.json({ 
      message: "Échantillon supprimé avec succès" 
    });

  } catch (err) {
    console.error('Erreur suppression échantillon:', err);
    res.status(500).json({ message: "Erreur suppression échantillon" });
  }
};

// Activer/Désactiver un échantillon
const toggleActiverEchantillon = async (req, res) => {
  try {
    const { id } = req.params;

    const echantillon = await EchantillonVideo.findById(id);
    if (!echantillon) {
      return res.status(404).json({ message: "Échantillon introuvable" });
    }

    echantillon.actif = !echantillon.actif;
    await echantillon.save();

    res.json({ 
      message: `Échantillon ${echantillon.actif ? 'activé' : 'désactivé'}`, 
      echantillon 
    });

  } catch (err) {
    console.error('Erreur toggle échantillon:', err);
    res.status(500).json({ message: "Erreur modification statut" });
  }
};

module.exports = {
  // Demandes de démo
  listerToutesDemandes,
  listerDemandesParStatut,
  obtenirStatistiques,
  contacterDemande,
  cloturerDemande,
  
  // Échantillons vidéo
  listerEchantillons,
  ajouterEchantillon,
  modifierEchantillon,
  supprimerEchantillon,
  toggleActiverEchantillon
};