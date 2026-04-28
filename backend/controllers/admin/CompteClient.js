const mongoose = require('mongoose');
const User = mongoose.model('Utilisateur'); 
const { envoyerEmailApprobation, envoyerEmailRejet } = require('../../services/emailCompteClient');

// ===============================
// Lister tous les comptes (hors admin)
// ===============================
const listerTous = async (req, res) => {
  try {
    const users = await User.find({ role: { $ne: 'admin' } }).sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    console.error("🔥 ERREUR LISTER TOUS :", err); 
    res.status(500).json({ 
      message: "Erreur récupération comptes", 
      error: err.message 
    });
  }
};

// ===============================
// Lister par statut
// ===============================
const listerParStatut = async (req, res) => {
  try {
    const { statut } = req.params;

    const users = await User.find({
      statut,
      role: { $ne: 'admin' }
    }).sort({ createdAt: -1 });

    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Erreur filtrage comptes" });
  }
};

// ===============================
// Approuver compte
// ===============================
const approuverCompte = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "Compte introuvable" });

    if (user.statut !== 'en_attente') {
      return res.status(400).json({ message: "Compte déjà traité" });
    }

    user.statut = 'approuve';
    await user.save();

    await envoyerEmailApprobation(user);

    res.json({ message: "Compte approuvé", user });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur approbation" });
  }
};

// ===============================
// Rejeter compte
// ===============================
const rejeterCompte = async (req, res) => {
  try {
    const { id } = req.params;
    const motifRefus = req.body?.motifRefus || "Non spécifié";

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "Compte introuvable" });

    if (user.statut !== 'en_attente') {
      return res.status(400).json({ message: "Compte déjà traité" });
    }

    user.statut = 'rejete';
    user.motifRefus = motifRefus;
    await user.save();

    await envoyerEmailRejet(user);

    res.json({ message: "Compte rejeté", user });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur rejet" });
  }
};

const obtenirStatistiques = async (req, res) => {
  try {
    const maintenant = new Date();
    const il_y_a_30_jours = new Date(maintenant - 30 * 24 * 60 * 60 * 1000);
    const il_y_a_60_jours = new Date(maintenant - 60 * 24 * 60 * 60 * 1000);

    // ── Totaux globaux (hors admin) ────────────────────────────────
    const [
      totalEnAttente,
      totalApprouve,
      totalRejete,
      totalComptes,
    ] = await Promise.all([
      User.countDocuments({ statut: 'en_attente', role: { $ne: 'admin' } }),
      User.countDocuments({ statut: 'approuve',   role: { $ne: 'admin' } }),
      User.countDocuments({ statut: 'rejete',     role: { $ne: 'admin' } }),
      User.countDocuments({ role: { $ne: 'admin' } }),
    ]);

    // ── Totaux 30j et période précédente ───────────────────────────
    const [inscriptions30j, inscriptions30_60j] = await Promise.all([
      User.countDocuments({
        role: { $ne: 'admin' },
        createdAt: { $gte: il_y_a_30_jours },
      }),
      User.countDocuments({
        role: { $ne: 'admin' },
        createdAt: { $gte: il_y_a_60_jours, $lt: il_y_a_30_jours },
      }),
    ]);

    const variationInscriptions =
      inscriptions30_60j === 0
        ? null
        : Math.round(((inscriptions30j - inscriptions30_60j) / inscriptions30_60j) * 100);

    // ── Taux d'approbation ─────────────────────────────────────────
    const comptesTraites = totalApprouve + totalRejete;
    const tauxApprobation =
      comptesTraites === 0
        ? 0
        : Math.round(totalApprouve / comptesTraites * 100);

    // ── Délai moyen d'approbation (createdAt → updatedAt pour les approuvés) ──
    // Nécessite que updatedAt soit activé sur le modèle (timestamps: true)
    const comptesApprouves = await User.find(
      { statut: 'approuve', role: { $ne: 'admin' } },
      { createdAt: 1, updatedAt: 1 }
    ).lean();

    let delaiMoyenApprobationH = null;
    if (comptesApprouves.length > 0) {
      const total = comptesApprouves.reduce(
        (acc, u) => acc + (new Date(u.updatedAt) - new Date(u.createdAt)), 0
      );
      delaiMoyenApprobationH = Math.round(
        total / comptesApprouves.length / 1000 / 3600
      );
    }

    // ── Courbe journalière des inscriptions 30j ────────────────────
    const parJour = await User.aggregate([
      {
        $match: {
          role: { $ne: 'admin' },
          createdAt: { $gte: il_y_a_30_jours },
        },
      },
      {
        $group: {
          _id: {
            annee: { $year: '$createdAt' },
            mois:  { $month: '$createdAt' },
            jour:  { $dayOfMonth: '$createdAt' },
          },
          total:      { $sum: 1 },
          approuves:  { $sum: { $cond: [{ $eq: ['$statut', 'approuve']   }, 1, 0] } },
          rejetes:    { $sum: { $cond: [{ $eq: ['$statut', 'rejete']     }, 1, 0] } },
          enAttente:  { $sum: { $cond: [{ $eq: ['$statut', 'en_attente'] }, 1, 0] } },
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
                  year: '$_id.annee', month: '$_id.mois', day: '$_id.jour',
                },
              },
            },
          },
          total: 1, approuves: 1, rejetes: 1, enAttente: 1,
        },
      },
    ]);

    // ── Répartition par mois ────────────────────────────────────────
    const parMois = await User.aggregate([
      { $match: { role: { $ne: 'admin' } } },
      {
        $group: {
          _id: {
            annee: { $year: '$createdAt' },
            mois:  { $month: '$createdAt' },
          },
          total:     { $sum: 1 },
          approuves: { $sum: { $cond: [{ $eq: ['$statut', 'approuve'] }, 1, 0] } },
          rejetes:   { $sum: { $cond: [{ $eq: ['$statut', 'rejete']   }, 1, 0] } },
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
          total: 1, approuves: 1, rejetes: 1,
        },
      },
    ]);

    res.json({
      totaux: {
        all:       totalComptes,
        enAttente: totalEnAttente,
        approuve:  totalApprouve,
        rejete:    totalRejete,
      },

      periode30j: {
        inscriptions: inscriptions30j,
        variation:    variationInscriptions, // en %
      },

      taux: {
        approbation:       tauxApprobation,       // % approuvés parmi traités
        enAttenteRatio:    totalComptes === 0 ? 0
                           : Math.round(totalEnAttente / totalComptes * 100),
        delaiMoyenApprobH: delaiMoyenApprobationH,
      },

      courbes: {
        parJour,   // [{date, total, approuves, rejetes, enAttente}, ...]
        parMois,   // [{periode, total, approuves, rejetes}, ...]
      },
    });
  } catch (err) {
    console.error('Erreur statistiques comptes:', err);
    res.status(500).json({ message: 'Erreur calcul statistiques' });
  }
};


module.exports = {
  listerTous,
  listerParStatut,
  approuverCompte,
  rejeterCompte,
  obtenirStatistiques
};
