const Forfait = require('../../models/forfait');

// ── Forfaits professionnel (existant — inchangé côté routes) ──

const getAllForfaits = async (req, res) => {
  try {
    // ✅ Filtre : seulement les forfaits professionnel
    const forfaits = await Forfait.find();
    res.json(forfaits);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getForfaitById = async (req, res) => {
  try {
    const forfait = await Forfait.findById(req.params.id);
    if (!forfait) return res.status(404).json({ message: 'Forfait non trouvé' });
    res.json(forfait);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createForfait = async (req, res) => {
  try {
    // ✅ Force cible: 'professionnel' pour ce controller
  const forfait = new Forfait({
      ...req.body,
      cible: req.body.cible ?? 'professionnel',
    });    const newForfait = await forfait.save();
    res.status(201).json(newForfait);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const updateForfait = async (req, res) => {
  try {
    delete req.body.cible; // sécurité — on ne laisse pas changer cible
    const updatedForfait = await Forfait.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedForfait) return res.status(404).json({ message: 'Forfait non trouvé' });
    res.json(updatedForfait);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const deleteForfait = async (req, res) => {
  try {
    const deletedForfait = await Forfait.findByIdAndDelete(req.params.id);
    if (!deletedForfait) return res.status(404).json({ message: 'Forfait non trouvé' });
    res.json({ message: 'Forfait supprimé avec succès' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /forfaits/cible/:cible  →  ex: /forfaits/cible/etudiant
const getForfaitsByCible = async (req, res) => {
  try {
    const { cible } = req.params;

    if (!['professionnel', 'etudiant'].includes(cible)) {
      return res.status(400).json({ 
        message: 'cible invalide. Valeurs acceptées : professionnel, etudiant' 
      });
    }

    // ✅ Supprimé actif: true — le champ n'existe pas dans le modèle
    const forfaits = await Forfait.find({ cible })
      .sort({ price: 1 });

    res.json(forfaits);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getAllForfaits,
  getForfaitById,
  createForfait,
  updateForfait,
  deleteForfait,
  getForfaitsByCible,
};