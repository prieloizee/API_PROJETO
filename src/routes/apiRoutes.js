const router = require("express").Router();
const verifyJWT = require("../services/verifyJWT");
const usuarioController = require("../controllers/usuarioController");
const estabelecimentosController = require("../controllers/estabelecimentoController");
const avaliacaoController = require("../controllers/avaliacaoController");
const favoritosController = require("../controllers/favoritosController");
const upload = require("../services/upload");

// ------------------ ROTAS USUÁRIO ------------------

// Criar usuário (sem imagem)
router.post("/user", usuarioController.createUsuario);

// Login
router.post("/login", usuarioController.loginUsuario);

// Recuperação de senha
router.post("/user/recovery-code", usuarioController.sendRecoveryCode); // envia código por email
router.post("/user/verify-recovery-code", usuarioController.verifyRecoveryCode); // verifica código
router.post("/user/reset-password", usuarioController.resetPassword); // redefine senha

// Listar usuário por ID
router.get("/user/:id", usuarioController.getUsuarioById);

// Listar todos usuários (precisa estar logado)
router.get("/user", verifyJWT, usuarioController.getAllUsers);

// Atualizar usuário com imagem (precisa estar logado)
router.put("/user", upload.single("imagem"), verifyJWT, usuarioController.updateUserWithImage);

// Deletar usuário
router.delete("/user/:id", verifyJWT, usuarioController.deleteUser);

// ------------------ ROTAS ESTABELECIMENTO ------------------
router.get("/buscar", estabelecimentosController.buscarEstabelecimentos);
router.get("/buscar/:id", estabelecimentosController.buscarPorId);

// ------------------ ROTAS AVALIAÇÃO ------------------
router.post("/avaliacao", verifyJWT, avaliacaoController.create);
router.get("/avaliacoes/:google_place_id", avaliacaoController.listByPlace);
router.put("/avaliacao", verifyJWT, avaliacaoController.update);
router.delete("/:id_avaliacao", verifyJWT, avaliacaoController.delete);

// ------------------ ROTAS FAVORITOS ------------------
router.post("/favoritos", verifyJWT, favoritosController.adicionaFavorito);
router.get("/favoritos", verifyJWT, favoritosController.getFavoritos);
router.delete("/favoritos/:id_favorito", verifyJWT, favoritosController.removeFavorito);

module.exports = router;
