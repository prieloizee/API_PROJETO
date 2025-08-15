
const { buscarEstabelecimentosGoogle, buscarDetalhesEstabelecimento } = require('../services/googleMapsService');
const pool = require('../db/connect').promise(); // Usando versão promise do pool

// Função para salvar/atualizar estabelecimento e horários
async function salvarEstabelecimento(est) {
  const queryEst = `
    INSERT INTO estabelecimentos
    (place_id, nome, endereco, cidade, categoria, telefone, site, avaliacao, latitude, longitude)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      nome = VALUES(nome),
      endereco = VALUES(endereco),
      cidade = VALUES(cidade),
      categoria = VALUES(categoria),
      telefone = VALUES(telefone),
      site = VALUES(site),
      avaliacao = VALUES(avaliacao),
      latitude = VALUES(latitude),
      longitude = VALUES(longitude)
  `;
  await pool.query(queryEst, [
    est.place_id,
    est.nome,
    est.endereco,
    est.cidade,
    est.categoria,
    est.telefone,
    est.site,
    est.avaliacao,
    est.latitude,
    est.longitude
  ]);

  // Salvar horários
  if (est.horarios && est.horarios.length > 0) {
    for (const texto of est.horarios) {
      const [dia, horario] = texto.split(': ');
      const queryHorarios = `
        INSERT INTO horarios (place_id, dia_semana, horario)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE horario = VALUES(horario)
      `;
      await pool.query(queryHorarios, [est.place_id, dia, horario]);
    }
  }
}

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

          if (!enderecoCompleto.toLowerCase().includes('franca')) continue;

          const estFormatado = {
            nome: est.name,
            endereco: enderecoCompleto,
            cidade: 'Franca',
            categoria: est.types ? est.types[0] : 'Não especificada',
            telefone: detalhes?.formatted_phone_number || null,
            site: detalhes?.website || null,
            avaliacao: est.rating || null,
            latitude: est.geometry?.location?.lat || null,
            longitude: est.geometry?.location?.lng || null,
            place_id: est.place_id,
            horarios: detalhes?.opening_hours?.weekday_text || []
          };

          await salvarEstabelecimento(estFormatado);
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

  // Buscar detalhes por place_id
  static async buscarPorId(req, res) {
    const { id } = req.params;


    if (!id) return res.status(400).json({ message: "Parâmetro obrigatório: id" });

    try {
      const detalhes = await buscarDetalhesEstabelecimento(id);
      if (!detalhes) return res.status(404).json({ message: "Estabelecimento não encontrado" });

      return res.status(200).json({
        nome: detalhes.name,
        endereco: detalhes.formatted_address,
        telefone: detalhes.formatted_phone_number || null,
        site: detalhes.website || null,
        avaliacao: detalhes.rating || "Não avaliado",
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
