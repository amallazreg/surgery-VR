const axios = require('axios');
require('dotenv').config();

// ====================== BREVO API - EMAILS COMPTE ======================

// Fonction commune pour envoyer via Brevo
const sendBrevoEmail = async (to, subject, htmlContent) => {
  try {
    if (!process.env.BREVO_API_KEY || !process.env.BREVO_SENDER_EMAIL) {
      throw new Error("BREVO_API_KEY ou BREVO_SENDER_EMAIL manquant");
    }

    const payload = {
      sender: {
        name: "SurgeryVR",
        email: process.env.BREVO_SENDER_EMAIL
      },
      to: [{ email: to }],
      subject: subject,
      htmlContent: htmlContent,
      replyTo: { email: process.env.BREVO_SENDER_EMAIL },
      tags: ["surgeryvr-compte"]
    };

    const response = await axios.post('https://api.brevo.com/v3/smtp/email', payload, {
      headers: {
        'api-key': process.env.BREVO_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    console.log(`✅ Email Brevo envoyé : ${subject} → ${to}`);
    return response.data;

  } catch (error) {
    const errData = error.response?.data || error;
    console.error('❌ Erreur Brevo API:', errData);
    throw new Error(`Erreur envoi email: ${errData.message || error.message}`);
  }
};

// ====================== EMAIL APPROBATION ======================
const envoyerEmailApprobation = async (client) => {
  const htmlContent = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Compte approuvé - SurgeryVR</title>
</head>
<body style="margin:0; padding:0; font-family: 'Inter', sans-serif; background-color:#F8FAFF;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F8FAFF; padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#fff; border-radius:20px; box-shadow:0 4px 20px rgba(0,0,0,0.1); overflow:hidden;">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #0066FF, #00D9FF); padding:40px 30px; text-align:center;">
              <h1 style="margin:0; color:#fff; font-size:32px;">🎯 SurgeryVR</h1>
              <p style="margin:10px 0 0 0; color:rgba(255,255,255,0.9); font-size:16px;">Votre compte a été approuvé</p>
            </td>
          </tr>

          <!-- Message -->
          <tr>
            <td style="padding:30px;">
              <h2 style="color:#1A2B5F; font-size:24px; margin:0 0 20px 0;">
                Bonjour ${client.prenom} ${client.nom},
              </h2>
              <div style="color:#1A2B5F; font-size:15px; line-height:1.6;">
                Après vérification, votre demande de création de compte a été <strong>approuvée</strong>.<br><br>
                Vous pouvez maintenant vous connecter et accéder à votre espace SurgeryVR.
              </div>
            </td>
          </tr>

          <!-- Call to Action -->
          <tr>
            <td style="padding:0 30px 30px 30px; text-align:center;">
              <a href="${process.env.FRONTEND_URL || 'https://surgery-vr.vercel.app'}/login" 
                 style="display:inline-block; padding:15px 40px; background:linear-gradient(135deg,#00C48C,#00FFA3); color:white; text-decoration:none; border-radius:12px; font-weight:700; font-size:16px; box-shadow:0 4px 15px rgba(0,196,140,0.3);">
                 🚀 Se connecter
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#F8FAFF; padding:30px; text-align:center; border-top:2px solid #E8EFF9;">
              <p style="margin:0 0 10px 0; color:#1A2B5F; font-size:16px; font-weight:600;">
                Cordialement,<br>L'équipe SurgeryVR
              </p>
              <p style="margin:0; color:#5A6B8C; font-size:14px;">
                ${process.env.BREVO_SENDER_EMAIL} | www.surgeryvr.com
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return await sendBrevoEmail(client.email, '✅ Compte approuvé - SurgeryVR', htmlContent);
};

// ====================== EMAIL REJET ======================
const envoyerEmailRejet = async (client) => {
  const htmlContent = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Compte refusé - SurgeryVR</title>
</head>
<body style="margin:0; padding:0; font-family: 'Inter', sans-serif; background-color:#F8FAFF;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F8FAFF; padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#fff; border-radius:20px; box-shadow:0 4px 20px rgba(0,0,0,0.1); overflow:hidden;">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #FF4B4B, #FF8C8C); padding:40px 30px; text-align:center;">
              <h1 style="margin:0; color:#fff; font-size:32px;">⚠️ SurgeryVR</h1>
              <p style="margin:10px 0 0 0; color:rgba(255,255,255,0.9); font-size:16px;">Votre compte a été refusé</p>
            </td>
          </tr>

          <!-- Message -->
          <tr>
            <td style="padding:30px;">
              <h2 style="color:#1A2B5F; font-size:24px; margin:0 0 20px 0;">
                Bonjour ${client.prenom} ${client.nom},
              </h2>
              <div style="color:#1A2B5F; font-size:15px; line-height:1.6;">
                Après vérification, votre demande de création de compte a été <strong>refusée</strong>.<br><br>
                Vous pouvez soumettre une nouvelle demande avec des documents valides.
              </div>
            </td>
          </tr>

          <!-- Call to Action -->
          <tr>
            <td style="padding:0 30px 30px 30px; text-align:center;">
              <a href="${process.env.FRONTEND_URL || 'https://surgery-vr.vercel.app'}/signup" 
                 style="display:inline-block; padding:15px 40px; background:linear-gradient(135deg,#FF4B4B,#FF8C8C); color:white; text-decoration:none; border-radius:12px; font-weight:700; font-size:16px; box-shadow:0 4px 15px rgba(255,75,75,0.3);">
                 🔄 Soumettre à nouveau
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#F8FAFF; padding:30px; text-align:center; border-top:2px solid #E8EFF9;">
              <p style="margin:0 0 10px 0; color:#1A2B5F; font-size:16px; font-weight:600;">
                Cordialement,<br>L'équipe SurgeryVR
              </p>
              <p style="margin:0; color:#5A6B8C; font-size:14px;">
                ${process.env.BREVO_SENDER_EMAIL} | www.surgeryvr.com
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return await sendBrevoEmail(client.email, '❌ Compte refusé - SurgeryVR', htmlContent);
};

module.exports = {
  envoyerEmailApprobation,
  envoyerEmailRejet
};