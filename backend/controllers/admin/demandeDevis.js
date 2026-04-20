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

const obtenirStatistiques = async (req, res) => {
  try {
    const [totalNouvelle, totalEnCours, totalEnvoyee, totalDemandes] = await Promise.all([
      DemandeDevis.countDocuments({ statut: 'nouvelle' }),
      DemandeDevis.countDocuments({ statut: 'en_cours' }),
      DemandeDevis.countDocuments({ statut: 'envoyee' }),
      DemandeDevis.countDocuments()
    ]);

    const devisEnvoyes = await DemandeDevis.find({ statut: 'envoyee', 'devisCalcule.totalTTC': { $exists: true } });
    const montantTotal = devisEnvoyes.reduce((sum, d) => sum + (d.devisCalcule.totalTTC || 0), 0);

    res.json({
      totalNouvelle, totalEnCours, totalEnvoyee, totalDemandes,
      montantTotal: Math.round(montantTotal * 100) / 100
    });
  } catch (err) {
    console.error('Erreur statistiques:', err);
    res.status(500).json({ message: "Erreur calcul statistiques" });
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