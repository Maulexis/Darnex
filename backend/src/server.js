import express from "express";
import http from "http";
import { Server } from "socket.io";
import { createClient } from "redis";

import apiRoutes from "./routes/api.js";
import { initializeSimulation, simulateMovement } from "./services/trainSimulator.js";

const app = express();
const server = http.createServer(app);

// Socket.IO (basic; adjust CORS if your frontend runs on a different origin)
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

// middleware FIRST
app.use(express.json());

// mount API routes ONCE
app.use("/api", apiRoutes);

const PORT = process.env.PORT || 3001;

// optional: Redis (don’t crash the server if Redis isn’t running)
const redisClient = createClient();
redisClient.on("error", (err) => console.log("Redis Client Error:", err));

async function main() {
  // connect Redis if available
  try {
    await redisClient.connect();
    console.log("Connected to Redis!");
  } catch (e) {
    console.warn("⚠️ Redis not available. Continuing without it.");
  }

  // initialize your simulation (if it needs Redis and failed, make sure it handles that gracefully)
  try {
    await initializeSimulation();
  } catch (e) {
    console.warn("⚠️ initializeSimulation failed:", e.message);
  }

  // periodic movement updates via socket
  setInterval(async () => {
    try {
      await simulateMovement(io);
    } catch (e) {
      console.warn("⚠️ simulateMovement error:", e.message);
    }
  }, 5000);

  // socket connections
  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);
    socket.on("disconnect", () => console.log(`User disconnected: ${socket.id}`));
  });

  server.listen(PORT, () =>
    console.log(`Server running at http://localhost:${PORT}`)
  );
}

main();
