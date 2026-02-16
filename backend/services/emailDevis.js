const nodemailer = require('nodemailer');
const { genererRecapitulatifDevis } = require('./devisCalcul');

// Configuration du transporteur email
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// ===============================
// Template HTML pour l'email de devis
// ===============================
const creerTemplateEmailDevis = (demande, devis) => {
  const { prenom, nom, nomEtablissement, besoins } = demande;

  // ✅ Conversion sécurisée de l'_id
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

          <!-- Devis détaillé -->
          <tr>
            <td style="padding: 20px 30px;">
              <h3 style="margin: 0 0 20px 0; color: #1A2B5F; font-size: 22px; font-weight: 700; border-bottom: 2px solid #E8EFF9; padding-bottom: 10px;">
                📊 Détail du Devis
              </h3>

              <!-- Ligne de coût -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 15px;">
                <tr>
                  <td style="padding: 15px; background: #F8FAFF; border-radius: 10px;">
                    <table width="100%">
                      <tr>
                        <td style="color: #1A2B5F; font-weight: 600;">
                          Licences utilisateurs
                          <div style="font-size: 13px; color: #5A6B8C; font-weight: 400; margin-top: 3px;">
                            ${devis.parametresCalcul.nombreUtilisateurs} utilisateurs × 12 mois
                          </div>
                        </td>
                        <td align="right" style="color: #1A2B5F; font-weight: 700; font-size: 18px;">
                          ${devis.coutLicences.toLocaleString('fr-FR')} €
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 15px;">
                <tr>
                  <td style="padding: 15px; background: #F8FAFF; border-radius: 10px;">
                    <table width="100%">
                      <tr>
                        <td style="color: #1A2B5F; font-weight: 600;">
                          Casques VR
                          <div style="font-size: 13px; color: #5A6B8C; font-weight: 400; margin-top: 3px;">
                            ${devis.parametresCalcul.nombreCasquesVR} unités
                          </div>
                        </td>
                        <td align="right" style="color: #1A2B5F; font-weight: 700; font-size: 18px;">
                          ${devis.coutCasquesVR.toLocaleString('fr-FR')} €
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 15px;">
                <tr>
                  <td style="padding: 15px; background: #F8FAFF; border-radius: 10px;">
                    <table width="100%">
                      <tr>
                        <td style="color: #1A2B5F; font-weight: 600;">
                          Déploiement
                          <div style="font-size: 13px; color: #5A6B8C; font-weight: 400; margin-top: 3px;">
                            ${devis.parametresCalcul.typeDeploiement}
                          </div>
                        </td>
                        <td align="right" style="color: #1A2B5F; font-weight: 700; font-size: 18px;">
                          ${devis.coutDeploiement.toLocaleString('fr-FR')} €
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 15px;">
                <tr>
                  <td style="padding: 15px; background: #F8FAFF; border-radius: 10px;">
                    <table width="100%">
                      <tr>
                        <td style="color: #1A2B5F; font-weight: 600;">
                          Formation utilisateurs
                        </td>
                        <td align="right" style="color: #1A2B5F; font-weight: 700; font-size: 18px;">
                          ${devis.coutFormation.toLocaleString('fr-FR')} €
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 15px;">
                <tr>
                  <td style="padding: 15px; background: #F8FAFF; border-radius: 10px;">
                    <table width="100%">
                      <tr>
                        <td style="color: #1A2B5F; font-weight: 600;">
                          Support annuel (Standard)
                        </td>
                        <td align="right" style="color: #1A2B5F; font-weight: 700; font-size: 18px;">
                          ${devis.coutSupport.toLocaleString('fr-FR')} €
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Sous-total -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 20px 0; border-top: 2px solid #E8EFF9; padding-top: 15px;">
                <tr>
                  <td style="color: #5A6B8C; font-size: 16px; padding: 10px 0;">
                    <strong>Sous-total</strong>
                  </td>
                  <td align="right" style="color: #1A2B5F; font-weight: 700; font-size: 20px;">
                    ${devis.sousTotal.toLocaleString('fr-FR')} €
                  </td>
                </tr>
              </table>

              ${devis.remisePourcentage > 0 ? `
              <!-- Remise -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 15px;">
                <tr>
                  <td style="padding: 15px; background: linear-gradient(135deg, rgba(0, 196, 140, 0.1), rgba(0, 255, 163, 0.1)); border-radius: 10px; border-left: 4px solid #00C48C;">
                    <table width="100%">
                      <tr>
                        <td style="color: #00C48C; font-weight: 700; font-size: 16px;">
                          🎉 REMISE VOLUME (${devis.remisePourcentage}%)
                        </td>
                        <td align="right" style="color: #00C48C; font-weight: 700; font-size: 18px;">
                          - ${devis.montantRemise.toLocaleString('fr-FR')} €
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              ` : ''}

              <!-- Total HT -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 20px 0; border-top: 2px solid #E8EFF9; padding-top: 15px;">
                <tr>
                  <td style="color: #1A2B5F; font-size: 18px; font-weight: 700; padding: 10px 0;">
                    TOTAL HT
                  </td>
                  <td align="right" style="color: #1A2B5F; font-weight: 700; font-size: 24px;">
                    ${devis.totalHT.toLocaleString('fr-FR')} €
                  </td>
                </tr>
                <tr>
                  <td style="color: #5A6B8C; font-size: 14px; padding: 5px 0;">
                    TVA (${devis.tauxTVA}%)
                  </td>
                  <td align="right" style="color: #5A6B8C; font-size: 16px;">
                    ${devis.montantTVA.toLocaleString('fr-FR')} €
                  </td>
                </tr>
              </table>

              <!-- Total TTC -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #0066FF, #00D9FF); border-radius: 12px; padding: 20px; margin-top: 20px;">
                <tr>
                  <td style="color: white; font-size: 22px; font-weight: 700;">
                    TOTAL TTC
                  </td>
                  <td align="right" style="color: white; font-weight: 700; font-size: 32px;">
                    ${devis.totalTTC.toLocaleString('fr-FR')} €
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Call to Action -->
          <tr>
            <td style="padding: 30px; text-align: center;">
              <!-- Info PDF -->
              <div style="background: linear-gradient(135deg, rgba(0, 102, 255, 0.1), rgba(0, 217, 255, 0.1)); padding: 20px; border-radius: 12px; margin-bottom: 25px; border-left: 4px solid #0066FF;">
                <h3 style="margin: 0 0 10px 0; color: #0066FF; font-size: 18px; font-weight: 700;">
                  📎 Devis PDF en Pièce Jointe
                </h3>
                <p style="margin: 0; color: #1A2B5F; font-size: 14px;">
                  Vous trouverez votre devis détaillé au format PDF en pièce jointe de cet email.<br>
                  <strong>Le PDF contient :</strong> Détail du calcul, explication des tarifs, conditions générales.
                </p>
              </div>

              <p style="margin: 0 0 20px 0; color: #5A6B8C; font-size: 15px;">
                Ce devis est valable pendant <strong>30 jours</strong> à compter de sa date d'émission.
              </p>
              <a href="${process.env.FRONTEND_URL || 'https://surveyvr.com'}/contact" 
                 style="display: inline-block; padding: 15px 40px; background: linear-gradient(135deg, #00C48C, #00FFA3); color: white; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 15px rgba(0, 196, 140, 0.3);">
                ✅ Accepter ce devis
              </a>
            </td>
          </tr>

          <!-- Informations complémentaires -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <div style="background: #F8FAFF; padding: 20px; border-radius: 12px;">
                <h4 style="margin: 0 0 15px 0; color: #1A2B5F; font-size: 16px;">
                  📋 Conditions
                </h4>
                <ul style="margin: 0; padding-left: 20px; color: #5A6B8C; font-size: 14px; line-height: 1.8;">
                  <li>Tarifs exprimés en Euros HT</li>
                  <li>Engagement initial de 12 mois</li>
                  <li>Formation et onboarding inclus</li>
                  <li>Support technique Standard inclus</li>
                  <li>Mises à jour régulières de la plateforme</li>
                </ul>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: #F8FAFF; padding: 30px; text-align: center; border-top: 2px solid #E8EFF9;">
              <p style="margin: 0 0 10px 0; color: #1A2B5F; font-size: 16px; font-weight: 600;">
                Des questions ? Besoin d'ajustements ?
              </p>
              <p style="margin: 0 0 20px 0; color: #5A6B8C; font-size: 14px;">
                Notre équipe commerciale est à votre disposition
              </p>
              <p style="margin: 0; color: #5A6B8C; font-size: 14px;">
                📧 ${process.env.EMAIL_FROM || 'contact@surveyvr.com'} | 📞 +33 1 XX XX XX XX
              </p>
              <p style="margin: 20px 0 0 0; color: #5A6B8C; font-size: 12px;">
                © 2024 SurveryVR. Tous droits réservés.
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

// ===============================
// Fonction d'envoi d'email de devis
// ===============================
const envoyerEmailDevis = async ({ demande, devis, pdfPath }) => {
  try {
    const htmlContent = creerTemplateEmailDevis(demande, devis);
    const recapitulatif = genererRecapitulatifDevis(devis);

    const mailOptions = {
      from: `"SurveryVR - Devis" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: demande.emailProfessionnel,
      subject: `Votre devis personnalisé SurveryVR - ${demande.nomEtablissement}`,
      html: htmlContent,
      text: recapitulatif,
      replyTo: process.env.EMAIL_REPLY_TO || process.env.EMAIL_FROM,
      attachments: pdfPath ? [{
        filename: `Devis_SurveryVR_${demande.nomEtablissement.replace(/\s+/g, '_')}.pdf`,
        path: pdfPath,
        contentType: 'application/pdf'
      }] : []
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Email de devis envoyé:', {
      messageId: info.messageId,
      destinataire: demande.emailProfessionnel,
      etablissement: demande.nomEtablissement,
      montantTTC: devis.totalTTC,
      pdfAttache: !!pdfPath
    });

    return info;

  } catch (error) {
    console.error('❌ Erreur envoi email devis:', error);
    throw new Error(`Erreur envoi email: ${error.message}`);
  }
};

// ===============================
// Fonction de test
// ===============================
const testerConfigurationEmail = async () => {
  try {
    await transporter.verify();
    console.log('✅ Configuration email valide');
    return true;
  } catch (error) {
    console.error('❌ Configuration email invalide:', error);
    return false;
  }
};

module.exports = {
  envoyerEmailDevis,
  testerConfigurationEmail
};