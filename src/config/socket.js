const socketio = require("socket.io");
const config = require("./env");
const { ioRedisClient, getPubSub } = require("./ioredis");
const { createAdapter } = require("@socket.io/redis-adapter");

const loadSocket = (server) => {
  let io = socketio(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) {
          callback(null, true);
        }
        const allowedorigin = config.SOCKET.allowedorigins
          ? config.SOCKET.allowedorigins.split(",")
          : [];
        if (allowedorigin.includes(origin) || allowedorigin.includes("*")) {
          callback(null, true);
        } else {
          callback(new Error("not supported by cors"));
        }
      },

      // 'true' to allow browser to send send credential with request
      credentials: config.SOCKET.crdentials,
      methods: config.SOCKET.methods.split(","),
      transports: config.SOCKET.transport.split(","),
      pingTimeout: config.SOCKET.pingtimeout,
      pingInterval: config.SOCKET.pinginterval,
      connectionStateRecovery: {
        // the backup duration of the sessions and the packets
        maxDisconnectionDuration: config.SOCKET.maxdisconnectiontime,
        // whether to skip middlewares upon successful recovery
        skipMiddlewares: config.SOCKET.skipmiddleware,
      },
    },
  });

  const { pub, sub } = getPubSub();
  io.adapter(createAdapter(pub, sub));

  io.on("connection", (socket) => {
    console.log("connect with client " + socket.id);
    // const call = ioRedisClient();
    // console.log(call);
    // socketService.handleConnection(socket, io);

    socket.on("disconnect", (reason) => {
      console.log(`client disconnect: ${socket.id} (${reason})`);
    });
  });
  return io;
};

module.exports = loadSocket;
