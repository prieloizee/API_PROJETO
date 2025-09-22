const connect = require("../db/connect").promise();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const validateUser = require("../services/validateUser");
const validateCpf = require("../services/validateCpf");

const SALT_ROUNDS = 10;

class UsuarioController {
  // Criar usuário
  static async createUsuario(req, res) {
    try {
      const { nome, email, senha, cpf } = req.body;

      // Validação básica
      const validationError = validateUser({ nome, email, senha, cpf });
      if (validationError)
        return res.status(400).json({ success: false, ...validationError });

      // Validação CPF
      const cpfError = await validateCpf(cpf);
      if (cpfError)
        return res.status(400).json({ success: false, ...cpfError });

      // Hash da senha
      const hashedPassword = await bcrypt.hash(senha, SALT_ROUNDS);

      // Inserção no banco
      const query = `INSERT INTO usuario (nome, email, senha, cpf) VALUES (?, ?, ?, ?)`;
      await connect.execute(query, [nome, email, hashedPassword, cpf]);

      return res
        .status(201)
        .json({ success: true, message: "Usuário criado com sucesso" });
    } catch (err) {
      if (err.code === "ER_DUP_ENTRY") {
        return res
          .status(400)
          .json({ success: false, error: "Email ou CPF já cadastrado" });
      }
      console.error(err);
      return res
        .status(500)
        .json({ success: false, error: "Erro interno do servidor" });
    }
  }

  // Obter todos os usuários
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

  // Buscar usuário por ID
  static async getUsuarioById(req, res) {
    const userId = req.params.id;
    try {
      const query = `SELECT * FROM usuario WHERE id_usuario = ?`;
      const [results] = await connect.execute(query, [userId]);

      if (results.length === 0)
        return res.status(404).json({ error: "Usuário não encontrado" });

      const user = results[0];
      delete user.senha;
      delete user.imagem;
      delete user.tipo_imagem;

      return res.status(200).json({ message: "Usuário encontrado", user });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  static async updateUserWithImage(req, res) {
    const { nome, senha } = req.body;
    const id_usuario = req.user.id_usuario; // pega do JWT
    const campos = [];
    const valores = [];
    
  
    try {
      // Atualiza nome se enviado
      if (nome) {
        campos.push("nome = ?");
        valores.push(nome);
      }
  
      // Atualiza senha se enviada
      if (senha) {
        const hashedPassword = await bcrypt.hash(senha, SALT_ROUNDS);
        campos.push("senha = ?");
        valores.push(hashedPassword);
      }
  
      // Atualiza imagem se enviada
      if (req.file) {
        const imagem = req.file.buffer;
        const tipoImagem = req.file.mimetype;
  
        campos.push("imagem = ?");
        valores.push(imagem);
  
        campos.push("tipo_imagem = ?");
        valores.push(tipoImagem);
      }
  
      if (campos.length === 0) {
        return res.status(400).json({ error: "Nenhum campo para atualizar" });
      }
  
      valores.push(id_usuario); // WHERE
      const query = `UPDATE usuario SET ${campos.join(", ")} WHERE id_usuario = ?`;
  
      const [result] = await connect.execute(query, valores);
  
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }
  
      return res.status(200).json({ message: "Perfil atualizado com sucesso" });
    } catch (err) {
      console.error("Erro ao atualizar usuário:", err);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }
  
  

  // Deletar usuário
  static async deleteUser(req, res) {
    try {
      const { id } = req.params;
      const query = "DELETE FROM usuario WHERE id_usuario = ?";
      const [result] = await connect.execute(query, [id]);

      if (result.affectedRows === 0)
        return res.status(404).json({ success: false, error: "Usuário não encontrado" });

      return res
        .status(200)
        .json({ success: true, message: `Usuário excluído com ID: ${id}` });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ success: false, error: "Erro interno do servidor" });
    }
  }

  // Login
  static async loginUsuario(req, res) {
    try {
      const { email, senha } = req.body;
      if (!email || !senha) {
        return res.status(400).json({ success: false, error: "Email e senha obrigatórios" });
      }
  
      const [rows] = await connect.execute("SELECT * FROM usuario WHERE email = ?", [email]);
      if (rows.length === 0) {
        return res.status(401).json({ success: false, error: "Usuário não encontrado" });
      }
  
      const user = rows[0];
      const senhaOK = await bcrypt.compare(senha, user.senha);
      if (!senhaOK) {
        return res.status(401).json({ success: false, error: "Senha incorreta" });
      }
  
      // Agora o token carrega id_usuario (igual ao banco e ao verifyJWT)
      const token = jwt.sign(
        { id_usuario: user.id_usuario },
        process.env.SECRET,
        { expiresIn: "1h" }
      );
  
      delete user.senha;
      delete user.imagem;
      delete user.tipo_imagem;
  
      return res.status(200).json({
        success: true,
        message: "Login bem-sucedido",
        user,
        token,
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ success: false, error: "Erro interno do servidor" });
    }
  }
  

  // Obter imagem de perfil
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
