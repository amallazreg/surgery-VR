const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // ex: surgeryvr@gmail.com
    pass: process.env.EMAIL_PASS  // mot de passe d’application
  }
});

exports.envoyerEmailApprobation = async (utilisateur) => {
  const mailOptions = {
    from: '"SurgeryVR" <' + process.env.EMAIL_USER + '>',
    to: utilisateur.email,
    subject: '✅ Votre compte SurgeryVR a été approuvé',
    html: `
      <h2>Bonjour ${utilisateur.prenom} ${utilisateur.nom},</h2>
      <p>Nous avons le plaisir de vous informer que votre compte SurgeryVR a été <b>approuvé</b>.</p>
      <p>Vous pouvez maintenant vous connecter et accéder à la plateforme.</p>
      <p><b>Statut :</b> Compte activé</p>
      <br>
      <p>Merci de votre confiance,</p>
      <p><b>L’équipe SurgeryVR</b></p>
    `
  };

  await transporter.sendMail(mailOptions);
};

exports.envoyerEmailRejet = async (utilisateur) => {
  const mailOptions = {
    from: '"SurgeryVR" <' + process.env.EMAIL_USER + '>',
    to: utilisateur.email,
    subject: '❌ Votre compte SurgeryVR a été refusé',
    html: `
      <h2>Bonjour ${utilisateur.prenom} ${utilisateur.nom},</h2>
      <p>Après vérification, votre demande de création de compte a été <b>refusée</b>.</p>
      <p><b>Motif :</b> ${utilisateur.motifRefus || 'Non spécifié'}</p>
      <br>
      <p>Vous pouvez soumettre une nouvelle demande avec des documents valides.</p>
      <p><b>L’équipe SurgeryVR</b></p>
    `
  };

  await transporter.sendMail(mailOptions);
};
