// src/routes/trains.js
import express from "express";
import { query } from "../services/db.js";

const router = express.Router();

// Get all trains
router.get("/", async (req, res) => {
  try {
    const result = await query(`
      SELECT t.id, t.train_no, t.name, t.type, t.priority, t.length_m,
             tm.status, tm.position_m, tm.next_station, tm.current_station
      FROM trains t
      LEFT JOIN train_movements tm ON tm.train_id = t.id
      ORDER BY t.id
      LIMIT 500;
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching trains:", err);
    res.status(500).json({ error: "Failed to fetch trains" });
  }
});

export default router;
