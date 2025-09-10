const { buscarEstabelecimentosGoogle, buscarDetalhesEstabelecimento } = require("../services/googleMapsService");
const pool = require("../db/connect").promise();

module.exports = class EstabelecimentoController {
  // Buscar lista de estabelecimentos
  static async buscarEstabelecimentos(req, res) {
    const { location, radius, type } = req.query;

    if (!location || !radius || !type) {
      return res
        .status(400)
        .json({ message: "Parâmetros obrigatórios: location, radius e type" });
    }

    try {
      const estabelecimentosBrutos = (await buscarEstabelecimentosGoogle(
        location,
        radius,
        type
      )).slice(0, 2);      
      const resultados = [];

      for (const est of estabelecimentosBrutos) {
        try {
          const detalhes = await buscarDetalhesEstabelecimento(est.place_id);
          const enderecoCompleto = detalhes?.formatted_address || est.vicinity;

          if (!enderecoCompleto.toLowerCase().includes("franca")) continue;

          // Buscar avaliações
          const [avaliacoes] = await pool.query(
            `SELECT id_avaliacao, id_usuario, comentario, nota, created_at
             FROM avaliacoes
             WHERE google_place_id = ?
             ORDER BY created_at DESC`,
            [est.place_id]
          );

          // Média das notas e total de avaliações
          const [media] = await pool.query(
            `SELECT AVG(nota) as media_notas, COUNT(*) as total_avaliacoes
             FROM avaliacoes
             WHERE google_place_id = ?`,
            [est.place_id]
          );

          const categoriaValida = detalhes.types?.find(
            t => t !== "establishment" && t !== "point_of_interest"
          ) || req.query.type || "Não especificada";

          const mediaNotas =
            media[0]?.media_notas !== null
              ? parseFloat(parseFloat(media[0].media_notas).toFixed(1))
              : null;
          const totalAvaliacoes = media[0]?.total_avaliacoes || 0;

          const estFormatado = {
            place_id: est.place_id,
            nome: detalhes.name,
            endereco: detalhes.formatted_address,
            categoria: categoriaValida,
            telefone: detalhes.formatted_phone_number || null,
            media_notas: mediaNotas,
            total_avaliacoes: totalAvaliacoes,
            site: detalhes.website || null,
            latitude: detalhes.geometry?.location?.lat || null,
            longitude: detalhes.geometry?.location?.lng || null,
            horarios: detalhes.opening_hours?.weekday_text || [],
            avaliacoes: avaliacoes || [],
          };

          resultados.push(estFormatado);
        } catch (err) {
          console.error("Erro ao processar estabelecimento", est.place_id, err);
        }
      }

      return res.status(200).json({
        message: "Busca concluída com sucesso",
        total: resultados.length,
        estabelecimentos: resultados,
      });
    } catch (err) {
      console.error(err);
      return res
        .status(500)
        .json({ message: "Erro interno", error: err.message });
    }
  }

  // Buscar detalhes por place_id + avaliações
  static async buscarPorId(req, res) {
    let { id } = req.params;
    if (!id)
      return res.status(400).json({ message: "Parâmetro obrigatório: id" });

    id = id.trim();

    try {
      const detalhes = await buscarDetalhesEstabelecimento(id);
      if (!detalhes)
        return res
          .status(404)
          .json({ message: "Estabelecimento não encontrado" });

      const [avaliacoes] = await pool.query(
        `SELECT id_avaliacao, id_usuario, comentario, nota, created_at
         FROM avaliacoes
         WHERE LOWER(google_place_id) = LOWER(?)
         ORDER BY created_at DESC`,
        [id]
      );

      const [media] = await pool.query(
        `SELECT AVG(nota) as media_notas, COUNT(*) as total_avaliacoes
         FROM avaliacoes
         WHERE LOWER(google_place_id) = LOWER(?)`,
        [id]
      );

      const mediaNotas =
        media[0]?.media_notas !== null
          ? parseFloat(parseFloat(media[0].media_notas).toFixed(1))
          : null;
      const totalAvaliacoes = media[0]?.total_avaliacoes || 0;

      return res.status(200).json({
        place_id: id,
        nome: detalhes.name,
        endereco: detalhes.formatted_address,
        categoria: detalhes.types ? detalhes.types[0] : "Não especificada",
        telefone: detalhes.formatted_phone_number || null,
        media_notas: mediaNotas,
        total_avaliacoes: totalAvaliacoes,
        site: detalhes.website || null,
        latitude: detalhes.geometry?.location?.lat || null,
        longitude: detalhes.geometry?.location?.lng || null,
        horarios: detalhes.opening_hours?.weekday_text || [],
        avaliacoes: avaliacoes || [],
      });
    } catch (err) {
      console.error(err);
      return res
        .status(500)
        .json({ message: "Erro interno do servidor", error: err.message });
    }
  }
};
