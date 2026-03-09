const AccesEtudiant = require('../../models/accesEtudiant');
const Abonnement    = require('../../models/abonnement');
const Experience    = require('../../models/experience');

// ═══ 1. getMesExperiences ══════════════════════════════════
const getMesExperiences = async (req, res) => {
  try {
    const etudiantId = req.user._id;

    const acces = await AccesEtudiant.find({ etudiant: etudiantId, statut: 'actif' })
      .populate({
        path:     'abonnement',
        select:   'status dateFin forfait',
        populate: { path: 'forfait', select: 'name _id' }
      });

    if (!acces.length) {
      return res.status(200).json({
        accesActif: false,
        message:    "Aucun accès actif. Saisissez un code de formation pour débloquer vos expériences.",
        experiences: [], total: 0, dateExpiration: null, abonnementFin: null, accesExpires: [],
      });
    }

    const maintenant = new Date();

    const accesValides = acces.filter((a) => {
      const abo = a.abonnement;
      if (!abo) return false;
      return abo.status === 'active' && (!abo.dateFin || maintenant <= new Date(abo.dateFin));
    });

    const accesExpires = acces.filter((a) => {
      const abo = a.abonnement;
      if (!abo) return true;
      return abo.status !== 'active' || (abo.dateFin && maintenant > new Date(abo.dateFin));
    });

    if (!accesValides.length) {
      return res.status(200).json({
        accesActif: false,
        message:    "L'abonnement de votre institution a expiré.",
        experiences: [], total: 0, dateExpiration: null, abonnementFin: null,
        accesExpires: accesExpires.map((a) => ({
          accesId: a._id, forfait: a.abonnement?.forfait?.name,
          dateExpiration: a.dateExpiration, statut: a.abonnement?.status,
        })),
      });
    }

    // Agréger les expériences depuis le forfait (dédupliquées)
    const experiencesMap = new Map();

    for (const a of accesValides) {
      const forfaitId = a.abonnement?.forfait?._id ?? a.abonnement?.forfait;
      if (!forfaitId) continue;

      const experiences = await Experience.find({ forfaits: forfaitId }).select(
        'title description emoji thumbClass compatibility appLabUrl apkUrl'
      );

      experiences.forEach((exp) => {
        if (!experiencesMap.has(exp._id.toString())) {
          experiencesMap.set(exp._id.toString(), {
            _id: exp._id, title: exp.title, description: exp.description,
            emoji: exp.emoji, thumbClass: exp.thumbClass,
            compatibility: exp.compatibility, appLabUrl: exp.appLabUrl,
            forfait: a.abonnement?.forfait?.name,
          });
        }
      });
    }

    const experiences = Array.from(experiencesMap.values());

    return res.status(200).json({
      accesActif:     experiences.length > 0,
      experiences,
      total:          experiences.length,
      dateExpiration: accesValides[0]?.dateExpiration      ?? null,
      abonnementFin:  accesValides[0]?.abonnement?.dateFin ?? null,
      accesExpires: accesExpires.map((a) => ({
        accesId: a._id, forfait: a.abonnement?.forfait?.name,
        dateExpiration: a.dateExpiration, statut: a.abonnement?.status,
      })),
    });

  } catch (error) { res.status(500).json({ error: error.message }); }
};


// ═══ 2. getUnAcces ═════════════════════════════════════════
const getUnAcces = async (req, res) => {
  try {
    const etudiantId = req.user._id;

    // ✅ CORRIGÉ : supprimé le populate('experiences') inutile
    const acces = await AccesEtudiant.findOne({ _id: req.params.accesId, etudiant: etudiantId })
      .populate('codeFormation', 'code dateUtilisation')
      .populate({
        path:     'abonnement',
        select:   'status dateFin forfait user',
        populate: [
          { path: 'forfait', select: 'name _id' },
          { path: 'user',    select: 'nom prenom organisation' }
        ]
      });

    if (!acces) return res.status(404).json({ message: 'Accès introuvable.' });

    const maintenant = new Date();
    const abo = acces.abonnement;
    const abonnementActif = abo.status === 'active' && (!abo.dateFin || maintenant <= new Date(abo.dateFin));

    // Récupérer les expériences en temps réel si accès actif
    let experiences = [];
    if (abonnementActif) {
      const forfaitId = abo?.forfait?._id ?? abo?.forfait;
      if (forfaitId) {
        experiences = await Experience.find({ forfaits: forfaitId }).select(
          'title description emoji thumbClass compatibility appLabUrl apkUrl'
        );
      }
    }

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
      forfait:     abo.forfait?.name,
      experiences: experiences.map((exp) => ({
        _id: exp._id, title: exp.title, description: exp.description,
        emoji: exp.emoji, thumbClass: exp.thumbClass,
        compatibility: exp.compatibility, appLabUrl: exp.appLabUrl,
      })),
      messageExpiration: !abonnementActif
        ? "L'abonnement de votre institution a expiré. Contactez votre établissement."
        : null,
    });

  } catch (error) { res.status(500).json({ error: error.message }); }
};


// ═══ 3. getAccesParAbonnement ══════════════════════════════
const getAccesParAbonnement = async (req, res) => {
  try {
    const { abonnementId } = req.params;

    const abonnement = await Abonnement.findById(abonnementId);
    if (!abonnement) return res.status(404).json({ message: 'Abonnement introuvable.' });
    if (abonnement.user.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Accès refusé.' });

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
        etudiant: { _id: a.etudiant?._id, nom: a.etudiant?.nom, prenom: a.etudiant?.prenom, email: a.etudiant?.email },
        codeUtilise: a.codeFormation?.code,
      })),
    });
  } catch (error) { res.status(500).json({ error: error.message }); }
};


module.exports = { getMesExperiences, getUnAcces, getAccesParAbonnement };