// src/routes/map.js
import express from "express";
import { query } from "../services/db.js";

const router = express.Router();

// 🚂 Get trains with positions mapped to lat/lon
router.get("/trains", async (req, res) => {
  try {
    const { rows } = await query(`
      SELECT tm.id, t.name, tm.position_m, tm.status,
             tk.id AS track_id,
             fs.lat AS from_lat, fs.lon AS from_lon,
             ts.lat AS to_lat, ts.lon AS to_lon,
             tk.length_m
      FROM train_movements tm
      JOIN trains t ON tm.train_id = t.id
      JOIN tracks tk ON tm.track_id = tk.id
      JOIN stations fs ON tk.from_station = fs.id
      JOIN stations ts ON tk.to_station = ts.id
      LIMIT 100
    `);

    const trains = rows.map(r => {
      const fromLat = Number(r.from_lat);
      const fromLon = Number(r.from_lon);
      const toLat = Number(r.to_lat);
      const toLon = Number(r.to_lon);

      const progress = Math.min(1, Number(r.position_m) / Number(r.length_m));

      const lat = fromLat + (toLat - fromLat) * progress;
      const lon = fromLon + (toLon - fromLon) * progress;

      return {
        id: r.id,
        name: r.name,
        status: r.status,
        lat,
        lon,
      };
    });

    res.json(trains);
  } catch (err) {
    console.error("❌ Error fetching trains:", err);
    res.status(500).json({ error: "Failed to fetch trains" });
  }
});

// 🚦 Get signals with positions mapped to lat/lon
router.get("/signals", async (req, res) => {
  try {
    const { rows } = await query(`
      SELECT s.id, s.status, s.position_km, s.track_id,
             fs.lat AS from_lat, fs.lon AS from_lon,
             ts.lat AS to_lat, ts.lon AS to_lon,
             tk.length_m
      FROM signals s
      JOIN tracks tk ON s.track_id = tk.id
      JOIN stations fs ON tk.from_station = fs.id
      JOIN stations ts ON tk.to_station = ts.id
    `);

    const signals = rows.map(r => {
      const fromLat = Number(r.from_lat);
      const fromLon = Number(r.from_lon);
      const toLat = Number(r.to_lat);
      const toLon = Number(r.to_lon);

      const pos_m = Number(r.position_km) * 1000;
      const progress = Math.min(1, pos_m / Number(r.length_m));

      const lat = fromLat + (toLat - fromLat) * progress;
      const lon = fromLon + (toLon - fromLon) * progress;

      return {
        id: r.id,
        name: `Signal ${r.id}`,
        status: r.status.toLowerCase(),
        lat,
        lon,
      };
    });

    res.json(signals);
  } catch (err) {
    console.error("❌ Error fetching signals:", err);
    res.status(500).json({ error: "Failed to fetch signals" });
  }
});

export default router;
