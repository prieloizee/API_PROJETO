// index.js
const express = require("express");
const cors = require("cors");
require("dotenv-safe").config();
const testConnect = require("./db/testConnect"); // importando a função

class AppController {
  constructor() {
    this.express = express();
    this.middlewares();
    this.routes();

    // Testa a conexão ao iniciar a aplicação
    testConnect();
  }

  middlewares() {
    this.express.use(express.json());
    this.express.use(cors());
  }

  routes() {
    // Aqui você coloca suas rotas
    const apiRoutes = require("./routes/apiRoutes"); // ajuste para seu arquivo de rotas
    this.express.use("/projeto_final/", apiRoutes);
  }
}

// Exporta a instância do Express configurada
module.exports = new AppController().express;
