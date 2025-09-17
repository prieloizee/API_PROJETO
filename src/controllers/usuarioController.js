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

      // Valida campos básicos
      const validationError = validateUser({ nome, email, senha, cpf });
      if (validationError)
        return res.status(400).json({ success: false, ...validationError });

      // Valida CPF
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

  // Obter todos os usuários (com paginação opcional)
  static async getAllUsers(req, res) {
    const query = `SELECT * FROM usuario`;
  
    try {
      const [results] = await connect.execute(query); // <- aqui não tem callback
  
      const users = results.map((user) => {
        delete user.senha;
        return user;
      });
  
      return res
        .status(200)
        .json({ message: "Obtendo todos os usuários", users });
    } catch (error) {
      console.error("Erro ao executar a consulta:", error);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }
  


  // Atualizar usuário
  static async updateUser(req, res) {
    try {
      const { id, nome, email, senha, cpf } = req.body;

      const validationError = validateUser({ nome, email, senha, cpf });
      if (validationError)
        return res.status(400).json({ success: false, ...validationError });

      const cpfError = await validateCpf(cpf, id);
      if (cpfError)
        return res.status(400).json({ success: false, ...cpfError });

      const hashedPassword = await bcrypt.hash(senha, SALT_ROUNDS);

      const query =
        "UPDATE usuario SET nome = ?, email = ?, senha = ?, cpf = ? WHERE id_usuario = ?";
      const [result] = await connect.execute(query, [
        nome,
        email,
        hashedPassword,
        cpf,
        id,
      ]);

      if (result.affectedRows === 0)
        return res
          .status(404)
          .json({ success: false, error: "Usuário não encontrado" });

      return res
        .status(200)
        .json({ success: true, message: "Usuário atualizado com sucesso" });
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

  // Deletar usuário
  static async deleteUser(req, res) {
    try {
      const { id } = req.params;
      const query = "DELETE FROM usuario WHERE id_usuario = ?";
      const [result] = await connect.execute(query, [id]);

      if (result.affectedRows === 0)
        return res
          .status(404)
          .json({ success: false, error: "Usuário não encontrado" });

      return res
        .status(200)
        .json({ success: true, message: `Usuário excluído com ID: ${id}` });
    } catch (err) {
      console.error(err);
      return res
        .status(500)
        .json({ success: false, error: "Erro interno do servidor" });
    }
  }

  // Login
  static async loginUsuario(req, res) {
    try {
      const { email, senha } = req.body;
      if (!email || !senha)
        return res
          .status(400)
          .json({ success: false, error: "Email e senha obrigatórios" });

      const [rows] = await connect.execute(
        "SELECT * FROM usuario WHERE email = ?",
        [email]
      );
      if (rows.length === 0)
        return res
          .status(401)
          .json({ success: false, error: "Usuário não encontrado" });

      const user = rows[0];
      const senhaOK = await bcrypt.compare(senha, user.senha);
      if (!senhaOK)
        return res
          .status(401)
          .json({ success: false, error: "Senha incorreta" });

      const token = jwt.sign({ id: user.id_usuario }, process.env.SECRET, {
        expiresIn: "1h",
      });
      delete user.senha;
      delete user.imagem;
      delete user.tipo_imagem;

      return res
        .status(200)
        .json({ success: true, message: "Login bem-sucedido", user, token });
    } catch (err) {
      console.error(err);
      return res
        .status(500)
        .json({ success: false, error: "Erro interno do servidor" });
    }
  }
    // Upload de imagem de perfil
    static async uploadImagemPerfil(req, res) {
      try {
        const id_usuario = req.user.id_usuario; // assume JWT
        if (!req.file) {
          return res.status(400).json({ success: false, message: "Nenhuma imagem enviada" });
        }
  
        const imagem = req.file.buffer;
        const tipoImagem = req.file.mimetype;
  
        // Verificação de tipo de imagem
        if (!["image/jpeg", "image/png"].includes(tipoImagem)) {
          return res.status(400).json({ success: false, message: "Formato inválido. Use JPEG ou PNG" });
        }
  
        // Limite de tamanho (2MB)
        if (req.file.size > 2 * 1024 * 1024) {
          return res.status(400).json({ success: false, message: "Imagem muito grande (máx: 2MB)" });
        }
  
        // Atualiza no banco
        const query = "UPDATE usuario SET imagem = ?, tipo_imagem = ? WHERE id_usuario = ?";
        connect.query(query, [imagem, tipoImagem, id_usuario], (err) => {
          if (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: "Erro ao atualizar imagem" });
          }
          return res.status(200).json({ success: true, message: "Imagem atualizada com sucesso" });
        });
      } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Erro interno no servidor" });
      }
    }
  
    // Obter imagem de perfil
    static async getImagemPerfil(req, res) {
      const id_usuario = req.params.id;
      const query = "SELECT imagem, tipo_imagem FROM usuario WHERE id_usuario = ?";
  
      connect.query(query, [id_usuario], (err, results) => {
        if (err || results.length === 0 || !results[0].imagem) {
          return res.status(404).send("Imagem não encontrada");
        }
  
        res.set("Content-Type", results[0].tipo_imagem || "image/jpeg");
        res.send(results[0].imagem);
      });
    }
  
}

module.exports = UsuarioController;
