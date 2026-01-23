const http = require("http");
const app = require("./app");
const config = require("./src/config/env");
const loadSocket = require('./src/config/socket')

const server = http.createServer(app);

const PORT = config.PORT || 3000;
server.listen(PORT, () => {
  console.log("server is running");
});

const io = loadSocket(server)



// module.exports = {
//     app,
//     io
// }
