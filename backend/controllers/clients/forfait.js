const Forfait = require('../../models/forfait');

// Récupérer tous les forfaits
const getAllForfaits = async (req, res) => {
  try {
    const forfaits = await Forfait.find();
    res.json(forfaits);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Récupérer un forfait par id
const getForfaitById = async (req, res) => {
  try {
    const forfait = await Forfait.findById(req.params.id);
    if (!forfait) return res.status(404).json({ message: 'Forfait non trouvé' });
    res.json(forfait);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Ajouter un forfait
const createForfait = async (req, res) => {
  const forfait = new Forfait(req.body);
  try {
    const newForfait = await forfait.save();
    res.status(201).json(newForfait);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Mettre à jour un forfait par id
const updateForfait = async (req, res) => {
  try {
    const updatedForfait = await Forfait.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedForfait) return res.status(404).json({ message: 'Forfait non trouvé' });
    res.json(updatedForfait);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Supprimer un forfait par id
const deleteForfait = async (req, res) => {
  try {
    const deletedForfait = await Forfait.findByIdAndDelete(req.params.id);
    if (!deletedForfait) return res.status(404).json({ message: 'Forfait non trouvé' });
    res.json({ message: 'Forfait supprimé avec succès' });
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
};