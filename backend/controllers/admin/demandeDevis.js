const DemandeDevis = require('../../models/demandeDevis');
const { calculerDevis } = require('../../services/devisCalcul');
const { envoyerEmailDevis } = require('../../services/emailDevis');

const listerToutesDemandesDevis = async (req, res) => {
  try {
    const demandes = await DemandeDevis.find().sort({ dateCreation: -1 });
    res.json(demandes);
  } catch (err) {
    console.error('Erreur récupération demandes devis:', err);
    res.status(500).json({ message: "Erreur récupération demandes devis" });
  }
};

const listerDemandesParStatut = async (req, res) => {
  try {
    const { statut } = req.params;
    if (!['nouvelle', 'en_cours', 'envoyee'].includes(statut)) {
      return res.status(400).json({ message: "Statut invalide" });
    }
    const demandes = await DemandeDevis.find({ statut }).sort({ dateCreation: -1 });
    res.json(demandes);
  } catch (err) {
    console.error('Erreur filtrage demandes:', err);
    res.status(500).json({ message: "Erreur filtrage demandes" });
  }
};

// controllers/admin/demandesDevisController.js

const obtenirStatistiques = async (req, res) => {
  try {
    const maintenant = new Date();
    const il_y_a_30_jours = new Date(maintenant - 30 * 24 * 60 * 60 * 1000);
    const il_y_a_60_jours = new Date(maintenant - 60 * 24 * 60 * 60 * 1000);

    // ── Totaux globaux ──────────────────────────────────────────────
    const [
      totalNouvelle,
      totalEnCours,
      totalEnvoyee,
      totalDemandes,
    ] = await Promise.all([
      DemandeDevis.countDocuments({ statut: 'nouvelle' }),
      DemandeDevis.countDocuments({ statut: 'en_cours' }),
      DemandeDevis.countDocuments({ statut: 'envoyee' }),
      DemandeDevis.countDocuments(),
    ]);

    // ── Totaux 30j et 30-60j ────────────────────────────────────────
    const [total30j, total30_60j] = await Promise.all([
      DemandeDevis.countDocuments({ dateCreation: { $gte: il_y_a_30_jours } }),
      DemandeDevis.countDocuments({
        dateCreation: { $gte: il_y_a_60_jours, $lt: il_y_a_30_jours },
      }),
    ]);

    const variationTotal =
      total30_60j === 0
        ? null
        : Math.round(((total30j - total30_60j) / total30_60j) * 100);

    // ── Montants financiers (pour KPI chiffre d'affaires) ──────────
    const statsFinancieres = await DemandeDevis.aggregate([
      { $match: { statut: 'envoyee', 'devisCalcule.totalTTC': { $exists: true } } },
      {
        $group: {
          _id: null,
          montantTotal:    { $sum: '$devisCalcule.totalTTC' },
          montantMoyen:    { $avg: '$devisCalcule.totalTTC' },
          montantMin:      { $min: '$devisCalcule.totalTTC' },
          montantMax:      { $max: '$devisCalcule.totalTTC' },
          nbDevisEnvoyes:  { $sum: 1 },
        },
      },
    ]);

    const finances = statsFinancieres[0] || {
      montantTotal: 0, montantMoyen: 0,
      montantMin: 0,   montantMax: 0, nbDevisEnvoyes: 0,
    };

    // Montants sur 30 derniers jours
    const [stats30j] = await DemandeDevis.aggregate([
      {
        $match: {
          statut: 'envoyee',
          dateEnvoi: { $gte: il_y_a_30_jours },
          'devisCalcule.totalTTC': { $exists: true },
        },
      },
      {
        $group: {
          _id: null,
          montant30j: { $sum: '$devisCalcule.totalTTC' },
          nb30j:      { $sum: 1 },
        },
      },
    ]) || [{ montant30j: 0, nb30j: 0 }];

    // ── Délai moyen de traitement ───────────────────────────────────
    const devisEnvoyes = await DemandeDevis.find(
      { statut: 'envoyee', dateEnvoi: { $exists: true } },
      { dateCreation: 1, dateEnvoi: 1 }
    ).lean();

    let delaiMoyenEnvoiH = null;
    if (devisEnvoyes.length > 0) {
      const total = devisEnvoyes.reduce(
        (acc, d) => acc + (new Date(d.dateEnvoi) - new Date(d.dateCreation)), 0
      );
      delaiMoyenEnvoiH = Math.round(total / devisEnvoyes.length / 1000 / 3600);
    }

    // ── Taux de conversion ──────────────────────────────────────────
    const tauxEnvoi =
      totalDemandes === 0
        ? 0
        : Math.round(totalEnvoyee / totalDemandes * 100);

    // ── Courbe journalière 30j ──────────────────────────────────────
    const parJour = await DemandeDevis.aggregate([
      { $match: { dateCreation: { $gte: il_y_a_30_jours } } },
      {
        $group: {
          _id: {
            annee: { $year: '$dateCreation' },
            mois:  { $month: '$dateCreation' },
            jour:  { $dayOfMonth: '$dateCreation' },
          },
          total:    { $sum: 1 },
          envoyees: { $sum: { $cond: [{ $eq: ['$statut', 'envoyee']  }, 1, 0] } },
          enCours:  { $sum: { $cond: [{ $eq: ['$statut', 'en_cours'] }, 1, 0] } },
          // Montant cumulé envoyé ce jour
          montantJour: {
            $sum: {
              $cond: [
                { $eq: ['$statut', 'envoyee'] },
                '$devisCalcule.totalTTC',
                0,
              ],
            },
          },
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
          total: 1, envoyees: 1, enCours: 1, montantJour: 1,
        },
      },
    ]);

    // ── Répartition par mois ────────────────────────────────────────
    const parMois = await DemandeDevis.aggregate([
      {
        $group: {
          _id: { annee: { $year: '$dateCreation' }, mois: { $month: '$dateCreation' } },
          total:       { $sum: 1 },
          montantMois: {
            $sum: {
              $cond: [
                { $and: [
                    { $eq: ['$statut', 'envoyee'] },
                    { $ifNull: ['$devisCalcule.totalTTC', false] },
                ]},
                '$devisCalcule.totalTTC',
                0,
              ],
            },
          },
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
          total: 1, montantMois: 1,
        },
      },
    ]);

    res.json({
      totaux: {
        all:      totalDemandes,
        nouvelle: totalNouvelle,
        enCours:  totalEnCours,
        envoyee:  totalEnvoyee,
      },

      periode30j: {
        total:     total30j,
        montant:   Math.round((stats30j?.montant30j || 0) * 100) / 100,
        nbEnvoyes: stats30j?.nb30j || 0,
        variation: variationTotal,
      },

      finances: {
        montantTotal:   Math.round(finances.montantTotal   * 100) / 100,
        montantMoyen:   Math.round(finances.montantMoyen   * 100) / 100,
        montantMin:     Math.round(finances.montantMin     * 100) / 100,
        montantMax:     Math.round(finances.montantMax     * 100) / 100,
        nbDevisEnvoyes: finances.nbDevisEnvoyes,
      },

      taux: {
        envoi:          tauxEnvoi,           // % demandes → devis envoyé
        delaiMoyenH:    delaiMoyenEnvoiH,    // délai moyen création → envoi
      },

      courbes: {
        parJour,   // [{date, total, envoyees, enCours, montantJour}, ...]
        parMois,   // [{periode, total, montantMois}, ...]
      },
    });
  } catch (err) {
    console.error('Erreur statistiques devis:', err);
    res.status(500).json({ message: 'Erreur calcul statistiques' });
  }
};

