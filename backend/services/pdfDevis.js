const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// ===============================
// SERVICE DE GÉNÉRATION DE PDF DEVIS
// ===============================

/**
 * Générer un PDF de devis détaillé
 */
const genererPDFDevis = async (demande, devis) => {
  return new Promise((resolve, reject) => {
    try {

      // ✅ Convertir _id en string
      const idDemande = demande._id ? demande._id.toString() : 'XXXXX';

      // Créer le document PDF
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: `Devis ${demande.nomEtablissement}`,
          Author: 'SurveryVR',
          Subject: 'Devis de formation médicale VR'
        }
      });

      // ✅ Utiliser idDemande ici
      const fileName = `devis_${idDemande}_${Date.now()}.pdf`;
      const filePath = path.join(__dirname, '../temp', fileName);


      // Créer le dossier temp s'il n'existe pas
      if (!fs.existsSync(path.join(__dirname, '../temp'))) {
        fs.mkdirSync(path.join(__dirname, '../temp'), { recursive: true });
      }

      // Stream vers le fichier
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // ===========================
      // EN-TÊTE
      // ===========================
      doc
        .fontSize(28)
        .fillColor('#0066FF')
        .text('SurveryVR', 50, 50)
        .fontSize(12)
        .fillColor('#5A6B8C')
        .text('Formation Médicale en Réalité Virtuelle', 50, 85);

      // Date et référence
      const dateDevis = new Date().toLocaleDateString('fr-FR');
      const reference = `DEV-${new Date().getFullYear()}-${idDemande.slice(-6).toUpperCase()}`;
      
      doc
        .fontSize(10)
        .fillColor('#1A2B5F')
        .text(`Date : ${dateDevis}`, 400, 50)
        .text(`Référence : ${reference}`, 400, 65)
        .text(`Valable 30 jours`, 400, 80);

      // Ligne de séparation
      doc
        .strokeColor('#E8EFF9')
        .lineWidth(2)
        .moveTo(50, 110)
        .lineTo(545, 110)
        .stroke();

      // ===========================
      // INFORMATIONS CLIENT
      // ===========================
      let yPos = 130;

      doc
        .fontSize(14)
        .fillColor('#0066FF')
        .text('DEVIS POUR :', 50, yPos);

      yPos += 25;

      doc
        .fontSize(11)
        .fillColor('#1A2B5F')
        .text(demande.nomEtablissement, 50, yPos, { bold: true })
        .text(`${demande.prenom} ${demande.nom}`, 50, yPos + 15)
        .text(demande.emailProfessionnel, 50, yPos + 30)
        .text(`${demande.ville}, ${demande.pays}`, 50, yPos + 45);

      yPos += 80;

      // ===========================
      // CONFIGURATION
      // ===========================
      doc
        .fontSize(14)
        .fillColor('#0066FF')
        .text('CONFIGURATION :', 50, yPos);

      yPos += 25;

      doc
        .fontSize(10)
        .fillColor('#1A2B5F')
        .text(`• ${devis.parametresCalcul.nombreUtilisateurs} utilisateurs`, 50, yPos)
        .text(`• ${devis.parametresCalcul.nombreCasquesVR} casques VR`, 50, yPos + 15)
        .text(`• Déploiement : ${devis.parametresCalcul.typeDeploiement}`, 50, yPos + 30)
        .text(`• Engagement : 12 mois`, 50, yPos + 45);

      yPos += 80;

      // ===========================
      // DÉTAIL DU CALCUL
      // ===========================
      doc
        .fontSize(14)
        .fillColor('#0066FF')
        .text('DÉTAIL DU CALCUL :', 50, yPos);

      yPos += 25;

      // Fonction helper pour les lignes de détail
      const addDetailLine = (label, montant, yPosition) => {
        doc
          .fontSize(10)
          .fillColor('#1A2B5F')
          .text(label, 50, yPosition)
          .text(formatEuros(montant), 450, yPosition, { align: 'right', width: 95 });
      };

      // Licences
      const nbUsers = devis.parametresCalcul.nombreUtilisateurs;
      const tranche = devis.parametresCalcul.tranche;
      const prixLicence = Math.round(devis.coutLicences / (nbUsers * 12));
      
      addDetailLine(
        `Licences (${nbUsers} utilisateurs × ${prixLicence}€/mois × 12 mois)`,
        devis.coutLicences,
        yPos
      );
      yPos += 20;

      // Casques VR
      const nbCasques = devis.parametresCalcul.nombreCasquesVR;
      const prixCasque = Math.round(devis.coutCasquesVR / nbCasques);
      
      addDetailLine(
        `Casques VR (${nbCasques} × ${prixCasque}€)`,
        devis.coutCasquesVR,
        yPos
      );
      yPos += 20;

      // Déploiement
      addDetailLine(
        `Déploiement ${devis.parametresCalcul.typeDeploiement}`,
        devis.coutDeploiement,
        yPos
      );
      yPos += 20;

      // Formation
      const prixFormation = Math.round(devis.coutFormation / nbUsers);
      addDetailLine(
        `Formation (${nbUsers} × ${prixFormation}€)`,
        devis.coutFormation,
        yPos
      );
      yPos += 20;

      // Support
      addDetailLine(
        `Support annuel (10%)`,
        devis.coutSupport,
        yPos
      );
      yPos += 20;

      // Ligne de séparation
      doc
        .strokeColor('#E8EFF9')
        .lineWidth(1)
        .moveTo(50, yPos + 5)
        .lineTo(545, yPos + 5)
        .stroke();

      yPos += 20;

      // Sous-total
      doc
        .fontSize(11)
        .fillColor('#1A2B5F')
        .font('Helvetica-Bold')
        .text('Sous-total', 50, yPos)
        .text(formatEuros(devis.sousTotal), 450, yPos, { align: 'right', width: 95 })
        .font('Helvetica');

      yPos += 25;

      // Remise (si applicable)
      if (devis.remisePourcentage > 0) {
        doc
          .fontSize(11)
          .fillColor('#00C48C')
          .font('Helvetica-Bold')
          .text(`Remise volume (${devis.remisePourcentage}%)`, 50, yPos)
          .text(`- ${formatEuros(devis.montantRemise)}`, 450, yPos, { align: 'right', width: 95 })
          .font('Helvetica');
        
        yPos += 25;

        // Ligne après remise
        doc
          .strokeColor('#E8EFF9')
          .lineWidth(1)
          .moveTo(50, yPos)
          .lineTo(545, yPos)
          .stroke();

        yPos += 15;
      }

      // TOTAL HT
      doc
        .fontSize(13)
        .fillColor('#1A2B5F')
        .font('Helvetica-Bold')
        .text('TOTAL HT', 50, yPos)
        .text(formatEuros(devis.totalHT), 450, yPos, { align: 'right', width: 95 })
        .font('Helvetica');

      yPos += 20;

      // TVA
      doc
        .fontSize(10)
        .fillColor('#5A6B8C')
        .text(`TVA (${devis.tauxTVA}%)`, 50, yPos)
        .text(formatEuros(devis.montantTVA), 450, yPos, { align: 'right', width: 95 });

      yPos += 20;

      // Ligne finale
      doc
        .strokeColor('#0066FF')
        .lineWidth(3)
        .moveTo(50, yPos)
        .lineTo(545, yPos)
        .stroke();

      yPos += 15;

      // TOTAL TTC
      doc
        .fontSize(16)
        .fillColor('#0066FF')
        .font('Helvetica-Bold')
        .text('TOTAL TTC', 50, yPos)
        .text(formatEuros(devis.totalTTC), 450, yPos, { align: 'right', width: 95 })
        .font('Helvetica');

      yPos += 40;

      // ===========================
      // EXPLICATION DU CALCUL
      // ===========================
      doc
        .fontSize(12)
        .fillColor('#0066FF')
        .text('COMMENT EST CALCULÉ CE DEVIS ?', 50, yPos);

      yPos += 20;

      doc
        .fontSize(9)
        .fillColor('#1A2B5F')
        .text(
          `• Les licences utilisateurs sont facturées mensuellement avec un tarif dégressif selon le volume (${tranche}).`,
          50,
          yPos,
          { width: 495, align: 'justify' }
        );

      yPos += 25;

      doc.text(
        `• Le support technique Standard (10% du sous-total) est inclus : mises à jour, assistance technique et formation continue.`,
        50,
        yPos,
        { width: 495, align: 'justify' }
      );

      yPos += 25;

      if (devis.remisePourcentage > 0) {
        doc.text(
          `• Une remise de ${devis.remisePourcentage}% a été appliquée automatiquement grâce au volume de votre commande.`,
          50,
          yPos,
          { width: 495, align: 'justify' }
        );
        yPos += 25;
      }

      doc.text(
        `• La TVA de ${devis.tauxTVA}% est calculée selon la législation en vigueur dans votre pays (${devis.parametresCalcul.pays}).`,
        50,
        yPos,
        { width: 495, align: 'justify' }
      );

      // ===========================
      // CONDITIONS
      // ===========================
      yPos = 650; // Position fixe pour le footer

      doc
        .fontSize(10)
        .fillColor('#0066FF')
        .text('CONDITIONS :', 50, yPos);

      yPos += 15;

      doc
        .fontSize(8)
        .fillColor('#5A6B8C')
        .text('• Devis valable 30 jours', 50, yPos)
        .text('• Engagement initial de 12 mois', 50, yPos + 12)
        .text('• Formation et onboarding inclus', 50, yPos + 24)
        .text('• Paiement : 50% à la commande, 50% à la livraison', 50, yPos + 36);

      // Footer
      yPos = 750;

      doc
        .strokeColor('#E8EFF9')
        .lineWidth(1)
        .moveTo(50, yPos)
        .lineTo(545, yPos)
        .stroke();

      doc
        .fontSize(8)
        .fillColor('#5A6B8C')
        .text(
          'SurveryVR - Formation Médicale en Réalité Virtuelle',
          50,
          yPos + 10,
          { align: 'center', width: 495 }
        )
        .text(
          'contact@surveyvr.com | www.surveyvr.com',
          50,
          yPos + 22,
          { align: 'center', width: 495 }
        );

      // Finaliser le PDF
      doc.end();

      // Attendre que le stream soit terminé
      stream.on('finish', () => {
        resolve({
          filePath,
          fileName
        });
      });

      stream.on('error', (error) => {
        reject(error);
      });

    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Helper pour formater les montants en euros
 */
const formatEuros = (montant) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(montant);
};

/**
 * Supprimer un fichier PDF temporaire
 */
const supprimerPDFTemp = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log('✅ PDF temporaire supprimé:', filePath);
    }
  } catch (error) {
    console.error('⚠️ Erreur suppression PDF:', error);
  }
};

module.exports = {
  genererPDFDevis,
  supprimerPDFTemp
};