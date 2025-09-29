// src/services/trainSimulator.js
import { query } from "./db.js";

const trainStates = {}; // In-memory state (optional for AI later)

// Initialize simulation by loading all trains
export async function initializeSimulation() {
  const trains = await query("SELECT id, train_no, name FROM trains");
  for (const train of trains.rows) {
    trainStates[train.train_no] = {
      ...train,
      position: 0,
      speed: 0,
      status: "stopped",
      nextStation: null,
      eta: null,
    };
  }
  console.log("🚂 Train simulation initialized with", trains.rows.length, "trains");
}

// Simulate movement (already present in your version)
export async function simulateMovement(io) {
  const res = await query(`
    SELECT tm.*, t.train_no, t.name,
           tk.length_m AS track_length,
           s.code AS current_station_code,
           ns.code AS next_station_code
    FROM train_movements tm
    JOIN trains t ON tm.train_id = t.id
    JOIN tracks tk ON tm.track_id = tk.id
    LEFT JOIN stations s ON tm.current_station = s.id
    LEFT JOIN stations ns ON tm.next_station = ns.id
    WHERE tm.status IN ('enroute', 'waiting_signal')
    LIMIT 50
  `);

  for (const train of res.rows) {
    let new_status = train.status;
    let new_position = parseFloat(train.position_m) || 0;
    let nextSignalId = null;

    // 1. Look up signals
    const signalRes = await query(
      "SELECT id, position_km, status FROM signals WHERE track_id = $1 ORDER BY position_km ASC",
      [train.track_id]
    );

    const signals = signalRes.rows.map(sig => ({
      ...sig,
      position_m: sig.position_km * 1000,
    }));

    const nextSignal = signals.find(sig => sig.position_m > new_position);
    if (nextSignal) {
      nextSignalId = nextSignal.id;
      if (nextSignal.status === "RED") {
        new_status = "waiting_signal";
        new_position = Math.min(new_position, nextSignal.position_m - 5);

        await query(
          "UPDATE train_movements SET signal_id=$1 WHERE id=$2",
          [nextSignal.id, train.id]
        );
      }
    }

    // 2. Move if not blocked
    if (new_status !== "waiting_signal") {
      const movement_step = (train.speed_kmph / 3.6) * 600; // fast-forward
      new_position += movement_step;

      if (new_position >= train.track_length) {
        new_status = "arrived";
        new_position = train.track_length;
      } else {
        new_status = "enroute";
      }
    }

    // 3. Update DB
    await query(
      "UPDATE train_movements SET position_m=$1, status=$2, next_signal_id=$3 WHERE id=$4",
      [new_position, new_status, nextSignalId, train.id]
    );

    // 4. Log changes
    if (train.status !== new_status) {
      console.log(
        `⚡ Train ${train.train_no} (${train.name}) → ${new_status} at ${Number(new_position).toFixed(1)}m (next signal: ${nextSignalId || "none"})`
      );
    }

    // 5. Emit updates
    if (io) {
      io.emit("trainUpdate", {
        train_no: train.train_no,
        name: train.name,
        current_status: {
          status: new_status,
          current_station: train.current_station_code,
          next_station: train.next_station_code,
          position_m: new_position,
          next_signal_id: nextSignalId,
        },
        timestamp: new Date(),
      });
    }
  }
}
