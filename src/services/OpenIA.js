const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function interpretarFiltro(texto) {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `
Você é um analisador de intenção.
O usuário vai digitar o que quer encontrar na cidade.
Retorne apenas um JSON com:
{
  "type": "tipo de estabelecimento (pizzaria, bar, restaurante, etc.)",
  "filtro_extra": "informações adicionais se houver"
}
        `
      },
      { role: "user", content: texto }
    ],
    temperature: 0
  });

  return JSON.parse(completion.choices[0].message.content);
}

module.exports = { interpretarFiltro };
