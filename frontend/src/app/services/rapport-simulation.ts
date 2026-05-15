import { Injectable } from '@angular/core';
import { AnalysisResult, SimulationResult } from './simulation-aiservice';
import jsPDF from 'jspdf';

@Injectable({
  providedIn: 'root',
})
export class RapportSimulation {
 generateReport(
    result: AnalysisResult,
    simulationResult: SimulationResult | null,
    previewUrl: string | null,
    selectedProcedure: string | null,
    procedureLabels: Record<string, string>
  ): void {

    const doc = new jsPDF('p', 'mm', 'a4');
    const W   = 210;
    const PAGE_H      = 287; // hauteur utile avant footer
    const MARGIN_BOT  = 20;  // marge de sécurité
    let y = 0;

    // ============================================================
    // COULEURS
    // ============================================================
    const BLUE   = [0,   102, 255] as [number, number, number];
    const DARK   = [26,  26,  46]  as [number, number, number];
    const GRAY   = [100, 100, 120] as [number, number, number];
    const LIGHT  = [245, 247, 255] as [number, number, number];
    const GREEN  = [0,   196, 140] as [number, number, number];
    const ORANGE = [255, 107,  0]  as [number, number, number];
    const WHITE  = [255, 255, 255] as [number, number, number];

    // ============================================================
    // HELPER : nouvelle page si nécessaire
    // ============================================================
    const checkPage = (neededHeight: number) => {
      if (y + neededHeight > PAGE_H - MARGIN_BOT) {
        doc.addPage();
        y = 15;
      }
    };

    // ============================================================
    // PAGE 1 — HEADER
    // ============================================================
    doc.setFillColor(...BLUE);
    doc.rect(0, 0, W, 40, 'F');

    doc.setFillColor(0, 80, 200);
    doc.rect(0, 32, W, 8, 'F');

    doc.setTextColor(...WHITE);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('SurgeryVR', 15, 16);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Rapport d\'Analyse Esthetique par Intelligence Artificielle', 15, 26);

