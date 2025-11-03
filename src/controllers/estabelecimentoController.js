const { buscarEstabelecimentosGoogle, buscarDetalhesEstabelecimento } = require("../services/googleMapsService");
const pool = require("../db/connect").promise();

module.exports = class EstabelecimentoController {
  // 🔹 Buscar lista de estabelecimentos
  static async buscarEstabelecimentos(req, res) {
    const { location, radius, type } = req.query;

    if (!location || !radius || !type) {
      return res.status(400).json({
        message: "Parâmetros obrigatórios: location, radius e type",
      });
    }

    try {
      // 🔹 Buscar estabelecimentos no Google e limitar resultados
      const estabelecimentosBrutos = (await buscarEstabelecimentosGoogle(location, radius, type)).slice(0, 2);

      // 🔹 Buscar detalhes e avaliações em paralelo
      const promessas = estabelecimentosBrutos.map(async (est) => {
        try {
          const detalhes = await buscarDetalhesEstabelecimento(est.place_id);
          if (!detalhes) return null;

          const enderecoCompleto = detalhes.formatted_address || est.vicinity || "";
          if (!enderecoCompleto.toLowerCase().includes("franca")) return null;

          // 🔹 Buscar dados do banco em paralelo
          const [avaliacoesPromise, mediaPromise] = await Promise.all([
            pool.query(
              `SELECT id_avaliacao, id_usuario, comentario, nota, created_at
               FROM avaliacoes
               WHERE google_place_id = ?
               ORDER BY created_at DESC`,
              [est.place_id]
            ),
            pool.query(
              `SELECT AVG(nota) as media_notas, COUNT(*) as total_avaliacoes
               FROM avaliacoes
               WHERE google_place_id = ?`,
              [est.place_id]
            ),
          ]);

          const avaliacoes = avaliacoesPromise[0];
          const media = mediaPromise[0][0];

          const categoriaValida =
            detalhes.types?.find(
              (t) => t !== "establishment" && t !== "point_of_interest"
            ) || type || "Não especificada";

          // ✅ Corrigido: conversão segura de média para número
          const mediaNotas = media.media_notas
            ? parseFloat(Number(media.media_notas).toFixed(1))
            : null;

          const totalAvaliacoes = media.total_avaliacoes || 0;

          return {
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
        } catch (err) {
          console.error("Erro ao processar estabelecimento", est.place_id, err);
          return null;
        }
      });

      // 🔹 Executar tudo em paralelo (sem interromper se uma falhar)
      const resultadosBrutos = await Promise.allSettled(promessas);

      // 🔹 Filtrar só os bem-sucedidos
      const resultados = resultadosBrutos
        .filter((r) => r.status === "fulfilled" && r.value !== null)
        .map((r) => r.value);

      return res.status(200).json({
        message: "Busca concluída com sucesso",
        total: resultados.length,
        estabelecimentos: resultados,
      });
    } catch (err) {
      console.error("Erro geral:", err);
      return res.status(500).json({ message: "Erro interno", error: err.message });
    }
  }

  // 🔹 Buscar detalhes por place_id + avaliações
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

      // 🔹 Executar queries de avaliações em paralelo
      const [avaliacoesPromise, mediaPromise] = await Promise.all([
        pool.query(
          `SELECT id_avaliacao, id_usuario, comentario, nota, created_at
           FROM avaliacoes
           WHERE LOWER(google_place_id) = LOWER(?)
           ORDER BY created_at DESC`,
          [id]
        ),
        pool.query(
          `SELECT AVG(nota) as media_notas, COUNT(*) as total_avaliacoes
           FROM avaliacoes
           WHERE LOWER(google_place_id) = LOWER(?)`,
          [id]
        ),
      ]);

      const avaliacoes = avaliacoesPromise[0];
      const media = mediaPromise[0][0];

      const mediaNotas = media.media_notas
        ? parseFloat(Number(media.media_notas).toFixed(1))
        : null;
      const totalAvaliacoes = media.total_avaliacoes || 0;

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
