
const express = require("express");
const router = express.Router();
const PDFDocument = require("pdfkit");
const Formation = require("../models/formation");
const mongoose = require("mongoose");

const COLORS = {
  primary:   "#0066FF",
  secondary: "#00D9FF",
  success:   "#00C48C",
  warning:   "#FF8C00",
  danger:    "#FF006E",
  dark:      "#1A2B5F",
  gray:      "#5A6B8C",
  light:     "#F8FAFF",
  white:     "#FFFFFF",
};

function scoreColor(score) {
  if (score >= 80) return COLORS.success;
  if (score >= 70) return COLORS.warning;
  return COLORS.danger;
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "long", year: "numeric",
  });
}

function formatDuration(seconds) {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m} min ${s.toString().padStart(2, "0")} sec`;
}

// ── Composants PDF réutilisables ─────────────────────────────

function drawHeader(doc, title, subtitle = "") {
  // Bande colorée
  doc.rect(0, 0, doc.page.width, 70).fill(COLORS.dark);

  // Nom app
  doc.fillColor(COLORS.secondary)
     .font("Helvetica-Bold")
     .fontSize(9)
     .text("SURGERY VR", 40, 18, { characterSpacing: 2 });

  // Titre
  doc.fillColor(COLORS.white)
     .font("Helvetica-Bold")
     .fontSize(18)
     .text(title, 40, 32);

  // Sous-titre à droite
  if (subtitle) {
    doc.fillColor("rgba(255,255,255,0.5)")
       .font("Helvetica")
       .fontSize(9)
       .text(subtitle, 40, 56, { align: "right", width: doc.page.width - 80 });
  }

  return 90; // y de départ après header
}

function drawFooter(doc, pageNum) {
  const y = doc.page.height - 40;
  doc.moveTo(40, y).lineTo(doc.page.width - 40, y)
     .strokeColor("#E0E0E0").lineWidth(0.5).stroke();
  doc.fillColor(COLORS.gray).font("Helvetica").fontSize(8)
     .text("Surgery VR — Document confidentiel à usage pédagogique", 40, y + 8)
     .text(`Page ${pageNum}`, 0, y + 8, { align: "right", width: doc.page.width - 40 });
}

function drawSectionTitle(doc, text, y) {
  doc.rect(40, y, doc.page.width - 80, 20).fill(COLORS.primary);
  doc.fillColor(COLORS.white).font("Helvetica-Bold").fontSize(9)
     .text(text.toUpperCase(), 48, y + 6, { characterSpacing: 1 });
  return y + 28;
}

function drawScoreBadge(doc, score, x, y, size = 32) {
  doc.circle(x, y, size / 2).fill(scoreColor(score));
  doc.fillColor(COLORS.white).font("Helvetica-Bold").fontSize(size === 32 ? 12 : 10)
     .text(String(score), x - size / 2, y - 8, { width: size, align: "center" });
}

function drawBar(doc, x, y, value, width = 200, height = 8) {
  // Fond
  doc.rect(x, y, width, height).fill("#EEEEEE");
  // Remplissage
  const fill = (value / 100) * width;
  doc.rect(x, y, fill, height).fill(scoreColor(value));
}

function drawInfoRow(doc, label, value, x, y) {
  doc.fillColor(COLORS.gray).font("Helvetica-Bold").fontSize(9)
     .text(label, x, y);
  doc.fillColor(COLORS.dark).font("Helvetica").fontSize(9)
     .text(String(value ?? "—"), x + 110, y, { lineBreak: false });
  return y + 14;
}

// ═════════════════════════════════════════════════════════════
// GET /api/pdf/session/:operationId
// Rapport détaillé d'une session
// ═════════════════════════════════════════════════════════════
router.get("/session/:operationId", async (req, res) => {
  try {
    const formation = await Formation.findOne({
      operationId: req.params.operationId,
    });

    if (!formation) {
      return res.status(404).json({ message: "Session introuvable." });
    }

    const doc = new PDFDocument({ size: "A4", margin: 0, bufferPages: true });
    const m = formation.performanceMetrics;
    const cert = formation.certification;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="rapport_${formation.operationId}.pdf"`
    );
    doc.pipe(res);

    // ── PAGE 1 ───────────────────────────────────────────────
    let y = drawHeader(doc, "Rapport de Formation", formatDate(formation.dateStart));

    // Bloc infos
    doc.rect(40, y, doc.page.width - 80, 90).fill(COLORS.light);
    y += 12;
    y = drawInfoRow(doc, "Étudiant", formation.studentName, 52, y);
    y = drawInfoRow(doc, "Scénario", formation.scenarioName, 52, y);
    y = drawInfoRow(doc, "Date", formatDate(formation.dateStart), 52, y);
    y = drawInfoRow(doc, "Durée", formatDuration(formation.durationSeconds), 52, y);
    y = drawInfoRow(doc, "Tentative n°", String(formation.attemptNumber ?? 1), 52, y);

    // Score global badge
    drawScoreBadge(doc, m.totalScore, doc.page.width - 70, y - 52, 40);

    y += 10;

    // Statut certification
    const certValidated = cert?.isValidated;
    doc.rect(40, y, doc.page.width - 80, 22)
       .fill(certValidated ? COLORS.success : COLORS.danger);
    doc.fillColor(COLORS.white).font("Helvetica-Bold").fontSize(10)
       .text(
         certValidated
           ? `✓ CERTIFIÉ — ${cert.certificationName || ""}`
           : "✗ NON VALIDÉ — Score minimum (70/100) non atteint",
         40, y + 6,
         { width: doc.page.width - 80, align: "center" }
       );
    y += 32;

    // Scores détaillés
    y = drawSectionTitle(doc, "Scores détaillés", y);

    const scores = [
      { label: "Précision", value: m.precisionScore },
      { label: "Temps", value: m.timeScore },
      { label: "Sécurité", value: m.safetyScore },
      { label: "Instruments", value: m.instrumentHandlingScore },
      { label: "Collaboration", value: m.collaborationScore },
    ];

    scores.forEach((s) => {
      doc.fillColor(COLORS.dark).font("Helvetica").fontSize(9)
         .text(s.label, 52, y + 1);
      drawBar(doc, 150, y, s.value, 300, 10);
      doc.fillColor(scoreColor(s.value)).font("Helvetica-Bold").fontSize(9)
         .text(`${s.value}/100`, 465, y + 1);
      y += 18;
    });

    y += 6;

    // Statistiques opératoires
    y = drawSectionTitle(doc, "Statistiques opératoires", y);

    const stats = [
      ["Erreurs totales", m.totalErrors, "Erreurs critiques", m.criticalErrors],
      ["Mauvais instruments", m.wrongInstrumentCount, "Pression excessive", m.excessivePressureCount],
      ["Collisions critiques", m.collisionWithCriticalZoneCount, "Saignements", m.bleedingEvents],
      ["Fuite LCR", m.csfLeak ? "Oui" : "Non", "Exérèse tumorale", `${m.tumorRemovalPercent}%`],
      ["Stabilité main", m.averageHandStability?.toFixed(2), "Trajectoire", `${m.trajectoryLengthMeters} m`],
    ];

    stats.forEach(([l1, v1, l2, v2]) => {
      doc.fillColor(COLORS.gray).font("Helvetica-Bold").fontSize(8).text(l1, 52, y);
      doc.fillColor(COLORS.dark).font("Helvetica").fontSize(9).text(String(v1 ?? "—"), 175, y, { lineBreak: false });
      doc.fillColor(COLORS.gray).font("Helvetica-Bold").fontSize(8).text(l2, 300, y, { lineBreak: false });
      doc.fillColor(COLORS.dark).font("Helvetica").fontSize(9).text(String(v2 ?? "—"), 430, y, { lineBreak: false });
      y += 14;
    });

    y += 6;

    // Feedback
    y = drawSectionTitle(doc, "Feedback du superviseur", y);

    if (formation.feedback?.globalComment) {
      doc.rect(40, y, doc.page.width - 80, 1).fill(COLORS.primary);
      doc.rect(40, y, 3, 36).fill(COLORS.primary);
      doc.fillColor(COLORS.gray).font("Helvetica-Oblique").fontSize(9)
         .text(`"${formation.feedback.globalComment}"`, 52, y + 6, { width: doc.page.width - 100 });
      y += 44;
    }

    // Points positifs
    if (formation.feedback?.positivePoints?.length) {
      doc.fillColor(COLORS.success).font("Helvetica-Bold").fontSize(9)
         .text("Points positifs", 52, y);
      y += 14;
      formation.feedback.positivePoints.forEach((p) => {
        doc.fillColor(COLORS.success).font("Helvetica").fontSize(8).text("+ ", 52, y, { continued: true });
        doc.fillColor(COLORS.dark).text(p);
        y += 12;
      });
      y += 4;
    }

    // Points à améliorer
    if (formation.feedback?.improvementPoints?.length) {
      doc.fillColor(COLORS.warning).font("Helvetica-Bold").fontSize(9)
         .text("Points à améliorer", 52, y);
      y += 14;
      formation.feedback.improvementPoints.forEach((p) => {
        doc.fillColor(COLORS.warning).font("Helvetica").fontSize(8).text("- ", 52, y, { continued: true });
        doc.fillColor(COLORS.dark).text(p);
        y += 12;
      });
    }

    drawFooter(doc, 1);

    // ── PAGE 2 ───────────────────────────────────────────────
    doc.addPage();
    y = drawHeader(doc, "Détail de l'intervention", formation.scenarioName);

    // Phases
    y = drawSectionTitle(doc, "Phases de l'intervention", y);

    (formation.phases || []).forEach((phase) => {
      doc.rect(40, y, doc.page.width - 80, 18).fill(COLORS.light);
      doc.fillColor(COLORS.dark).font("Helvetica-Bold").fontSize(9)
         .text(`Phase ${phase.phaseId} — ${phase.phaseName}`, 52, y + 5);
      doc.fillColor(COLORS.gray).font("Helvetica").fontSize(8)
         .text(`${phase.startTime} → ${phase.endTime}`, 0, y + 5, {
           width: doc.page.width - 50, align: "right",
         });
      y += 22;

      (phase.mainActions || []).forEach((action) => {
        doc.fillColor(COLORS.gray).fontSize(8).text(`• ${action}`, 60, y);
        y += 11;
      });
      y += 4;
    });

    y += 4;

    // Erreurs
    if (formation.errors?.length) {
      y = drawSectionTitle(doc, "Erreurs commises", y);

      formation.errors.forEach((err) => {
        const c = err.severity === "critical" ? COLORS.danger
                : err.severity === "major"    ? COLORS.warning
                : COLORS.gray;
        doc.rect(40, y, 3, 22).fill(c);
        doc.fillColor(c).font("Helvetica-Bold").fontSize(8)
           .text(`[${err.severity?.toUpperCase()}] ${err.type}`, 52, y + 2);
        doc.fillColor(COLORS.dark).font("Helvetica").fontSize(8)
           .text(err.description, 52, y + 12);
        doc.fillColor(COLORS.danger).font("Helvetica-Bold").fontSize(8)
           .text(`-${err.scorePenalty} pts`, 0, y + 2, {
             width: doc.page.width - 45, align: "right",
           });
        y += 28;
      });

      y += 4;
    }

    // Instruments
    if (formation.instrumentsUsed?.length) {
      y = drawSectionTitle(doc, "Instruments utilisés", y);

      const colW = 155;
      formation.instrumentsUsed.forEach((inst, i) => {
        const col = i % 3;
        const ix = 40 + col * colW;
        const iy = y + Math.floor(i / 3) * 22;
        doc.rect(ix, iy, colW - 6, 18).fill(COLORS.light);
        doc.fillColor(COLORS.dark).font("Helvetica-Bold").fontSize(8)
           .text(inst.name, ix + 6, iy + 5, { width: colW - 40 });
        doc.fillColor(COLORS.gray).font("Helvetica").fontSize(8)
           .text(`x${inst.usageCount}`, ix + colW - 28, iy + 5);
      });
    }

    drawFooter(doc, 2);

    doc.end();
  } catch (error) {
    console.error("PDF session error:", error);
    res.status(500).json({ message: "Erreur génération PDF", error: error.message });
  }
});

