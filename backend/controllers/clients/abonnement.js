const Abonnement = require('../../models/abonnement');
const Paiement = require('../../models/paiement');
const Forfait = require('../../models/forfait');
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const PDFDocument = require('pdfkit');


// ─────────────────────────────────────────
// 1. GET — Abonnement actif de l'utilisateur (avec détails forfait)
// ─────────────────────────────────────────
const getMonAbonnement = async (req, res) => {
  try {
    const { userId } = req.params;

    const abonnement = await Abonnement.findOne({ user: userId, status: 'active' })
      .populate('forfait')
      .populate('user', 'nom prenom email');

    if (!abonnement) {
      return res.status(404).json({ message: 'Aucun abonnement actif trouvé' });
    }

    res.json(abonnement);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─────────────────────────────────────────
// 2. GET — Historique de tous les abonnements
// ─────────────────────────────────────────
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

// ─────────────────────────────────────────
// 3. GET — Factures de l'utilisateur
// ─────────────────────────────────────────
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

    // ── Header ──
    doc.fontSize(24).fillColor('#1A2B5F').text('SurveyVR', 50, 50);
    doc.fontSize(10).fillColor('#888').text('Plateforme d\'enquêtes VR', 50, 78);

    doc.moveTo(50, 100).lineTo(550, 100).strokeColor('#e0e0e0').stroke();

    // ── Titre Facture ──
    doc.fontSize(20).fillColor('#1A2B5F').text('FACTURE', 50, 120);
    doc.fontSize(10).fillColor('#888')
      .text(`Réf: ${paiementId.toString().slice(0, 12).toUpperCase()}`, 50, 145)
      .text(`Date: ${new Date(paiement.createdAt).toLocaleDateString('fr-FR')}`, 50, 160);

    // ── Infos Client ──
    doc.roundedRect(50, 185, 240, 80, 8).fillColor('#f8f9ff').fill();
    doc.fontSize(11).fillColor('#1A2B5F').text('CLIENT', 65, 198);
    doc.fontSize(10).fillColor('#333')
      .text(`${paiement.user?.prenom || ''} ${paiement.user?.nom || ''}`, 65, 215)
      .text(`${paiement.user?.email || ''}`, 65, 230)
      .text(`ID: ${paiement.user?._id?.toString().slice(0, 12)}`, 65, 245);

    // ── Infos Abonnement ──
    doc.roundedRect(310, 185, 240, 80, 8).fillColor('#f8f9ff').fill();
    doc.fontSize(11).fillColor('#1A2B5F').text('ABONNEMENT', 325, 198);
    doc.fontSize(10).fillColor('#333')
      .text(`Forfait: ${paiement.abonnement?.forfait?.name || '—'}`, 325, 215)
      .text(`Début: ${new Date(paiement.abonnement?.dateDebut).toLocaleDateString('fr-FR')}`, 325, 230)
      .text(`Fin: ${paiement.abonnement?.dateFin ? new Date(paiement.abonnement.dateFin).toLocaleDateString('fr-FR') : '—'}`, 325, 245);

    // ── Tableau détails ──
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

    // ── Total ──
    doc.roundedRect(380, 355, 170, 40, 8).fillColor('#1A2B5F').fill();
    doc.fontSize(12).fillColor('#fff')
      .text('TOTAL', 395, 366)
      .text(`${paiement.amount} ${paiement.currency?.toUpperCase()}`, 460, 366);

    // ── Statut ──
    doc.fontSize(11).fillColor('#22c55e')
      .text(`✓ Paiement confirmé`, 50, 415);
    doc.fontSize(10).fillColor('#888')
      .text(`Session Stripe: ${paiement.stripeSessionId}`, 50, 432);

    // ── Footer ──
    doc.moveTo(50, 700).lineTo(550, 700).strokeColor('#e0e0e0').stroke();
    doc.fontSize(9).fillColor('#aaa')
      .text('SurveyVR — Plateforme d\'enquêtes VR', 50, 710, { align: 'center', width: 500 })
      .text('Ce document est une facture officielle.', 50, 723, { align: 'center', width: 500 });

    doc.end();

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─────────────────────────────────────────
// 4. POST — Renouveler l'abonnement (même forfait)
// ─────────────────────────────────────────
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
      metadata: {
        userId,
        forfaitId: forfait._id.toString(),
        type: 'renouvellement'
      }
    });

    res.json({ url: session.url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─────────────────────────────────────────
// 5. POST — Upgrade vers un forfait supérieur
// ─────────────────────────────────────────
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
      metadata: {
        userId,
        forfaitId: nouveauForfaitId,
        type: 'upgrade'
      }
    });

    res.json({ url: session.url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─────────────────────────────────────────
// 6. GET — Forfaits disponibles pour upgrade
// ─────────────────────────────────────────
const getForfaitsUpgrade = async (req, res) => {
  try {
    const { userId } = req.params;

    // Récupérer le forfait actuel
    const abonnementActuel = await Abonnement.findOne({ 
      user: userId, 
      status: 'active' 
    }).populate('forfait');

    if (!abonnementActuel) {
      return res.status(404).json({ message: 'Aucun abonnement actif' });
    }

    const prixActuel = parseInt(abonnementActuel.forfait.price);

    // Retourner uniquement les forfaits plus chers
    const forfaitsSupérieurs = await Forfait.find({
      price: { $gt: prixActuel }
    }).sort({ price: 1 });

    res.json({
      forfaitActuel: abonnementActuel.forfait,
      forfaitsDisponibles: forfaitsSupérieurs
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getMonAbonnement,
  getHistoriqueAbonnements,
  getMesFactures,
  renouvelerAbonnement,
  upgradeAbonnement,
  getForfaitsUpgrade,
  telechargerFacture
};