const cloudinary = require('cloudinary').v2;
const Experience = require('../../models/experience');
const Abonnement = require('../../models/abonnement');

// ═══════════════════════════════════════════════════════════
// 1. ADMIN — Créer une expérience + uploader APK sur Cloudinary
//    POST /admin/experiences
//    Body : multipart/form-data
// ═══════════════════════════════════════════════════════════


const createExperience = async (req, res) => {
  try {
    const experience = await Experience.create({
      ...req.body,
      forfaits: req.body.forfaits || [],
    });
    res.status(201).json(experience);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ═══════════════════════════════════════════════════════════
// 2. ADMIN — Lister toutes les expériences
//    GET /admin/experiences
// ═══════════════════════════════════════════════════════════
const getAllExperiences = async (req, res) => {
  try {
    const experiences = await Experience.find()
      .populate('forfaits', 'name price')
      .sort({ createdAt: -1 });
    res.json(experiences);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ═══════════════════════════════════════════════════════════
// 3. ADMIN — Supprimer expérience + fichier Cloudinary
//    DELETE /admin/experiences/:id
// ═══════════════════════════════════════════════════════════
const deleteExperience = async (req, res) => {
  try {
    const exp = await Experience.findById(req.params.id);
    if (!exp) return res.status(404).json({ message: 'Expérience introuvable' });

    // Supprimer le fichier de Cloudinary
    if (exp.apkPublicId) {
      await cloudinary.uploader.destroy(exp.apkPublicId, {
        resource_type: 'raw' // APK = fichier "raw" sur Cloudinary (pas image/vidéo)
      });
    }

    await Experience.findByIdAndDelete(req.params.id);
    res.json({ message: 'Expérience supprimée avec succès' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ═══════════════════════════════════════════════════════════
// 4. CLIENT — Mes expériences (liées au forfait actif)
//    GET /client/experiences/:userId
// ═══════════════════════════════════════════════════════════
const getMesExperiences = async (req, res) => {
  try {
    const { userId } = req.params;

    const abonnement = await Abonnement.findOne({ user: userId, status: 'active' })
      .populate('forfait')
      .populate('experiencesDebloquees', '_id');

    if (!abonnement) {
      return res.status(404).json({ message: 'Aucun abonnement actif' });
    }

    // Toutes les expériences liées au forfait de l'user
    const experiences = await Experience.find({
      forfaits: abonnement.forfait._id
    });

    // IDs des expériences dont l'APK est déjà téléchargé
    const deblouqueesIds = abonnement.experiencesDebloquees.map(e => e._id.toString());

    // Enrichir avec apkInstalled + status
    const result = experiences.map(exp => ({
      ...exp.toObject(),
      apkInstalled: deblouqueesIds.includes(exp._id.toString()),
      status:       deblouqueesIds.includes(exp._id.toString()) ? 'live' : 'new',
    }));

    res.json({
      experiences: result,
      abonnement: {
        apkRestants: abonnement.apkRestants,
        apkTotal:    abonnement.forfait.nbApk,
        forfaitName: abonnement.forfait.name,
        dateFin:     abonnement.dateFin,
      }
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ═══════════════════════════════════════════════════════════
// 5. CLIENT — Télécharger APK (retourne URL Cloudinary)
//    POST /client/experiences/download/:userId/:experienceId
// ═══════════════════════════════════════════════════════════
const downloadExperienceApk = async (req, res) => {
  try {
    const { userId, experienceId } = req.params;

    const abonnement = await Abonnement.findOne({ user: userId, status: 'active' })
      .populate('forfait');

    if (!abonnement) {
      return res.status(404).json({ message: 'Aucun abonnement actif' });
    }

    // Vérifier que l'expérience appartient au forfait de l'user
    const experience = await Experience.findOne({
      _id:     experienceId,
      forfaits: abonnement.forfait._id
    });

    if (!experience) {
      return res.status(403).json({
        message: 'Cette expérience n\'est pas disponible dans votre forfait.'
      });
    }

    // Déjà téléchargé = pas de décompte quota
    const dejaTelechargee = abonnement.experiencesDebloquees
      .map(id => id.toString())
      .includes(experienceId);

    if (!dejaTelechargee) {
      if (abonnement.apkRestants <= 0) {
        return res.status(403).json({
          message: `Quota APK épuisé (${abonnement.forfait.nbApk}/mois). Renouvelez votre abonnement.`
        });
      }
      // Décrémenter + marquer débloquée (persisté en BDD)
      abonnement.apkRestants -= 1;
      abonnement.experiencesDebloquees.push(experienceId);
      await abonnement.save();
    }

    // Retourner l'URL Cloudinary
    // Le frontend va déclencher le téléchargement via un <a> tag
    res.json({
      downloadUrl:  experience.apkUrl,
      fileName:     experience.apkOriginalName || `${experience.title}.apk`,
      apkRestants:  abonnement.apkRestants,
      dejaInstalle: dejaTelechargee,
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getExperiencesByForfait = async (req, res) => {
  try {
    const { forfaitId } = req.params;

    const experiences = await Experience.find({ forfaits: forfaitId })
      .populate('forfaits', 'name price tagline')
      .sort({ createdAt: -1 });

    res.json({
      forfaitId,
      total: experiences.length,
      experiences,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


const updateExperience = async (req, res) => {
  try {
    const exp = await Experience.findById(req.params.id);
    if (!exp) return res.status(404).json({ message: 'Expérience introuvable' });

    const updated = await Experience.findByIdAndUpdate(
      req.params.id,
      { ...req.body },
      { new: true, runValidators: true }
    ).populate('forfaits', 'name price tagline');

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createExperience,
  getAllExperiences,
  deleteExperience,
  getMesExperiences,
  downloadExperienceApk,
  getExperiencesByForfait,
  updateExperience,
};