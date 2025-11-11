const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "Gmail", 
  auth: {
    user: process.env.EMAIL_USER, // e-mail do projeto
    pass: process.env.EMAIL_PASS, // senha ou app password
  },
});

// Função para gerar HTML da mensagem
function getEmailHTML(code, tipo) {
  if (tipo === "verificacao") {
    return `
      <div style="font-family: Arial, sans-serif; text-align: center; color: #333;">
        <h2>Bem-vindo(a)!</h2>
        <p>Seu código de verificação é:</p>
        <h1 style="color: #2e86de;">${code}</h1>
        <p>Digite este código no app/site para confirmar seu e-mail.</p>
        <p style="font-size: 12px; color: #888;">O código expira em 6 minutos.</p>
      </div>
    `;
  } else if (tipo === "reset") {
    return `
      <div style="font-family: Arial, sans-serif; text-align: center; color: #333;">
        <h2>Redefinição de Senha</h2>
        <p>Seu código para redefinir a senha é:</p>
        <h1 style="color: #e74c3c;">${code}</h1>
        <p>Digite este código no app/site para criar uma nova senha.</p>
        <p style="font-size: 12px; color: #888;">O código expira em 6 minutos.</p>
      </div>
    `;
  }
}

// Função para enviar código de verificação
async function sendVerificationEmail(to, code) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: "Código de Verificação",
    html: getEmailHTML(code, "verificacao"),
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`E-mail (verificação) enviado para ${to}`);
  } catch (err) {
    console.error("Erro ao enviar e-mail:", err);
    throw err;
  }
}

// Função para enviar código de redefinição de senha
async function sendResetEmail(to, code) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: "Redefinição de Senha",
    html: getEmailHTML(code, "reset"),
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`E-mail (reset) enviado para ${to}`);
  } catch (err) {
    console.error("Erro ao enviar e-mail:", err);
    throw err;
  }
}

module.exports = {
  sendVerificationEmail,
  sendResetEmail,
};
