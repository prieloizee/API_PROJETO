const connect = require("../db/connect").promise();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const emailService = require("../services/emailServices");

const SALT_ROUNDS = 10;

class UsuarioController {
  // Solicitar código para cadastro (não cria usuário ainda)
  static async solicitarCodigo(req, res) {
    try {
      const { nome, email, senha, confirmarSenha, cpf } = req.body;

      if (!nome || !email || !senha || !confirmarSenha || !cpf) {
        return res
          .status(400)
          .json({ error: "Todos os campos são obrigatórios." });
      }

      if (senha !== confirmarSenha) {
        return res.status(400).json({ error: "As senhas não conferem." });
      }

      // Verifica se email ou CPF já estão cadastrados
      const [existente] = await connect.execute(
        "SELECT * FROM usuario WHERE email = ? OR cpf = ?",
        [email, cpf]
      );
      if (existente.length > 0) {
        return res.status(400).json({ error: "Email ou CPF já cadastrado." });
      }

      // Remove códigos antigos
      await connect.execute("DELETE FROM temp_users WHERE email = ?", [email]);

      // Gera código e salva dados temporários
      const codigo = Math.floor(100000 + Math.random() * 900000).toString();
      const expiracao = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos
      await connect.execute(
        "INSERT INTO temp_users (nome, email, senha, cpf, code, expiracao) VALUES (?, ?, ?, ?, ?, ?)",
        [nome, email, senha, cpf, codigo, expiracao]
      );

      // Envia e-mail com o código
      await emailService.sendVerificationEmail(email, codigo);

      return res
        .status(200)
        .json({ message: "Código de verificação enviado para o seu e-mail." });
    } catch (err) {
      console.error("Erro ao solicitar código:", err);
      return res
        .status(500)
        .json({ error: "Erro interno ao enviar o código." });
    }
  }

  // Confirmar código e criar usuário de fato
  static async confirmarCodigo(req, res) {
    try {
      const { email, code } = req.body;

      if (!email || !code) {
        return res
          .status(400)
          .json({ error: "Todos os campos são obrigatórios." });
      }

      const [rows] = await connect.execute(
        "SELECT * FROM temp_users WHERE email = ? AND code = ?",
        [email, code]
      );

      if (rows.length === 0) {
        return res.status(400).json({ error: "Código inválido." });
      }

      const tempUser = rows[0];
      if (new Date() > new Date(tempUser.expiracao)) {
        await connect.execute("DELETE FROM temp_users WHERE email = ?", [email]);
        return res.status(400).json({ error: "Código expirado. Solicite outro." });
      }

      // Cria usuário de fato
      const senhaHash = await bcrypt.hash(tempUser.senha, SALT_ROUNDS);
      await connect.execute(
        "INSERT INTO usuario (nome, email, senha, cpf, email_verified) VALUES (?, ?, ?, ?, 1)",
        [tempUser.nome, tempUser.email, senhaHash, tempUser.cpf]
      );

      // Remove dados temporários
      await connect.execute("DELETE FROM temp_users WHERE email = ?", [email]);

      return res
        .status(201)
        .json({ message: "Usuário criado e e-mail confirmado com sucesso!" });
    } catch (err) {
      console.error("Erro ao confirmar código:", err);
      return res
        .status(500)
        .json({ error: "Erro interno ao confirmar código." });
    }
  }

// Login
static async loginUsuario(req, res) {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res
        .status(400)
        .json({ error: "Email e senha são obrigatórios." });
    }

    const [rows] = await connect.execute(
      "SELECT * FROM usuario WHERE email = ?",
      [email]
    );
    if (rows.length === 0) {
      return res.status(401).json({ error: "Usuário não encontrado." });
    }

    const user = rows[0];
    const senhaCorreta = await bcrypt.compare(senha, user.senha);
    if (!senhaCorreta) {
      return res.status(401).json({ error: "Senha incorreta." });
    }

    const token = jwt.sign(
      { id_usuario: user.id_usuario },
      process.env.SECRET,
      { expiresIn: "1h" }
    );


