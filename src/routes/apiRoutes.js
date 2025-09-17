const router = require('express').Router();
const verifyJWT = require("../services/verifyJWT");
const usuarioController = require('../controllers/usuarioController');
const estabelecimentosController = require('../controllers/estabelecimentoController');
const avaliacaoController= require ('../controllers/avaliacaoController');


//rotas userController
 router.post('/user', usuarioController.createUsuario);
 router.post('/login', usuarioController.loginUsuario);
 router.get("/user/:id", usuarioController.getUsuarioById);
 router.get('/user',verifyJWT, usuarioController.getAllUsers)
 router.delete("/user/:id", verifyJWT,usuarioController.deleteUser);
 router.put('/user', verifyJWT, usuarioController.updateUser);
 

 //rotas para estabelecimento
 router.get('/buscar', estabelecimentosController.buscarEstabelecimentos);
 //http://localhost:3000/projeto_final/buscar?location=-20.5381,-47.4008&radius=17000&type=restaurant
 //http://localhost:3000/projeto_final/buscar?location=-20.5381,-47.4008&radius=17000&type=park
 //http://localhost:3000/projeto_final/buscar?location=-20.5381,-47.4008&radius=17000&type=store

 router.get('/buscar/:id', estabelecimentosController.buscarPorId);
 //http://localhost:3000/projeto_final/buscar/ ID



//router avaliaçoes
router.post("/avaliacao",verifyJWT,avaliacaoController.create);
router.get("/:google_place_id",verifyJWT, avaliacaoController.listByPlace);
router.put("/avaliacao",verifyJWT, avaliacaoController.update);
router.delete("/:id_avaliacao",verifyJWT,avaliacaoController.delete);

//http://localhost:3000/projeto_final/avaliacao



module.exports = router;

