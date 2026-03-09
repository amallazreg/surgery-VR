const AccesEtudiant = require('../../models/accesEtudiant');
const Abonnement    = require('../../models/abonnement');
const Experience    = require('../../models/experience'); // ← AJOUTÉ


// ═══════════════════════════════════════════════════════════
// 1. GET — Expériences accessibles pour l'étudiant connecté
//
// Appelé à chaque ouverture de "Mes Modules VR".
// Vérifie en temps réel que l'abonnement parent est encore actif.
// Si l'institution expire → l'étudiant est bloqué instantanément.
//
// Route : GET /api/acces/mes-experiences
// Auth  : étudiant connecté (req.user._id)
// ═══════════════════════════════════════════════════════════
const getMesExperiences = async (req, res) => {
  try {
    const etudiantId = req.user._id;

    // Récupérer tous les accès actifs de l'étudiant
    const acces = await AccesEtudiant.find({
      etudiant: etudiantId,
      statut:   'actif',
    })
      .populate('experiences', 'titre description specialite niveau dureeMinutes thumbnail ressourceUrl')
      .populate({
        path:     'abonnement',
        select:   'status dateFin forfait',
        populate: { path: 'forfait', select: 'name' }
      });

    if (!acces.length) {
      return res.status(200).json({
        accesActif:   false,
        message:      "Aucun accès actif. Saisissez un code de formation pour débloquer vos expériences.",
        experiences:  [],
        total:        0,
      });
    }

    // ── Vérification en temps réel de chaque abonnement parent ───
    // Si l'institution a expiré → on filtre cet accès
    const maintenant = new Date();

    const accesValides = acces.filter((a) => {
      const abo = a.abonnement;
      return (
        abo.status === 'active' &&
        (!abo.dateFin || maintenant <= new Date(abo.dateFin))
      );
    });

    const accesExpires = acces.filter((a) => {
      const abo = a.abonnement;
      return (
        abo.status !== 'active' ||
        (abo.dateFin && maintenant > new Date(abo.dateFin))
      );
    });

    // Agréger toutes les expériences des accès encore valides (dédupliquées)
    // On repopule depuis Experience car le snapshot stocke des ObjectIds
    const experiencesMap = new Map();

    for (const a of accesValides) {
      // Récupérer les expériences du forfait de l'abonnement en temps réel
      const forfaitId  = a.abonnement?.forfait?._id ?? a.abonnement?.forfait;
      const experiences = forfaitId
        ? await Experience.find({ forfaits: forfaitId }).select(
            'title description emoji thumbClass compatibility appLabUrl apkUrl'
          )
        : [];

      experiences.forEach((exp) => {
        if (!experiencesMap.has(exp._id.toString())) {
          experiencesMap.set(exp._id.toString(), {
            _id:           exp._id,
            title:         exp.title,
            description:   exp.description,
            emoji:         exp.emoji,
            thumbClass:    exp.thumbClass,
            compatibility: exp.compatibility,
            appLabUrl:     exp.appLabUrl,
            forfait:       a.abonnement?.forfait?.name,
          });
        }
      });
    }

    const experiences = Array.from(experiencesMap.values());

    return res.status(200).json({
      accesActif:   experiences.length > 0,
      experiences,
      total:        experiences.length,

      dateExpiration: accesValides[0]?.dateExpiration ?? null,
      abonnementFin:  accesValides[0]?.abonnement?.dateFin ?? null,
      // Informer l'étudiant si certains accès ont expiré
      accesExpires: accesExpires.map((a) => ({
        accesId:        a._id,
        forfait:        a.abonnement?.forfait?.name,
        dateExpiration: a.dateExpiration,
        statut:         a.abonnement?.status,
      })),
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// ═══════════════════════════════════════════════════════════
// 2. GET — Détail d'un accès spécifique de l'étudiant
//
// Route : GET /api/acces/:accesId
// Auth  : étudiant connecté
// ═══════════════════════════════════════════════════════════
const getUnAcces = async (req, res) => {
  try {
    const etudiantId = req.user._id;

    const acces = await AccesEtudiant.findOne({
      _id:      req.params.accesId,
      etudiant: etudiantId,
    })
      .populate('experiences', 'titre description specialite niveau dureeMinutes thumbnail ressourceUrl')
      .populate('codeFormation', 'code dateUtilisation')
      .populate({
        path:     'abonnement',
        select:   'status dateFin forfait user',
        populate: [
          { path: 'forfait', select: 'name' },
          { path: 'user',    select: 'nom prenom organisation' }
        ]
      });

    if (!acces) {
      return res.status(404).json({ message: 'Accès introuvable.' });
    }

    // Vérification en temps réel
    const maintenant    = new Date();
    const abo           = acces.abonnement;
    const abonnementActif =
      abo.status === 'active' &&
      (!abo.dateFin || maintenant <= new Date(abo.dateFin));

    return res.status(200).json({
      _id:            acces._id,
      statut:         acces.statut,
      accesActif:     abonnementActif,
      dateActivation: acces.dateActivation,
      dateExpiration: acces.dateExpiration,
      codeUtilise:    acces.codeFormation?.code,
      institution: {
        nom:          abo.user?.nom,
        prenom:       abo.user?.prenom,
        organisation: abo.user?.organisation,
      },
      forfait:        abo.forfait?.name,
      experiences:    abonnementActif ? acces.experiences : [],
      // Message si abonnement expiré
      messageExpiration: !abonnementActif
        ? "L'abonnement de votre institution a expiré. Contactez votre établissement."
        : null,
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// ═══════════════════════════════════════════════════════════
// 3. GET — Tous les accès d'un abonnement (vue institution)
//
// Permet à l'institution de voir quels étudiants ont activé
// leurs codes et accèdent à ses expériences.
//
// Route : GET /api/acces/abonnement/:abonnementId
// Auth  : institution propriétaire
// ═══════════════════════════════════════════════════════════
const getAccesParAbonnement = async (req, res) => {
  try {
    const { abonnementId } = req.params;

    // Vérifier que c'est bien l'institution propriétaire
    const abonnement = await Abonnement.findById(abonnementId);
    if (!abonnement) {
      return res.status(404).json({ message: 'Abonnement introuvable.' });
    }

    if (abonnement.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Accès refusé.' });
    }

    const acces = await AccesEtudiant.find({ abonnement: abonnementId })
      .populate('etudiant',      'nom prenom email')
      .populate('codeFormation', 'code dateUtilisation')
      .sort({ dateActivation: -1 });

    return res.status(200).json({
      total: acces.length,
      acces: acces.map((a) => ({
        _id:            a._id,
        statut:         a.statut,
        dateActivation: a.dateActivation,
        etudiant: {
          _id:    a.etudiant?._id,
          nom:    a.etudiant?.nom,
          prenom: a.etudiant?.prenom,
          email:  a.etudiant?.email,
        },
        codeUtilise: a.codeFormation?.code,
      })),
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


module.exports = {
  getMesExperiences,
  getUnAcces,
  getAccesParAbonnement,
};