    const userData = {
      id_usuario: user.id_usuario,
      nome: user.nome,
      email: user.email,
    };

    return res.status(200).json({
      message: "Login bem-sucedido!",
      user: userData,
      token,
    });
  } catch (err) {
    console.error("Erro no login:", err);
    return res.status(500).json({ error: "Erro interno no servidor." });
  }
}


  // Atualizar usuário com imagem
  static async updateUserWithImage(req, res) {
    const { nome, email, senha_atual, nova_senha } = req.body;

    if (!req.userId) {
      return res.status(401).json({ error: "Usuário não autenticado ou token inválido" });
    }

    const id_usuario = req.userId;
    const campos = [];
    const valores = [];

    try {
      const [rows] = await connect.execute(
        "SELECT nome, senha, email FROM usuario WHERE id_usuario = ?",
        [id_usuario]
      );

      if (rows.length === 0) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      const usuarioAtual = rows[0];

      // Atualiza nome
      if (nome && nome !== usuarioAtual.nome) {
        campos.push("nome = ?");
        valores.push(nome);
      }

      // Atualiza senha
      if (senha_atual?.trim() && nova_senha?.trim()) {
        const senhaValida = await bcrypt.compare(senha_atual, usuarioAtual.senha);
        if (!senhaValida) {
          return res.status(400).json({ error: "Senha atual incorreta" });
        }

        const novaIgualAtual = await bcrypt.compare(nova_senha, usuarioAtual.senha);
        if (novaIgualAtual) {
          return res.status(400).json({ error: "A nova senha não pode ser igual à senha atual" });
        }

        const hashedPassword = await bcrypt.hash(nova_senha, SALT_ROUNDS);
        campos.push("senha = ?");
        valores.push(hashedPassword);
      } else if ((senha_atual && !nova_senha) || (!senha_atual && nova_senha)) {
        return res.status(400).json({ error: "Para alterar a senha, envie a senha atual e a nova senha" });
      }

      // Atualiza email
      if (email && email !== usuarioAtual.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return res.status(400).json({ error: "E-mail inválido" });
        }
        campos.push("email = ?");
        valores.push(email);
      }

      // Atualiza imagem
      if (req.file) {
        campos.push("imagem = ?");
        valores.push(req.file.buffer);
        campos.push("tipo_imagem = ?");
        valores.push(req.file.mimetype);
      }

      if (campos.length === 0) {
        return res.status(400).json({ error: "Nenhum campo foi alterado" });
      }

      valores.push(id_usuario);
      const query = `UPDATE usuario SET ${campos.join(", ")} WHERE id_usuario = ?`;
      await connect.execute(query, valores);

      return res.status(200).json({ message: "Usuário atualizado com sucesso" });
    } catch (error) {
      return res.status(500).json({ error });
    }
  }

  // Solicitar redefinição de senha (esqueceu senha)
  static async solicitarRedefinicaoSenha(req, res) {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ error: "Email é obrigatório." });

      const [rows] = await connect.execute(
        "SELECT * FROM usuario WHERE email = ?",
        [email]
      );
      if (rows.length === 0) return res.status(404).json({ error: "Usuário não encontrado." });

      const codigo = Math.floor(100000 + Math.random() * 900000).toString();
      const expiracao = new Date(Date.now() + 15 * 60 * 1000);

      await connect.execute("DELETE FROM temp_reset_codes WHERE email = ?", [email]);
      await connect.execute(
        "INSERT INTO temp_reset_codes (email, code, expiracao) VALUES (?, ?, ?)",
        [email, codigo, expiracao]
      );

      await emailService.sendVerificationEmail(email, codigo);

      return res.status(200).json({ message: "Código de redefinição enviado para o seu e-mail." });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Erro interno ao gerar código." });
    }
  }

  // Resetar senha com código

  static async resetarSenha(req, res) {
    try {
      const { email, code, novaSenha } = req.body;
      if (!email || !code || !novaSenha)
        return res.status(400).json({ error: "Todos os campos são obrigatórios." });

      const [rows] = await connect.execute(
        "SELECT * FROM temp_reset_codes WHERE email = ? AND code = ?",
        [email, code]
      );

      if (rows.length === 0) return res.status(400).json({ error: "Código inválido." });


    // 🔹 1. Verifica se o código de redefinição é válido
    const [rows] = await connect.execute(
      "SELECT * FROM temp_reset_codes WHERE email = ? AND code = ?",
      [email, code]
    );

    if (rows.length === 0) {
      return res.status(400).json({ error: "Código inválido." });
    }

    const registro = rows[0];
    if (new Date() > new Date(registro.expiracao)) {
      await connect.execute("DELETE FROM temp_reset_codes WHERE email = ?", [email]);
      return res.status(400).json({ error: "Código expirado. Solicite outro." });
    }

    // 🔹 2. Busca a senha atual do usuário
    const [usuarioRows] = await connect.execute(
      "SELECT senha FROM usuario WHERE email = ?",
      [email]
    );

    if (usuarioRows.length === 0) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }

    const senhaAtualHash = usuarioRows[0].senha;

    // 🔹 3. Verifica se a nova senha é igual à atual
    const ehMesmaSenha = await bcrypt.compare(novaSenha, senhaAtualHash);
    if (ehMesmaSenha) {
      return res.status(400).json({ error: "A nova senha não pode ser igual à senha atual." });
    }

    // 🔹 4. Atualiza a senha com o novo hash
    const novaSenhaHash = await bcrypt.hash(novaSenha, SALT_ROUNDS);
    await connect.execute("UPDATE usuario SET senha = ? WHERE email = ?", [novaSenhaHash, email]);

    // 🔹 5. Remove o código de redefinição
    await connect.execute("DELETE FROM temp_reset_codes WHERE email = ?", [email]);

    return res.status(200).json({ message: "Senha alterada com sucesso!" });
  } catch (err) {
    console.error("Erro ao redefinir senha:", err);
    return res.status(500).json({ error: "Erro interno ao redefinir senha." });
  }
}



  // Buscar usuário por ID
  static async getUsuarioById(req, res) {
    try {
      const { id } = req.params;
      const [rows] = await connect.execute(
        "SELECT id_usuario, nome, email, cpf, email_verified FROM usuario WHERE id_usuario = ?",
        [id]
      );

      if (rows.length === 0) {
        return res.status(404).json({ error: "Usuário não encontrado." });
      }

      return res.json({ user: rows[0] });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Erro interno no servidor." });
    }
  }

  // Deletar usuário
  static async deleteUser(req, res) {
    try {
      const { id } = req.params;
      const [result] = await connect.execute(
        "DELETE FROM usuario WHERE id_usuario = ?",
        [id]
      );

      if (result.affectedRows === 0)
        return res.status(404).json({ error: "Usuário não encontrado." });

      return res.status(200).json({ message: "Usuário excluído com sucesso!" });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Erro interno ao deletar usuário." });
    }
  }
  
    static async getAllUsers(req, res) {
    try {
      const query = `SELECT * FROM usuario`;
      const [results] = await connect.execute(query);

      const users = results.map((user) => {
        delete user.senha;
        delete user.imagem;
        delete user.tipo_imagem;
        return user;
      });

      return res
        .status(200)
        .json({ message: "Obtendo todos os usuários", users });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }
  static async getImagemPerfil(req, res) {
  try {
    const id_usuario = req.params.id;
    const query = "SELECT imagem, tipo_imagem FROM usuario WHERE id_usuario = ?";
    const [results] = await connect.execute(query, [id_usuario]);

    if (!results.length || !results[0].imagem)
      return res.status(404).send("Imagem não encontrada");

    res.set("Content-Type", results[0].tipo_imagem || "image/jpeg");
    res.send(results[0].imagem);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erro interno no servidor" });
  }
}


}

module.exports = UsuarioController;
