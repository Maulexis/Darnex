// src/db/utils/generateDummyData.js
// Full corrected dummy-data generator for the prototype
// - Uses client from ../../services/db.js
// - Inserts data in correct FK order
// - Chunked bulk inserts for large volumes
// - Station list is exactly what you requested

import pool from "../../services/db.js";
import { faker } from "@faker-js/faker";

/* CONFIG */
const CHUNK = 1000;

/* UTILITIES */
function chunkArray(arr, size = CHUNK) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function bulkInsert(client, table, columns, rows, chunkSize = CHUNK) {
  if (!rows.length) return 0;
  const chunks = chunkArray(rows, chunkSize);
  let total = 0;
  for (const chunk of chunks) {
    const params = [];
    const vals = [];
    let idx = 1;
    for (const r of chunk) {
      const placeholder = r.map(() => `$${idx++}`).join(", ");
      vals.push(`(${placeholder})`);
      params.push(...r);
    }
    const q = `INSERT INTO ${table} (${columns.join(", ")}) VALUES ${vals.join(", ")}`;
    await client.query(q, params);
    total += chunk.length;
  }
  return total;
}

/* USER-SUPPLIED / FIXED STATIONS (you asked these exact ones) */
const FIXED_STATIONS = [
  { code: "BSGD", name: "Bais Godam", distance: 2.0 },
  { code: "DKBJ", name: "Dahar Ka Balaji", distance: 3.0 },
  { code: "GADJ", name: "Jaipur Gandhinagar", distance: 5.0 },
  { code: "DPA",  name: "Durgapura", distance: 7.0 },
  { code: "KKU",  name: "Kanakpura", distance: 9.0 },
  { code: "GTJT", name: "Getor Jagatpura", distance: 11.0 },
  { code: "NDH",  name: "Nindhar Benar", distance: 11.0 },
  { code: "SNGN", name: "Sanganer", distance: 12.0 },
  { code: "BDYK", name: "Bindayaka", distance: 14.0 },
  { code: "KWP",  name: "Khatipura", distance: 17.0 }
];

/* 1) Stations */
async function insertStations(client) {
  const rows = FIXED_STATIONS.map(s => [s.code, s.name, s.distance]);
  const inserted = await bulkInsert(client, "stations", ["code", "name", "distance_from_jaipur"], rows);
  console.log(`✅ Stations inserted (${inserted}).`);
  // return full station rows (id, code)
  const res = await client.query("SELECT id, code FROM stations ORDER BY id");
  return res.rows;
}

/* 2) Platforms */
async function insertPlatforms(client) {
  const { rows: stations } = await client.query("SELECT id, code FROM stations ORDER BY id");
  if (!stations.length) {
    console.warn("⚠️ No stations available for platforms.");
    return [];
  }

  const inserts = [];
  for (let i = 0; i < stations.length; i++) {
    const s = stations[i];
    // Make the first station have 5 platforms (mimic Jaipur logic), others 2-3
    const count = (i === 0) ? 5 : faker.number.int({ min: 2, max: 3 });
    for (let p = 1; p <= count; p++) {
      inserts.push([s.id, p]);
    }
  }

  const inserted = await bulkInsert(client, "platforms", ["station_id", "platform_no"], inserts);
  console.log(`✅ Platforms inserted (${inserted}).`);
  const res = await client.query("SELECT id, station_id, platform_no FROM platforms ORDER BY id");
  return res.rows;
}

