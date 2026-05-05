const express = require("express");
const Formation = require("../../models/formation");
const mongoose = require('mongoose');

// ─────────────────────────────────────────────
// GET /api/formations/:userId
// Toutes les sessions d'un étudiant
// ─────────────────────────────────────────────
const getSessionForEtudiant = async (req, res) => {
  try {
    const formations = await Formation.find({ userId: req.params.userId }).sort(
      { dateStart: -1 }
    );

    if (!formations.length) {
      return res
        .status(404)
        .json({ message: "Aucune formation trouvée pour cet étudiant." });
    }

    res.json(formations);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// ─────────────────────────────────────────────
// GET /api/formations/:userId/summary
// Résumé groupé par scénario (pour la page Formations)
// Retourne : par scénario → nb tentatives, meilleur score, certifié ou non
// ─────────────────────────────────────────────
const getResumeForEtudiant =  async (req, res) => {
  try {
    const summary = await Formation.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(req.params.userId) } },
      {
        $group: {
          _id: "$scenarioName",
          totalAttempts: { $sum: 1 },
          bestScore: { $max: "$performanceMetrics.totalScore" },
          lastAttemptDate: { $max: "$dateStart" },
          isValidated: { $max: "$certification.isValidated" },
          certificationName: { $last: "$certification.certificationName" },
          sessions: {
            $push: {
              operationId: "$operationId",
              dateStart: "$dateStart",
              durationSeconds: "$durationSeconds",
              totalScore: "$performanceMetrics.totalScore",
              attemptNumber: "$attemptNumber",
              isValidated: "$certification.isValidated",
            },
          },
        },
      },
      { $sort: { lastAttemptDate: -1 } },
    ]);

    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// ─────────────────────────────────────────────
// GET /api/formations/:userId/session/:operationId
// Détail d'une session précise (pour générer le PDF)
// ─────────────────────────────────────────────
const getDetailsSession = async (req, res) => {
  try {
    const formation = await Formation.findOne({
      userId: req.params.userId,
      operationId: req.params.operationId,
    });

    if (!formation) {
      return res.status(404).json({ message: "Session introuvable." });
    }

    res.json(formation);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// ─────────────────────────────────────────────
// GET /api/formations/:userId/certifications
// Toutes les certifications validées d'un étudiant
// ─────────────────────────────────────────────
const getAllCertificatForEtudiant = async (req, res) => {
  try {
    const certifications = await Formation.find({
      userId: req.params.userId,
      "certification.isValidated": true,
    })
      .select(
        "scenarioName certification.certificationName certification.issuedAt performanceMetrics.totalScore dateStart"
      )
      .sort({ "certification.issuedAt": -1 });

    res.json(certifications);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

module.exports = {
    getSessionForEtudiant,
    getResumeForEtudiant,
    getDetailsSession,
    getAllCertificatForEtudiant
};