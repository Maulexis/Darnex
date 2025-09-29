
// src/server.js
import express from "express";
import http from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import { createClient } from "redis";

import { initializeSimulation, simulateMovement } from "./services/trainSimulator.js";
import trainsRouter from "./routes/trains.js";
import signalsRouter from "./routes/signals.js";

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// ✅ Redis
const redis = createClient({ url: process.env.REDIS_URL });
redis.on("connect", () => console.log("✅ Connected to Redis!"));
await redis.connect();

// ✅ Routes
app.use("/trains", trainsRouter);
app.use("/signals", signalsRouter);

app.get("/", (req, res) => {
  res.json({ message: "🚂 Railway Simulation API is running!" });
});

// ✅ Initialize simulation state
await initializeSimulation();

// ✅ Start simulation loop
setInterval(async () => {
  try {
    await simulateMovement(io); // move trains
    // later: call updateSignals(io) to change signals dynamically
  } catch (err) {
    console.error("❌ Error in simulation loop:", err);
  }
}, 2000); // every 2 seconds (adjust speed here)

import { autoCycleSignals } from "./routes/signals.js";

// start simulation loop for trains
setInterval(async () => {
  try {
    await simulateMovement(io);
  } catch (err) {
    console.error("❌ Error in train simulation loop:", err);
  }
}, 2000);

// start auto signal cycle loop
setInterval(async () => {
  try {
    await autoCycleSignals(io);
  } catch (err) {
    console.error("❌ Error in signal cycle loop:", err);
  }
}, 5000); // every 5s change signals

// ✅ Start server
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`🚉 Server running at http://localhost:${PORT}`);
});
=======
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

