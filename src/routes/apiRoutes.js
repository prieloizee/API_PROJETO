const router = require("express").Router();
const multer = require("multer");
const upload = multer(); // salva o arquivo em memória (req.file.buffer)

const verifyJWT = require("../services/verifyJWT");
const usuarioController = require("../controllers/usuarioController");
const estabelecimentosController = require("../controllers/estabelecimentoController");
const avaliacaoController = require("../controllers/avaliacaoController");
const favoritosController = require("../controllers/favoritosController");

// rotas userController
router.post("/user", usuarioController.createUsuario);
router.post("/login", usuarioController.loginUsuario);
router.get("/user/:id", usuarioController.getUsuarioById);
router.get("/user", verifyJWT, usuarioController.getAllUsers);
router.delete("/user/:id", verifyJWT, usuarioController.deleteUser);
router.put(
  "/user",
  verifyJWT,
  upload.single("imagem"), // <- adiciona suporte a imagem
  usuarioController.updateUserWithImage
);

// rotas para estabelecimento
router.get("/buscar", estabelecimentosController.buscarEstabelecimentos);
// http://localhost:3000/projeto_final/buscar?location=-20.5381,-47.4008&radius=17000&type=restaurant
// http://localhost:3000/projeto_final/buscar?location=-20.5381,-47.4008&radius=17000&type=park
// http://localhost:3000/projeto_final/buscar?location=-20.5381,-47.4008&radius=17000&type=store

router.get("/buscar/:id", estabelecimentosController.buscarPorId);
// http://localhost:3000/projeto_final/buscar/ID

// router avaliações
router.post("/avaliacao", verifyJWT, avaliacaoController.create);
router.get("/avaliacoes/:google_place_id", avaliacaoController.listByPlace);
router.put("/avaliacao", verifyJWT, avaliacaoController.update);
router.delete("/:id_avaliacao", verifyJWT, avaliacaoController.delete);

// Favoritos
router.post("/favoritos", verifyJWT, favoritosController.adicionaFavorito);
// Lista todos os favoritos do usuário logado
router.get("/favoritos", verifyJWT, favoritosController.getFavoritos);
// Para remover favorito
router.delete(
  "/favoritos/:id_favorito",
  verifyJWT,
  favoritosController.removeFavorito
);

module.exports = router;
