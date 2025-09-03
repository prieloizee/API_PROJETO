const connect = require("../db/connect");
const jwt = require("jsonwebtoken");
const validateUser = require("../services/validateUser");
const validateCpf = require("../services/validateCpf");
const bcrypt = require("bcrypt");

const SALT_ROUNDS = 10;

module.exports = class usuarioController {
  // Criar usuário
  static async createUsuario(req, res) {
    const { nome, email, senha, cpf } = req.body;

    const validationError = validateUser(req.body);
    if (validationError) return res.status(400).json(validationError);

    try {
      const cpfError = await validateCpf(cpf);
      if (cpfError) return res.status(400).json(cpfError);

      const hashedPassword = await bcrypt.hash(senha, SALT_ROUNDS);

      const query = `INSERT INTO usuario (nome, email, senha, cpf) VALUES (?, ?, ?, ?)`;
      connect.query(query, [nome, email, hashedPassword, cpf], (err) => {
        if (err) {
          if (err.code === "ER_DUP_ENTRY" && err.message.includes("email")) {
            return res.status(400).json({ error: "Email já cadastrado" });
          }
          console.log(err);
          return res.status(500).json({ error: "Erro interno do servidor", err });
        }
        return res.status(201).json({ message: "Usuário criado com sucesso" });
      });
    } catch (error) {
      return res.status(500).json({ error });
    }
  }

  // Buscar todos os usuários
  static async getAllUsers(req, res) {
    const query = `SELECT * FROM usuario`;

    try {
      connect.query(query, function (err, results) {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: "Erro interno do servidor" });
        }

        const users = results.map((user) => {
          delete user.senha;
          return user;
        });

        return res.status(200).json({ message: "Obtendo todos os usuários", users });
      });
    } catch (error) {
      console.error("Erro ao executar a consulta:", error);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  // Buscar usuário por ID
  static async getUsuarioById(req, res) {
    const userId = req.params.id;
    const query = `SELECT * FROM usuario WHERE id_usuario = ?`;

    try {
      connect.query(query, [userId], (err, results) => {
        if (err) {
          console.error("Erro ao executar a consulta:", err);
          return res.status(500).json({ error: "Erro interno do servidor" });
        }

        if (results.length === 0) {
          return res.status(404).json({ error: "Usuário não encontrado" });
        }

        const user = results[0];
        delete user.senha; // não expor senha

        return res.status(200).json({ message: "Usuário encontrado", user });
      });
    } catch (error) {
      console.error("Erro ao executar a consulta:", error);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  // Atualizar usuário
  static async updateUser(req, res) {
    const { cpf, email, senha, nome, id } = req.body;

    const validationError = validateUser(req.body);
    if (validationError) return res.status(400).json(validationError);

    try {
      const cpfError = await validateCpf(cpf, id);
      if (cpfError) return res.status(400).json(cpfError);

      const hashedPassword = await bcrypt.hash(senha, SALT_ROUNDS);

      const query = "UPDATE usuario SET nome = ?, email = ?, senha = ?, cpf = ? WHERE id_usuario = ?";
      connect.query(query, [nome, email, hashedPassword, cpf, id], (err, results) => {
        if (err) {
          if (err.code === "ER_DUP_ENTRY" && err.message.includes("email")) {
            return res.status(400).json({ error: "Email já cadastrado" });
          }
          return res.status(500).json({ error: "Erro interno do servidor", err });
        }

        if (results.affectedRows === 0) {
          return res.status(404).json({ error: "Usuário não encontrado" });
        }

        return res.status(200).json({ message: "Usuário atualizado com sucesso" });
      });
    } catch (error) {
      return res.status(500).json({ error });
    }
  }

  // Deletar usuário
  static async deleteUser(req, res) {
    const userId = req.params.id;
    const query = `DELETE FROM usuario WHERE id_usuario = ?`;

    try {
      connect.query(query, [userId], function (err, results) {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: "Erro interno do servidor" });
        }

        if (results.affectedRows === 0) {
          return res.status(404).json({ error: "Usuário não encontrado" });
        }

        return res.status(200).json({ message: "Usuário excluído com ID: " + userId });
      });
    } catch (error) {
      console.error("Erro ao executar a consulta:", error);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  // Login
  static async loginUsuario(req, res) {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ error: "Email e senha são obrigatórios" });
    }

    const query = `SELECT * FROM usuario WHERE email = ?`;

    try {
      connect.query(query, [email], (err, results) => {
        if (err) {
          console.error("Erro ao executar a consulta:", err);
          return res.status(500).json({ error: "Erro interno do servidor" });
        }

        if (results.length === 0) {
          return res.status(401).json({ error: "Usuário não encontrado" });
        }

        const user = results[0];
        const senhaOK = bcrypt.compareSync(senha, user.senha);

        if (!senhaOK) {
          return res.status(401).json({ error: "Senha incorreta" });
        }

        const token = jwt.sign({ id: user.id_usuario }, process.env.SECRET, { expiresIn: "1h" });
        delete user.senha;

        return res.status(200).json({ message: "Login bem-sucedido", user, token });
      });
    } catch (error) {
      console.error("Erro ao executar a consulta:", error);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  // Upload imagem de perfil
  static async uploadImagemPerfil(req, res) {
    try {
      const id_usuario = req.user.id_usuario; // assumindo JWT para pegar o usuário
      if (!req.file) {
        return res.status(400).json({ message: "Nenhuma imagem enviada" });
      }

      const imagem = req.file.buffer;
      const tipoImagem = req.file.mimetype;

      // Verificação de tipo (apenas jpeg e png)
      if (!["image/jpeg", "image/png"].includes(tipoImagem)) {
        return res.status(400).json({ message: "Formato inválido. Use JPEG ou PNG" });
      }

      // Limite de tamanho (2MB)
      if (req.file.size > 2 * 1024 * 1024) {
        return res.status(400).json({ message: "Imagem muito grande (máx: 2MB)" });
      }

      await pool.query(
        `UPDATE usuarios SET imagem = ?, tipo_imagem = ? WHERE id_usuario = ?`,
        [imagem, tipoImagem, id_usuario]
      );

      return res.status(200).json({ message: "Imagem atualizada com sucesso" });
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      return res.status(500).json({ message: "Erro interno no servidor" });
    }
  }

  // Obter imagem do perfil
  static async getImagemPerfil(req, res) {
    try {
      const id_usuario = req.params.id;

      const [rows] = await pool.query(
        `SELECT imagem, tipo_imagem FROM usuarios WHERE id_usuario = ?`,
        [id_usuario]
      );

      if (!rows.length || !rows[0].imagem) {
        return res.status(404).send("Imagem não encontrada");
      }

      res.set("Content-Type", rows[0].tipo_imagem || "image/jpeg");
      res.send(rows[0].imagem);
    } catch (error) {
      console.error("Erro ao buscar imagem:", error);
      return res.status(500).json({ message: "Erro interno no servidor" });
    }
  }
};
