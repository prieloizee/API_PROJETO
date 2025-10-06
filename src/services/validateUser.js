module.exports = function validateUser({
  nome,
  email,
  senha,
  cpf
 
  }) {
    if (!nome || !email || !senha || !cpf) {
      return { error: "Todos os campos devem ser preenchidos" };
    }
  
    if (isNaN(cpf) || cpf.length !== 11) {
      return {
        error: "CPF inválido. Deve conter exatamente 11 dígitos numéricos",
      };
    }
  
      if (email) {
    // Agora aceita qualquer domínio com ponto e algo após ele (ex: .com, .com.br, .org)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { error: "E-mail inválido. Deve conter '@' e um domínio válido (ex: .com, .org, .br)" };
    }
  }
  
    // Retorna null se não houver erro
    return null; 
  };
  
  