const cloudinary = require('cloudinary').v2;
const Experience = require('../../models/experience');
const Abonnement = require('../../models/abonnement');


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


const getAllExperiences = async (req, res) => {
  try {
    const filter = {};

    // Filtrage optionnel par cible via query param
    const { cible } = req.query;
    const validCibles = ['etudiant', 'professionnel', 'les deux'];
    if (cible && validCibles.includes(cible)) {
      filter.cible = cible;
    }

    const experiences = await Experience.find(filter)
      .populate('forfaits', 'name price')
      .sort({ createdAt: -1 });

    res.json(experiences);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


const deleteExperience = async (req, res) => {
  try {
    const exp = await Experience.findById(req.params.id);
    if (!exp) return res.status(404).json({ message: 'Expérience introuvable' });

    if (exp.apkPublicId) {
      await cloudinary.uploader.destroy(exp.apkPublicId, { resource_type: 'raw' });
    }

    await Experience.findByIdAndDelete(req.params.id);
    res.json({ message: 'Expérience supprimée avec succès' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


const getMesExperiences = async (req, res) => {
  try {
    const { userId } = req.params;

    const abonnement = await Abonnement.findOne({ user: userId, status: 'active' })
      .populate('forfait')
      .populate('experiencesDebloquees', '_id');

    if (!abonnement) {
      return res.status(404).json({ message: 'Aucun abonnement actif' });
    }

    // Filtre de base : expériences liées au forfait
    const filter = { forfaits: abonnement.forfait._id };

    // Filtrage optionnel par cible
    const { cible } = req.query;
    const validCibles = ['etudiant', 'professionnel', 'les deux'];
    if (cible && validCibles.includes(cible)) {
      filter.cible = cible;
    }

    const experiences = await Experience.find(filter);

    const deblouqueesIds = abonnement.experiencesDebloquees.map(e => e._id.toString());

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

const downloadExperienceApk = async (req, res) => {
  try {
    const { userId, experienceId } = req.params;

    const abonnement = await Abonnement.findOne({ user: userId, status: 'active' })
      .populate('forfait');

    if (!abonnement) {
      return res.status(404).json({ message: 'Aucun abonnement actif' });
    }

    const experience = await Experience.findOne({
      _id:     experienceId,
      forfaits: abonnement.forfait._id
    });

    if (!experience) {
      return res.status(403).json({
        message: "Cette expérience n'est pas disponible dans votre forfait."
      });
    }

    const dejaTelechargee = abonnement.experiencesDebloquees
      .map(id => id.toString())
      .includes(experienceId);

    if (!dejaTelechargee) {
      if (abonnement.apkRestants <= 0) {
        return res.status(403).json({
          message: `Quota APK épuisé (${abonnement.forfait.nbApk}/mois). Renouvelez votre abonnement.`
        });
      }
      abonnement.apkRestants -= 1;
      abonnement.experiencesDebloquees.push(experienceId);
      await abonnement.save();
    }

    res.json({
      downloadUrl:  experience.apkUrl,
      fileName:     experience.apkOriginalName || `${experience.title}.apk`,
      apkRestants:  abonnement.apkRestants,
      dejaInstalle: dejaTelechargee,
      // ✅ cible retourné dans la réponse pour info côté client
      cible:        experience.cible,
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


const getExperiencesByForfait = async (req, res) => {
  try {
    const { forfaitId } = req.params;

    const filter = { forfaits: forfaitId };

    const { cible } = req.query;
    const validCibles = ['etudiant', 'professionnel', 'les deux'];
    if (cible && validCibles.includes(cible)) {
      filter.cible = cible;
    }

    const experiences = await Experience.find(filter)
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

    // Validation manuelle de cible si fourni dans le body
    if (req.body.cible) {
      const validCibles = ['etudiant', 'professionnel', 'les deux'];
      if (!validCibles.includes(req.body.cible)) {
        return res.status(400).json({
          message: `Cible invalide. Valeurs acceptées : ${validCibles.join(', ')}`
        });
      }
    }

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


const getExperiencesForEtudiant = async (req, res) => {
  try {
    const experiences = await Experience.find({
      cible: { $in: ['etudiant', 'les deux'] }
    })
      .populate('forfaits', 'name price tagline')
      .sort({ createdAt: -1 });

    res.json({ total: experiences.length, experiences });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getExperiencesForProfessionnel = async (req, res) => {
  try {
    const experiences = await Experience.find({
      cible: { $in: ['professionnel', 'les deux'] }
    })
      .populate('forfaits', 'name price tagline')
      .sort({ createdAt: -1 });

    res.json({ total: experiences.length, experiences });
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
  getExperiencesForEtudiant,
  getExperiencesForProfessionnel
};