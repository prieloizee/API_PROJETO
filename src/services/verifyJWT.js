const jwt = require("jsonwebtoken");

//pega dados e responde a requisição
function verifyJWT(req, res, next){
    const token = req.headers["authorization"]

    if(!token){
        //auth pra ver se o usuario esta autenticado
        return res.status(401).json({auth:false, message:"Token não foi fornecido"})
    }

    //acessa e configura
    jwt.verify(token, process.env.SECRET,(err, decoded) => {
        if(err){
            return res.status(403)({auth:false, message:"Falha na autenticação do token"})
        }
        req.userId = decoded.id;
        //função garante o fluxo da requisição do http
        //deixa o próximo fluxo funcionar
        next();
    })
}
module.exports = verifyJWT;