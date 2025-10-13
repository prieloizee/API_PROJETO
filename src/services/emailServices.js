const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "Gmail", // ou outro provedor
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

// Função principal para enviar e-mail
async function sendEmailWithCode(to, code, tipo) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject:
      tipo === "verificacao" ? "Código de Verificação" : "Redefinição de Senha",
    html: getEmailHTML(code, tipo),
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`E-mail (${tipo}) enviado para ${to}`);
  } catch (err) {
    console.error("Erro ao enviar e-mail:", err);
    throw err;
  }
}

module.exports = { sendEmailWithCode };
