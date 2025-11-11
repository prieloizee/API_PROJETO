const router = require("express").Router();
const multer = require("multer");
const upload = multer(); // salva o arquivo em memória (req.file.buffer)

const verifyJWT = require("../services/verifyJWT");
const usuarioController = require("../controllers/usuarioController");
const estabelecimentosController = require("../controllers/estabelecimentoController");
const avaliacaoController = require("../controllers/avaliacaoController");
const favoritosController = require("../controllers/favoritosController");


// Rotas do Usuário
router.post("/user", usuarioController.solicitarCodigo);
router.post("/user/confirm", usuarioController.confirmarCodigo);
router.post("/login", usuarioController.loginUsuario);
router.post("/user/redefinir", usuarioController.solicitarRedefinicaoSenha);
router.post("/user/reset-password", usuarioController.resetarSenha);
router.get("/user/:id", usuarioController.getUsuarioById);
router.put("/user", upload.single("imagem"), verifyJWT, usuarioController.updateUserWithImage);
router.delete("/user/:id", verifyJWT, usuarioController.deleteUser);
router.get("/user", verifyJWT, usuarioController.getAllUsers);
router.get("/user/:id/imagem", usuarioController.getImagemPerfil);


// Rotas para estabelecimentos
router.get("/buscar", estabelecimentosController.buscarEstabelecimentos);
router.get("/buscar/:id", estabelecimentosController.buscarPorId);



// Rotas para avaliações
router.post("/avaliacao", verifyJWT, avaliacaoController.create);
router.get("/avaliacoes/:google_place_id", avaliacaoController.listByPlace);
router.delete("/avaliacao/:id_avaliacao", verifyJWT, avaliacaoController.delete);
router.get("/avaliacao", verifyJWT, avaliacaoController.listByUser);

// Rotas de favoritos
router.post("/favoritos", verifyJWT, favoritosController.adicionaFavorito);
router.get("/favoritos", verifyJWT, favoritosController.getFavoritos);
router.delete("/favoritos/:id_favorito", verifyJWT, favoritosController.removeFavorito);

module.exports = router;
