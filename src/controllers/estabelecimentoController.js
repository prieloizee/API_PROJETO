const { interpretarFiltro } = require('../services/OpenIA');
const { buscarEstabelecimentosGoogle, buscarDetalhesEstabelecimento } = require('../services/googleMapsService');
const pool = require('../db/connect').promise();

// Mapeamento PT-BR -> Google Places
const MAPA_TIPOS = {
  restaurante: "restaurant",
  bar: "bar",
  café: "cafe",
  academia: "gym",
  parque: "park",
  loja: "store",
  hotel: "hotel",
  museu: "museum",
  shopping: "shopping_mall"
};

module.exports = class EstabelecimentoController {

  // Buscar lista de estabelecimentos com IA e filtros
  static async buscarEstabelecimentos(req, res) {
    const { location, radius, texto } = req.query;

    if (!location || !radius || !texto) {
      return res.status(400).json({ message: "Parâmetros obrigatórios: location, radius e texto" });
    }

    try {
      // 1. Interpretar texto com IA -> { type, keyword, preco, abertoAgora }
      let filtro = await interpretarFiltro(texto);

      // Garantir que existe type válido
      let tipoGoogle = "restaurant";
      if (filtro.type) {
        tipoGoogle = MAPA_TIPOS[filtro.type.toLowerCase()] || "restaurant";
      }

      // 2. Buscar no Google Places com filtros
     const estabelecimentosBrutos = await buscarEstabelecimentosGoogle(
  location,
  radius,
  filtro.type,
  filtro.keyword || null,
  filtro.abertoAgora || false,
  filtro.preco || null
);


      const resultados = [];

      for (const est of estabelecimentosBrutos) {
        try {
          const detalhes = await buscarDetalhesEstabelecimento(est.place_id);
          const enderecoCompleto = detalhes?.formatted_address || est.vicinity;

          if (!enderecoCompleto.toLowerCase().includes('franca')) continue;

          // Filtro adicional: aberto agora
          if (filtro.abertoAgora && detalhes.opening_hours && !detalhes.opening_hours.open_now) {
            continue;
          }

          // Filtro adicional: palavra-chave no nome
          if (filtro.keyword && !detalhes.name.toLowerCase().includes(filtro.keyword.toLowerCase())) {
            continue;
          }

          // Buscar avaliações no banco
          const [avaliacoes] = await pool.query(
            `SELECT id_avaliacao, id_usuario, comentario, created_at 
             FROM avaliacoes 
             WHERE google_place_id = ? 
             ORDER BY created_at DESC`,
            [est.place_id]
          );

          resultados.push({
            nome: est.name,
            endereco: enderecoCompleto,
            categoria: est.types ? est.types[0] : 'Não especificada',
            telefone: detalhes?.formatted_phone_number || null,
            site: detalhes?.website || null,
            latitude: est.geometry?.location?.lat || null,
            longitude: est.geometry?.location?.lng || null,
            place_id: est.place_id,
            horarios: detalhes?.opening_hours?.weekday_text || [],
            avaliacoes: avaliacoes || []
          });

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

  // Buscar por place_id
  static async buscarPorId(req, res) {
    const { id } = req.params;

    if (!id) return res.status(400).json({ message: "Parâmetro obrigatório: id" });

    try {
      const detalhes = await buscarDetalhesEstabelecimento(id);
      if (!detalhes) return res.status(404).json({ message: "Estabelecimento não encontrado" });

      const [avaliacoesUsuarios] = await pool.query(
        `SELECT usuario, nota, comentario 
         FROM avaliacao 
         WHERE place_id = ? 
         ORDER BY data_criacao DESC`,
        [id]
      );

      return res.status(200).json({
        nome: detalhes.name,
        endereco: detalhes.formatted_address,
        telefone: detalhes.formatted_phone_number || null,
        site: detalhes.website || null,
        avaliacao_google: detalhes.rating || null,
        total_avaliacoes_google: detalhes.user_ratings_total || 0,
        avaliacoes_usuarios: avaliacoesUsuarios.length > 0 ? avaliacoesUsuarios : [],
        horarios: detalhes.opening_hours?.weekday_text || [],
        latitude: detalhes.geometry?.location?.lat || null,
        longitude: detalhes.geometry?.location?.lng || null
      });

    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Erro interno do servidor', error: err.message });
    }
  }
};
