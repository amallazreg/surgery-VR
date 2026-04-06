const crypto        = require('crypto');
const Abonnement    = require('../../models/abonnement');
const Paiement      = require('../../models/paiement');
const Forfait       = require('../../models/forfait');
const CodeFormation = require('../../models/codeFormation');   // NOUVEAU
const Stripe        = require('stripe');
const stripe        = Stripe(process.env.STRIPE_SECRET_KEY);
const PDFDocument   = require('pdfkit');


// ═══════════════════════════════════════════════════════════
// 1. GET — Abonnement actif de l'utilisateur (avec détails forfait)
// ═══════════════════════════════════════════════════════════
const getMonAbonnement = async (req, res) => {
  try {
    const { userId } = req.params;

    const abonnement = await Abonnement.findOne({ user: userId, status: 'active' })
      .populate('forfait')
      .populate('user', 'nom prenom email');

    if (!abonnement) {
      return res.status(404).json({ message: 'Aucun abonnement actif trouvé' });
    }

    // Vérification de l'expiration
    const now = new Date();
    if (abonnement.dateFin && new Date(abonnement.dateFin) < now) {
      // Mettre à jour le statut en BDD
      await Abonnement.findByIdAndUpdate(abonnement._id, { status: 'expired' });

      return res.status(403).json({
        message: 'Votre abonnement a expiré',
        dateFin: abonnement.dateFin,
        expired: true,
      });
    }

    res.json(abonnement);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// ═══════════════════════════════════════════════════════════
// 2. GET — Historique de tous les abonnements
// ═══════════════════════════════════════════════════════════
const getHistoriqueAbonnements = async (req, res) => {
  try {
    const { userId } = req.params;

    const abonnements = await Abonnement.find({ user: userId })
      .populate('forfait')
      .sort({ createdAt: -1 });

    res.json(abonnements);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// ═══════════════════════════════════════════════════════════
// 3. GET — Factures de l'utilisateur
// ═══════════════════════════════════════════════════════════
const getMesFactures = async (req, res) => {
  try {
    const { userId } = req.params;

    const paiements = await Paiement.find({ user: userId })
      .populate({
        path: 'abonnement',
        populate: { path: 'forfait', select: 'name price tagline' }
      })
      .populate('user', 'nom prenom email')
      .sort({ createdAt: -1 });

    res.json(paiements);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// ═══════════════════════════════════════════════════════════
// 4. GET — Télécharger une facture PDF
// ═══════════════════════════════════════════════════════════
const telechargerFacture = async (req, res) => {
  try {
    const { paiementId } = req.params;

    const paiement = await Paiement.findById(paiementId)
      .populate({
        path: 'abonnement',
        populate: { path: 'forfait' }
      })
      .populate('user', 'nom prenom email');

    if (!paiement) {
      return res.status(404).json({ message: 'Paiement introuvable' });
    }

    const doc = new PDFDocument({ margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=facture-${paiementId}.pdf`);
    doc.pipe(res);

    doc.fontSize(24).fillColor('#1A2B5F').text('SurgeryVR', 50, 50);
    doc.fontSize(10).fillColor('#888').text('Plateforme d\'enquêtes VR', 50, 78);
    doc.moveTo(50, 100).lineTo(550, 100).strokeColor('#e0e0e0').stroke();

    doc.fontSize(20).fillColor('#1A2B5F').text('FACTURE', 50, 120);
    doc.fontSize(10).fillColor('#888')
      .text(`Réf: ${paiementId.toString().slice(0, 12).toUpperCase()}`, 50, 145)
      .text(`Date: ${new Date(paiement.createdAt).toLocaleDateString('fr-FR')}`, 50, 160);

    doc.roundedRect(50, 185, 240, 80, 8).fillColor('#f8f9ff').fill();
    doc.fontSize(11).fillColor('#1A2B5F').text('CLIENT', 65, 198);
    doc.fontSize(10).fillColor('#333')
      .text(`${paiement.user?.prenom || ''} ${paiement.user?.nom || ''}`, 65, 215)
      .text(`${paiement.user?.email || ''}`, 65, 230)
      .text(`ID: ${paiement.user?._id?.toString().slice(0, 12)}`, 65, 245);

    doc.roundedRect(310, 185, 240, 80, 8).fillColor('#f8f9ff').fill();
    doc.fontSize(11).fillColor('#1A2B5F').text('ABONNEMENT', 325, 198);
    doc.fontSize(10).fillColor('#333')
      .text(`Forfait: ${paiement.abonnement?.forfait?.name || '—'}`, 325, 215)
      .text(`Début: ${new Date(paiement.abonnement?.dateDebut).toLocaleDateString('fr-FR')}`, 325, 230)
      .text(`Fin: ${paiement.abonnement?.dateFin ? new Date(paiement.abonnement.dateFin).toLocaleDateString('fr-FR') : '—'}`, 325, 245);

    doc.moveTo(50, 285).lineTo(550, 285).strokeColor('#e0e0e0').stroke();
    doc.fontSize(10).fillColor('#888')
      .text('DESCRIPTION', 50, 295)
      .text('QTÉ', 350, 295)
      .text('MONTANT', 460, 295);
    doc.moveTo(50, 310).lineTo(550, 310).strokeColor('#e0e0e0').stroke();

    doc.fontSize(11).fillColor('#333')
      .text(`Forfait ${paiement.abonnement?.forfait?.name} — Mensuel`, 50, 322)
      .text('1', 350, 322)
      .text(`${paiement.amount} ${paiement.currency?.toUpperCase()}`, 460, 322);

    doc.moveTo(50, 345).lineTo(550, 345).strokeColor('#e0e0e0').stroke();

    doc.roundedRect(380, 355, 170, 40, 8).fillColor('#1A2B5F').fill();
    doc.fontSize(12).fillColor('#fff')
      .text('TOTAL', 395, 366)
      .text(`${paiement.amount} ${paiement.currency?.toUpperCase()}`, 460, 366);

    doc.fontSize(11).fillColor('#22c55e').text(`✓ Paiement confirmé`, 50, 415);
    doc.fontSize(10).fillColor('#888').text(`Session Stripe: ${paiement.stripeSessionId}`, 50, 432);

    doc.moveTo(50, 700).lineTo(550, 700).strokeColor('#e0e0e0').stroke();
    doc.fontSize(9).fillColor('#aaa')
      .text('SurgeryVR — Plateforme d\'enquêtes VR', 50, 710, { align: 'center', width: 500 })
      .text('Ce document est une facture officielle.', 50, 723, { align: 'center', width: 500 });

    doc.end();

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// ═══════════════════════════════════════════════════════════
// 5. POST — Renouveler l'abonnement (même forfait)
// ═══════════════════════════════════════════════════════════
const renouvelerAbonnement = async (req, res) => {
  try {
    const { userId, abonnementId } = req.body;

    const abonnement = await Abonnement.findById(abonnementId).populate('forfait');
    if (!abonnement) {
      return res.status(404).json({ message: 'Abonnement introuvable' });
    }

    const forfait = abonnement.forfait;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { name: `Renouvellement — ${forfait.name}` },
            unit_amount: forfait.price,
          },
          quantity: 1,
        },
      ],
      success_url: 'https://surgery-vr.vercel.app/client/abonnements?payment=success',
      cancel_url:  'https://surgery-vr.vercel.app/client/abonnements?payment=cancel',
      metadata: { userId, forfaitId: forfait._id.toString(), type: 'renouvellement' }
    });

    res.json({ url: session.url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// ═══════════════════════════════════════════════════════════
// 6. POST — Upgrade vers un forfait supérieur
// ═══════════════════════════════════════════════════════════
const upgradeAbonnement = async (req, res) => {
  try {
    const { userId, nouveauForfaitId } = req.body;

    const nouveauForfait = await Forfait.findById(nouveauForfaitId);
    if (!nouveauForfait) {
      return res.status(404).json({ message: 'Forfait introuvable' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { name: `Upgrade — ${nouveauForfait.name}` },
            unit_amount: nouveauForfait.price,
          },
          quantity: 1,
        },
      ],
      success_url: 'https://surgery-vr.vercel.app/client/abonnements?payment=success',
      cancel_url:  'https://surgery-vr.vercel.app/client/abonnements?payment=cancel',
      metadata: { userId, forfaitId: nouveauForfaitId, type: 'upgrade' }
    });

    res.json({ url: session.url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// ═══════════════════════════════════════════════════════════
// 7. GET — Forfaits disponibles pour upgrade
// ═══════════════════════════════════════════════════════════
const getForfaitsUpgrade = async (req, res) => {
  try {
    const { userId } = req.params;

    const abonnementActuel = await Abonnement.findOne({
      user: userId, status: 'active'
    }).populate('forfait');

    if (!abonnementActuel) {
      return res.status(404).json({ message: 'Aucun abonnement actif' });
    }

    const forfaitsSupérieurs = await Forfait.find({
      price: { $gt: parseInt(abonnementActuel.forfait.price) }
    }).sort({ price: 1 });

    res.json({
      forfaitActuel:       abonnementActuel.forfait,
      forfaitsDisponibles: forfaitsSupérieurs
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// ═══════════════════════════════════════════════════════════
// 8. GET — Droits complets de l'abonnement actif
// ═══════════════════════════════════════════════════════════
const getMesDroits = async (req, res) => {
  try {
    const { userId } = req.params;

    const abonnement = await Abonnement.findOne({ user: userId, status: 'active' })
      .populate('forfait');

    if (!abonnement) {
      return res.status(404).json({ message: 'Aucun abonnement actif' });
    }

    const forfait = abonnement.forfait;

    // ── NOUVEAU : charger les codes si formation activée ──────────
    let codesFormation = [];
    if (forfait.formation?.incluse && abonnement.formationUtilisee) {
      const CodeFormation = require('../../models/codeFormation'); // adapte le chemin
      codesFormation = await CodeFormation.find({ abonnement: abonnement._id })
        .select('code statut etudiant dateExpiration')
        .populate('etudiant', 'nom prenom email')
        .sort({ createdAt: 1 });
    }

    res.json({
      forfait:        forfait.name,
      abonnementId:   abonnement._id,
      apkTotal:       forfait.nbApk,
      apkRestants:    abonnement.apkRestants,
      dateFin:        abonnement.dateFin,
      formation: forfait.formation?.incluse
        ? {
            dureeHeures:  forfait.formation.dureeHeures,
            maxEtudiants: forfait.formation.maxEtudiants,
            detaillee:    forfait.formation.detaillee,
            activee:      abonnement.formationUtilisee,
            codes:        codesFormation,   // ← AJOUTÉ
          }
        : null,
      simulationEsthetique: forfait.simulationEsthetique,
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ═══════════════════════════════════════════════════════════
// 9. POST — Télécharger un APK (décrémente le compteur)
// ═══════════════════════════════════════════════════════════
const telechargerApk = async (req, res) => {
  try {
    const { userId } = req.params;

    const abonnement = await Abonnement.findOne({ user: userId, status: 'active' })
      .populate('forfait');

    if (!abonnement) {
      return res.status(404).json({ message: 'Aucun abonnement actif' });
    }

    if (abonnement.apkRestants <= 0) {
      return res.status(403).json({
        message: `Quota APK épuisé (${abonnement.forfait.nbApk} APK/mois). Renouvelez votre abonnement.`
      });
    }

    abonnement.apkRestants -= 1;
    await abonnement.save();

    res.json({
      message:     'APK disponible au téléchargement',
      apkRestants: abonnement.apkRestants,
      apkTotal:    abonnement.forfait.nbApk,
      downloadUrl: process.env.APK_DOWNLOAD_URL || 'https://ton-bucket.s3.amazonaws.com/app.apk'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// ═══════════════════════════════════════════════════════════
// 10. POST — Activer la formation + générer les CodeFormation
//
// MODIFIÉ : au lieu de stocker des strings dans codesAcces[],
// on crée de vrais documents CodeFormation en base
// et on stocke leurs _id dans abonnement.codesFormation[]
// ═══════════════════════════════════════════════════════════
const activerFormation = async (req, res) => {
  try {
    const { userId } = req.params;

    const abonnement = await Abonnement.findOne({ user: userId, status: 'active' })
      .populate({
        path:     'forfait',
        populate: { path: 'experiences' }
      });

    if (!abonnement) {
      return res.status(404).json({ message: 'Aucun abonnement actif' });
    }

    const forfait = abonnement.forfait;

    if (!forfait.formation?.incluse) {
      return res.status(403).json({
        message: `Le forfait "${forfait.name}" ne comprend pas de formation. Passez au forfait Pro ou Business.`
      });
    }

    // Si déjà activée → retourner les codes existants
    if (abonnement.formationUtilisee) {
      const codesExistants = await CodeFormation.find({
        abonnement: abonnement._id
      }).select('code statut etudiant dateExpiration');

      return res.status(200).json({
        message:      'Formation déjà activée.',
        dureeHeures:  forfait.formation.dureeHeures,
        detaillee:    forfait.formation.detaillee,
        maxEtudiants: forfait.formation.maxEtudiants,
        codes:        codesExistants
      });
    }

    // ── Générer N documents CodeFormation ────────────────────────
    const nbCodes    = forfait.formation.maxEtudiants;
    const maintenant = new Date();

    // Générer des codes uniques (format: "A3F2C1B0")
    const codesStrings = Array.from({ length: nbCodes }, () =>
      crypto.randomBytes(4).toString('hex').toUpperCase()
    );

    const codesACreer = codesStrings.map((code) => ({
      code,
      abonnement:      abonnement._id,
      institution:     abonnement.user,
      statut:          'disponible',
      dateExpiration:  abonnement.dateFin ?? new Date(maintenant.setFullYear(maintenant.getFullYear() + 1)),
    }));

    const codesInseres = await CodeFormation.insertMany(codesACreer);

    // ── Mettre à jour l'abonnement ────────────────────────────────
    abonnement.formationUtilisee = true;
    abonnement.codesFormation    = codesInseres.map((c) => c._id);
    await abonnement.save();

    return res.status(201).json({
      message:      'Formation activée avec succès !',
      dureeHeures:  forfait.formation.dureeHeures,
      detaillee:    forfait.formation.detaillee,
      maxEtudiants: nbCodes,
      abonnementId: abonnement._id,
      codes:        codesInseres.map((c) => ({
        _id:            c._id,
        code:           c.code,
        statut:         c.statut,
        dateExpiration: c.dateExpiration,
      })),
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


module.exports = {
  getMonAbonnement,
  getHistoriqueAbonnements,
  getMesFactures,
  telechargerFacture,
  renouvelerAbonnement,
  upgradeAbonnement,
  getForfaitsUpgrade,
  getMesDroits,
  telechargerApk,
  activerFormation,
};