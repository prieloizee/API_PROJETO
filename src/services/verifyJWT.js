const jwt = require("jsonwebtoken");

// pega dados e responde a requisição
function verifyJWT(req, res, next) {
  let token = req.headers["authorization"];

  if (!token) {
    return res.status(401).json({ auth: false, message: "Token não foi fornecido" });
  }

  // Remove "Bearer " se existir
  if (token.startsWith("Bearer ")) {
    token = token.slice(7, token.length);
  }

  jwt.verify(token, process.env.SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ auth: false, message: "Falha na autenticação do token" });
    }

    req.user = { id_usuario: decoded.id_usuario };
    next();
  });
}


module.exports = verifyJWT;