/* 3) Tracks */
async function insertTracks(client) {
  const stations = (await client.query("SELECT id, code FROM stations ORDER BY id")).rows;
  if (stations.length < 2) {
    console.warn("⚠️ Not enough stations to create tracks.");
    return [];
  }

  const inserts = [];

  // Connect first (hub) station to all others (one-way)
  const hub = stations[0];
  for (const s of stations) {
    if (s.id === hub.id) continue;
    inserts.push([hub.id, s.id, faker.number.float({ min: 5, max: 120, precision: 0.01 })]);
  }

  // Connect adjacent pairs (bidirectional sometimes)
  for (let i = 0; i < stations.length - 1; i++) {
    const a = stations[i].id;
    const b = stations[i + 1].id;
    inserts.push([a, b, faker.number.float({ min: 5, max: 120, precision: 0.01 })]);
    if (Math.random() < 0.5) {
      inserts.push([b, a, faker.number.float({ min: 5, max: 120, precision: 0.01 })]);
    }
  }

  // Deduplicate by from_to
  const seen = new Set();
  const unique = [];
  for (const r of inserts) {
    const key = `${r[0]}_${r[1]}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(r);
    }
  }

  const inserted = await bulkInsert(client, "tracks", ["from_station", "to_station", "distance_km"], unique);
  console.log(`✅ Tracks inserted (${inserted}).`);
  const res = await client.query("SELECT id, from_station, to_station, distance_km FROM tracks ORDER BY id");
  return res.rows;
}

/* 4) Signals (~75) */
async function insertSignals(client, target = 75) {
  const tracks = (await client.query("SELECT id, distance_km FROM tracks")).rows;
  if (!tracks.length) {
    console.warn("⚠️ No tracks available for signals.");
    return 0;
  }

  const inserts = [];
  for (let i = 0; i < target; i++) {
    const t = faker.helpers.arrayElement(tracks);
    const maxPos = Math.max(0.1, Number(t.distance_km) - 0.1);
    const pos = faker.number.float({ min: 0.1, max: Math.max(0.2, maxPos), precision: 0.01 });
    const status = faker.helpers.arrayElement(["GREEN", "YELLOW", "RED"]);
    inserts.push([t.id, pos, status]);
  }

  const inserted = await bulkInsert(client, "signals", ["track_id", "position_km", "status"], inserts);
  console.log(`✅ Signals inserted (~${inserted}).`);
  return inserted;
}

/* 5) Trains (500) */
async function insertTrains(client, total = 500) {
  const inserts = [];
  const used = new Set();

  function genUniqueTrainNo() {
    let v;
    do {
      v = faker.number.int({ min: 10000, max: 99999 }).toString();
    } while (used.has(v));
    used.add(v);
    return v;
  }

  for (let i = 0; i < total; i++) {
    inserts.push([
      genUniqueTrainNo(),
      `${faker.word.adjective({ length: { min: 3, max: 10 } })} ${faker.word.noun({ length: { min: 3, max: 10 } })} Express`.slice(0, 95),
      faker.helpers.arrayElement(["Passenger", "Express", "Superfast", "Goods", "MEMU"]),
      faker.number.int({ min: 100, max: 1200 }), // capacity
      faker.number.int({ min: 50, max: 600 })   // length (approx)
    ]);
  }

  const inserted = await bulkInsert(client, "trains", ["train_no", "name", "type", "capacity", "length"], inserts);
  console.log(`✅ Trains inserted (${inserted}).`);
  const res = await client.query("SELECT id FROM trains");
  return res.rows.map(r => r.id);
}

/* 6) Timetable events (~10000) */
async function insertTimetableEvents(client, target = 10000) {
  const trainIds = (await client.query("SELECT id FROM trains")).rows.map(r => r.id);
  const stationIds = (await client.query("SELECT id FROM stations")).rows.map(r => r.id);
  if (!trainIds.length || !stationIds.length) {
    console.warn("⚠️ Missing trains or stations for timetable events.");
    return 0;
  }

  const inserts = [];
  for (let i = 0; i < target; i++) {
    const train_id = faker.helpers.arrayElement(trainIds);
    const station_id = faker.helpers.arrayElement(stationIds);
    const scheduledArrival = faker.date.between({
      from: new Date(),
      to: new Date(Date.now() + 30 * 24 * 3600 * 1000)
    });
    const scheduledDeparture = new Date(scheduledArrival.getTime() + faker.number.int({ min: 1, max: 60 }) * 60000);
    const delay = faker.number.int({ min: 0, max: 300 });
    inserts.push([train_id, station_id, scheduledArrival, scheduledDeparture, delay]);
  }

  const inserted = await bulkInsert(client, "timetable_events",
    ["train_id", "station_id", "scheduled_arrival", "scheduled_departure", "delay_minutes"], inserts);
  console.log(`✅ Timetable events inserted (~${inserted}).`);
  return inserted;
}

/* 7) Train movements (~50000) */
async function insertTrainMovements(client, target = 50000) {
  const trainIds = (await client.query("SELECT id FROM trains")).rows.map(r => r.id);
  const tracks = (await client.query("SELECT id, distance_km FROM tracks")).rows;
  if (!trainIds.length || !tracks.length) {
    console.warn("⚠️ Missing trains or tracks for train movements.");
    return 0;
  }

  const inserts = [];
  for (let i = 0; i < target; i++) {
    const train_id = faker.helpers.arrayElement(trainIds);
    const track = faker.helpers.arrayElement(tracks);
    const entry = faker.date.recent(30);
    const travelMinutes = Math.max(1, Math.round(Number(track.distance_km) / faker.number.float({ min: 0.3, max: 2.5 })));
    const exit = new Date(entry.getTime() + travelMinutes * 60 * 1000);
    const delay = faker.number.int({ min: 0, max: 120 });
    inserts.push([train_id, track.id, entry, exit, delay]);
  }

  const inserted = await bulkInsert(client, "train_movements",
    ["train_id", "track_id", "entry_time", "exit_time", "delay_minutes"], inserts);
  console.log(`✅ Train movements inserted (~${inserted}).`);
  return inserted;
}

/* 8) Historical data (~50000) */
async function insertHistoricalData(client, target = 50000) {
  const trainIds = (await client.query("SELECT id FROM trains")).rows.map(r => r.id);
  const stationIds = (await client.query("SELECT id FROM stations")).rows.map(r => r.id);
  if (!trainIds.length || !stationIds.length) {
    console.warn("⚠️ Missing trains or stations for historical data.");
    return 0;
  }

  const eventTypes = ["arrival", "departure", "signal_passed"];
  const inserts = [];
  for (let i = 0; i < target; i++) {
    inserts.push([
      faker.helpers.arrayElement(trainIds),
      faker.helpers.arrayElement(stationIds),
      faker.date.past({ years: 1 }),
      faker.helpers.arrayElement(eventTypes),
      faker.number.int({ min: 0, max: 240 })
    ]);
  }

  const inserted = await bulkInsert(client, "historical_data",
    ["train_id", "station_id", "event_time", "event_type", "delay_minutes"], inserts);
  console.log(`✅ Historical data inserted (~${inserted}).`);
  return inserted;
}

/* 9) Real-time positions (~10000) */
async function insertRealTimePositions(client, target = 10000) {
  const trainIds = (await client.query("SELECT id FROM trains")).rows.map(r => r.id);
  const tracks = (await client.query("SELECT id, distance_km FROM tracks")).rows;
  if (!trainIds.length || !tracks.length) {
    console.warn("⚠️ Missing trains or tracks for real-time positions.");
    return 0;
  }

  const inserts = [];
  for (let i = 0; i < target; i++) {
    const train_id = faker.helpers.arrayElement(trainIds);
    const track = faker.helpers.arrayElement(tracks);
    const ts = faker.date.recent(7);
    const pos = faker.number.float({ min: 0, max: Number(track.distance_km), precision: 0.01 });
    inserts.push([train_id, track.id, ts, pos]);
  }

  const inserted = await bulkInsert(client, "real_time_positions",
    ["train_id", "track_id", "timestamp", "position_km"], inserts);
  console.log(`✅ Real-time positions inserted (~${inserted}).`);
  return inserted;
}

/* 10) Incidents (10) */
async function insertIncidents(client, total = 10) {
  const trainIds = (await client.query("SELECT id FROM trains")).rows.map(r => r.id);
  const stationIds = (await client.query("SELECT id FROM stations")).rows.map(r => r.id);
  const trackIds = (await client.query("SELECT id FROM tracks")).rows.map(r => r.id);

  if (!trainIds.length || !stationIds.length || !trackIds.length) {
    console.warn("⚠️ Missing trains/stations/tracks for incidents.");
    return 0;
  }

  const inserts = [];
  for (let i = 0; i < total; i++) {
    inserts.push([
      faker.helpers.arrayElement(trainIds),
      faker.helpers.arrayElement(stationIds),
      faker.helpers.arrayElement(trackIds),
      faker.date.recent(90),
      faker.lorem.sentence()
    ]);
  }

  const inserted = await bulkInsert(client, "incidents",
    ["train_id", "station_id", "track_id", "incident_time", "description"], inserts);
  console.log(`✅ Incidents inserted (${inserted}).`);
  return inserted;
}

/* 11) Weather records (~50000) */
async function insertWeatherRecords(client, total = 50000) {
  const stations = (await client.query("SELECT id FROM stations")).rows.map(r => r.id);
  if (!stations.length) {
    console.warn("⚠️ No stations for weather records.");
    return 0;
  }

  const inserts = [];
  for (let i = 0; i < total; i++) {
    inserts.push([
      faker.helpers.arrayElement(stations),
      faker.date.between({ from: new Date(Date.now() - 120 * 24 * 3600 * 1000), to: new Date() }),
      Number((20 + Math.random() * 15).toFixed(2)),
      Number((Math.random() * 50).toFixed(2)),
      Number((Math.random() * 10).toFixed(2))
    ]);
  }

  const inserted = await bulkInsert(client, "weather_records",
    ["station_id", "recorded_at", "temperature", "rainfall_mm", "visibility_km"], inserts);
  console.log(`✅ Weather records inserted (~${inserted}).`);
  return inserted;
}

/* 12) Safety scenarios (~20) */
async function insertSafetyScenarios(client) {
    const scenarios = [
      {
        scenario_time: new Date(),
        description: "Signal malfunction detected near Durgapura.",
        severity: "High",
      },
      {
        scenario_time: new Date(),
        description: "Track obstruction reported at Kanakpura.",
        severity: "Medium",
      },
      {
        scenario_time: new Date(),
        description: "Unauthorized entry detected on Bindayaka platform.",
        severity: "Low",
      },
    ];
  
    for (const s of scenarios) {
      await client.query(
        `INSERT INTO safety_scenarios (scenario_time, description, severity)
         VALUES ($1, $2, $3)`,
        [s.scenario_time, s.description, s.severity]
      );
    }
  }
  

/* 13) Congestion data: 30 days per platform (platform_id, recorded_at, congestion_level) */
async function insertCongestionData(client) {
  const platforms = (await client.query("SELECT id FROM platforms")).rows.map(r => r.id);
  if (!platforms.length) {
    console.warn("⚠️ No platforms found for congestion data.");
    return 0;
  }

  const inserts = [];
  for (const p of platforms) {
    for (let d = 0; d < 30; d++) {
      inserts.push([
        p,
        new Date(Date.now() - d * 24 * 3600 * 1000),
        faker.number.int({ min: 0, max: 100 })
      ]);
    }
  }

  const inserted = await bulkInsert(client, "congestion_data",
    ["platform_id", "recorded_at", "congestion_level"], inserts);
  console.log(`✅ Congestion data inserted (~${inserted}).`);
  return inserted;
}

/* MAIN: orchestrate everything in the right order */
async function main() {
  const client = await pool.connect();
  try {
    console.log("🚉 Starting full prototype dummy data generation...");

    // Clean slate (truncate all our tables)
    await client.query(`
      TRUNCATE TABLE
        congestion_data,
        safety_scenarios,
        weather_records,
        incidents,
        real_time_positions,
        historical_data,
        train_movements,
        timetable_events,
        signals,
        trains,
        tracks,
        platforms,
        stations
      RESTART IDENTITY CASCADE;
    `);
    console.log("✅ Tables truncated.");

    // 1 Stations
    await insertStations(client);

    // 2 Platforms
    await insertPlatforms(client);

    // 3 Tracks
    await insertTracks(client);

    // 4 Signals (create after tracks so they can reference track ids)
    await insertSignals(client, 75);

    // 5 Trains
    await insertTrains(client, 500);

    // 6 Timetable events
    await insertTimetableEvents(client, 10000);

    // 7 Train movements
    await insertTrainMovements(client, 50000);

    // 8 Historical data
    await insertHistoricalData(client, 50000);

    // 9 Real-time positions
    await insertRealTimePositions(client, 10000);

    // 10 Incidents
    await insertIncidents(client, 10);

    // 11 Weather records
    await insertWeatherRecords(client, 50000);

    // 12 Safety scenarios
    await insertSafetyScenarios(client);
console.log("✅ Safety scenarios inserted.");


    // 13 Congestion data (30 days per platform)
    await insertCongestionData(client);

    console.log("🎉 Dummy data generation complete!");
  } catch (err) {
    console.error("❌ Error during dummy data generation:", err);
  } finally {
    client.release();
  }
}

main().catch(err => {
  console.error("Unhandled error:", err);
  process.exit(1);
});
