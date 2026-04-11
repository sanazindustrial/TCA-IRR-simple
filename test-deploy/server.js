const http = require("http"); http.createServer((req, res) => { res.writeHead(200); res.end("Test OK"); }).listen(process.env.PORT || 8080);
