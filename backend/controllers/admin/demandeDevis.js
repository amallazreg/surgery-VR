const DemandeDevis = require('../../models/demandeDevis');
const { calculerDevis } = require('../../services/devisCalcul');
const { envoyerEmailDevis } = require('../../services/emailDevis');

// ===============================
// Lister toutes les demandes de devis
// ===============================
const listerToutesDemandesDevis = async (req, res) => {
  try {
    const demandes = await DemandeDevis.find()
      .sort({ dateCreation: -1 });

    res.json(demandes);
  } catch (err) {
    console.error('Erreur récupération demandes devis:', err);
    res.status(500).json({ message: "Erreur récupération demandes devis" });
  }
};

// ===============================
// Lister demandes par statut
// ===============================
const listerDemandesParStatut = async (req, res) => {
  try {
    const { statut } = req.params;

    if (!['nouvelle', 'en_cours', 'envoyee'].includes(statut)) {
      return res.status(400).json({ message: "Statut invalide" });
    }

    const demandes = await DemandeDevis.find({ statut })
      .sort({ dateCreation: -1 });

    res.json(demandes);
  } catch (err) {
    console.error('Erreur filtrage demandes:', err);
    res.status(500).json({ message: "Erreur filtrage demandes" });
  }
};

// ===============================
// Obtenir les statistiques
// ===============================
const obtenirStatistiques = async (req, res) => {
  try {
    const [totalNouvelle, totalEnCours, totalEnvoyee, totalDemandes] = await Promise.all([
      DemandeDevis.countDocuments({ statut: 'nouvelle' }),
      DemandeDevis.countDocuments({ statut: 'en_cours' }),
      DemandeDevis.countDocuments({ statut: 'envoyee' }),
      DemandeDevis.countDocuments()
    ]);

    // Calculer le montant total des devis envoyés
    const devisEnvoyes = await DemandeDevis.find({ statut: 'envoyee', 'devisCalcule.totalTTC': { $exists: true } });
    const montantTotal = devisEnvoyes.reduce((sum, d) => sum + (d.devisCalcule.totalTTC || 0), 0);

    res.json({
      totalNouvelle,
      totalEnCours,
      totalEnvoyee,
      totalDemandes,
      montantTotal: Math.round(montantTotal * 100) / 100
    });
  } catch (err) {
    console.error('Erreur statistiques:', err);
    res.status(500).json({ message: "Erreur calcul statistiques" });
  }
};

// ===============================
// Calculer le devis (sans l'envoyer)
// ===============================
const calculerDevisEstime = async (req, res) => {
  try {
    const { id } = req.params;

    const demande = await DemandeDevis.findById(id);
    if (!demande) {
      return res.status(404).json({ message: "Demande introuvable" });
    }

    // Calculer le devis
    const devisCalcule = calculerDevis(demande);

    // Mettre à jour la demande avec le devis calculé
    demande.devisCalcule = devisCalcule;
    demande.statut = 'en_cours';
    demande.dateTraitement = new Date();
    await demande.save();

    res.json({
      message: "Devis calculé avec succès",
      demande,
      devis: devisCalcule
    });

  } catch (err) {
    console.error('Erreur calcul devis:', err);
    res.status(500).json({ 
      message: "Erreur lors du calcul du devis",
      error: err.message 
    });
  }
};

// ===============================
// Envoyer le devis par email
// ===============================
const envoyerDevis = async (req, res) => {
  try {
    const { id } = req.params;
    const { messagePersonnalise } = req.body;

    const demande = await DemandeDevis.findById(id);
    if (!demande) {
      return res.status(404).json({ message: "Demande introuvable" });
    }

    // Vérifier qu'un devis a été calculé
    if (!demande.devisCalcule || !demande.devisCalcule.totalTTC) {
      return res.status(400).json({ 
        message: "Veuillez d'abord calculer le devis avant de l'envoyer" 
      });
    }

    if (demande.statut === 'envoyee') {
      return res.status(400).json({ 
        message: "Le devis a déjà été envoyé" 
      });
    }

    // Envoyer l'email avec le devis
    const emailInfo = await envoyerEmailDevis({
      demande,
      devis: demande.devisCalcule,
      messagePersonnalise
    });

    // Mettre à jour le statut
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
      emailInfo: {
        messageId: emailInfo.messageId,
        destinataire: demande.emailProfessionnel
      }
    });

  } catch (err) {
    console.error('Erreur envoi devis:', err);
    
    // Logger l'erreur dans l'historique
    try {
      const demande = await DemandeDevis.findById(req.params.id);
      if (demande) {
        demande.historiqueEmails.push({
          dateEnvoi: new Date(),
          devisAttache: true,
          statut: 'erreur'
        });
        await demande.save();
      }
    } catch (logErr) {
      console.error('Erreur log:', logErr);
    }

    res.status(500).json({ 
      message: "Erreur lors de l'envoi du devis",
      error: err.message 
    });
  }
};

// ===============================
// Calculer ET envoyer le devis (action combinée)
// ===============================
const calculerEtEnvoyerDevis = async (req, res) => {
  try {
    const { id } = req.params;
    const { messagePersonnalise } = req.body;

    const demande = await DemandeDevis.findById(id);
    if (!demande) {
      return res.status(404).json({ message: "Demande introuvable" });
    }

    if (demande.statut === 'envoyee') {
      return res.status(400).json({ 
        message: "Le devis a déjà été envoyé" 
      });
    }

    // 1. Calculer le devis
    const devisCalcule = calculerDevis(demande);
    demande.devisCalcule = devisCalcule;
    demande.statut = 'en_cours';
    demande.dateTraitement = new Date();
    await demande.save();

    // 2. Générer le PDF
    const { genererPDFDevis, supprimerPDFTemp } = require('../../services/pdfDevis');
    const { filePath: pdfPath, fileName: pdfFileName } = await genererPDFDevis(demande, devisCalcule);

    // 3. Envoyer l'email avec le PDF
    const emailInfo = await envoyerEmailDevis({
      demande,
      devis: devisCalcule
    });

    // 4. Supprimer le PDF temporaire
    setTimeout(() => {
      supprimerPDFTemp(pdfPath);
    }, 5000); // Attendre 5 secondes pour être sûr que l'email est envoyé

    // 5. Mettre à jour le statut final
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
        pdfAttache: true,
        pdfFileName
      }
    });

  } catch (err) {
    console.error('Erreur calcul et envoi devis:', err);
    res.status(500).json({ 
      message: "Erreur lors du traitement du devis",
      error: err.message 
    });
  }
};

// ===============================
// Mettre à jour les notes admin
// ===============================
const mettreAJourNotes = async (req, res) => {
  try {
    const { id } = req.params;
    const { notesAdmin } = req.body;

    const demande = await DemandeDevis.findByIdAndUpdate(
      id,
      { notesAdmin },
      { new: true, runValidators: true }
    );

    if (!demande) {
      return res.status(404).json({ message: "Demande introuvable" });
    }

    res.json({ 
      message: "Notes mises à jour avec succès", 
      demande 
    });

  } catch (err) {
    console.error('Erreur MAJ notes:', err);
    res.status(500).json({ message: "Erreur mise à jour notes" });
  }
};

// ===============================
// Supprimer une demande
// ===============================
const supprimerDemande = async (req, res) => {
  try {
    const { id } = req.params;

    const demande = await DemandeDevis.findByIdAndDelete(id);

    if (!demande) {
      return res.status(404).json({ message: "Demande introuvable" });
    }

    res.json({ 
      message: "Demande supprimée avec succès" 
    });

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