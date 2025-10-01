const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER, // seu email
    pass: process.env.EMAIL_APP_PASS, // senha de app
  },
});

async function sendVerificationEmail(email, code) {
  await transporter.sendMail({
    from: '"Glimp 👋" <no-reply@glimp.com>',
    to: email,
    subject: "Confirme seu email no Glimp",
    html: `
      <h2>Bem-vindo ao Glimp!</h2>
      <p>Use o código abaixo para confirmar seu email:</p>
      <h3>${code}</h3>
      <p>Se você não se cadastrou, ignore este email.</p>
    `,
  });
}

async function sendRecoveryEmail(email, code) {
  await transporter.sendMail({
    from: `"Glimp 👋" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Recuperação de senha",
    html: `<p>Seu código de recuperação de senha é: <b>${code}</b></p>
           <p>Ele expira em 15 minutos.</p>`,
  });
}

module.exports = { sendVerificationEmail, sendRecoveryEmail };
