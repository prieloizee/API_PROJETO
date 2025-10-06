const router = require("express").Router();
const verifyJWT = require("../services/verifyJWT");
const usuarioController = require("../controllers/usuarioController");
const estabelecimentosController = require("../controllers/estabelecimentoController");
const avaliacaoController = require("../controllers/avaliacaoController");
const favoritosController = require("../controllers/favoritosController");
const upload = require("../services/upload");


// Rotas do Usuário
//Solicitar código de verificação para cadastro 
router.post("/user/cadastro", usuarioController.solicitarCodigo);
//  Confirmar código e criar usuário
router.post("/user/confirm", usuarioController.confirmarCodigo);
// Login
router.post("/login", usuarioController.loginUsuario);
//  Solicitar redefinição de senha (esqueceu senha)
router.post("/user/redefinir", usuarioController.solicitarRedefinicaoSenha);
// Resetar senha com código enviado por e-mail
router.post("/user/reset-password", usuarioController.resetarSenha);
// Buscar usuário por ID
router.get("/user/:id", usuarioController.getUsuarioById);
//  Atualizar usuário (com upload de imagem)
router.put("/user", upload.single("imagem"), verifyJWT, usuarioController.updateUserWithImage);
//  Deletar usuário
router.delete("/user/:id", verifyJWT, usuarioController.deleteUser);



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