    const now     = new Date();
    const dateStr = now.toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'long', year: 'numeric'
    });
    doc.setFontSize(8);
    doc.text(`Genere le ${dateStr}`, W - 15, 26, { align: 'right' });

    y = 50;

    // ============================================================
    // PHOTO + RECOMMANDATION
    // ============================================================
    if (previewUrl) {
      try {
        doc.addImage(previewUrl, 'JPEG', 15, y, 45, 52);
        doc.setDrawColor(...BLUE);
        doc.setLineWidth(0.5);
        doc.rect(15, y, 45, 52);
      } catch (e) {}
    }

    const recProc   = result.recommendation.procedure;
    const procLabel = procedureLabels[recProc] ?? recProc;
    const conf      = Math.round(result.recommendation.confidence * 100);

    doc.setFillColor(...LIGHT);
    doc.roundedRect(65, y, W - 80, 52, 4, 4, 'F');

    doc.setTextColor(...BLUE);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('RECOMMANDATION IA', 72, y + 9);

    doc.setTextColor(...DARK);
    doc.setFontSize(15);
    doc.setFont('helvetica', 'bold');
    doc.text(procLabel, 72, y + 20);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...GRAY);
    doc.text('Confiance du modele :', 72, y + 30);
    doc.setTextColor(...BLUE);
    doc.setFont('helvetica', 'bold');
    doc.text(`${conf}%`, 125, y + 30);

    const confBarX = 72;
    const confBarW = W - 80 - 14;
    doc.setFillColor(220, 220, 235);
    doc.roundedRect(confBarX, y + 33, confBarW, 4, 1, 1, 'F');
    doc.setFillColor(...BLUE);
    doc.roundedRect(confBarX, y + 33, confBarW * conf / 100, 4, 1, 1, 'F');

    doc.setTextColor(...GRAY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(result.recommendation.reason, 72, y + 46, { maxWidth: W - 85 });

    y += 62;

    // ============================================================
    // SCORES SYMÉTRIE + RATIO D'OR
    // ============================================================
    checkPage(50);
    this.sectionTitle(doc, 'Analyse Faciale', y, BLUE, WHITE, W);
    y += 12;

    const symScore    = Math.round(result.features.scores.symmetry_score * 100);
    const goldenScore = Math.round(result.features.scores.golden_ratio_score * 100);
    const blockW      = 88;
    const gap         = 6;

    this.scoreBlock(doc, 'Symetrie Faciale', symScore,    15,               y, GREEN, LIGHT, blockW);
    this.scoreBlock(doc, 'Ratio d\'Or',      goldenScore, 15 + blockW + gap, y, BLUE,  LIGHT, blockW);

    y += 38;

    // ============================================================
    // RATIOS FACIAUX
    // ============================================================
    checkPage(80);
    this.sectionTitle(doc, 'Ratios Faciaux', y, DARK, WHITE, W);
    y += 12;

    const ratios = [
      { label: 'Ratio nez/visage',      value: result.features.ratios.nose_face_ratio },
      { label: 'Ratio bouche/visage',   value: result.features.ratios.mouth_face_ratio },
      { label: 'Symetrie oculaire',     value: result.features.ratios.eye_symmetry },
      { label: 'Ratio facial',          value: result.features.ratios.face_ratio },
      { label: 'Ratio oculaire/visage', value: result.features.ratios.eye_face_ratio },
    ];

    const ratioBlockW = (W - 35) / 2;
    const ratioBarX   = 38;
    const ratioBarW   = ratioBlockW - ratioBarX - 6;
    const ratioStartY = y;

    ratios.forEach((r, i) => {
      const col = i % 2 === 0 ? 15 : 15 + ratioBlockW + 5;
      if (i % 2 === 0 && i > 0) y += 22;

      const currentBlockW = (i === ratios.length - 1 && ratios.length % 2 !== 0)
        ? (W - 30)
        : ratioBlockW;

      doc.setFillColor(...LIGHT);
      doc.roundedRect(col, y, currentBlockW, 18, 3, 3, 'F');

      doc.setTextColor(...GRAY);
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.text(r.label, col + 4, y + 6);

      doc.setTextColor(...DARK);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(r.value.toFixed(3), col + 4, y + 14);

      const bX          = col + ratioBarX;
      const bY          = y + 10;
      const currentBarW = currentBlockW - ratioBarX - 6;

      doc.setFillColor(220, 220, 235);
      doc.roundedRect(bX, bY, currentBarW, 4, 1, 1, 'F');

      const color = r.value >= 0.8 ? GREEN : r.value >= 0.6 ? BLUE : ORANGE;
      doc.setFillColor(...color);
      doc.roundedRect(bX, bY, currentBarW * Math.min(r.value, 1), 4, 1, 1, 'F');
    });

    y += 28;

    // ============================================================
    // MESURES FACIALES
    // ============================================================
    checkPage(60); // ← vérifie avant d'écrire la section
    this.sectionTitle(doc, 'Mesures Faciales (px)', y, DARK, WHITE, W);
    y += 12;

    const distances = [
      { label: 'Largeur visage',    value: result.features.distances.face_width },
      { label: 'Hauteur visage',    value: result.features.distances.face_height },
      { label: 'Distance oculaire', value: result.features.distances.eye_distance },
      { label: 'Largeur bouche',    value: result.features.distances.mouth_width },
      { label: 'Largeur nez',       value: result.features.distances.nose_width },
    ];

    const distW    = (W - 40) / 3;
    const distCols = [15, 15 + distW + 5, 15 + (distW + 5) * 2];

    distances.forEach((d, i) => {
      const col = distCols[i % 3];
      if (i % 3 === 0 && i > 0) y += 20;

      doc.setFillColor(...LIGHT);
      doc.roundedRect(col, y, distW, 16, 2, 2, 'F');

      doc.setTextColor(...GRAY);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.text(d.label, col + 4, y + 6);

      doc.setTextColor(...DARK);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(`${d.value.toFixed(1)} px`, col + 4, y + 13);
    });

    y += 24;

    // ============================================================
    // ALTERNATIVES
    // ============================================================
    if (result.recommendation.alternatives.length > 0) {
      checkPage(30 + result.recommendation.alternatives.length * 18);
      y += 4;
      this.sectionTitle(doc, 'Alternatives Possibles', y, ORANGE, WHITE, W);
      y += 12;

      result.recommendation.alternatives.forEach(alt => {
        const altLabel = procedureLabels[alt.procedure] ?? alt.procedure;
        const altConf  = Math.round(alt.confidence * 100);

        doc.setFillColor(...LIGHT);
        doc.roundedRect(15, y, W - 30, 14, 3, 3, 'F');

        doc.setTextColor(...DARK);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text(altLabel, 22, y + 9);

        doc.setTextColor(...ORANGE);
        doc.setFont('helvetica', 'bold');
        doc.text(`${altConf}%`, W - 20, y + 9, { align: 'right' });

        const altBarX = 90;
        const altBarW = 80;
        doc.setFillColor(220, 220, 235);
        doc.roundedRect(altBarX, y + 5, altBarW, 4, 1, 1, 'F');
        doc.setFillColor(...ORANGE);
        doc.roundedRect(altBarX, y + 5, altBarW * altConf / 100, 4, 1, 1, 'F');

        y += 18;
      });
    }

    // ============================================================
    // PAGE SIMULATION — AVANT/APRÈS
    // ============================================================
    if (simulationResult?.success && simulationResult.before_b64 && simulationResult.after_b64) {
      doc.addPage();
      y = 0;

      doc.setFillColor(...BLUE);
      doc.rect(0, 0, W, 30, 'F');

      doc.setTextColor(...WHITE);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Simulation Avant / Apres', 15, 16);

      const simLabel = procedureLabels[simulationResult.procedure] ?? simulationResult.procedure;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(simLabel, W - 15, 16, { align: 'right' });

      y = 42;

      const imgW   = 82;
      const imgH   = 82;
      const leftX  = 15;
      const rightX = W - imgW - 15;

      doc.setTextColor(...GRAY);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('AVANT',        leftX  + imgW / 2, y, { align: 'center' });
      doc.text('APRES SIMULE', rightX + imgW / 2, y, { align: 'center' });

      y += 4;

      try {
        doc.addImage(
          `data:image/jpeg;base64,${simulationResult.before_b64}`,
          'JPEG', leftX, y, imgW, imgH
        );
        doc.setDrawColor(...GRAY);
        doc.setLineWidth(0.3);
        doc.rect(leftX, y, imgW, imgH);
      } catch (e) {}

      doc.setTextColor(...BLUE);
      doc.setFontSize(24);
      doc.text('>', W / 2, y + imgH / 2 + 6, { align: 'center' });

      try {
        doc.addImage(
          `data:image/jpeg;base64,${simulationResult.after_b64}`,
          'JPEG', rightX, y, imgW, imgH
        );
        doc.setDrawColor(...BLUE);
        doc.setLineWidth(0.8);
        doc.rect(rightX, y, imgW, imgH);
      } catch (e) {}

      y += imgH + 14;

      doc.setFillColor(...LIGHT);
      doc.roundedRect(15, y, W - 30, 14, 3, 3, 'F');
      doc.setTextColor(...BLUE);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('PROCEDURE SIMULEE :', 22, y + 9);
      doc.setTextColor(...DARK);
      doc.setFont('helvetica', 'normal');
      doc.text(simLabel, 75, y + 9);

      y += 22;

      doc.setFillColor(255, 245, 235);
      doc.roundedRect(15, y, W - 30, 22, 3, 3, 'F');
      doc.setDrawColor(...ORANGE);
      doc.setLineWidth(0.5);
      doc.roundedRect(15, y, W - 30, 22, 3, 3, 'S');

      doc.setTextColor(...ORANGE);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('AVERTISSEMENT', 22, y + 8);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...DARK);
      doc.setFontSize(7.5);
      doc.text(
        'Cette simulation est generee par intelligence artificielle a titre indicatif uniquement. ' +
        'Elle ne constitue pas un avis medical et ne remplace pas une consultation avec un chirurgien qualifie.',
        22, y + 15,
        { maxWidth: W - 44 }
      );
    }

    // ============================================================
    // FOOTER — toutes les pages
    // ============================================================
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFillColor(...LIGHT);
      doc.rect(0, 287, W, 10, 'F');
      doc.setDrawColor(220, 220, 235);
      doc.setLineWidth(0.3);
      doc.line(0, 287, W, 287);
      doc.setTextColor(...GRAY);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.text('SurgeryVR  —  Rapport confidentiel  —  Usage medical uniquement', 15, 293);
      doc.text(`Page ${i} / ${pageCount}`, W - 15, 293, { align: 'right' });
    }

    // ============================================================
    // SAUVEGARDE
    // ============================================================
    const filename = `SurgeryVR_Rapport_${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}.pdf`;
    doc.save(filename);
  }

  // ============================================================
  // HELPERS
  // ============================================================

  private sectionTitle(
    doc: jsPDF,
    title: string,
    y: number,
    bg: [number, number, number],
    fg: [number, number, number],
    W: number
  ): void {
    doc.setFillColor(...bg);
    doc.roundedRect(15, y, W - 30, 9, 2, 2, 'F');
    doc.setTextColor(...fg);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.text(title.toUpperCase(), 20, y + 6.2);
  }

  private scoreBlock(
    doc: jsPDF,
    label: string,
    value: number,
    x: number,
    y: number,
    color: [number, number, number],
    bg: [number, number, number],
    blockW: number
  ): void {
    doc.setFillColor(...bg);
    doc.roundedRect(x, y, blockW, 30, 4, 4, 'F');

    const barX = x + 5;
    const barW = blockW - 10;
    const barY = y + 6;
    doc.setFillColor(220, 220, 235);
    doc.roundedRect(barX, barY, barW, 5, 2, 2, 'F');
    doc.setFillColor(...color);
    doc.roundedRect(barX, barY, barW * value / 100, 5, 2, 2, 'F');

    doc.setTextColor(...color);
    doc.setFontSize(17);
    doc.setFont('helvetica', 'bold');
    doc.text(`${value}%`, x + blockW / 2, y + 21, { align: 'center' });

    doc.setTextColor(100, 100, 120);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.text(label, x + blockW / 2, y + 27, { align: 'center' });
  }
}