const pool = require('../db/connect').promise();

module.exports = class FavoritosController {

  // Adicionar favorito
  static async adicionaFavorito(req, res) {
    // Se veio do token, usa req.userId; se não, usa o id_usuario do corpo
    const id_usuario = req.userId || req.body.id_usuario;
    const { google_place_id, nome_estabelecimento, endereco } = req.body;

    if (!id_usuario || !google_place_id) {
      return res.status(400).json({ message: "id_usuario e google_place_id são obrigatórios" });
    }

    try {
      const query = `
        INSERT INTO favoritos (id_usuario, google_place_id, nome_estabelecimento, endereco)
        VALUES (?, ?, ?, ?)
      `;
      const [result] = await pool.query(query, [
        id_usuario,
        google_place_id,
        nome_estabelecimento || null,
        endereco || null
      ]);

      return res.status(201).json({
        message: "Favorito adicionado com sucesso",
        id_favorito: result.insertId
      });
    } catch (error) {
      console.error("Erro ao adicionar favorito:", error);
      return res.status(500).json({ message: "Erro interno", error });
    }
  }

  // Listar favoritos do usuário
  static async listFavoritos(req, res) {
    // Primeiro tenta pegar do token, se não, dos params
    const id_usuario = req.userId || req.params.id_usuario;

    if (!id_usuario) {
      return res.status(400).json({ message: "id_usuario é obrigatório" });
    }

    try {
      const query = `
        SELECT id_favorito, google_place_id, nome_estabelecimento, endereco, created_at
        FROM favoritos
        WHERE id_usuario = ?
        ORDER BY created_at DESC
      `;
      const [rows] = await pool.query(query, [id_usuario]);

      return res.status(200).json({ total: rows.length, favoritos: rows });
    } catch (error) {
      console.error("Erro ao listar favoritos:", error);
      return res.status(500).json({ message: "Erro interno", error });
    }
  }

  // Remover favorito
  static async removeFavorito(req, res) {
    const { id_favorito } = req.params;
    const id_usuario = req.userId || req.body.id_usuario;

    if (!id_usuario) {
      return res.status(400).json({ message: "id_usuario é obrigatório" });
    }

    try {
      const query = `DELETE FROM favoritos WHERE id_favorito = ? AND id_usuario = ?`;
      const [result] = await pool.query(query, [id_favorito, id_usuario]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Favorito não encontrado" });
      }

      return res.status(200).json({ message: "Favorito removido com sucesso" });
    } catch (error) {
      console.error("Erro ao remover favorito:", error);
      return res.status(500).json({ message: "Erro interno", error });
    }
  }
};
