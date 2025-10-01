const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const connect = require("../db/connect").promise();
const SALT_ROUNDS = 10;
const emailServices = require("../services/emailServices");

//await emailServices.sendVerificationEmail(usuario.email, usuario.verificationCode);

class UsuarioController {
  // Criar usuário
  static async createUsuario(req, res) {
    try {
      const { nome, email, senha, confirmarSenha, cpf } = req.body;

      if (!nome || !email || !senha || !confirmarSenha || !cpf) {
        return res.status(400).json({ error: "Todos os campos são obrigatórios" });
      }

      if (senha !== confirmarSenha) {
        return res.status(400).json({ error: "As senhas não conferem" });
      }

      const hashedPassword = await bcrypt.hash(senha, SALT_ROUNDS);

      const query = `INSERT INTO usuario (nome, email, senha, cpf) VALUES (?, ?, ?, ?)`;
      const [result] = await connect.execute(query, [nome, email, hashedPassword, cpf]);

      return res.status(201).json({ message: "Usuário criado com sucesso", id_usuario: result.insertId });
    } catch (err) {
      if (err.code === "ER_DUP_ENTRY") {
        return res.status(400).json({ error: "Email ou CPF já cadastrado" });
      }
      console.error(err);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  // Login
  static async loginUsuario(req, res) {
    try {
      const { email, senha } = req.body;
      if (!email || !senha) return res.status(400).json({ error: "Email e senha obrigatórios" });

      const [rows] = await connect.execute("SELECT * FROM usuario WHERE email = ?", [email]);
      if (rows.length === 0) return res.status(401).json({ error: "Usuário não encontrado" });

      const user = rows[0];
      const senhaOK = await bcrypt.compare(senha, user.senha);
      if (!senhaOK) return res.status(401).json({ error: "Senha incorreta" });

      const token = jwt.sign({ id_usuario: user.id_usuario }, process.env.SECRET, { expiresIn: "1h" });

      delete user.senha;
      delete user.imagem;
      delete user.tipo_imagem;

      return res.status(200).json({ message: "Login bem-sucedido", user, token });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  // Recuperação de senha
  static async sendRecoveryCode(req, res) {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ error: "Email obrigatório" });

      const [rows] = await connect.execute("SELECT * FROM usuario WHERE email = ?", [email]);
      if (rows.length === 0) return res.status(404).json({ error: "Usuário não encontrado" });

      const code = Math.floor(100000 + Math.random() * 900000);

      // Salva código temporário no banco
      const expiracao = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos
      await connect.execute(
        "INSERT INTO temp_email_codes (email, code, tipo, expiracao) VALUES (?, ?, 'recuperacao', ?)",
        [email, code, expiracao]
      );

      // Envia email com código
      await emailServices.sendRecoveryEmail(email, code);

      return res.status(200).json({ message: "Código de recuperação enviado por email" });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  static async verifyRecoveryCode(req, res) {
    try {
      const { email, code } = req.body;
      const [rows] = await connect.execute(
        "SELECT * FROM temp_email_codes WHERE email = ? AND code = ? AND tipo = 'recuperacao' AND expiracao > NOW()",
        [email, code]
      );

      if (rows.length === 0) return res.status(400).json({ error: "Código inválido ou expirado" });

      return res.status(200).json({ message: "Código válido, você pode redefinir a senha" });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  static async resetPassword(req, res) {
    try {
      const { email, code, novaSenha, confirmarSenha } = req.body;
      if (!novaSenha || !confirmarSenha) return res.status(400).json({ error: "Preencha todas as senhas" });
      if (novaSenha !== confirmarSenha) return res.status(400).json({ error: "As senhas não conferem" });

      const [rows] = await connect.execute(
        "SELECT * FROM temp_email_codes WHERE email = ? AND code = ? AND tipo = 'recuperacao' AND expiracao > NOW()",
        [email, code]
      );
      if (rows.length === 0) return res.status(400).json({ error: "Código inválido ou expirado" });

      const hashedPassword = await bcrypt.hash(novaSenha, SALT_ROUNDS);
      await connect.execute("UPDATE usuario SET senha = ? WHERE email = ?", [hashedPassword, email]);
      await connect.execute("DELETE FROM temp_email_codes WHERE email = ? AND tipo = 'recuperacao'", [email]);

      return res.status(200).json({ message: "Senha redefinida com sucesso" });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  // Obter usuário por ID
  static async getUsuarioById(req, res) {
    try {
      const [rows] = await connect.execute(
        "SELECT id_usuario, nome, email, cpf FROM usuario WHERE id_usuario = ?",
        [req.params.id]
      );
      if (rows.length === 0) return res.status(404).json({ error: "Usuário não encontrado" });

      return res.status(200).json(rows[0]);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  // Obter todos os usuários
  static async getAllUsers(req, res) {
    try {
      const [rows] = await connect.execute("SELECT id_usuario, nome, email, cpf FROM usuario");
      return res.status(200).json(rows);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  // Atualizar usuário com imagem
  static async updateUserWithImage(req, res) {
    try {
      const campos = [];
      const valores = [];

      if (req.body.nome) {
        campos.push("nome = ?");
        valores.push(req.body.nome);
      }

      if (req.body.senha) {
        const hashed = await bcrypt.hash(req.body.senha, SALT_ROUNDS);
        campos.push("senha = ?");
        valores.push(hashed);
      }

      if (req.file) {
        campos.push("imagem = ?", "tipo_imagem = ?");
        valores.push(req.file.buffer, req.file.mimetype);
      }

      if (campos.length === 0) return res.status(400).json({ error: "Nenhum campo para atualizar" });

      valores.push(req.userId);
      const query = `UPDATE usuario SET ${campos.join(", ")} WHERE id_usuario = ?`;
      await connect.execute(query, valores);

      return res.status(200).json({ message: "Usuário atualizado com sucesso" });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  // Deletar usuário
  static async deleteUser(req, res) {
    try {
      const [result] = await connect.execute("DELETE FROM usuario WHERE id_usuario = ?", [req.params.id]);
      if (result.affectedRows === 0) return res.status(404).json({ error: "Usuário não encontrado" });

      return res.status(200).json({ message: "Usuário deletado com sucesso" });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }
}

module.exports = UsuarioController;
