// src/routes/api.js (ESM)

import express from "express";
import { query } from "../services/db.js";             // your DB helper (ESM named export)
import mapLayoutRouter from "../api/maplayout.js";     // your router that ends with `export default router`

const router = express.Router();

/**
 * Mount the map-layout router.
 * Since maplayout.js already defines GET '/map-layout',
 * mounting here means it will be available at:  /api/map-layout
 */
router.use("/", mapLayoutRouter);

/**
 * Snapshot for a station
 * - Uses schema columns that actually exist in your DB.
 * - Trains list is derived from timetable_events around 'now' for the station.
 */
router.get("/v1/sections/:station_code/snapshot", async (req, res) => {
  const { station_code } = req.params;

  try {
    // 1) find the station
    const station =
      (await query("SELECT * FROM stations WHERE code = $1", [station_code]))
        .rows[0];

    if (!station) {
      return res.status(404).json({ error: "Station not found" });
    }

    // 2) platforms
    const platforms = (
      await query(
        "SELECT id, platform_no, length_m FROM platforms WHERE station_id=$1 ORDER BY platform_no",
        [station.id]
      )
    ).rows;

    // 3) tracks touching this station
    const tracks = (
      await query(
        `
        SELECT
          t.id AS track_id,
          s1.code AS from_station_code,
          s2.code AS to_station_code,
          t.distance_km,
          t.length_m,
          t.type,
          t.allowed_speed
        FROM tracks t
        JOIN stations s1 ON t.from_station = s1.id
        JOIN stations s2 ON t.to_station   = s2.id
        WHERE s1.id = $1 OR s2.id = $1
        ORDER BY t.id
        `,
        [station.id]
      )
    ).rows;

    // 4) trains scheduled at this station (window: past 1h to next 6h)
    const trainsAtStation = (
      await query(
        `
        SELECT
          t.train_no,
          t.name,
          t.type,
          te.platform_no,
          te.delay_minutes,
          te.scheduled_arrival,
          te.actual_arrival,
          te.scheduled_departure,
          te.actual_departure
        FROM timetable_events te
        JOIN trains t ON t.id = te.train_id
        WHERE te.station_id = $1
          AND te.scheduled_arrival BETWEEN now() - interval '1 hour' AND now() + interval '6 hours'
        ORDER BY te.scheduled_arrival ASC
        LIMIT 100
        `,
        [station.id]
      )
    ).rows;

    const trains = trainsAtStation.map((r) => ({
      train_no: r.train_no,
      name: r.name,
      type: r.type,
      platform_no: r.platform_no,
      delay_minutes: r.delay_minutes,
      scheduled_arrival: r.scheduled_arrival,
      actual_arrival: r.actual_arrival,
      scheduled_departure: r.scheduled_departure,
      actual_departure: r.actual_departure,
    }));

    // payload
    res.json({
      station: {
        id: station.id,
        code: station.code,
        name: station.name,
        lat: station.lat,
        lon: station.lon,
      },
      platforms,
      tracks,
      trains,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("snapshot error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * Train details by train_no
 * - timetable from timetable_events
 * - movements from train_movements joined with tracks to expose from/to station codes
 */
router.get("/v1/trains/:train_no", async (req, res) => {
  const { train_no } = req.params;

  try {
    // find the train
    const train =
      (await query("SELECT * FROM trains WHERE train_no = $1", [train_no]))
        .rows[0];

    if (!train) {
      return res.status(404).json({ error: "Train not found" });
    }

    // timetable for this train
    const timetable = (
      await query(
        `
        SELECT
          te.scheduled_arrival,
          te.actual_arrival,
          te.scheduled_departure,
          te.actual_departure,
          te.platform_no,
          te.delay_minutes,
          te.order_no,
          s.code AS station_code,
          s.name AS station_name
        FROM timetable_events te
        JOIN stations s ON s.id = te.station_id
        WHERE te.train_id = $1
        ORDER BY te.order_no ASC
        `,
        [train.id]
      )
    ).rows;

    // movements for this train (latest first), with from/to station codes via track
    const movements = (
      await query(
        `
        SELECT
          tm.entry_time,
          tm.exit_time,
          tm.actual_arrival,
          tm.delay_minutes,
          tm.status,
          tm.speed_kmph,
          tm.track_id,
          s1.code AS from_station_code,
          s2.code AS to_station_code
        FROM train_movements tm
        JOIN tracks tr ON tr.id = tm.track_id
        JOIN stations s1 ON s1.id = tr.from_station
        JOIN stations s2 ON s2.id = tr.to_station
        WHERE tm.train_id = $1
        ORDER BY tm.entry_time DESC
        LIMIT 200
        `,
        [train.id]
      )
    ).rows;

    res.json({
      train: {
        id: train.id,
        train_no: train.train_no,
        name: train.name,
        type: train.type,
      },
      timetable,
      movements,
    });
  } catch (err) {
    console.error("train details error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * Sim command placeholder (as you had)
 */
router.post("/v1/sim/command", (req, res) => {
  const { train_no, command } = req.body || {};
  console.log(`Command '${command}' received for train ${train_no}`);
  res.json({ status: "success", message: `Command '${command}' received for train ${train_no}` });
});

export default router;
