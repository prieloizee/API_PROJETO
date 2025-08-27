const pool = require('../db/connect').promise();

module.exports = class FavoritosController {

  // Adicionar favorito
  static async adicionaFavorito(req, res) {
    const { google_place_id, nome_estabelecimento, endereco } = req.body;
    const id_usuario = Number(req.user.id_usuario); // garante número

    if (!google_place_id) {
      return res.status(400).json({ message: "google_place_id é obrigatório" });
    }

    console.log("Tentando adicionar favorito:", { id_usuario, google_place_id, nome_estabelecimento, endereco });

    const query = `
      INSERT INTO favoritos (id_usuario, google_place_id, nome_estabelecimento, endereco)
      VALUES (?, ?, ?, ?)
    `;

    try {
      const [result] = await pool.query(query, [
        id_usuario,
        google_place_id,
        nome_estabelecimento || null,
        endereco || null
      ]);

      console.log("Resultado do insert:", result);

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
    const id_usuario = Number(req.user.id_usuario);
    console.log("Listando favoritos para usuário:", id_usuario);

    const query = `
      SELECT id_favorito, google_place_id, nome_estabelecimento, endereco, created_at
      FROM favoritos
      WHERE id_usuario = ?
      ORDER BY created_at DESC
    `;

    try {
      const [rows] = await pool.query(query, [id_usuario]);
      console.log("Favoritos encontrados:", rows.length);
      return res.status(200).json({ total: rows.length, favoritos: rows });
    } catch (error) {
      console.error("Erro ao listar favoritos:", error);
      return res.status(500).json({ message: "Erro interno", error });
    }
  }

  // Remover favorito
  static async removeFavorito(req, res) {
    const { id_favorito } = req.params;
    const id_usuario = Number(req.user.id_usuario);

    console.log("Removendo favorito:", id_favorito, "usuário:", id_usuario);

    const query = `DELETE FROM favoritos WHERE id_favorito = ? AND id_usuario = ?`;

    try {
      const [result] = await pool.query(query, [id_favorito, id_usuario]);
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Favorito não encontrado" });
      }

      console.log("Favorito removido:", id_favorito);
      return res.status(200).json({ message: "Favorito removido com sucesso" });
    } catch (error) {
      console.error("Erro ao remover favorito:", error);
      return res.status(500).json({ message: "Erro interno", error });
    }
  }
};
