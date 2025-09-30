// src/services/redis.js
import Redis from "ioredis";

const redis = new Redis({
  host: "127.0.0.1",   // Redis server address
  port: 6379,          // Redis default port
});

redis.on("connect", () => {
  console.log("✅ Redis connected");
});

redis.on("error", (err) => {
  console.error("❌ Redis error:", err);
});

export default redis;
