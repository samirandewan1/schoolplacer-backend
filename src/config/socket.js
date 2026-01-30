import { createAdapter } from "@socket.io/redis-adapter";
import { Server } from "socket.io";
import config from "./env.js";
import redisClient from "./redis.js";

let io;
const socketService = {
  init: (server) => {
    io = new Server(server, {
      cors: {
        origin: (origin, callback) => {
          if (!origin) {
            return callback(null, true);
          }

          const allowedOrigins = config.SOCKET.allowedorigins
            ? config.SOCKET.allowedorigins.split(",")
            : [];

          if (allowedOrigins.includes(origin) || allowedOrigins.includes("*")) {
            callback(null, true);
          } else {
            console.log("Not supported by CORS");
            callback(new Error("Not supported by CORS"));
          }
        },
        credentials: config.SOCKET.credentials,
        methods: config.SOCKET.methods.split(","),
      },
      transports: config.SOCKET.transport.split(","),
      pingTimeout: config.SOCKET.pingtimeout,
      pingInterval: config.SOCKET.pinginterval,
      connectionStateRecovery: {
        maxDisconnectionDuration: config.SOCKET.maxdisconnectiontime,
        skipMiddlewares: config.SOCKET.skipmiddleware,
      },
    });
    return io;
  },

  getIO: () => {
    if (!io) {
      throw new Error("Socket.io not initialized!");
    }
    return io;
  },
};
export default socketService;
