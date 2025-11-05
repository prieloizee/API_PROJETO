const axios = require('axios');
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

/**
 * 🔹 Busca estabelecimentos no Google Places
 * - Usa Nearby Search (por localização e tipo)
 * - Usa Text Search (quando há termo de busca)
 */
exports.buscarEstabelecimentosGoogle = async (location, radius, type, query) => {
  try {
    let resultados = [];
    let nextPageToken = null;
    let url;

    // 🔸 Se tiver query, usa o endpoint Text Search
    if (query && query.trim() !== "") {
      url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&language=pt-BR&key=${GOOGLE_API_KEY}`;

      // Pode incluir localização para priorizar lugares próximos
      if (location) {
        url += `&location=${location}`;
      }
      if (radius) {
        url += `&radius=${radius}`;
      }
    } else {
      // 🔸 Caso contrário, usa Nearby Search
      url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location}&radius=${radius}&type=${type}&language=pt-BR&key=${GOOGLE_API_KEY}`;
    }

    do {
      const response = await axios.get(url);
      const data = response.data;

      if (data.results && data.results.length > 0) {
        resultados = resultados.concat(data.results);
      }

      nextPageToken = data.next_page_token;

      if (nextPageToken) {
        // Espera o token ficar ativo (~2 segundos)
        await new Promise((resolve) => setTimeout(resolve, 2000));
        // Atualiza URL para a próxima página
        url = `https://maps.googleapis.com/maps/api/place/${
          query ? 'textsearch' : 'nearbysearch'
        }/json?pagetoken=${nextPageToken}&language=pt-BR&key=${GOOGLE_API_KEY}`;
      }
    } while (nextPageToken && resultados.length < 60);

    return resultados;
  } catch (error) {
    console.error('❌ Erro ao consultar Google Maps:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * 🔹 Busca detalhes de um estabelecimento específico pelo place_id
 */
exports.buscarDetalhesEstabelecimento = async (placeId) => {
  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&language=pt-BR&key=${GOOGLE_API_KEY}`;
    const response = await axios.get(url);
    return response.data.result;
  } catch (error) {
    console.error('❌ Erro ao consultar detalhes do estabelecimento:', error.response?.data || error.message);
    throw error;
  }
};
