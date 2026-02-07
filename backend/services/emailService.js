const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const envoyerEmailApprobation = async (client) => {
  try {
    console.log('➡️ Tentative envoi email à:', client.email);

    const info = await transporter.sendMail({
      from:'"SurgeryVR" <' + process.env.EMAIL_USER + '>',
      to: client.email,
      subject: '✅ Compte approuvé',
      html: `
        <h2>Bonjour ${client.prenom} ${client.nom}</h2>
        <p>Après vérification, votre demande de création de compte a été <b>approuvé</b>.</p>
        <p>Vous pouvez maintenant vous connecter.</p>
        <p><b>L’équipe SurgeryVR</b></p>

      `
    });

    console.log('✅ Nodemailer info:', info);

  } catch (error) {
    console.error('❌ Erreur Nodemailer détaillée:', error);
    throw error;
  }
};

const envoyerEmailRejet = async (client) => {
  const mailOptions = {
    from: '"SurgeryVR" <' + process.env.EMAIL_USER + '>',
    to: client.email,
    subject: '❌ Compte refusé',
    html: `
      <h2>Bonjour ${client.prenom} ${client.nom},</h2>
      <p>Après vérification, votre demande de création de compte a été <b>refusée</b>.</p>
      <br>
      <p>Vous pouvez soumettre une nouvelle demande avec des documents valides.</p>
      <p><b>L’équipe SurgeryVR</b></p>
    `
  };

  await transporter.sendMail(mailOptions);
};

module.exports = {
  envoyerEmailApprobation,
  envoyerEmailRejet
};
