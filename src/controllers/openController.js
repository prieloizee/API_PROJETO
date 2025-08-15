// controllers/estabelecimentosController.js
import { interpretarFiltro, buscarEstabelecimentos } from "../services/estabelecimentosService.js";

export const getEstabelecimentos = async (req, res) => {
  try {
    const { texto } = req.body; // texto digitado pelo usuário

    // 1. Interpretar o texto com ChatGPT
    const filtro = await interpretarFiltro(texto);

    // 2. Buscar no Google Maps usando o filtro retornado
    const resultados = await buscarEstabelecimentos(filtro);

    res.json(resultados);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar estabelecimentos" });
  }
};
