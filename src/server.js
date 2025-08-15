const app = require("./index");
const cors = require('cors');

// Configuração do CORS com origens permitidas
const corsOptions = {
  origin: '*', // Substitua pela origem permitida
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Métodos HTTP permitidos
  credentials: true, // Permite o uso de cookies e credenciais
  optionsSuccessStatus: 204, // Define o status de resposta para o método OPTIONS
};

// Aplicando o middleware CORS no app
app.use(cors(corsOptions));
app.listen(3000);