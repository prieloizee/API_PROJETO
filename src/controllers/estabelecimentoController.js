// controllers/estabelecimentosController.js
const { interpretarFiltro } = require('../services/OpenIA');
const { buscarEstabelecimentosGoogle } = require('../services/googleMapsService');

exports.buscarEstabelecimentos = async (req, res) => {
  try {
    const { location, radius, texto } = req.query;

    if (!location || !radius || !texto) {
      return res.status(400).json({
        message: "Parâmetros obrigatórios: location, radius e texto",
      });
    }

    // 1. Interpretar o texto do usuário
    const filtro = await interpretarFiltro(texto);
    const type = filtro.type; // tipo principal para o Google Maps
    const filtroExtra = filtro.filtro_extra; // opcional

    // 2. Chama a API do Google usando o type
    const estabelecimentosBrutos = await buscarEstabelecimentosGoogle(location, radius, type);

    // 3. Organiza os dados para o front-end
    const estabelecimentos = estabelecimentosBrutos.map(est => ({
      nome: est.name,
      endereco: est.vicinity,
      avaliacao: est.rating || "Não avaliado",
      categoria: est.types ? est.types[0] : "Não especificada",
      telefone: est.formatted_phone_number || null,
      site: est.website || null,
      latitude: est.geometry?.location?.lat || null,
      longitude: est.geometry?.location?.lng || null
    }));

    // 4. Opcional: filtrar resultados manualmente usando filtro_extra
    let resultadosFiltrados = estabelecimentos;
    if (filtroExtra) {
      const termo = filtroExtra.toLowerCase();
      resultadosFiltrados = estabelecimentos.filter(est => 
        est.nome.toLowerCase().includes(termo) ||
        (est.categoria && est.categoria.toLowerCase().includes(termo))
      );
    }

    return res.status(200).json({
      message: 'Busca concluída com sucesso',
      total: resultadosFiltrados.length,
      estabelecimentos: resultadosFiltrados
    });

  } catch (error) {
    console.error('Erro ao buscar estabelecimentos:', error);
    return res.status(500).json({
      message: 'Erro interno do servidor',
      error: error.message,
    });
  }
};
