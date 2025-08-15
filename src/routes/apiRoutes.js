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
 //http://localhost:3000/projeto_final/buscar?location=-20.5381,-47.4008&radius=2000&type=restaurant
 //http://localhost:3000/projeto_final/buscar?location=-20.5381,-47.4008&radius=2000&type=park
 //http://localhost:3000/projeto_final/buscar?location=-20.5381,-47.4008&radius=2000&type=store

//router avaliaçoes
router.post("/avaliacao", avaliacaoController.create);

// Listar comentários de um local
router.get("/:google_place_id", avaliacaoController.listByPlace);

// Atualizar comentário
router.put("/avaliacao", avaliacaoController.update);

// Deletar comentário
router.delete("/:id_avaliacao", avaliacaoController.delete);

//http://localhost:3000/projeto_final/avaliacao

module.exports = router;

