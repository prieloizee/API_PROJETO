const router = require("express").Router();
const verifyJWT = require("../services/verifyJWT");
const usuarioController = require("../controllers/usuarioController");
const estabelecimentosController = require("../controllers/estabelecimentoController");
const avaliacaoController = require("../controllers/avaliacaoController");
const favoritosController = require("../controllers/favoritosController");
const upload = require("../services/upload");

// Rotas do Usuário
router.post("/user", usuarioController.createUsuario); // Criar usuário (não envia imagem aqui)
router.post("/login", usuarioController.loginUsuario); // Login
router.post("/user/verify-code", usuarioController.verifyEmailCode); // Verificação de email
router.get("/user/:id", usuarioController.getUsuarioById); // Buscar usuário por ID
router.get("/user", verifyJWT, usuarioController.getAllUsers); // Listar todos (precisa estar logado)
router.put("/user", upload.single("imagem"), verifyJWT, usuarioController.updateUserWithImage); // Atualizar usuário
router.delete("/user/:id", verifyJWT, usuarioController.deleteUser); // Deletar usuário

// Rotas para estabelecimento
router.get("/buscar", estabelecimentosController.buscarEstabelecimentos);
// Ex.: /buscar?location=-20.5381,-47.4008&radius=17000&type=restaurant
router.get("/buscar/:id", estabelecimentosController.buscarPorId);

// Rotas de avaliações
router.post("/avaliacao", verifyJWT, avaliacaoController.create);
router.get("/avaliacoes/:google_place_id", avaliacaoController.listByPlace);
router.put("/avaliacao", verifyJWT, avaliacaoController.update);
router.delete("/:id_avaliacao", verifyJWT, avaliacaoController.delete);

// Rotas de favoritos
router.post("/favoritos", verifyJWT, favoritosController.adicionaFavorito);
router.get("/favoritos", verifyJWT, favoritosController.getFavoritos);
router.delete("/favoritos/:id_favorito", verifyJWT, favoritosController.removeFavorito);

module.exports = router;
