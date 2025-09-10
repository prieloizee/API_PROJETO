const router = require('express').Router();
const verifyJWT = require("../services/verifyJWT");
const usuarioController = require('../controllers/usuarioController');
const estabelecimentosController = require('../controllers/estabelecimentoController');
const avaliacaoController= require ('../controllers/avaliacaoController');


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
router.get("/:google_place_id", avaliacaoController.listByPlace);
router.put("/avaliacao",verifyJWT, avaliacaoController.update);
router.delete("/:id_avaliacao",verifyJWT,avaliacaoController.delete);

//http://localhost:3000/projeto_final/avaliacao

const favoritosController = require('../controllers/favoritosController');

// Favoritos
router.post("/favoritos", verifyJWT, favoritosController.adicionaFavorito);
router.get("/favoritos", verifyJWT, favoritosController.listFavoritos);
router.delete("/favoritos/:id_favorito", verifyJWT, favoritosController.removeFavorito);


//TESTE
router.post('/favoritos/test/:id_usuario', favoritosController.adicionaFavorito);
// Listar favoritos de um usuário específico (teste)
router.get('/favoritos/test/:id_usuario', favoritosController.listFavoritos);
// Remover favorito de um usuário específico (teste)
router.delete('/favoritos/test/:id_usuario/:id_favorito', favoritosController.removeFavorito);


module.exports = router;

