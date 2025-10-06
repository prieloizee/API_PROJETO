const connect = require("../db/connect").promise();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const emailService = require("../services/emailServices");

const SALT_ROUNDS = 10;

class UsuarioController {
  // 1️⃣ Solicitar código para cadastro (não cria usuário ainda)
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
        [nome, email, senha, cpf, codigo, expiracao] // aqui o email vai na posição certa
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

  // 2️⃣ Confirmar código e criar usuário de fato
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
        await connect.execute("DELETE FROM temp_users WHERE email = ?", [
          email,
        ]);
        return res
          .status(400)
          .json({ error: "Código expirado. Solicite outro." });
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

  // 3️⃣ Login
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
        {
          expiresIn: "1h",
        }
      );

      delete user.senha;

      return res.status(200).json({
        message: "Login bem-sucedido!",
        user,
        token,
      });
    } catch (err) {
      console.error("Erro no login:", err);
      return res.status(500).json({ error: "Erro interno no servidor." });
    }
  }

  // 4️⃣ Solicitar redefinição de senha (esqueceu senha)
  static async solicitarRedefinicaoSenha(req, res) {
    try {
      const { email } = req.body;
      if (!email)
        return res.status(400).json({ error: "Email é obrigatório." });

      const [rows] = await connect.execute(
        "SELECT * FROM usuario WHERE email = ?",
        [email]
      );
      if (rows.length === 0)
        return res.status(404).json({ error: "Usuário não encontrado." });

      const codigo = Math.floor(100000 + Math.random() * 900000).toString();
      const expiracao = new Date(Date.now() + 15 * 60 * 1000);

      await connect.execute("DELETE FROM temp_reset_codes WHERE email = ?", [
        email,
      ]);
      await connect.execute(
        "INSERT INTO temp_reset_codes (email, code, expiracao) VALUES (?, ?, ?)",
        [email, codigo, expiracao]
      );

      await emailService.sendVerificationEmail(email, codigo);

      return res
        .status(200)
        .json({ message: "Código de redefinição enviado para o seu e-mail." });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Erro interno ao gerar código." });
    }
  }

  // 5️⃣ Resetar senha com código
  static async resetarSenha(req, res) {
    try {
      const { email, code, novaSenha } = req.body;
      if (!email || !code || !novaSenha)
        return res
          .status(400)
          .json({ error: "Todos os campos são obrigatórios." });

      const [rows] = await connect.execute(
        "SELECT * FROM temp_reset_codes WHERE email = ? AND code = ?",
        [email, code]
      );

      if (rows.length === 0)
        return res.status(400).json({ error: "Código inválido." });

      const registro = rows[0];
      if (new Date() > new Date(registro.expiracao)) {
        await connect.execute("DELETE FROM temp_reset_codes WHERE email = ?", [
          email,
        ]);
        return res
          .status(400)
          .json({ error: "Código expirado. Solicite outro." });
      }

      const hash = await bcrypt.hash(novaSenha, SALT_ROUNDS);
      await connect.execute("UPDATE usuario SET senha = ? WHERE email = ?", [
        hash,
        email,
      ]);

      await connect.execute("DELETE FROM temp_reset_codes WHERE email = ?", [
        email,
      ]);

      return res.status(200).json({ message: "Senha alterada com sucesso!" });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Erro interno ao resetar senha." });
    }
  }

  // 6️⃣ Buscar usuário por ID
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

  // 7️⃣ Atualizar usuário com imagem
  static async updateUserWithImage(req, res) {
    try {
      const id_usuario = req.userId;
      const { nome, senha, email } = req.body;
      const campos = [];
      const valores = [];

      const [rows] = await connect.execute(
        "SELECT nome, senha, email FROM usuario WHERE id_usuario = ?",
        [id_usuario]
      );
      if (rows.length === 0)
        return res.status(404).json({ error: "Usuário não encontrado." });

      const usuarioAtual = rows[0];

      if (nome && nome !== usuarioAtual.nome) {
        campos.push("nome = ?");
        valores.push(nome);
      }

      if (senha) {
        const mesmaSenha = await bcrypt.compare(senha, usuarioAtual.senha);
        if (!mesmaSenha) {
          const hash = await bcrypt.hash(senha, SALT_ROUNDS);
          campos.push("senha = ?");
          valores.push(hash);
        }
      }

      if (email && email !== usuarioAtual.email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!regex.test(email))
          return res.status(400).json({ error: "Email inválido." });
        campos.push("email = ?");
        valores.push(email);
      }

      if (req.file) {
        campos.push("imagem = ?", "tipo_imagem = ?");
        valores.push(req.file.buffer, req.file.mimetype);
      }

      if (campos.length === 0)
        return res.status(400).json({ error: "Nenhum campo foi alterado." });

      valores.push(id_usuario);
      const query = `UPDATE usuario SET ${campos.join(
        ", "
      )} WHERE id_usuario = ?`;
      await connect.execute(query, valores);

      return res
        .status(200)
        .json({ message: "Perfil atualizado com sucesso!" });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Erro interno no servidor." });
    }
  }

  // 8️⃣ Deletar usuário
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
      return res
        .status(500)
        .json({ error: "Erro interno ao deletar usuário." });
    }
  }
}

module.exports = UsuarioController;
