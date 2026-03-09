const CodeFormation = require('../../models/codeFormation');
const Abonnement    = require('../../models/abonnement');
const AccesEtudiant = require('../../models/accesEtudiant');
const Experience    = require('../../models/experience'); // ← AJOUTÉ

// ═══════════════════════════════════════════════════════════
// helper — Récupère les expériences liées à un forfaitId
// La relation est portée par Experience.forfaits[],
// donc on fait Experience.find({ forfaits: forfaitId })
// ═══════════════════════════════════════════════════════════
const getExperiencesDuForfait = async (forfaitId) => {
  if (!forfaitId) return [];
  return Experience.find({ forfaits: forfaitId }).select(
    'title description emoji thumbClass compatibility appLabUrl apkUrl'
  );
};

// ═══════════════════════════════════════════════════════════
// 1. POST — Vérifier un code (sans activer)
// Route : POST /api/codes/verifier
// Body  : { code: "A3F2C1B0" }
// Auth  : étudiant
// ═══════════════════════════════════════════════════════════
const verifierCode = async (req, res) => {
  try {
    const { code } = req.body;

    if (!code?.trim()) {
      return res.status(400).json({ valide: false, message: 'Code manquant.' });
    }

    const codeDoc = await CodeFormation.findOne({
      code: code.trim().toUpperCase()
    })
      .populate('institution', 'nom prenom email organisation')
      .populate({
        path: 'abonnement',
        populate: { path: 'forfait' }
      });

    if (!codeDoc) {
      return res.status(404).json({
        valide:  false,
        message: 'Code invalide. Vérifiez la saisie ou contactez votre institution.'
      });
    }

    if (codeDoc.statut === 'utilise') {
      return res.status(400).json({
        valide:  false,
        message: 'Ce code a déjà été utilisé par un autre étudiant.'
      });
    }

    if (codeDoc.statut === 'revoque') {
      return res.status(400).json({
        valide:  false,
        message: 'Ce code a été révoqué par votre institution.'
      });
    }

    if (codeDoc.statut === 'expire' || new Date() > new Date(codeDoc.dateExpiration)) {
      if (codeDoc.statut !== 'expire') {
        codeDoc.statut = 'expire';
        await codeDoc.save();
      }
      return res.status(400).json({
        valide:  false,
        message: `Ce code a expiré le ${new Date(codeDoc.dateExpiration).toLocaleDateString('fr-FR')}.`
      });
    }

    const abonnement      = codeDoc.abonnement;
    const abonnementActif =
      abonnement.status === 'active' &&
      (!abonnement.dateFin || new Date() <= new Date(abonnement.dateFin));

    if (!abonnementActif) {
      return res.status(403).json({
        valide:  false,
        message: "L'abonnement de votre institution n'est plus actif. Contactez votre établissement.",
        statut:  abonnement.status
      });
    }

    // ── Récupérer les expériences via Experience.find({ forfaits: forfaitId }) ──
    const experiences = await getExperiencesDuForfait(abonnement.forfait?._id);

    return res.status(200).json({
      valide:   true,
      message:  'Code valide ✓',
      institution: {
        nom:          codeDoc.institution?.nom,
        prenom:       codeDoc.institution?.prenom,
        organisation: codeDoc.institution?.organisation,
      },
      forfait:        abonnement.forfait?.name,
      dateExpiration: codeDoc.dateExpiration,
      experiences:    experiences.map((exp) => ({
        _id:           exp._id,
        title:         exp.title,
        description:   exp.description,
        emoji:         exp.emoji,
        thumbClass:    exp.thumbClass,
        compatibility: exp.compatibility,
        appLabUrl:     exp.appLabUrl,
      })),
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// ═══════════════════════════════════════════════════════════
// 2. POST — Activer un code → crée un AccesEtudiant
// Route : POST /api/codes/activer
// Body  : { code: "A3F2C1B0" }
// Auth  : étudiant connecté (req.user._id)
// ═══════════════════════════════════════════════════════════
const activerCode = async (req, res) => {
  try {
    const { code }   = req.body;
    const etudiantId = req.user._id;

    if (!code?.trim()) {
      return res.status(400).json({ message: 'Code manquant.' });
    }

    const codeDoc = await CodeFormation.findOne({
      code: code.trim().toUpperCase()
    }).populate({
      path:     'abonnement',
      populate: { path: 'forfait' }
    });

    if (!codeDoc) {
      return res.status(404).json({ message: 'Code invalide.' });
    }

    if (codeDoc.statut !== 'disponible') {
      const messages = {
        utilise: 'Ce code a déjà été utilisé.',
        expire:  'Ce code a expiré.',
        revoque: 'Ce code a été révoqué.',
      };
      return res.status(400).json({
        message: messages[codeDoc.statut] ?? 'Code non disponible.'
      });
    }

    if (new Date() > new Date(codeDoc.dateExpiration)) {
      codeDoc.statut = 'expire';
      await codeDoc.save();
      return res.status(400).json({ message: 'Ce code a expiré.' });
    }

    const abonnement      = codeDoc.abonnement;
    const abonnementActif =
      abonnement.status === 'active' &&
      (!abonnement.dateFin || new Date() <= new Date(abonnement.dateFin));

    if (!abonnementActif) {
      return res.status(403).json({
        message: "L'abonnement de votre institution n'est plus actif."
      });
    }

    const accesExistant = await AccesEtudiant.findOne({
      etudiant:   etudiantId,
      abonnement: abonnement._id,
    });

    if (accesExistant) {
      return res.status(400).json({
        message: 'Vous avez déjà accès aux expériences de cet abonnement.'
      });
    }

    // ── Récupérer les expériences via Experience.find({ forfaits: forfaitId }) ──
    const experiences   = await getExperiencesDuForfait(abonnement.forfait?._id);
    const experienceIds = experiences.map((e) => e._id);

    codeDoc.statut          = 'utilise';
    codeDoc.etudiant        = etudiantId;
    codeDoc.dateUtilisation = new Date();
    await codeDoc.save();

    const acces = await AccesEtudiant.create({
      etudiant:       etudiantId,
      codeFormation:  codeDoc._id,
      abonnement:     abonnement._id,
      experiences:    experienceIds,
      statut:         'actif',
      dateActivation: new Date(),
      dateExpiration: abonnement.dateFin ?? codeDoc.dateExpiration,
    });

    return res.status(201).json({
      message:        'Code activé ! Vos expériences VR sont maintenant accessibles.',
      accesId:        acces._id,
      dateActivation: acces.dateActivation,
      dateExpiration: acces.dateExpiration,
      experiences:    experiences.map((exp) => ({
        _id:           exp._id,
        title:         exp.title,
        description:   exp.description,
        emoji:         exp.emoji,
        thumbClass:    exp.thumbClass,
        compatibility: exp.compatibility,
        appLabUrl:     exp.appLabUrl,
      })),
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        message: 'Vous avez déjà accès aux expériences de cet abonnement.'
      });
    }
    res.status(500).json({ error: error.message });
  }
};


// ═══════════════════════════════════════════════════════════
// 3. GET — Codes d'un abonnement (vue institution)
// Route : GET /api/codes/abonnement/:abonnementId
// Auth  : institution propriétaire
// ═══════════════════════════════════════════════════════════
const getCodesAbonnement = async (req, res) => {
  try {
    const { abonnementId } = req.params;

    const abonnement = await Abonnement.findById(abonnementId);
    if (!abonnement) {
      return res.status(404).json({ message: 'Abonnement introuvable.' });
    }

    if (abonnement.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Accès refusé.' });
    }

    const codes = await CodeFormation.find({ abonnement: abonnementId })
      .populate('etudiant', 'nom prenom email')
      .sort({ createdAt: 1 });

    const stats = {
      total:       codes.length,
      disponibles: codes.filter((c) => c.statut === 'disponible').length,
      utilises:    codes.filter((c) => c.statut === 'utilise').length,
      expires:     codes.filter((c) => c.statut === 'expire').length,
      revoques:    codes.filter((c) => c.statut === 'revoque').length,
    };

    return res.status(200).json({ stats, codes });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// ═══════════════════════════════════════════════════════════
// 4. PATCH — Révoquer un code
// Route : PATCH /api/codes/:codeId/revoquer
// Auth  : institution propriétaire
// ═══════════════════════════════════════════════════════════
const revoquerCode = async (req, res) => {
  try {
    const codeDoc = await CodeFormation.findById(req.params.codeId);

    if (!codeDoc) {
      return res.status(404).json({ message: 'Code introuvable.' });
    }

    if (codeDoc.institution.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Accès refusé.' });
    }

    if (codeDoc.statut === 'revoque') {
      return res.status(400).json({ message: 'Code déjà révoqué.' });
    }

    codeDoc.statut = 'revoque';
    await codeDoc.save();

    if (codeDoc.etudiant) {
      await AccesEtudiant.findOneAndUpdate(
        { codeFormation: codeDoc._id },
        { statut: 'revoque' }
      );
    }

    return res.status(200).json({ message: 'Code révoqué avec succès.' });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


module.exports = {
  verifierCode,
  activerCode,
  getCodesAbonnement,
  revoquerCode,
};