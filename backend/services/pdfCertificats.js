// ═════════════════════════════════════════════════════════════
// GET /api/pdf/certificate/:operationId
// Certificat officiel A4 paysage avec médaillon
// Ajouter cette route dans votre fichier pdf.routes.js
// ═════════════════════════════════════════════════════════════

const router = require("./pdfFormations");

router.get("/certificate/:operationId", async (req, res) => {
  try {
    const formation = await Formation.findOne({
      operationId: req.params.operationId,
    });

    if (!formation) {
      return res.status(404).json({ message: "Session introuvable." });
    }

    if (!formation.certification?.isValidated) {
      return res.status(400).json({ message: "Cette session n'est pas certifiée." });
    }

    const cert   = formation.certification;
    const student = formation.studentName || "Étudiant";
    const scenario = formation.scenarioName || "Scénario";
    const certName  = cert.certificationName || "Certification Surgery VR";
    const score     = formation.performanceMetrics?.totalScore ?? 0;
    const issuedAt  = formatDate(cert.issuedAt || new Date());

    // ── DOC A4 PAYSAGE ───────────────────────────────────────
    const doc = new PDFDocument({
      size: "A4",
      layout: "landscape",
      margin: 0,
      bufferPages: true,
    });

    const W = doc.page.width;   // 841.89
    const H = doc.page.height;  // 595.28

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="certificat_${formation.operationId}.pdf"`
    );
    doc.pipe(res);

    // ── FOND ────────────────────────────────────────────────
    // Fond sombre dégradé simulé
    doc.rect(0, 0, W, H).fill("#05050F");

    // Bandes de couleur subtiles (simulation dégradé)
    doc.rect(0, 0, W, H / 2).fill("#07071A");

    // ── BORDURE DORÉE ───────────────────────────────────────
    const brd = 18;
    doc.rect(brd, brd, W - brd * 2, H - brd * 2)
       .lineWidth(2)
       .strokeColor("#FFD700")
       .stroke();

    // Bordure intérieure fine
    const brd2 = 24;
    doc.rect(brd2, brd2, W - brd2 * 2, H - brd2 * 2)
       .lineWidth(0.5)
       .strokeColor("rgba(255,215,0,0.3)")
       .stroke();

    // ── COINS DÉCORATIFS ─────────────────────────────────────
    function drawCorner(x, y, rx, ry) {
      doc.moveTo(x, y + 30).lineTo(x, y).lineTo(x + 30, y)
         .lineWidth(3).strokeColor("#FFD700").stroke();
    }
    drawCorner(brd + 4, brd + 4);
    // Top-right
    doc.moveTo(W - brd - 34, brd + 4).lineTo(W - brd - 4, brd + 4).lineTo(W - brd - 4, brd + 34)
       .lineWidth(3).strokeColor("#FFD700").stroke();
    // Bottom-left
    doc.moveTo(brd + 4, H - brd - 34).lineTo(brd + 4, H - brd - 4).lineTo(brd + 34, H - brd - 4)
       .lineWidth(3).strokeColor("#FFD700").stroke();
    // Bottom-right
    doc.moveTo(W - brd - 34, H - brd - 4).lineTo(W - brd - 4, H - brd - 4).lineTo(W - brd - 4, H - brd - 34)
       .lineWidth(3).strokeColor("#FFD700").stroke();

    // ── LOGO / NOM APP ───────────────────────────────────────
    doc.fillColor("#FFD700")
       .font("Helvetica-Bold")
       .fontSize(10)
       .text("SURGERY VR", 0, 42, {
         align: "center",
         characterSpacing: 5,
         width: W,
       });

    // Ligne décorative sous le logo
    const lineY = 60;
    doc.moveTo(W / 2 - 60, lineY).lineTo(W / 2 + 60, lineY)
       .lineWidth(0.8).strokeColor("rgba(255,215,0,0.4)").stroke();

    // ── TITRE CERTIFICAT ────────────────────────────────────
    doc.fillColor("#FFFFFF")
       .font("Helvetica")
       .fontSize(13)
       .text("CERTIFICAT D'EXCELLENCE", 0, 76, {
         align: "center",
         characterSpacing: 4,
         width: W,
       });

    // ── MÉDAILLON ────────────────────────────────────────────
    const medalX = W / 2;
    const medalY = 155;
    const medalR  = 44;

    // Halo extérieur
    doc.circle(medalX, medalY, medalR + 14)
       .lineWidth(1)
       .strokeColor("rgba(255,215,0,0.15)")
       .stroke();

    doc.circle(medalX, medalY, medalR + 8)
       .lineWidth(1)
       .strokeColor("rgba(255,215,0,0.25)")
       .stroke();

    // Cercle principal doré
    doc.circle(medalX, medalY, medalR).fill("#FFD700");

    // Étoile centrale simplifiée (écriture score)
    doc.fillColor("#000000")
       .font("Helvetica-Bold")
       .fontSize(22)
       .text(String(score), medalX - medalR, medalY - 14, {
         width: medalR * 2,
         align: "center",
       });

    doc.fillColor("#333333")
       .font("Helvetica")
       .fontSize(9)
       .text("/100", medalX - medalR, medalY + 10, {
         width: medalR * 2,
         align: "center",
       });

    // ── NOM ÉTUDIANT ────────────────────────────────────────
    doc.fillColor("rgba(255,215,0,0.6)")
       .font("Helvetica")
       .fontSize(11)
       .text("Est décerné à", 0, 214, { align: "center", width: W });

    doc.fillColor("#FFFFFF")
       .font("Helvetica-Bold")
       .fontSize(32)
       .text(student, 0, 232, { align: "center", width: W });

    // Ligne sous le nom
    const nameLineY = 270;
    const nameLineW = Math.min(300, student.length * 14 + 80);
    doc.moveTo(W / 2 - nameLineW / 2, nameLineY)
       .lineTo(W / 2 + nameLineW / 2, nameLineY)
       .lineWidth(1)
       .strokeColor("rgba(255,215,0,0.5)")
       .stroke();

    // ── TEXTE CERTIFICATION ──────────────────────────────────
    doc.fillColor("rgba(255,255,255,0.6)")
       .font("Helvetica")
       .fontSize(11)
       .text("Pour avoir obtenu la certification", 0, 282, { align: "center", width: W });

    doc.fillColor("#FFD700")
       .font("Helvetica-Bold")
       .fontSize(18)
       .text(certName, 0, 300, { align: "center", width: W });

    doc.fillColor("rgba(255,255,255,0.5)")
       .font("Helvetica")
       .fontSize(11)
       .text(`dans le scénario : ${scenario}`, 0, 326, { align: "center", width: W });

    // ── SCORE DÉTAIL ────────────────────────────────────────
    const scoreBoxW = 160;
    const scoreBoxX = W / 2 - scoreBoxW / 2;
    const scoreBoxY = 350;

    doc.rect(scoreBoxX, scoreBoxY, scoreBoxW, 34)
       .lineWidth(1)
       .strokeColor("rgba(255,215,0,0.25)")
       .stroke();

    doc.fillColor("rgba(255,215,0,0.08)").rect(scoreBoxX, scoreBoxY, scoreBoxW, 34).fill();

    doc.fillColor("#FFD700")
       .font("Helvetica-Bold")
       .fontSize(11)
       .text(`Score obtenu : ${score} / 100`, scoreBoxX, scoreBoxY + 11, {
         width: scoreBoxW,
         align: "center",
       });

    // ── PIED DE PAGE CERTIF ──────────────────────────────────
    // Séparateur
    doc.moveTo(W / 2 - 120, 400).lineTo(W / 2 + 120, 400)
       .lineWidth(0.5).strokeColor("rgba(255,215,0,0.2)").stroke();

    doc.fillColor("rgba(255,255,255,0.35)")
       .font("Helvetica")
       .fontSize(9)
       .text(`Délivré le ${issuedAt}`, 0, 410, { align: "center", width: W });

    // Signatures (2 colonnes)
    const sigY = 450;
    const sig1X = W / 4 - 60;
    const sig2X = (3 * W) / 4 - 60;
    const sigW  = 120;

    // Ligne signature gauche
    doc.moveTo(sig1X, sigY).lineTo(sig1X + sigW, sigY)
       .lineWidth(0.8).strokeColor("rgba(255,215,0,0.3)").stroke();
    doc.fillColor("rgba(255,255,255,0.35)")
       .font("Helvetica")
       .fontSize(8)
       .text("Directeur pédagogique", sig1X - 10, sigY + 5, { width: sigW + 20, align: "center" });
    doc.fillColor("rgba(255,215,0,0.5)")
       .font("Helvetica-Bold")
       .fontSize(8)
       .text("Surgery VR Academy", sig1X - 10, sigY + 17, { width: sigW + 20, align: "center" });

    // Ligne signature droite
    doc.moveTo(sig2X, sigY).lineTo(sig2X + sigW, sigY)
       .lineWidth(0.8).strokeColor("rgba(255,215,0,0.3)").stroke();
    doc.fillColor("rgba(255,255,255,0.35)")
       .font("Helvetica")
       .fontSize(8)
       .text("Responsable de formation", sig2X - 10, sigY + 5, { width: sigW + 20, align: "center" });
    doc.fillColor("rgba(255,215,0,0.5)")
       .font("Helvetica-Bold")
       .fontSize(8)
       .text("Surgery VR Platform", sig2X - 10, sigY + 17, { width: sigW + 20, align: "center" });

    // ID unique en bas
    doc.fillColor("rgba(255,255,255,0.15)")
       .font("Helvetica")
       .fontSize(7)
       .text(
         `ID : ${formation.operationId}  ·  Surgery VR — Document officiel à usage pédagogique`,
         0,
         H - 36,
         { align: "center", width: W }
       );

    doc.end();
  } catch (error) {
    console.error("PDF certificate error:", error);
    res.status(500).json({ message: "Erreur génération certificat", error: error.message });
  }
});



module.exports = router;