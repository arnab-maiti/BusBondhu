import http from "node:http";
import process from "node:process";
import dotenv from "dotenv";
import { Server } from "socket.io";
import app from "./app.js";
import { initBusSocket } from "./sockets/bus.socket.js";

dotenv.config();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

app.set("io", io);

initBusSocket(io);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`BusBondhu server running on port ${PORT}`);
});

export { server, io };
export default server;
