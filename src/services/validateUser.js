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
  
    if (!email.includes("@")) {
      return { error: "Email inválido. Deve conter @" };
    }
  
    // Retorna null se não houver erro
    return null; 
  };
  
  