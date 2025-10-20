const pool = require("../db/connect").promise();

module.exports = class avaliacaoController {
  // Criar avaliação (comentário + nota + nome_estabelecimento)
  static async create(req, res) {
    const id_usuario = req.userId; // vem do JWT
    const { google_place_id, comentario, nota, nome_estabelecimento, endereco } = req.body;

    if (!id_usuario || !google_place_id || !comentario || !nota || !nome_estabelecimento || !endereco) {
      return res.status(400).json({
        error: "Campos obrigatórios: google_place_id, comentario, nota (1-5), nome do estabelecimento, endereço",
      });
    }

    if (nota < 1 || nota > 5) {
      return res.status(400).json({ error: "A nota deve ser de 1 a 5" });
    }

    try {
      const query = `
        INSERT INTO avaliacoes (id_usuario, google_place_id, comentario, nota, nome_estabelecimento, endereco)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      const [result] = await pool.query(query, [
        id_usuario,
        google_place_id,
        comentario,
        nota,
        nome_estabelecimento,
        endereco
      ]);

      return res.status(201).json({
        message: "Avaliação cadastrada com sucesso",
        id_avaliacao: result.insertId
      });
    } catch (error) {
      console.error("Erro ao criar avaliação:", error);
      return res.status(500).json({ error: "Erro interno", details: error });
    }
  }

  // Listar avaliações por usuário
  static async listByUser(req, res) {
    const id_usuario = req.userId; // vem do JWT

    const query = `
      SELECT a.id_avaliacao, a.comentario, a.nota, a.google_place_id, 
             a.nome_estabelecimento, a.endereco, a.created_at
      FROM avaliacoes a
      WHERE a.id_usuario = ?
      ORDER BY a.created_at DESC
    `;

    try {
      const [rows] = await pool.query(query, [id_usuario]);

      if (rows.length === 0) {
        return res.status(404).json({ message: "Nenhuma avaliação encontrada para este usuário" });
      }

      return res.status(200).json({ total: rows.length, avaliacoes: rows });
    } catch (error) {
      console.error("Erro ao listar avaliações:", error);
      return res.status(500).json({ error: "Erro interno", details: error });
    }
  }

  // Listar avaliações por local (com nota e média das notas)
  static async listByPlace(req, res) {
    const { google_place_id } = req.params;

    const query = `
      SELECT a.id_avaliacao, a.comentario, a.nota, a.nome_estabelecimento, a.endereco,
             u.nome AS usuario, a.created_at
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
      const [avaliacoes] = await pool.query(query, [google_place_id]);
      const [media] = await pool.query(mediaQuery, [google_place_id]);

      const mediaNotas =
        media[0]?.media_notas !== null
          ? parseFloat(parseFloat(media[0].media_notas).toFixed(1))
          : null;

      const totalAvaliacoes = media[0]?.total_avaliacoes || 0;

      return res.status(200).json({
        avaliacoes,
        media_notas: mediaNotas,
        total_avaliacoes: totalAvaliacoes,
      });
    } catch (error) {
      console.error("Erro ao listar avaliações por local:", error);
      return res.status(500).json({ error: "Erro interno", details: error });
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

  if (!req.userId) {
    return res.status(401).json({ error: "Usuário não autenticado" });
  }

  try {
    const [result] = await pool.query(
      "DELETE FROM avaliacoes WHERE id_avaliacao = ? AND id_usuario = ?",
      [id_avaliacao, req.userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Avaliação não encontrada ou você não tem permissão para deletar" });
    }

    return res.status(200).json({ message: "Avaliação deletada com sucesso" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erro ao deletar avaliação" });
  }
}
}
