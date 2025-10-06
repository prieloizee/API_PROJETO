const connect = require("../db/connect").promise();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const emailService = require("../services/emailServices");

const SALT_ROUNDS = 10;

class UsuarioController {
  // Criar usuário
  static async createUsuario(req, res) {
    try {
      const { nome, email, senha, confirmarSenha, cpf } = req.body;

      if (!nome || !email || !senha || !confirmarSenha || !cpf) {
        return res.status(400).json({ error: "Todos os campos são obrigatórios" });
      }

      if (senha !== confirmarSenha) {
        return res.status(400).json({ error: "As senhas não são iguais" });
      }

      const hashedPassword = await bcrypt.hash(senha, SALT_ROUNDS);

      // Código de verificação de email
      const verificationCode = Math.floor(100000 + Math.random() * 900000);

      const query = `
        INSERT INTO usuario (nome, email, senha, cpf, verification_code, email_verified)
        VALUES (?, ?, ?, ?, ?, 0)
      `;
      const [result] = await connect.execute(query, [
        nome,
        email,
        hashedPassword,
        cpf,
        verificationCode
      ]);

      // Envia email de verificação
      await emailService.sendVerificationEmail(email, verificationCode);

      return res.status(201).json({
        message: "Usuário criado. Verifique seu email!",
        usuario: { id_usuario: result.insertId, nome, email }
      });
    } catch (err) {
      if (err.code === "ER_DUP_ENTRY") {
        return res.status(400).json({ error: "Email ou CPF já cadastrado" });
      }
      console.error(err);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  // Verificar código de email
  static async verifyEmailCode(req, res) {
    try {
      const { email, code } = req.body;
      const [rows] = await connect.execute(
        "SELECT * FROM usuario WHERE email = ? AND verification_code = ?",
        [email, code]
      );

      if (rows.length === 0) {
        return res.status(400).json({ error: "Código inválido" });
      }

      await connect.execute(
        "UPDATE usuario SET email_verified = 1, verification_code = NULL WHERE email = ?",
        [email]
      );

      return res.json({ message: "Email verificado com sucesso!" });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  // Login
  static async loginUsuario(req, res) {
    try {
      const { email, senha } = req.body;
      if (!email || !senha) {
        return res.status(400).json({ error: "Email e senha obrigatórios" });
      }

      const [rows] = await connect.execute("SELECT * FROM usuario WHERE email = ?", [email]);
      if (rows.length === 0) return res.status(401).json({ error: "Usuário não encontrado" });

      const user = rows[0];
      const senhaOK = await bcrypt.compare(senha, user.senha);
      if (!senhaOK) return res.status(401).json({ error: "Senha incorreta" });
      if (!user.email_verified) return res.status(401).json({ error: "Email não verificado" });

      const token = jwt.sign({ id_usuario: user.id_usuario }, process.env.SECRET, { expiresIn: "1h" });

      delete user.senha;
      delete user.imagem;
      delete user.tipo_imagem;

      return res.json({ message: "Login bem-sucedido", user, token });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  // Obter usuário por ID
  static async getUsuarioById(req, res) {
    try {
      const [rows] = await connect.execute(
        "SELECT id_usuario, nome, email, cpf, email_verified FROM usuario WHERE id_usuario = ?",
        [req.params.id]
      );
      if (rows.length === 0) return res.status(404).json({ error: "Usuário não encontrado" });
      return res.json({ user: rows[0] });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  // Obter todos os usuários
  static async getAllUsers(req, res) {
    try {
      const [rows] = await connect.execute(
        "SELECT id_usuario, nome, email, cpf, email_verified FROM usuario"
      );
      return res.json({ users: rows });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  // Atualizar usuário com imagem
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
      if (rows.length === 0) return res.status(404).json({ error: "Usuário não encontrado" });

      const usuarioAtual = rows[0];

      if (nome && nome !== usuarioAtual.nome) {
        campos.push("nome = ?");
        valores.push(nome);
      }

      if (senha) {
        const senhaIgual = await bcrypt.compare(senha, usuarioAtual.senha);
        if (!senhaIgual) {
          const hashedPassword = await bcrypt.hash(senha, SALT_ROUNDS);
          campos.push("senha = ?");
          valores.push(hashedPassword);
        }
      }

      if (email && email !== usuarioAtual.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) return res.status(400).json({ error: "E-mail inválido" });
        campos.push("email = ?");
        valores.push(email);
      }

      if (req.file) {
        campos.push("imagem = ?", "tipo_imagem = ?");
        valores.push(req.file.buffer, req.file.mimetype);
      }

      if (campos.length === 0) return res.status(400).json({ error: "Nenhum campo para alterar" });

      valores.push(id_usuario);
      const query = `UPDATE usuario SET ${campos.join(", ")} WHERE id_usuario = ?`;
      await connect.execute(query, valores);

      return res.json({ message: "Perfil atualizado com sucesso" });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  // Deletar usuário
  static async deleteUser(req, res) {
    try {
      const { id } = req.params;
      const [result] = await connect.execute("DELETE FROM usuario WHERE id_usuario = ?", [id]);
      if (result.affectedRows === 0) return res.status(404).json({ error: "Usuário não encontrado" });
      return res.json({ message: `Usuário excluído com ID: ${id}` });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }
}

module.exports = UsuarioController;
