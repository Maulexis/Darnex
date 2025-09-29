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
