const router = require('express').Router();
const verifyJWT = require("../services/verifyJWT");
const usuarioController = require('../controllers/usuarioController');
const estabelecimentosController = require('../controllers/estabelecimentoController');
const avaliacaoController= require ('../controllers/avaliacaoController');
const favoritosController = require('../controllers/favoritosController');

//rotas userController
 router.post('/user', usuarioController.createUsuario);
 router.post('/login', usuarioController.loginUsuario);

 router.get('/user',verifyJWT, usuarioController.getAllUsers)
 router.delete("/user/:id", verifyJWT,usuarioController.deleteUser);
 router.put('/user', verifyJWT, usuarioController.updateUser);
 

 //rotas para estabelecimentoController
 router.get('/buscar', estabelecimentosController.buscarEstabelecimentos);
 //http://localhost:3000/projeto_final/buscar?location=-20.5381,-47.4008&radius=17000&type=restaurant
 //http://localhost:3000/projeto_final/buscar?location=-20.5381,-47.4008&radius=17000&type=park
 //http://localhost:3000/projeto_final/buscar?location=-20.5381,-47.4008&radius=17000&type=store

 router.get('/buscar/:id', estabelecimentosController.buscarPorId);
 //http://localhost:3000/projeto_final/buscar/ ID



//router avaliaçoes
router.post("/avaliacao",verifyJWT,avaliacaoController.create);
router.get("avaliacoes/:google_place_id", avaliacaoController.listByPlace);
router.put("/avaliacao",verifyJWT, avaliacaoController.update);
router.delete("/:id_avaliacao",verifyJWT,avaliacaoController.delete);

//http://localhost:3000/projeto_final/avaliacao



// Favoritos
router.post("/favoritos", verifyJWT, favoritosController.adicionaFavorito);
// Lista todos os favoritos do usuário logado
router.get("/favoritos", verifyJWT, favoritosController.getFavoritos);
// Remove favorito pelo google_place_id (passado no body)
// Para remover favorito
router.delete("/favoritos/:id_favorito", verifyJWT, favoritosController.removeFavorito);




module.exports = router;

