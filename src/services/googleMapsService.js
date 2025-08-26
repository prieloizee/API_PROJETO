const axios = require('axios');
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

exports.buscarEstabelecimentosGoogle = async (location, radius, type) => {
  try {
    //Procura na api os estabelecimentos
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location}&radius=${radius}&type=${type}&key=${GOOGLE_API_KEY}&language=pt-BR`;
    //envia um get para a api do google
    const response = await axios.get(url);
    return response.data.results;
  } catch (error) {
    console.error('Erro ao consultar Google Maps:', error);
    throw error;
  }
};

exports.buscarDetalhesEstabelecimento = async (placeId) => {
  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${GOOGLE_API_KEY}&language=pt-BR`;
    const response = await axios.get(url);
    return response.data.result;
  } catch (error) {
    console.error('Erro ao consultar detalhes do estabelecimento:', error);
    throw error;
  }
};
