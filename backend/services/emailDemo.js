const { Resend } = require('resend');

// Initialisation Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// =============================================
// Template HTML (exactement le même que avant)
// =============================================
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
              <h3 style="margin: 0 0 5px 0; color: #1A2B5F; font-size: 16px;">
                ${video.titre}
              </h3>
              <p style="margin: 0 0 10px 0; color: #5A6B8C; font-size: 14px;">
                ${video.description}
              </p>
              <a href="${video.urlVideo}" 
                 style="display: inline-block; padding: 8px 20px; background: linear-gradient(135deg, #0066FF, #00D9FF); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">
                ▶️ Regarder la vidéo (${video.duree}s)
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr><td height="15"></td></tr>
  `).join('');

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vos Démos SurgeryVR</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #F8FAFF;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F8FAFF; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background: white; border-radius: 20px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1); overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #0066FF, #00D9FF); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: white; font-size: 32px; font-weight: 700;">
                🎯 SurgeryVR
              </h1>
              <p style="margin: 10px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 16px;">
                Formation Médicale en Réalité Virtuelle
              </p>
            </td>
          </tr>

          <!-- Message personnalisé -->
          <tr>
            <td style="padding: 30px;">
              <h2 style="color: #1A2B5F; font-size: 24px; margin: 0 0 20px 0;">
                Bonjour ${demande.nomInstitution},
              </h2>
              <div style="color: #1A2B5F; font-size: 15px; line-height: 1.6;">
                ${messageEmail.replace(/\n/g, '<br>')}
              </div>
            </td>
          </tr>

          <!-- Vidéos de démo -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <div style="background: linear-gradient(135deg, rgba(0, 102, 255, 0.05), rgba(0, 217, 255, 0.05)); padding: 20px; border-radius: 15px; border-left: 4px solid #0066FF; margin-bottom: 20px;">
                <h3 style="margin: 0 0 10px 0; color: #0066FF; font-size: 18px;">
                  🎬 Vos 5 Vidéos de Démonstration
                </h3>
                <p style="margin: 0; color: #5A6B8C; font-size: 14px;">
                  Découvrez notre plateforme à travers ces courtes vidéos sélectionnées spécialement pour vous.
                </p>
              </div>

              <table width="100%" cellpadding="0" cellspacing="0">
                ${videosHTML}
              </table>
            </td>
          </tr>

          <!-- Call to Action -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background: linear-gradient(135deg, rgba(0, 196, 140, 0.1), rgba(0, 255, 163, 0.1)); padding: 25px; border-radius: 15px; text-align: center; border-left: 4px solid #00C48C;">
                    <h3 style="margin: 0 0 10px 0; color: #00C48C; font-size: 18px;">
                      ✨ Intéressé par nos solutions ?
                    </h3>
                    <p style="margin: 0 0 20px 0; color: #1A2B5F; font-size: 15px;">
                      Créez votre compte et accédez à l'ensemble de notre plateforme de formation médicale en VR.
                    </p>
                    <a href="${process.env.FRONTEND_URL || 'https://surgery-vr.vercel.app'}/signup" 
                       style="display: inline-block; padding: 15px 40px; background: linear-gradient(135deg, #00C48C, #00FFA3); color: white; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 15px rgba(0, 196, 140, 0.3);">
                      🚀 Créer mon compte gratuit
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Informations complémentaires + Footer -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="50%" style="padding-right: 10px;">
                    <div style="background: #F8FAFF; padding: 20px; border-radius: 12px;">
                      <div style="font-size: 24px; margin-bottom: 10px;">📞</div>
                      <h4 style="margin: 0 0 10px 0; color: #1A2B5F; font-size: 16px;">Besoin d'aide ?</h4>
                      <p style="margin: 0; color: #5A6B8C; font-size: 14px;">
                        Notre équipe est disponible pour répondre à toutes vos questions.
                      </p>
                    </div>
                  </td>
                  <td width="50%" style="padding-left: 10px;">
                    <div style="background: #F8FAFF; padding: 20px; border-radius: 12px;">
                      <div style="font-size: 24px; margin-bottom: 10px;">💼</div>
                      <h4 style="margin: 0 0 10px 0; color: #1A2B5F; font-size: 16px;">Forfaits Pro</h4>
                      <p style="margin: 0; color: #5A6B8C; font-size: 14px;">
                        Découvrez nos offres adaptées aux institutions médicales.
                      </p>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: #F8FAFF; padding: 30px; text-align: center; border-top: 2px solid #E8EFF9;">
              <p style="margin: 0 0 10px 0; color: #1A2B5F; font-size: 16px; font-weight: 600;">
                Cordialement,<br>
                L'équipe SurgeryVR
              </p>
              <p style="margin: 0 0 20px 0; color: #5A6B8C; font-size: 14px;">
                surgeryvr@resend.dev | www.SurgeryVR.com
              </p>
              <p style="margin: 20px 0 0 0; color: #5A6B8C; font-size: 12px;">
                © 2026 SurgeryVR. Tous droits réservés.<br>
                Vous recevez cet email car vous avez demandé une démonstration.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

// =============================================
// Envoyer l'email via Resend API
// =============================================
const envoyerEmailDemo = async ({ demande, messageEmail, videos }) => {
  try {
    const htmlContent = creerTemplateEmailDemo(demande, messageEmail, videos);

    const { data, error } = await resend.emails.send({
      from: 'SurgeryVR <noreply@surgery-vr.com>',   // Change en "SurgeryVR <onboarding@resend.dev>" si tu n'as pas encore vérifié ton domaine
      to: [demande.emailProfessionnel],
      subject: '✅ Vos vidéos de démonstration SurgeryVR',
      html: htmlContent,
      replyTo: process.env.REPLY_TO_EMAIL || 'contact@surgery-vr.com'
    });

    if (error) {
      console.error('❌ Erreur Resend API:', error);
      throw new Error(`Resend error: ${error.message}`);
    }

    console.log('✅ Email de démo envoyé via Resend :', {
      messageId: data.id,
      destinataire: demande.emailProfessionnel,
      institution: demande.nomInstitution,
      nbVideos: videos.length
    });

    return data;

  } catch (error) {
    console.error('❌ Erreur envoi email Resend:', error);
    throw new Error(`Erreur envoi email: ${error.message}`);
  }
};

// =============================================
// Tester la configuration Resend
// =============================================
const testerConfigurationEmail = async () => {
  try {
    // Test simple
    const { data, error } = await resend.emails.send({
      from: 'SurgeryVR <noreply@surgery-vr.com>',
      to: [process.env.TEST_EMAIL || process.env.BREVO_SMTP_USER], // ton propre email pour tester
      subject: 'Test Resend - SurgeryVR',
      html: '<h1>✅ Configuration Resend OK !</h1><p>L\'envoi d\'emails fonctionne sur Render.</p>'
    });

    if (error) throw error;

    console.log('✅ Test Resend réussi !');
    return true;
  } catch (error) {
    console.error('❌ Erreur test Resend:', error);
    return false;
  }
};

module.exports = {
  envoyerEmailDemo,
  testerConfigurationEmail
};