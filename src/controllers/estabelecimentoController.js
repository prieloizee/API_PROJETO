const { buscarEstabelecimentosGoogle, buscarDetalhesEstabelecimento } = require('../services/googleMapsService');
const pool = require('../db/connect').promise();

module.exports = class EstabelecimentoController {
  // Buscar lista de estabelecimentos
  static async buscarEstabelecimentos(req, res) {
    const { location, radius, type } = req.query;

    if (!location || !radius || !type) {
      return res.status(400).json({ message: "Parâmetros obrigatórios: location, radius e type" });
    }

    try {
      const estabelecimentosBrutos = await buscarEstabelecimentosGoogle(location, radius, type);
      const resultados = [];

      for (const est of estabelecimentosBrutos) {
        try {
          const detalhes = await buscarDetalhesEstabelecimento(est.place_id);
          const enderecoCompleto = detalhes?.formatted_address || est.vicinity;

          // Filtro para só pegar de Franca
          if (!enderecoCompleto.toLowerCase().includes('franca')) continue;

          // Buscar avaliações no banco pelo place_id
          const [avaliacoes] = await pool.query(
            "SELECT id_avaliacao, id_usuario, comentario, created_at FROM avaliacoes WHERE google_place_id = ? ORDER BY created_at DESC",
            [est.place_id]
          );

          const estFormatado = {
            nome: est.name,
            endereco: enderecoCompleto,
            categoria: est.types ? est.types[0] : 'Não especificada',
            telefone: detalhes?.formatted_phone_number || null,
            site: detalhes?.website || null,
            latitude: est.geometry?.location?.lat || null,
            longitude: est.geometry?.location?.lng || null,
            place_id: est.place_id,
            horarios: detalhes?.opening_hours?.weekday_text || [],
            avaliacoes: avaliacoes || [] // anexando aqui
          };

          resultados.push(estFormatado);

        } catch (err) {
          console.error('Erro ao processar estabelecimento', est.place_id, err);
        }
      }

      return res.status(200).json({
        message: 'Busca concluída com sucesso',
        total: resultados.length,
        estabelecimentos: resultados
      });

    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Erro interno', error: err.message });
    }
  }

  // Buscar detalhes por place_id + avaliações
  static async buscarPorId(req, res) {
    const { id } = req.params;

    if (!id) return res.status(400).json({ message: "Parâmetro obrigatório: id" });

    try {
      const detalhes = await buscarDetalhesEstabelecimento(id);
      if (!detalhes) return res.status(404).json({ message: "Estabelecimento não encontrado" });

      // Buscar avaliações no banco
      const [avaliacoes] = await pool.query(
        "SELECT id_avaliacao, id_usuario, comentario, created_at FROM avaliacoes WHERE google_place_id = ? ORDER BY created_at DESC",
        [id]
      );

      return res.status(200).json({
        nome: detalhes.name,
        endereco: detalhes.formatted_address,
        telefone: detalhes.formatted_phone_number || null,
        site: detalhes.website || null,
        horarios: detalhes.opening_hours?.weekday_text || [],
        latitude: detalhes.geometry?.location?.lat || null,
        longitude: detalhes.geometry?.location?.lng || null,
        avaliacoes: avaliacoes || []
      });

    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Erro interno do servidor', error: err.message });
    }
  }
};
