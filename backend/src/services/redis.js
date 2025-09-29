// src/services/redis.js
import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

// Use env var if available, fallback to local Redis
const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

// ✅ Handle connection events
redis.on("connect", () => {
  console.log("✅ Connected to Redis!");
});

redis.on("error", (err) => {
  console.error("❌ Redis connection error:", err);
});

export default redis;
