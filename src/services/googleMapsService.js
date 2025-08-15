const axios = require('axios');

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

exports.buscarEstabelecimentosGoogle = async (location, radius, type) => {
  try {
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location}&radius=${radius}&type=${type}&key=${GOOGLE_API_KEY}`;
    
    const response = await axios.get(url);

    return response.data.results; // Retorna só a lista de estabelecimentos
  } catch (error) {
    console.error('Erro ao consultar Google Maps:', error);
    throw error;
  }
};
