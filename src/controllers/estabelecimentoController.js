const { interpretarFiltro } = require('../services/OpenIA');
const { buscarEstabelecimentosGoogle, buscarDetalhesEstabelecimento } = require('../services/googleMapsService');
const pool = require('../db/connect').promise();

// Tipos válidos para o Google Places
const TIPOS_GOOGLE = [
  "restaurant", "bar", "cafe", "store", "park", "gym", "museum", "hotel", "shopping_mall"
];

module.exports = class EstabelecimentoController {

  // Buscar lista de estabelecimentos com filtro da IA
  static async buscarEstabelecimentos(req, res) {
    const { location, radius, texto } = req.query; // agora recebe texto para IA

    if (!location || !radius || !texto) {
      return res.status(400).json({ message: "Parâmetros obrigatórios: location, radius e texto" });
    }

    try {
      // 1. Interpretar o texto com IA
      let filtro = await interpretarFiltro(texto);

      // Garantir que o type seja válido para o Google
      if (!TIPOS_GOOGLE.includes(filtro.type)) {
        filtro.type = "restaurant"; // fallback padrão
      }

      // 2. Buscar estabelecimentos no Google
      const estabelecimentosBrutos = await buscarEstabelecimentosGoogle(location, radius, filtro.type);
      const resultados = [];

      for (const est of estabelecimentosBrutos) {
        try {
          const detalhes = await buscarDetalhesEstabelecimento(est.place_id);
          const enderecoCompleto = detalhes?.formatted_address || est.vicinity;

          if (!enderecoCompleto.toLowerCase().includes('franca')) continue;

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

  // Buscar detalhes por place_id + avaliações
 static async buscarPorId(req, res) {
  const { id } = req.params;

  if (!id) return res.status(400).json({ message: "Parâmetro obrigatório: id" });

  try {
    // 1. Buscar detalhes do Google Places
    const detalhes = await buscarDetalhesEstabelecimento(id);
    if (!detalhes) return res.status(404).json({ message: "Estabelecimento não encontrado" });

    // 2. Buscar avaliações dos usuários no banco (tabela 'avaliacao')
    const [avaliacoesUsuarios] = await pool.query(
      `SELECT usuario, nota, comentario 
       FROM avaliacao 
       WHERE place_id = ? 
       ORDER BY data_criacao DESC`,
      [id]
    );

    // 3. Montar resposta com ambas as avaliações
    const resposta = {
      nome: detalhes.name,
      endereco: detalhes.formatted_address,
      telefone: detalhes.formatted_phone_number || null,
      site: detalhes.website || null,
      avaliacao_google: detalhes.rating || null, // ⭐ Avaliação do Google
      total_avaliacoes_google: detalhes.user_ratings_total || 0, // quantidade do Google
      avaliacoes_usuarios: avaliacoesUsuarios.length > 0 ? avaliacoesUsuarios : [],
      horarios: detalhes.opening_hours?.weekday_text || [],
      latitude: detalhes.geometry?.location?.lat || null,
      longitude: detalhes.geometry?.location?.lng || null
    };

    return res.status(200).json(resposta);

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erro interno do servidor', error: err.message });
  }
}
};
