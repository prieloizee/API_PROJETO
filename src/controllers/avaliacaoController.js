const pool = require("../db/connect");

module.exports = class avaliacaoController {
  // Criar avaliação (comentário + nota)
  static async create(req, res) {
    const { id_usuario, google_place_id, comentario, nota } = req.body;

    if (!id_usuario || !google_place_id || !comentario || nota ) {
      return res.status(400).json({
        error: "Campos obrigatórios: id_usuario, google_place_id, comentario, nota (1-5)",
      });
    }

    // Verificar se a nota está entre 1 e 5
    if (nota < 1 || nota > 5) {
      return res.status(400).json({ error: "A nota deve ser de 1 a 5" });
    }

    try {
      // Verificar se o usuário existe
      const [usuario] = await pool.promise().query(
        "SELECT * FROM usuario WHERE id_usuario = ?",
        [id_usuario]
      );

      if (usuario.length === 0) {
        return res.status(404).json({ error: "Usuário não existe" });
      }

      const query = `
        INSERT INTO avaliacoes (id_usuario, google_place_id, comentario, nota)
        VALUES (?, ?, ?, ?)
      `;

      pool.query(query, [id_usuario, google_place_id, comentario, nota], (err, result) => {
        if (err) return res.status(500).json({ error: err });
        return res
          .status(201)
          .json({ message: "Avaliação cadastrada com sucesso", id: result.insertId });
      });
    } catch (error) {
      return res.status(500).json({ error });
    }
  }

  // Listar avaliações por local (com nota e média das notas)
  static async listByPlace(req, res) {
    const { google_place_id } = req.params;

    const query = `
      SELECT a.id_avaliacao, a.comentario, a.nota, u.nome AS usuario, a.created_at
      FROM avaliacoes a
      JOIN usuario u ON a.id_usuario = u.id_usuario
      WHERE a.google_place_id = ?
      ORDER BY a.created_at DESC
    `;

    const mediaQuery = `
      SELECT AVG(nota) as media_notas, COUNT(*) as total_avaliacoes
      FROM avaliacoes
      WHERE google_place_id = ?
    `;

    try {
      pool.query(query, [google_place_id], (err, results) => {
        if (err) return res.status(500).json({ error: err });

        pool.query(mediaQuery, [google_place_id], (err2, media) => {
          if (err2) return res.status(500).json({ error: err2 });

          const mediaNotas = media[0]?.media_notas !== null
            ? parseFloat(parseFloat(media[0].media_notas).toFixed(1))
            : null;
          const totalAvaliacoes = media[0]?.total_avaliacoes || 0;

          return res.status(200).json({
            avaliacoes: results,
            media_notas: mediaNotas,
            total_avaliacoes: totalAvaliacoes,
          });
        });
      });
    } catch (error) {
      return res.status(500).json({ error });
    }
  }

  // Atualizar avaliação (comentário e/ou nota)
  static async update(req, res) {
    const { id_avaliacao, comentario, nota } = req.body;

    if (!id_avaliacao || (!comentario && nota === undefined)) {
      return res.status(400).json({
        error: "Campos obrigatórios: id_avaliacao e (comentario ou nota)",
      });
    }

    // Validar nota
    if (nota !== undefined && (nota < 1 || nota > 5)) {
      return res.status(400).json({ error: "A nota deve ser de 1 a 5" });
    }

    const fields = [];
    const values = [];

    if (comentario) {
      fields.push("comentario = ?");
      values.push(comentario);
    }
    if (nota !== undefined) {
      fields.push("nota = ?");
      values.push(nota);
    }

    values.push(id_avaliacao);

    const query = `UPDATE avaliacoes SET ${fields.join(", ")} WHERE id_avaliacao = ?`;

    try {
      pool.query(query, values, (err, result) => {
        if (err) return res.status(500).json({ error: err });
        if (result.affectedRows === 0)
          return res.status(404).json({ error: "Avaliação não encontrada" });
        return res.status(200).json({ message: "Avaliação atualizada com sucesso" });
      });
    } catch (error) {
      return res.status(500).json({ error });
    }
  }

  // Deletar avaliação
  static async delete(req, res) {
    const { id_avaliacao } = req.params;

    const query = `DELETE FROM avaliacoes WHERE id_avaliacao = ?`;

    try {
      pool.query(query, [id_avaliacao], (err, result) => {
        if (err) return res.status(500).json({ error: err });
        if (result.affectedRows === 0)
          return res.status(404).json({ error: "Avaliação não encontrada" });
        return res.status(200).json({ message: "Avaliação deletada com sucesso" });
      });
    } catch (error) {
      return res.status(500).json({ error });
    }
  }
};
