const axios = require('axios');
require('dotenv').config();

// ====================== EMAIL SERVICE - BREVO API ======================

// Vérification de la clé au démarrage
if (!process.env.BREVO_API_KEY) {
  console.error("❌ ERREUR : BREVO_API_KEY manquante dans le fichier .env");
}

// ====================== TEMPLATE HTML (ton beau template) ======================
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
<body style="margin:0; padding:0; font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; background-color:#F8FAFF;">
  <!-- Ton template complet ici (header, message, vidéos, CTA, footer) -->
  <!-- Je te mets la version courte pour ne pas allonger trop, mais remplace par ton template complet -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F8FAFF; padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:white; border-radius:20px; box-shadow:0 4px 20px rgba(0,0,0,0.1);">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#0066FF,#00D9FF); padding:40px 30px; text-align:center;">
            <h1 style="margin:0; color:white; font-size:32px;">🎯 SurgeryVR</h1>
            <p style="margin:10px 0 0; color:rgba(255,255,255,0.9);">Formation Médicale en Réalité Virtuelle</p>
          </td>
        </tr>
        <!-- Message personnalisé -->
        <tr>
          <td style="padding:30px;">
            <h2 style="color:#1A2B5F; font-size:24px;">Bonjour ${demande.nomInstitution},</h2>
            <div style="color:#1A2B5F; font-size:15px; line-height:1.6;">
              ${messageEmail.replace(/\n/g, '<br>')}
            </div>
          </td>
        </tr>
        <!-- Vidéos et le reste de ton template -->
        <!-- ... Colle ici le reste de ton ancien template (vidéos, CTA, footer) ... -->
      </table>
    </td></tr>
  </table>
</body>
</html>`;
};

// ====================== ENVOYER EMAIL VIA BREVO API ======================
const envoyerEmailDemo = async ({ demande, messageEmail, videos }) => {
  try {
    if (!process.env.BREVO_API_KEY) {
      throw new Error("BREVO_API_KEY manquante dans .env");
    }

    const htmlContent = creerTemplateEmailDemo(demande, messageEmail, videos);

    const payload = {
      sender: { 
        name: "SurgeryVR", 
        email: process.env.BREVO_SENDER_EMAIL   // ex: lazregamal45@gmail.com ou l'email de ton compte Brevo
      },
      to: [{ email: demande.emailProfessionnel }],
      subject: '✅ Vos vidéos de démonstration SurgeryVR',
      htmlContent: htmlContent,
      replyTo: { email: process.env.BREVO_SENDER_EMAIL }
    };

    const response = await axios.post('https://api.brevo.com/v3/smtp/email', payload, {
      headers: {
        'api-key': process.env.BREVO_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    console.log('✅ Email Brevo envoyé avec succès à', demande.emailProfessionnel);
    return response.data;

  } catch (error) {
    console.error('❌ Erreur Brevo API:', error.response?.data || error.message);
    throw new Error(`Erreur envoi email: ${error.response?.data?.message || error.message}`);
  }
};

module.exports = {
  envoyerEmailDemo
};