// ═════════════════════════════════════════════════════════════
// GET /api/pdf/summary/:userId/:scenarioName
// Résumé de toutes les tentatives d'un scénario
// ═════════════════════════════════════════════════════════════
router.get("/summary/:userId/:scenarioName", async (req, res) => {
  try {
    const sessions = await Formation.find({
      userId: new mongoose.Types.ObjectId(req.params.userId),
      scenarioName: decodeURIComponent(req.params.scenarioName),
    }).sort({ dateStart: 1 });

    if (!sessions.length) {
      return res.status(404).json({ message: "Aucune session trouvée." });
    }

    const scenarioName = sessions[0].scenarioName;
    const studentName = sessions[0].studentName;
    const scores = sessions.map((s) => s.performanceMetrics?.totalScore || 0);
    const bestScore = Math.max(...scores);
    const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    const isValidated = sessions.some((s) => s.certification?.isValidated);

    const doc = new PDFDocument({ size: "A4", margin: 0 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="resume_${req.params.scenarioName}.pdf"`
    );
    doc.pipe(res);

    let y = drawHeader(doc, "Résumé de Formation", `Généré le ${formatDate(new Date())}`);

    // Infos étudiant
    doc.rect(40, y, doc.page.width - 80, 36).fill(COLORS.light);
    y += 8;
    drawInfoRow(doc, "Étudiant", studentName, 52, y);
    y += 14;
    drawInfoRow(doc, "Scénario", scenarioName, 52, y);
    y += 22;

    // Stats (3 blocs)
    const statW = (doc.page.width - 80) / 3;
    [
      { label: "Tentatives", value: sessions.length },
      { label: "Meilleur score", value: `${bestScore}/100` },
      { label: "Score moyen", value: `${avgScore}/100` },
    ].forEach((stat, i) => {
      const bx = 40 + i * statW;
      doc.rect(bx, y, statW - 4, 44).fill(COLORS.dark);
      doc.fillColor(COLORS.secondary).font("Helvetica").fontSize(8)
         .text(stat.label, bx + 4, y + 8, { width: statW - 12, align: "center" });
      doc.fillColor(COLORS.white).font("Helvetica-Bold").fontSize(18)
         .text(String(stat.value), bx + 4, y + 18, { width: statW - 12, align: "center" });
    });
    y += 52;

    // Certification status
    doc.rect(40, y, doc.page.width - 80, 22)
       .fill(isValidated ? COLORS.success : COLORS.danger);
    doc.fillColor(COLORS.white).font("Helvetica-Bold").fontSize(10)
       .text(
         isValidated
           ? "✓ SCÉNARIO VALIDÉ — Certification obtenue"
           : "✗ SCÉNARIO NON VALIDÉ — Score minimum (70/100) non atteint",
         40, y + 6,
         { width: doc.page.width - 80, align: "center" }
       );
    y += 32;

    // Tableau des tentatives
    y = drawSectionTitle(doc, "Historique des tentatives", y);

    // En-tête tableau
    const cols = [40, 90, 200, 300, 380, 450];
    const headers = ["N°", "Date", "Scénario (résumé)", "Durée", "Score", "Validé"];
    doc.rect(40, y, doc.page.width - 80, 18).fill(COLORS.primary);
    doc.fillColor(COLORS.white).font("Helvetica-Bold").fontSize(8);
    headers.forEach((h, i) => doc.text(h, cols[i] + 4, y + 5, { lineBreak: false }));
    y += 18;

    sessions.forEach((session, idx) => {
      const score = session.performanceMetrics?.totalScore || 0;
      const validated = session.certification?.isValidated;
      doc.rect(40, y, doc.page.width - 80, 16)
         .fill(idx % 2 === 0 ? COLORS.white : COLORS.light);

      doc.fillColor(COLORS.dark).font("Helvetica").fontSize(8);
      doc.text(String(session.attemptNumber || idx + 1), cols[0] + 4, y + 4, { lineBreak: false });
      doc.text(formatDate(session.dateStart), cols[1] + 4, y + 4, { lineBreak: false });
      doc.text(session.scenarioName.substring(0, 14) + "…", cols[2] + 4, y + 4, { lineBreak: false });
      doc.text(formatDuration(session.durationSeconds), cols[3] + 4, y + 4, { lineBreak: false });

      doc.fillColor(scoreColor(score)).font("Helvetica-Bold").fontSize(8)
         .text(`${score}/100`, cols[4] + 4, y + 4, { lineBreak: false });

      doc.fillColor(validated ? COLORS.success : COLORS.danger).font("Helvetica-Bold").fontSize(8)
         .text(validated ? "Oui" : "Non", cols[5] + 4, y + 4, { lineBreak: false });

      y += 16;
    });

    y += 12;

    // Graphe progression simplifié (barres verticales)
    if (sessions.length > 1) {
      y = drawSectionTitle(doc, "Progression des scores", y);

      const graphH = 60;
      const graphX = 60;
      const graphW = doc.page.width - 120;
      const barW = Math.min(30, (graphW / sessions.length) - 8);
      const stepX = graphW / sessions.length;

      // Ligne seuil 70
      const threshY = y + graphH - (70 / 100) * graphH;
      doc.moveTo(graphX, threshY).lineTo(graphX + graphW, threshY)
         .dash(4, { space: 4 }).strokeColor(COLORS.warning).lineWidth(0.8).stroke();
      doc.undash();
      doc.fillColor(COLORS.warning).font("Helvetica").fontSize(7)
         .text("Seuil 70", graphX - 40, threshY - 3);

      scores.forEach((score, i) => {
        const bx = graphX + i * stepX + (stepX - barW) / 2;
        const bh = (score / 100) * graphH;
        const by = y + graphH - bh;

        doc.rect(bx, by, barW, bh).fill(scoreColor(score));
        doc.fillColor(COLORS.white).font("Helvetica-Bold").fontSize(7)
           .text(String(score), bx, by + 4, { width: barW, align: "center" });
        doc.fillColor(COLORS.gray).font("Helvetica").fontSize(7)
           .text(`T${i + 1}`, bx, y + graphH + 4, { width: barW, align: "center" });
      });
    }

    drawFooter(doc, 1);
    doc.end();
  } catch (error) {
    console.error("PDF summary error:", error);
    res.status(500).json({ message: "Erreur génération PDF", error: error.message });
  }
});

module.exports = router;