const calculerDevisEstime = async (req, res) => {
  try {
    const { id } = req.params;
    const demande = await DemandeDevis.findById(id);
    if (!demande) return res.status(404).json({ message: "Demande introuvable" });

    const devisCalcule = calculerDevis(demande);
    demande.devisCalcule = devisCalcule;
    demande.statut = 'en_cours';
    demande.dateTraitement = new Date();
    await demande.save();

    res.json({ message: "Devis calculé avec succès", demande, devis: devisCalcule });
  } catch (err) {
    console.error('Erreur calcul devis:', err);
    res.status(500).json({ message: "Erreur lors du calcul du devis", error: err.message });
  }
};

const envoyerDevis = async (req, res) => {
  try {
    const { id } = req.params;
    const { messagePersonnalise } = req.body;

    const demande = await DemandeDevis.findById(id);
    if (!demande) return res.status(404).json({ message: "Demande introuvable" });

    if (!demande.devisCalcule || !demande.devisCalcule.totalTTC) {
      return res.status(400).json({ message: "Veuillez d'abord calculer le devis avant de l'envoyer" });
    }
    if (demande.statut === 'envoyee') {
      return res.status(400).json({ message: "Le devis a déjà été envoyé" });
    }

    const { genererPDFBuffer } = require('../../services/pdfDevis');
    const pdfBuffer = await genererPDFBuffer(demande, demande.devisCalcule);

    const emailInfo = await envoyerEmailDevis({
      demande,
      devis: demande.devisCalcule,
      messagePersonnalise,
      pdfBuffer
    });

    demande.statut = 'envoyee';
    demande.dateEnvoi = new Date();
    demande.historiqueEmails.push({
      dateEnvoi: new Date(),
      messageId: emailInfo.messageId,
      devisAttache: true,
      statut: 'envoye'
    });
    await demande.save();

    res.json({
      message: "Devis envoyé avec succès",
      demande,
      emailInfo: { messageId: emailInfo.messageId, destinataire: demande.emailProfessionnel }
    });
  } catch (err) {
    console.error('Erreur envoi devis:', err);
    res.status(500).json({ message: "Erreur lors de l'envoi du devis", error: err.message });
  }
};

