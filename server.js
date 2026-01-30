import http from "http";
import { createAdapter } from "@socket.io/redis-adapter";
import app from "./app.js";
import config from "./src/config/env.js";
import redisManager from "./src/config//redis.js";
import socketService from "./src/config/socket.js";
import {VerifySocketConnection} from "./src/utils/verifysocketconnection.js";
import { connectToDatabase } from './src/config/mongo.js';
try {
  const PORT = config.PORT || 3000;
  await connectToDatabase();
  const redisClient = await redisManager.init();
  const server = http.createServer(app);
  const io = socketService.init(server);

  const pub = redisClient.pubClient;
  const sub = redisClient.subClient;
  io.adapter(createAdapter(pub, sub));

  io.on("connection", (socket) => {
    console.log("connected " + socket.id);
    VerifySocketConnection(socket);
    io.emit('testdata', 'verifying connection');
    socket.on("disconnect", (reason) => {
      console.log(`Client disconnected: ${socket.id} (${reason})`);
    });
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
} catch (error) {
  console.error("Failed to start server:", error);
  process.exit(1);
}
