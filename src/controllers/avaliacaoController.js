const pool = require("../db/connect");

module.exports = class avaliacaoController {
  // Criar comentário
  static async create(req, res) {
    const { id_usuario, google_place_id, comentario } = req.body;

    if (!id_usuario || !google_place_id || !comentario) {
      return res.status(400).json({ error: "Campos obrigatórios: id_usuario, google_place_id, comentario" });
    }

    const query = `
      INSERT INTO avaliacoes (id_usuario, google_place_id, comentario)
      VALUES (?, ?, ?)
    `;

    try {
      pool.query(query, [id_usuario, google_place_id, comentario], (err, result) => {
        if (err) return res.status(500).json({ error: err });
        return res.status(201).json({ message: "Comentário cadastrado com sucesso", id: result.insertId });
      });
    } catch (error) {
      return res.status(500).json({ error });
    }
  }

  // Listar comentários por local
  static async listByPlace(req, res) {
    const { google_place_id } = req.params;

    const query = `
      SELECT a.id_avaliacao, a.comentario, u.nome AS usuario, a.created_at
      FROM avaliacoes a
      JOIN usuario u ON a.id_usuario = u.id_usuario
      WHERE a.google_place_id = ?
      ORDER BY a.created_at DESC
    `;

    try {
      pool.query(query, [google_place_id], (err, results) => {
        if (err) return res.status(500).json({ error: err });
        return res.status(200).json(results);
      });
    } catch (error) {
      return res.status(500).json({ error });
    }
  }

  // Atualizar comentário
  static async update(req, res) {
    const { id_avaliacao, comentario } = req.body;

    if (!id_avaliacao || !comentario) {
      return res.status(400).json({ error: "Campos obrigatórios: id_avaliacao e comentario" });
    }

    const query = `UPDATE avaliacoes SET comentario = ? WHERE id_avaliacao = ?`;

    try {
      pool.query(query, [comentario, id_avaliacao], (err, result) => {
        if (err) return res.status(500).json({ error: err });
        if (result.affectedRows === 0) return res.status(404).json({ error: "Comentário não encontrado" });
        return res.status(200).json({ message: "Comentário atualizado com sucesso" });
      });
    } catch (error) {
      return res.status(500).json({ error });
    }
  }

  // Deletar comentário
  static async delete(req, res) {
    const { id_avaliacao } = req.params;

    const query = `DELETE FROM avaliacoes WHERE id_avaliacao = ?`;

    try {
      pool.query(query, [id_avaliacao], (err, result) => {
        if (err) return res.status(500).json({ error: err });
        if (result.affectedRows === 0) return res.status(404).json({ error: "Comentário não encontrado" });
        return res.status(200).json({ message: "Comentário deletado com sucesso" });
      });
    } catch (error) {
      return res.status(500).json({ error });
    }
  }
};
