const axios = require('axios');
require('dotenv').config();

// ====================== EMAIL SERVICE - BREVO API ======================

if (!process.env.BREVO_API_KEY || !process.env.BREVO_SENDER_EMAIL) {
  console.error("❌ ERREUR : BREVO_API_KEY ou BREVO_SENDER_EMAIL manquant dans le .env");
}

// ====================== TEMPLATE HTML COMPLET ======================
const creerTemplateEmailDemo = (demande, messageEmail, videos) => {
  
  // Génération des 5 vidéos
  const videosHTML = videos.map((video, index) => `
    <tr>
      <td style="padding: 15px; background: #F8FAFF; border-radius: 10px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td width="60" style="padding-right: 15px; vertical-align: top;">
              <div style="width: 50px; height: 50px; background: linear-gradient(135deg, #0066FF, #00D9FF); border-radius: 10px; text-align: center; line-height: 50px; color: white; font-size: 22px; font-weight: bold;">
                ${index + 1}
              </div>
            </td>
            <td style="vertical-align: top;">
              <h3 style="margin: 0 0 6px 0; color: #1A2B5F; font-size: 17px;">${video.titre}</h3>
              ${video.description ? `<p style="margin: 0 0 12px 0; color: #5A6B8C; font-size: 14px; line-height: 1.5;">${video.description}</p>` : ''}
              <a href="${video.urlVideo}" 
                 target="_blank"
                 style="display: inline-block; padding: 10px 22px; background: linear-gradient(135deg, #0066FF, #00D9FF); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14.5px;">
                ▶️ Regarder la vidéo (${video.duree || '?'}s)
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr><td height="12"></td></tr>
  `).join('');

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vos Démos SurgeryVR</title>
</head>
<body style="margin:0; padding:0; font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; background-color:#F8FAFF;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F8FAFF; padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:white; border-radius:20px; box-shadow:0 4px 20px rgba(0,0,0,0.1); overflow:hidden;">
          
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0066FF,#00D9FF); padding:40px 30px; text-align:center;">
              <h1 style="margin:0; color:white; font-size:32px;">🎯 SurgeryVR</h1>
              <p style="margin:10px 0 0; color:rgba(255,255,255,0.9); font-size:18px;">Formation Médicale en Réalité Virtuelle</p>
            </td>
          </tr>

          <!-- Message personnalisé -->
          <tr>
            <td style="padding:35px 30px 20px 30px;">
              <h2 style="color:#1A2B5F; margin:0 0 20px 0; font-size:24px;">Bonjour ${demande.nomInstitution || 'Cher contact'},</h2>
              <div style="color:#334155; font-size:15.5px; line-height:1.65;">
                ${messageEmail ? messageEmail.replace(/\n/g, '<br>') : 'Merci pour votre intérêt pour nos solutions de formation médicale en réalité virtuelle.'}
              </div>
            </td>
          </tr>

          <!-- Section Vidéos -->
          <tr>
            <td style="padding:0 30px 30px 30px;">
              <h3 style="color:#1A2B5F; margin:0 0 20px 0; font-size:19px;">Voici les 5 vidéos de démonstration sélectionnées pour vous :</h3>
              <table width="100%" cellpadding="0" cellspacing="0">
                ${videosHTML}
              </table>
            </td>
          </tr>

          <!-- Call to Action -->
          <tr>
            <td style="padding:0 30px 40px 30px; text-align:center;">
              <p style="color:#64748B; font-size:15px;">Cliquez sur les boutons ci-dessus pour découvrir nos simulations immersives.</p>
              <p style="margin-top:25px;">
                <a href="https://surgery-vr.vercel.app/signin" 
                   style="color:#0066FF; text-decoration:underline; font-weight:500;">
                  Je souhaite une démonstration personnalisée →
                </a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#F1F5F9; padding:25px 30px; text-align:center; font-size:13px; color:#64748B; border-top:1px solid #E2E8F0;">
              Cordialement,<br>
              <strong>L’équipe SurgeryVR</strong><br><br>
              📧 ${demande.emailProfessionnel} | 📱 ${demande.telephone || ''}
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

// ====================== ENVOYER EMAIL VIA BREVO ======================
const envoyerEmailDemo = async ({ demande, messageEmail, videos }) => {
  try {
    if (!videos || videos.length === 0) {
      throw new Error("Aucune vidéo fournie pour l'email");
    }

    const htmlContent = creerTemplateEmailDemo(demande, messageEmail, videos);

    const payload = {
      sender: { 
        name: "SurgeryVR - Formation VR", 
        email: process.env.BREVO_SENDER_EMAIL 
      },
      to: [{ email: demande.emailProfessionnel, name: demande.nomInstitution || undefined }],
      subject: `🎥 Vos 5 vidéos démo - ${demande.nomInstitution || 'SurgeryVR'}`,
      htmlContent: htmlContent,
      replyTo: { email: process.env.BREVO_SENDER_EMAIL },
      tags: ["demo-surgeryvr"]
    };

    const response = await axios.post('https://api.brevo.com/v3/smtp/email', payload, {
      headers: {
        'api-key': process.env.BREVO_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    console.log(`✅ Email envoyé avec succès via Brevo → ${demande.emailProfessionnel} | ${videos.length} vidéos`);

    return response.data;

  } catch (error) {
    const errData = error.response?.data || error.message;
    console.error('❌ Erreur Brevo API:', {
      status: error.response?.status,
      message: errData.message || errData,
      details: errData
    });
    throw new Error(`Erreur envoi email Brevo: ${errData.message || errData}`);
  }
};

module.exports = { envoyerEmailDemo };