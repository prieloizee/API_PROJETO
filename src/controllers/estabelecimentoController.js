const { buscarEstabelecimentosGoogle } = require('../services/googleMapsService');

exports.buscarEstabelecimentos = async (req, res) => {
  try {
    const { location, radius, type } = req.query;

    if (!location || !radius || !type) {
      return res.status(400).json({
        message: "Parâmetros obrigatórios: location, radius e type",
      });
    }

    // Chama a API do Google
    const estabelecimentosBrutos = await buscarEstabelecimentosGoogle(location, radius, type);

    // Organiza os dados para o front-end
    const estabelecimentos = estabelecimentosBrutos.map(est => ({
      nome: est.name,
      endereco: est.vicinity,
      avaliacao: est.rating || "Não avaliado",
      categoria: est.types ? est.types[0] : "Não especificada",
      telefone: est.formatted_phone_number || null, // se disponível
      site: est.website || null, // se disponível
      latitude: est.geometry?.location?.lat || null,
      longitude: est.geometry?.location?.lng || null
    }));

    return res.status(200).json({
      message: 'Busca concluída com sucesso',
      total: estabelecimentos.length,
      estabelecimentos
    });

  } catch (error) {
    console.error('Erro ao buscar estabelecimentos:', error);
    return res.status(500).json({
      message: 'Erro interno do servidor',
      error: error.message,
    });
  }
};
