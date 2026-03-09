const jwt         = require('jsonwebtoken');
const Utilisateur = require('../models/userModels'); // adapte le chemin si besoin

// ═══════════════════════════════════════════════════════════
// protect — Vérifie le JWT et attache req.user
// ═══════════════════════════════════════════════════════════
const protect = async (req, res, next) => {
  try {
    // ── 1. Extraire le token du header ────────────────────────────
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        message: 'Accès refusé. Token manquant.'
      });
    }

    const token = authHeader.split(' ')[1];

    // ── 2. Vérifier et décoder le token ───────────────────────────
    // Compatible avec : jwt.sign({ id: user._id, role: user.role }, ...)
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ── 3. Récupérer l'utilisateur en base ────────────────────────
    const user = await Utilisateur.findById(decoded.id).select('-motDePasse');

    if (!user) {
      return res.status(401).json({
        message: 'Utilisateur introuvable. Token invalide.'
      });
    }

    // ── 4. Vérifier que le compte est approuvé ────────────────────
    if (user.role !== 'admin' && user.statut !== 'approuve') {
      return res.status(403).json({
        message: 'Votre compte est en attente de validation.'
      });
    }

    // ── 5. Attacher l'utilisateur à la requête ────────────────────
    req.user = user; // → req.user._id, req.user.role, req.user.nom, etc.
    next();

  } catch (err) {
    // Token expiré ou malformé
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Session expirée. Reconnectez-vous.' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Token invalide.' });
    }
    return res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

// ═══════════════════════════════════════════════════════════
// authorize — Restreint l'accès à certains rôles
//
// Usage : authorize('institution', 'admin')
// ═══════════════════════════════════════════════════════════
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Non authentifié.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Accès refusé. Rôle requis : ${roles.join(' ou ')}.`
      });
    }

    next();
  };
};

module.exports = { 
    protect,
    authorize
};