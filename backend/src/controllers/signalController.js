// src/controllers/signalController.js
import { query } from "../services/db.js";

/**
 * Get all signals
 */
export async function getSignals(req, res) {
  try {
    const result = await query("SELECT * FROM signals ORDER BY id");
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching signals:", err);
    res.status(500).json({ error: "Failed to fetch signals" });
  }
}

/**
 * Get one signal by ID
 */
export async function getSignalById(req, res) {
  try {
    const { id } = req.params;
    const result = await query("SELECT * FROM signals WHERE id=$1", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Signal not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Error fetching signal:", err);
    res.status(500).json({ error: "Failed to fetch signal" });
  }
}

/**
 * Update a signal's status (e.g., RED, YELLOW, GREEN)
 */
export async function updateSignal(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["RED", "YELLOW", "GREEN"].includes(status)) {
      return res.status(400).json({ error: "Invalid signal status" });
    }

    await query("UPDATE signals SET status=$1 WHERE id=$2", [status, id]);
    res.json({ message: `✅ Signal ${id} updated to ${status}` });
  } catch (err) {
    console.error("❌ Error updating signal:", err);
    res.status(500).json({ error: "Failed to update signal" });
  }
}
