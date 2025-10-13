const axios = require('axios');
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

exports.buscarEstabelecimentosGoogle = async (location, radius, type) => {
  try {
    let resultados = [];
    let nextPageToken = null;

    let url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location}&radius=${radius}&type=${type}&key=${GOOGLE_API_KEY}&language=pt-BR`;

    do {
      const response = await axios.get(url);
      const data = response.data;

      // Adiciona os resultados da página atual
      if (data.results && data.results.length > 0) {
        resultados = resultados.concat(data.results);
      }

      // Pega o token da próxima página (se houver)
      nextPageToken = data.next_page_token;

      if (nextPageToken) {
        // Tempo necessário para o token ativar
        await new Promise((resolve) => setTimeout(resolve, 2000));
        url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?pagetoken=${nextPageToken}&key=${GOOGLE_API_KEY}&language=pt-BR`;
      }
    } while (nextPageToken && resultados.length < 60);

    return resultados;
  } catch (error) {
    console.error('Erro ao consultar Google Maps:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Busca detalhes de um estabelecimento específico
 */
exports.buscarDetalhesEstabelecimento = async (placeId) => {
  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${GOOGLE_API_KEY}&language=pt-BR`;
    const response = await axios.get(url);
    return response.data.result;
  } catch (error) {
    console.error('Erro ao consultar detalhes do estabelecimento:', error.response?.data || error.message);
    throw error;
  }
};
