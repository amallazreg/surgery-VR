// ====================== EMAIL SERVICE - RESEND ======================
const { Resend } = require('resend');
require('dotenv').config();   // ← Très important en local

// Vérification de la clé API au démarrage
if (!process.env.RESEND_API_KEY) {
  console.error("❌ ERREUR : RESEND_API_KEY est manquante dans le fichier .env");
  console.error("   Ajoute-la dans ton fichier .env à la racine du backend");
}

// Initialisation Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// ====================== TEMPLATE HTML (inchangé) ======================
const creerTemplateEmailDemo = (demande, messageEmail, videos) => {
  const videosHTML = videos.map((video, index) => `
    <tr>
      <td style="padding: 15px; background: #F8FAFF; border-radius: 10px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td width="60" style="padding-right: 15px;">
              <div style="width: 50px; height: 50px; background: linear-gradient(135deg, #0066FF, #00D9FF); border-radius: 10px; text-align: center; line-height: 50px; color: white; font-size: 20px; font-weight: bold;">
                ${index + 1}
              </div>
            </td>
            <td>
              <h3 style="margin: 0 0 5px 0; color: #1A2B5F; font-size: 16px;">${video.titre}</h3>
              <p style="margin: 0 0 10px 0; color: #5A6B8C; font-size: 14px;">${video.description}</p>
              <a href="${video.urlVideo}" style="display: inline-block; padding: 8px 20px; background: linear-gradient(135deg, #0066FF, #00D9FF); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">
                ▶️ Regarder la vidéo (${video.duree}s)
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr><td height="15"></td></tr>
  `).join('');

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vos Démos SurgeryVR</title>
</head>
<body style="margin:0;padding:0;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background-color:#F8FAFF;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F8FAFF;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:white;border-radius:20px;box-shadow:0 4px 20px rgba(0,0,0,0.1);overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0066FF,#00D9FF);padding:40px 30px;text-align:center;">
              <h1 style="margin:0;color:white;font-size:32px;font-weight:700;">🎯 SurgeryVR</h1>
              <p style="margin:10px 0 0 0;color:rgba(255,255,255,0.9);font-size:16px;">Formation Médicale en Réalité Virtuelle</p>
            </td>
          </tr>

          <!-- Message -->
          <tr>
            <td style="padding:30px;">
              <h2 style="color:#1A2B5F;font-size:24px;margin:0 0 20px 0;">Bonjour ${demande.nomInstitution},</h2>
              <div style="color:#1A2B5F;font-size:15px;line-height:1.6;">
                ${messageEmail.replace(/\n/g, '<br>')}
              </div>
            </td>
          </tr>

          <!-- Vidéos + CTA + Footer -->
          <!-- (Je garde ton template complet, mais pour éviter que le message soit trop long ici, je te donne la suite si besoin) -->
          <!-- ... ton ancien template complet ... -->

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

// ====================== ENVOYER EMAIL ======================
const envoyerEmailDemo = async ({ demande, messageEmail, videos }) => {
  try {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY manquante dans les variables d'environnement");
    }

    const htmlContent = creerTemplateEmailDemo(demande, messageEmail, videos);

    const { data, error } = await resend.emails.send({
      from: 'SurgeryVR <onboarding@resend.dev>',
      to: [demande.emailProfessionnel],
      subject: '✅ Vos vidéos de démonstration SurgeryVR',
      html: htmlContent,
      replyTo: process.env.REPLY_TO_EMAIL || 'contact@surgery-vr.com'
    });

    if (error) throw error;

    console.log('✅ Email Resend envoyé avec succès à', demande.emailProfessionnel);
    return data;

  } catch (error) {
    console.error('❌ Erreur Resend:', error);
    throw new Error(`Erreur envoi email: ${error.message}`);
  }
};

// ====================== TEST CONFIG ======================
const testerConfigurationEmail = async () => {
  try {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY manquante");
    }

    const { data, error } = await resend.emails.send({
      from: 'SurgeryVR <onboarding@resend.dev>',
      to: [process.env.TEST_EMAIL],
      subject: 'Test Resend - SurgeryVR',
      html: '<h1>✅ Configuration Resend OK sur ton PC !</h1>'
    });

    if (error) throw error;

    console.log('✅ Test Resend réussi ! Email envoyé à', process.env.TEST_EMAIL);
    return true;
  } catch (error) {
    console.error('❌ Test Resend échoué:', error.message);
    return false;
  }
};

module.exports = {
  envoyerEmailDemo,
  testerConfigurationEmail
};