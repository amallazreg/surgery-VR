const Abonnement  = require('../../models/abonnement');
const Paiement    = require('../../models/paiement');
const Forfait     = require('../../models/forfait');
const Stripe      = require('stripe');
const stripe      = Stripe(process.env.STRIPE_SECRET_KEY);
const PDFDocument = require('pdfkit');

// ═══════════════════════════════════════════════════════════
// 1. GET — Abonnement étudiant actif
// ═══════════════════════════════════════════════════════════
const getMonAbonnement = async (req, res) => {
  try {
    const { userId } = req.params;

    // Expire automatiquement les dépassés
    await Abonnement.updateMany(
      { user: userId, cible: 'etudiant', status: 'active', dateFin: { $lt: new Date() } },
      { status: 'expired' }
    );

    const abonnement = await Abonnement.findOne({
      user:   userId,
      cible:  'etudiant',
      status: 'active'
    })
    .populate('forfait')
    .populate('user', 'nom prenom email');

    if (!abonnement) {
      return res.status(404).json({ message: 'Aucun abonnement étudiant actif trouvé' });
    }

    res.json(abonnement);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ═══════════════════════════════════════════════════════════
// 2. GET — Historique de tous les abonnements étudiants
// ═══════════════════════════════════════════════════════════
const getHistoriqueAbonnements = async (req, res) => {
  try {
    const { userId } = req.params;

    const abonnements = await Abonnement.find({
      user:  userId,
      cible: 'etudiant'
    })
    .populate('forfait')
    .sort({ createdAt: -1 });

    res.json(abonnements);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ═══════════════════════════════════════════════════════════
// 3. GET — Factures de l'étudiant
// ═══════════════════════════════════════════════════════════
const getMesFactures = async (req, res) => {
  try {
    const { userId } = req.params;

    const paiements = await Paiement.find({ user: userId })
      .populate({
        path:  'abonnement',
        match: { cible: 'etudiant' },
        populate: { path: 'forfait', select: 'name price tagline' }
      })
      .populate('user', 'nom prenom email')
      .sort({ createdAt: -1 });

    // Filtrer uniquement les paiements liés à un abonnement étudiant
    const facturesEtudiant = paiements.filter(p => p.abonnement !== null);
    res.json(facturesEtudiant);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ═══════════════════════════════════════════════════════════
// 4. GET — Télécharger une facture PDF (identique institution)
// ═══════════════════════════════════════════════════════════
const telechargerFacture = async (req, res) => {
  try {
    const { paiementId } = req.params;

    const paiement = await Paiement.findById(paiementId)
      .populate({ path: 'abonnement', populate: { path: 'forfait' } })
      .populate('user', 'nom prenom email');

    if (!paiement) {
      return res.status(404).json({ message: 'Paiement introuvable' });
    }

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=facture-${paiementId}.pdf`);
    doc.pipe(res);

    doc.fontSize(24).fillColor('#1A2B5F').text('SurgeryVR', 50, 50);
    doc.fontSize(10).fillColor('#888').text('Plateforme de simulation chirurgicale VR', 50, 78);
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
    doc.fontSize(11).fillColor('#1A2B5F').text('ABONNEMENT ÉTUDIANT', 325, 198);
    doc.fontSize(10).fillColor('#333')
      .text(`Forfait: ${paiement.abonnement?.forfait?.name || '—'}`, 325, 215)
      .text(`Début: ${new Date(paiement.abonnement?.dateDebut).toLocaleDateString('fr-FR')}`, 325, 230)
      .text(`Fin: ${paiement.abonnement?.dateFin ? new Date(paiement.abonnement.dateFin).toLocaleDateString('fr-FR') : '—'}`, 325, 245);

    doc.moveTo(50, 285).lineTo(550, 285).strokeColor('#e0e0e0').stroke();
    doc.fontSize(10).fillColor('#888')
      .text('DESCRIPTION', 50, 295).text('QTÉ', 350, 295).text('MONTANT', 460, 295);
    doc.moveTo(50, 310).lineTo(550, 310).strokeColor('#e0e0e0').stroke();

    doc.fontSize(11).fillColor('#333')
      .text(`Forfait Étudiant ${paiement.abonnement?.forfait?.name}`, 50, 322)
      .text('1', 350, 322)
      .text(`${paiement.amount} ${paiement.currency?.toUpperCase()}`, 460, 322);

    doc.moveTo(50, 345).lineTo(550, 345).strokeColor('#e0e0e0').stroke();
    doc.roundedRect(380, 355, 170, 40, 8).fillColor('#1A2B5F').fill();
    doc.fontSize(12).fillColor('#fff')
      .text('TOTAL', 395, 366)
      .text(`${paiement.amount} ${paiement.currency?.toUpperCase()}`, 460, 366);

    doc.fontSize(11).fillColor('#22c55e').text('✓ Paiement confirmé', 50, 415);
    doc.fontSize(10).fillColor('#888').text(`Session Stripe: ${paiement.stripeSessionId}`, 50, 432);

    doc.moveTo(50, 700).lineTo(550, 700).strokeColor('#e0e0e0').stroke();
    doc.fontSize(9).fillColor('#aaa')
      .text('SurgeryVR — Plateforme de simulation chirurgicale VR', 50, 710, { align: 'center', width: 500 })
      .text('Ce document est une facture officielle.', 50, 723, { align: 'center', width: 500 });

    doc.end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ═══════════════════════════════════════════════════════════
// 5. POST — Renouveler l'abonnement étudiant (même forfait)
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
      line_items: [{
        price_data: {
          currency:     'usd',
          product_data: { name: `Renouvellement Étudiant — ${forfait.name}` },
          unit_amount:  forfait.price * 100,
        },
        quantity: 1,
      }],
      success_url: 'https://surgery-vr.vercel.app/etudiant/forfaits?payment=success',
      cancel_url:  'https://surgery-vr.vercel.app/etudiant/forfaits?payment=cancel',
      metadata: { userId, forfaitId: forfait._id.toString(), type: 'renouvellement' }
    });

    res.json({ url: session.url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ═══════════════════════════════════════════════════════════
// 6. POST — Upgrade vers un forfait étudiant supérieur
// ═══════════════════════════════════════════════════════════
const upgradeAbonnement = async (req, res) => {
  try {
    const { userId, nouveauForfaitId } = req.body;

    const nouveauForfait = await Forfait.findOne({ _id: nouveauForfaitId, cible: 'etudiant' });
    if (!nouveauForfait) {
      return res.status(404).json({ message: 'Forfait étudiant introuvable' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [{
        price_data: {
          currency:     'usd',
          product_data: { name: `Upgrade Étudiant — ${nouveauForfait.name}` },
          unit_amount:  nouveauForfait.price * 100,
        },
        quantity: 1,
      }],
      success_url: 'https://surgery-vr.vercel.app/etudiant/forfaits?payment=success',
      cancel_url:  'https://surgery-vr.vercel.app/etudiant/forfaits?payment=cancel',
      metadata: { userId, forfaitId: nouveauForfaitId, type: 'upgrade' }
    });

    res.json({ url: session.url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ═══════════════════════════════════════════════════════════
// 7. GET — Forfaits étudiants disponibles pour upgrade
// ═══════════════════════════════════════════════════════════
const getForfaitsUpgrade = async (req, res) => {
  try {
    const { userId } = req.params;

    const abonnementActuel = await Abonnement.findOne({
      user: userId, cible: 'etudiant', status: 'active'
    }).populate('forfait');

    if (!abonnementActuel) {
      return res.status(404).json({ message: 'Aucun abonnement étudiant actif' });
    }

    const forfaitsSupérieurs = await Forfait.find({
      cible: 'etudiant',
      price: { $gt: abonnementActuel.forfait.price },
      actif: true
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
// 8. GET — Droits complets + expériences du forfait actif
// ═══════════════════════════════════════════════════════════
const getMesDroits = async (req, res) => {
  try {
    const { userId } = req.params;

    const abonnement = await Abonnement.findOne({
      user: userId, cible: 'etudiant', status: 'active'
    }).populate({
      path:     'forfait',
      populate: {
        path:   'experiencesEtudiant',
        select: 'title description emoji appLabUrl compatibility'
      }
    });

    if (!abonnement) {
      return res.status(404).json({ message: 'Aucun abonnement étudiant actif' });
    }

    const forfait       = abonnement.forfait;
    const joursRestants = Math.max(
      0,
      Math.ceil((new Date(abonnement.dateFin) - new Date()) / (1000 * 60 * 60 * 24))
    );

    res.json({
      forfait:              forfait.name,
      abonnementId:         abonnement._id,
      cible:                'etudiant',
      nbExperiences:        forfait.nbExperiences || 0,
      experiencesRestantes: abonnement.experiencesRestantes,
      dateDebut:            abonnement.dateDebut,
      dateFin:              abonnement.dateFin,
      joursRestants,
      experiences: (forfait.experiencesEtudiant || []).map(exp => ({
        ...exp.toObject(),
        source: 'abonnement_propre'
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ═══════════════════════════════════════════════════════════
// 9. GET — Expériences du forfait étudiant actif
//    (route dédiée pour l'onglet "Mon Forfait" du frontend)
// ═══════════════════════════════════════════════════════════
const getMesExperiencesForfait = async (req, res) => {
  try {
    const { userId } = req.params;

    await Abonnement.updateMany(
      { user: userId, cible: 'etudiant', status: 'active', dateFin: { $lt: new Date() } },
      { status: 'expired' }
    );

    const abonnement = await Abonnement.findOne({
      user:    userId,
      cible:   'etudiant',
      status:  'active',
      dateFin: { $gt: new Date() }
    }).populate({
      path:     'forfait',
      populate: {
        path:   'experiences',
        select: 'title description emoji appLabUrl compatibility'
      }
    });

    if (!abonnement) {
      return res.json({
        abonnementActif: false,
        experiences:     [],
        message:         'Aucun abonnement étudiant actif'
      });
    }

    const experiences   = abonnement.forfait?.experiencesEtudiant ?? [];
    const joursRestants = Math.max(
      0,
      Math.ceil((new Date(abonnement.dateFin) - new Date()) / (1000 * 60 * 60 * 24))
    );

    res.json({
      abonnementActif: true,
      forfait:         abonnement.forfait?.name,
      forfaitId:       abonnement.forfait?._id,
      dateExpiration:  abonnement.dateFin,
      joursRestants,
      experiences: experiences.map(exp => ({
        ...exp.toObject(),
        source: 'abonnement_propre'
      }))
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
  getMesExperiencesForfait,
};