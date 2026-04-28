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
    const maintenant = new Date();
    const il_y_a_30_jours = new Date(maintenant - 30 * 24 * 60 * 60 * 1000);
    const il_y_a_60_jours = new Date(maintenant - 60 * 24 * 60 * 60 * 1000);

    // ── Totaux globaux ──────────────────────────────────────────────
    const [
      totalNouvelle,
      totalContactee,
      totalCloturee,
      totalDemandes,
    ] = await Promise.all([
      DemandeDemo.countDocuments({ statut: 'nouvelle' }),
      DemandeDemo.countDocuments({ statut: 'contactee' }),
      DemandeDemo.countDocuments({ statut: 'cloturee' }),
      DemandeDemo.countDocuments(),
    ]);

    // ── Totaux sur les 30 derniers jours (pour comparaison période) ─
    const [
      nouvelles30j,
      contactees30j,
      cloturees30j,
      total30j,
    ] = await Promise.all([
      DemandeDemo.countDocuments({ statut: 'nouvelle',   dateCreation: { $gte: il_y_a_30_jours } }),
      DemandeDemo.countDocuments({ statut: 'contactee',  dateContact:  { $gte: il_y_a_30_jours } }),
      DemandeDemo.countDocuments({ statut: 'cloturee',   dateCloture:  { $gte: il_y_a_30_jours } }),
      DemandeDemo.countDocuments({                       dateCreation: { $gte: il_y_a_30_jours } }),
    ]);

    // ── Totaux sur les 30-60 jours (période précédente pour variation) ─
    const [total30_60j] = await Promise.all([
      DemandeDemo.countDocuments({
        dateCreation: { $gte: il_y_a_60_jours, $lt: il_y_a_30_jours },
      }),
    ]);

    // Variation en % : +12% ou -5% par rapport à la période précédente
    const variationTotal =
      total30_60j === 0
        ? null
        : Math.round(((total30j - total30_60j) / total30_60j) * 100);

    // ── Taux de conversion ──────────────────────────────────────────
    // Parmi toutes les demandes traitées (contactée + clôturée), combien sont clôturées ?
    const tauxContactage =
      totalDemandes === 0
        ? 0
        : Math.round((totalContactee + totalCloturee) / totalDemandes * 100);

    const tauxCloture =
      (totalContactee + totalCloturee) === 0
        ? 0
        : Math.round(totalCloturee / (totalContactee + totalCloturee) * 100);

    // ── Délai moyen de traitement (nouvelle → contactée) ───────────
    const demandesContactees = await DemandeDemo.find(
      { statut: { $in: ['contactee', 'cloturee'] }, dateContact: { $exists: true } },
      { dateCreation: 1, dateContact: 1 }
    ).lean();

    let delaiMoyenContactH = null;
    if (demandesContactees.length > 0) {
      const total = demandesContactees.reduce((acc, d) => {
        return acc + (new Date(d.dateContact) - new Date(d.dateCreation));
      }, 0);
      delaiMoyenContactH = Math.round(total / demandesContactees.length / 1000 / 3600);
    }

    // ── Courbe journalière sur 30 jours (pour graphique en ligne) ──
    const parJour = await DemandeDemo.aggregate([
      { $match: { dateCreation: { $gte: il_y_a_30_jours } } },
      {
        $group: {
          _id: {
            annee:  { $year:  '$dateCreation' },
            mois:   { $month: '$dateCreation' },
            jour:   { $dayOfMonth: '$dateCreation' },
          },
          total:      { $sum: 1 },
          nouvelles:  { $sum: { $cond: [{ $eq: ['$statut', 'nouvelle']  }, 1, 0] } },
          contactees: { $sum: { $cond: [{ $eq: ['$statut', 'contactee'] }, 1, 0] } },
          cloturees:  { $sum: { $cond: [{ $eq: ['$statut', 'cloturee']  }, 1, 0] } },
        },
      },
      { $sort: { '_id.annee': 1, '_id.mois': 1, '_id.jour': 1 } },
      {
        $project: {
          _id: 0,
          date: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: {
                $dateFromParts: {
                  year: '$_id.annee',
                  month: '$_id.mois',
                  day: '$_id.jour',
                },
              },
            },
          },
          total:      1,
          nouvelles:  1,
          contactees: 1,
          cloturees:  1,
        },
      },
    ]);

    // ── Répartition par mois (pour graphique en barres) ────────────
    const parMois = await DemandeDemo.aggregate([
      {
        $group: {
          _id: {
            annee: { $year: '$dateCreation' },
            mois:  { $month: '$dateCreation' },
          },
          total: { $sum: 1 },
        },
      },
      { $sort: { '_id.annee': 1, '_id.mois': 1 } },
      {
        $project: {
          _id: 0,
          periode: {
            $concat: [
              { $toString: '$_id.annee' }, '-',
              { $cond: [{ $lt: ['$_id.mois', 10] }, '0', ''] },
              { $toString: '$_id.mois' },
            ],
          },
          total: 1,
        },
      },
    ]);

    res.json({
      // Totaux globaux (pour les KPI cards)
      totaux: {
        all:       totalDemandes,
        nouvelle:  totalNouvelle,
        contactee: totalContactee,
        cloturee:  totalCloturee,
      },

      // Période courante 30j (pour tendances)
      periode30j: {
        total:      total30j,
        nouvelle:   nouvelles30j,
        contactee:  contactees30j,
        cloturee:   cloturees30j,
        variation:  variationTotal, // ex: +12 ou -5 (en %)
      },

      // Taux de conversion (pour jauges / donut)
      taux: {
        contactage: tauxContactage, 
        cloture:    tauxCloture,    
      },

      // Délai moyen en heures (pour KPI)
      delaiMoyenContactH,

      // Séries temporelles (pour recharts LineChart / BarChart)
      courbes: {
        parJour,  
        parMois,  
      },
    });
  } catch (err) {
    console.error('Erreur statistiques démo:', err);
    res.status(500).json({ message: 'Erreur calcul statistiques' });
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