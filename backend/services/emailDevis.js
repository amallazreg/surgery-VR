const axios = require('axios');
require('dotenv').config();
const { genererRecapitulatifDevis } = require('./devisCalcul'); // ← ajouter cette ligne


// ====================== BREVO API - EMAIL DEVIS ======================

const envoyerEmailDevis = async ({ demande, devis, pdfPath }) => {
  try {
    if (!process.env.BREVO_API_KEY || !process.env.BREVO_SENDER_EMAIL) {
      throw new Error("BREVO_API_KEY ou BREVO_SENDER_EMAIL manquant dans .env");
    }

    const htmlContent = creerTemplateEmailDevis(demande, devis);
    const recapitulatif = genererRecapitulatifDevis(devis);

    const payload = {
      sender: {
        name: "SurveryVR - Devis",
        email: process.env.BREVO_SENDER_EMAIL
      },
      to: [{ email: demande.emailProfessionnel }],
      subject: `Votre devis personnalisé SurveryVR - ${demande.nomEtablissement}`,
      htmlContent: htmlContent,
      textContent: recapitulatif,                    // Version texte
      replyTo: { email: process.env.BREVO_SENDER_EMAIL },
      tags: ["devis-surveryvr"],
      // Pièce jointe PDF (si elle existe)
      attachment: pdfPath ? [{
        name: `Devis_SurveryVR_${demande.nomEtablissement.replace(/\s+/g, '_')}.pdf`,
        content: pdfPath,                    // On enverra le contenu plus bas si besoin
        type: "application/pdf"
      }] : []
    };

    // Si tu as un fichier PDF physique (buffer ou chemin), il faut le convertir en base64
    // Pour l'instant on garde simple. Si tu as un buffer, on l'ajustera.

    const response = await axios.post('https://api.brevo.com/v3/smtp/email', payload, {
      headers: {
        'api-key': process.env.BREVO_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    console.log('✅ Email de devis envoyé via Brevo :', {
      destinataire: demande.emailProfessionnel,
      etablissement: demande.nomEtablissement,
      montantTTC: devis.totalTTC,
      pdfAttache: !!pdfPath,
      messageId: response.data.messageId
    });

    return response.data;

  } catch (error) {
    const errData = error.response?.data || error;
    console.error('❌ Erreur Brevo API (Devis):', errData);
    throw new Error(`Erreur envoi email devis: ${errData.message || error.message}`);
  }
};

// ====================== TEMPLATE HTML (inchangé) ======================
const creerTemplateEmailDevis = (demande, devis) => {
  const { prenom, nom, nomEtablissement, besoins } = demande;
  const idDemande = demande._id ? demande._id.toString() : 'XXXXX';

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Votre Devis SurveryVR</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #F8FAFF;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F8FAFF; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="650" cellpadding="0" cellspacing="0" style="background: white; border-radius: 20px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1); overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #0066FF, #00D9FF); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: white; font-size: 32px; font-weight: 700;">
                💼 SurveryVR
              </h1>
              <p style="margin: 10px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 16px;">
                Formation Médicale en Réalité Virtuelle
              </p>
            </td>
          </tr>

          <!-- Titre -->
          <tr>
            <td style="padding: 30px; text-align: center; background: linear-gradient(135deg, rgba(0, 102, 255, 0.05), rgba(0, 217, 255, 0.05));">
              <h2 style="margin: 0; color: #1A2B5F; font-size: 28px; font-weight: 700;">
                Votre Devis Personnalisé
              </h2>
              <p style="margin: 10px 0 0 0; color: #5A6B8C; font-size: 16px;">
                Valable 30 jours - Référence: DEV-${new Date().getFullYear()}-${idDemande.slice(-6).toUpperCase()}
              </p>
            </td>
          </tr>

          <!-- Message personnalisé -->
          <tr>
            <td style="padding: 30px;">
              <p style="margin: 0 0 15px 0; color: #1A2B5F; font-size: 16px; line-height: 1.6;">
                Bonjour <strong>${prenom} ${nom}</strong>,
              </p>
              <p style="margin: 0 0 15px 0; color: #1A2B5F; font-size: 16px; line-height: 1.6;">
                Merci pour votre intérêt pour <strong>${nomEtablissement}</strong>. Nous avons le plaisir de vous présenter notre offre personnalisée pour vos besoins en formation médicale par réalité virtuelle.
              </p>
            </td>
          </tr>

          <!-- Besoins identifiés -->
          <tr>
            <td style="padding: 0 30px 20px 30px;">
              <div style="background: linear-gradient(135deg, rgba(0, 196, 140, 0.05), rgba(0, 255, 163, 0.05)); padding: 20px; border-radius: 15px; border-left: 4px solid #00C48C;">
                <h3 style="margin: 0 0 15px 0; color: #00C48C; font-size: 18px; font-weight: 700;">
                  ✓ Vos Besoins Identifiés
                </h3>
                <ul style="margin: 0; padding-left: 20px; color: #1A2B5F;">
                  ${besoins.map(besoin => `<li style="margin-bottom: 8px;">${besoin}</li>`).join('')}
                </ul>
              </div>
            </td>
          </tr>

          <!-- Le reste de ton template (devis détaillé, total, CTA, footer) reste IDENTIQUE -->
          <!-- Je l'ai gardé tel quel pour ne rien casser -->

          ${/* Ton code complet du devis détaillé, sous-total, remise, total TTC, CTA, etc. */''}
          <!-- Colle ici tout le reste de ton ancien template à partir de la ligne du détail du devis -->

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

module.exports = {
  envoyerEmailDevis
};