// ===============================
// Calculer ET envoyer (action combinée) — MODIFIÉE
// ===============================
const calculerEtEnvoyerDevis = async (req, res) => {
  try {
    const { id } = req.params;

    const demande = await DemandeDevis.findById(id);
    if (!demande) return res.status(404).json({ message: "Demande introuvable" });

    if (demande.statut === 'envoyee') {
      return res.status(400).json({ message: "Le devis a déjà été envoyé" });
    }

    // 1. Calculer le devis
    const devisCalcule = calculerDevis(demande);
    demande.devisCalcule = devisCalcule;
    demande.statut = 'en_cours';
    demande.dateTraitement = new Date();
    await demande.save();

    // 2. Générer le PDF en mémoire (Buffer) — plus de fichier temporaire
    const { genererPDFBuffer } = require('../../services/pdfDevis');
    const pdfBuffer = await genererPDFBuffer(demande, devisCalcule);
    console.log(`📄 Buffer PDF prêt : ${(pdfBuffer.length / 1024).toFixed(1)} Ko`);

    // 3. Envoyer l'email avec le buffer directement
    const emailInfo = await envoyerEmailDevis({
      demande,
      devis: devisCalcule,
      pdfBuffer  // ← buffer en mémoire, pas de fichier temporaire
    });

    // 4. Mettre à jour le statut
    demande.statut = 'envoyee';
    demande.dateEnvoi = new Date();
    demande.historiqueEmails.push({
      dateEnvoi: new Date(),
      messageId: emailInfo.messageId,
      devisAttache: true,
      statut: 'envoye'
    });
    await demande.save();

    res.json({
      message: "Devis calculé et envoyé avec succès",
      demande,
      devis: devisCalcule,
      emailInfo: {
        messageId: emailInfo.messageId,
        destinataire: demande.emailProfessionnel,
        montantTTC: devisCalcule.totalTTC,
        pdfAttache: true
      }
    });

  } catch (err) {
    console.error('Erreur calcul et envoi devis:', err);
    res.status(500).json({ message: "Erreur lors du traitement du devis", error: err.message });
  }
};

const mettreAJourNotes = async (req, res) => {
  try {
    const { id } = req.params;
    const { notesAdmin } = req.body;

    const demande = await DemandeDevis.findByIdAndUpdate(
      id, { notesAdmin }, { new: true, runValidators: true }
    );
    if (!demande) return res.status(404).json({ message: "Demande introuvable" });

    res.json({ message: "Notes mises à jour avec succès", demande });
  } catch (err) {
    console.error('Erreur MAJ notes:', err);
    res.status(500).json({ message: "Erreur mise à jour notes" });
  }
};

const supprimerDemande = async (req, res) => {
  try {
    const { id } = req.params;
    const demande = await DemandeDevis.findByIdAndDelete(id);
    if (!demande) return res.status(404).json({ message: "Demande introuvable" });
    res.json({ message: "Demande supprimée avec succès" });
  } catch (err) {
    console.error('Erreur suppression:', err);
    res.status(500).json({ message: "Erreur suppression demande" });
  }
};

module.exports = {
  listerToutesDemandesDevis,
  listerDemandesParStatut,
  obtenirStatistiques,
  calculerDevisEstime,
  envoyerDevis,
  calculerEtEnvoyerDevis,
  mettreAJourNotes,
  supprimerDemande
};