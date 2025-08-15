const multer = require("multer");

//salva na memoria ram
const storage = multer.memoryStorage(); 

const upload = multer({storage});

module.exports = upload;