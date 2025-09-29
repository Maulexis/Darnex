// src/routes/signals.js
import express from "express";
import { query } from "../services/db.js";

const router = express.Router();

/**
 * 🚦 GET all signals
 * Example: GET /signals
 */
router.get("/", async (req, res) => {
  try {
    const { rows } = await query("SELECT * FROM signals ORDER BY id ASC");
    res.json(rows);
  } catch (err) {
    console.error("❌ Error fetching signals:", err);
    res.status(500).json({ error: "Failed to fetch signals" });
  }
});

/**
 * 🚦 Update a signal manually
 * Example: PUT /signals/1 { "status": "RED" }
 */
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["RED", "YELLOW", "GREEN"].includes(status)) {
      return res.status(400).json({ error: "Invalid signal status" });
    }

    await query("UPDATE signals SET status=$1 WHERE id=$2", [status, id]);
    res.json({ message: `🚦 Signal ${id} updated to ${status}` });
  } catch (err) {
    console.error("❌ Error updating signal:", err);
    res.status(500).json({ error: "Failed to update signal" });
  }
});

/**
 * 🚦 Auto-cycle signals
 * This is called from server.js in a background loop.
 */
export async function autoCycleSignals(io) {
  try {
    // fetch all signals
    const { rows: signals } = await query("SELECT * FROM signals ORDER BY id ASC");

    for (const signal of signals) {
      let newStatus;

      // simple cycle RED → GREEN → YELLOW → RED
      if (signal.status === "RED") newStatus = "GREEN";
      else if (signal.status === "GREEN") newStatus = "YELLOW";
      else newStatus = "RED";

      await query("UPDATE signals SET status=$1 WHERE id=$2", [newStatus, signal.id]);

      // log to backend
      console.log(`🚦 Signal ${signal.id} switched to ${newStatus}`);

      // notify frontend via socket.io
      if (io) {
        io.emit("signalUpdate", {
          id: signal.id,
          track_id: signal.track_id,
          status: newStatus,
        });
      }
    }
  } catch (err) {
    console.error("❌ Error auto-cycling signals:", err);
  }
}

export default router;
