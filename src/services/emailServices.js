const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "Gmail", // ou outro provedor
  auth: {
    user: process.env.EMAIL_USER, // email do projeto
    pass: process.env.EMAIL_PASS, // senha ou app password
  },
});

async function sendVerificationEmail(to, code) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: "Código de verificação",
    text: `Seu código de verificação é: ${code}`,
  };

  await transporter.sendMail(mailOptions);
}

module.exports = { sendVerificationEmail };
