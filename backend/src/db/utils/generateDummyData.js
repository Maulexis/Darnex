// src/db/utils/generateDummyData.js
// Ready-to-run prototype-scale dummy data generator
// Requirements implemented:
// stations: 11, platforms: Jaipur=5 others 2-3, signals ~75, trains=500,
// timetable_events=10k, train_movements=50k, historical_data=50k,
// real_time_positions=10k, incidents=10, weather_records=50k,
// safety_scenarios~20, congestion_data ~30 days per platform

import pool from "../../services/db.js";
import { faker } from "@faker-js/faker";

/* UTILITIES */
const CHUNK = 1000; // chunk size for bulk inserts

function chunkArray(arr, size = CHUNK) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function nowMinusDays(days) {
  return new Date(Date.now() - days * 24 * 3600 * 1000);
}

function formatIso(d) {
  return d.toISOString();
}

/* RESET TABLES (safe) */
async function resetTables() {
  const tables = [
    "historical_data",
    "congestion_data",
    "safety_scenarios",
    "weather_records",
    "incidents",
    "real_time_positions",
    "train_movements",
    "timetable_events",
    "signals",
    "trains",
    "tracks",
    "platforms",
    "stations"
  ];
  for (let t of tables) {
    await pool.query(`TRUNCATE ${t} RESTART IDENTITY CASCADE`);
  }
  console.log("✅ Tables truncated.");
}

/* 1) STATIONS: 11 fixed stations with distances (<1000 numeric(5,2)) */
const FIXED_STATIONS = [
  { code: "JP", name: "Jaipur Junction", distance: 0.0 },
  { code: "DL", name: "Delhi Junction", distance: 280.5 },
  { code: "AG", name: "Agra Cantt", distance: 200.2 },
  { code: "LK", name: "Lucknow NR", distance: 470.0 },
  { code: "MB", name: "Mumbai Central", distance: 830.7 },
  { code: "PT", name: "Patna Junction", distance: 890.1 },
  { code: "BG", name: "Bengaluru City", distance: 950.0 },
  { code: "HY", name: "Hyderabad Deccan", distance: 740.3 },
  { code: "KL", name: "Kolkata Howrah", distance: 920.0 },
  { code: "CN", name: "Chennai Central", distance: 980.5 },
  { code: "RA", name: "Ratlam Junction", distance: 380.6 }
];

async function insertStations() {
  const values = [];
  const params = [];
  let idx = 1;
  for (let s of FIXED_STATIONS) {
    values.push(`($${idx++}, $${idx++}, $${idx++})`);
    params.push(s.code, s.name, s.distance);
  }
  const q = `INSERT INTO stations (code, name, distance_from_jaipur) VALUES ${values.join(",")}`;
  await pool.query(q, params);
  console.log("✅ Stations inserted (11).");
}

/* 2) PLATFORMS */
async function insertPlatforms() {
  const res = await pool.query("SELECT id, code FROM stations");
  const rows = res.rows;
  const inserts = [];
  for (let r of rows) {
    let count = (r.code === "JP") ? 5 : faker.number.int({ min: 2, max: 3 });
    for (let p = 1; p <= count; p++) {
      inserts.push({ station_id: r.id, platform_no: p });
    }
  }
  const chunks = chunkArray(inserts, CHUNK);
  for (let c of chunks) {
    const values = [];
    const params = [];
    let idx = 1;
    for (let it of c) {
      values.push(`($${idx++}, $${idx++})`);
      params.push(it.station_id, it.platform_no);
    }
    await pool.query(
      `INSERT INTO platforms (station_id, platform_no) VALUES ${values.join(",")}`,
      params
    );
  }
  console.log("✅ Platforms inserted.");
}

/* 3) TRACKS */
async function insertTracks() {
  const stations = (await pool.query("SELECT id, code FROM stations ORDER BY id")).rows;
  const stationMap = new Map(stations.map(s => [s.code, s.id]));
  const inserts = [];
  const jpId = stationMap.get("JP");

  for (let s of stations) {
    if (s.id === jpId) continue;
    const dist = faker.number.float({ min: 30, max: 350, precision: 0.01 });
    inserts.push({ from: jpId, to: s.id, d: dist });
  }

  for (let i = 0; i < stations.length - 1; i++) {
    const a = stations[i].id, b = stations[i + 1].id;
    const dist = faker.number.float({ min: 20, max: 200, precision: 0.01 });
    inserts.push({ from: a, to: b, d: dist });
    if (Math.random() < 0.6) {
      inserts.push({ from: b, to: a, d: faker.number.float({ min: 20, max: 200, precision: 0.01 }) });
    }
  }

  const seen = new Set();
  const unique = [];
  for (const it of inserts) {
    const key = `${it.from}_${it.to}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(it);
    }
  }

  const chunks = chunkArray(unique, CHUNK);
  for (let c of chunks) {
    const values = [];
    const params = [];
    let idx = 1;
    for (let it of c) {
      values.push(`($${idx++}, $${idx++}, $${idx++})`);
      params.push(it.from, it.to, it.d);
    }
    await pool.query(
      `INSERT INTO tracks (from_station, to_station, distance_km) VALUES ${values.join(",")}`,
      params
    );
  }
  console.log("✅ Tracks inserted.");
}

/* 4) SIGNALS */
async function insertSignals(target = 75) {
  const tracks = (await pool.query("SELECT id, distance_km FROM tracks")).rows;
  let created = 0;
  const inserts = [];
  while (created < target) {
    const track = faker.helpers.arrayElement(tracks);
    const maxPos = Math.max(0.1, Number(track.distance_km) - 0.1);
    const position = faker.number.float({ min: 0.1, max: Math.max(0.2, maxPos), precision: 0.01 });
    inserts.push({
      track_id: track.id,
      position_km: position,
      status: faker.helpers.arrayElement(["GREEN", "YELLOW", "RED"])
    });
    created++;
  }
  const chunks = chunkArray(inserts, CHUNK);
  for (let c of chunks) {
    const vals = [];
    const params = [];
    let idx = 1;
    for (let it of c) {
      vals.push(`($${idx++}, $${idx++}, $${idx++})`);
      params.push(it.track_id, it.position_km, it.status);
    }
    await pool.query(
      `INSERT INTO signals (track_id, position_km, status) VALUES ${vals.join(",")}`,
      params
    );
  }
  console.log(`✅ Signals inserted (~${target}).`);
}

/* 5) TRAINS */
async function insertTrains(total = 500) {
  const inserts = [];
  const usedTrainNos = new Set();

  function generateUniqueTrainNo() {
    let num;
    do {
      num = faker.number.int({ min: 10000, max: 99999 });
    } while (usedTrainNos.has(num));
    usedTrainNos.add(num);
    return `${num}`;
  }

  for (let i = 0; i < total; i++) {
    const train_no = generateUniqueTrainNo();
    const name = `${faker.word.adjective()} ${faker.word.noun()} Express`.slice(0, 95);
    const type = faker.helpers.arrayElement(["Passenger", "Express", "Superfast", "Goods", "MEMU"]);
    inserts.push({ train_no, name, type });
  }

  const chunks = chunkArray(inserts, CHUNK);
  for (let c of chunks) {
    const vals = [];
    const params = [];
    let idx = 1;
    for (let it of c) {
      vals.push(`($${idx++}, $${idx++}, $${idx++})`);
      params.push(it.train_no, it.name, it.type);
    }
    await pool.query(
      `INSERT INTO trains (train_no, name, type) VALUES ${vals.join(",")}`,
      params
    );
  }
  console.log(`✅ ${total} trains inserted.`);
}

/* 6) TIMETABLE EVENTS */
async function insertTimetableEvents(target = 10000) {
  const trains = (await pool.query("SELECT id FROM trains")).rows.map(r => r.id);
  const stations = (await pool.query("SELECT id FROM stations")).rows.map(r => r.id);
  const inserts = [];

  for (let i = 0; i < target; i++) {
    const train_id = faker.helpers.arrayElement(trains);
    const station_id = faker.helpers.arrayElement(stations);

    const scheduledArrival = faker.date.between({
        from: new Date(),
        to: new Date(Date.now() + 30 * 24 * 3600 * 1000) // 30 days ahead
      });
      

    const scheduledDeparture = new Date(
      scheduledArrival.getTime() + faker.number.int({ min: 1, max: 60 }) * 60000
    );
    const delay = faker.number.int({ min: 0, max: 300 });

    inserts.push({
      train_id, station_id,
      scheduled_arrival: scheduledArrival,
      scheduled_departure: scheduledDeparture,
      delay_minutes: delay
    });
  }

  const chunks = chunkArray(inserts, CHUNK);
  for (let c of chunks) {
    const vals = [];
    const params = [];
    let idx = 1;
    for (let it of c) {
      vals.push(`($${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++})`);
      params.push(it.train_id, it.station_id, it.scheduled_arrival, it.scheduled_departure, it.delay_minutes);
    }
    await pool.query(
      `INSERT INTO timetable_events (train_id, station_id, scheduled_arrival, scheduled_departure, delay_minutes)
       VALUES ${vals.join(",")}`,
      params
    );
  }
  console.log(`✅ Timetable events inserted (~${target}).`);
}

/* 7) TRAIN MOVEMENTS */
async function insertTrainMovements(target = 50000) {
  const trains = (await pool.query("SELECT id FROM trains")).rows.map(r => r.id);
  const tracks = (await pool.query("SELECT id, distance_km FROM tracks")).rows;
  const inserts = [];

  for (let i = 0; i < target; i++) {
    const train_id = faker.helpers.arrayElement(trains);
    const track = faker.helpers.arrayElement(tracks);
    const entry = faker.date.recent(30);
    const travelMinutes = Math.max(1, Math.round(Number(track.distance_km) / faker.number.float({ min: 0.3, max: 2.5 })));
    const exit = new Date(entry.getTime() + travelMinutes * 60 * 1000);
    const delay = faker.number.int({ min: 0, max: 120 });
    inserts.push({ train_id, track_id: track.id, entry_time: entry, exit_time: exit, delay_minutes: delay });
  }

  const chunks = chunkArray(inserts, CHUNK);
  for (let c of chunks) {
    const vals = [];
    const params = [];
    let idx = 1;
    for (let it of c) {
      vals.push(`($${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++})`);
      params.push(it.train_id, it.track_id, it.entry_time, it.exit_time, it.delay_minutes);
    }
    await pool.query(
      `INSERT INTO train_movements (train_id, track_id, entry_time, exit_time, delay_minutes)
       VALUES ${vals.join(",")}`,
      params
    );
  }
  console.log(`✅ Train movements inserted (~${target}).`);
}

/* 8) HISTORICAL DATA */
async function insertHistoricalData(target = 50000) {
  const trains = (await pool.query("SELECT id FROM trains")).rows.map(r => r.id);
  const stations = (await pool.query("SELECT id FROM stations")).rows.map(r => r.id);
  const inserts = [];
  const eventTypes = ["arrival", "departure", "signal_passed"];

  for (let i = 0; i < target; i++) {
    const train_id = faker.helpers.arrayElement(trains);
    const station_id = faker.helpers.arrayElement(stations);
    const t = faker.helpers.arrayElement(eventTypes);
    const event_time = faker.date.past(180);
    const delay = faker.number.int({ min: 0, max: 240 });
    inserts.push({ train_id, station_id, event_time, event_type: t, delay_minutes: delay });
  }

  const chunks = chunkArray(inserts, CHUNK);
  for (let c of chunks) {
    const vals = [];
    const params = [];
    let idx = 1;
    for (let it of c) {
      vals.push(`($${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++})`);
      params.push(it.train_id, it.station_id, it.event_time, it.event_type, it.delay_minutes);
    }
    await pool.query(
      `INSERT INTO historical_data (train_id, station_id, event_time, event_type, delay_minutes)
       VALUES ${vals.join(",")}`,
      params
    );
  }
  console.log(`✅ Historical data inserted (~${target}).`);
}

/* 9) REAL-TIME POSITIONS */
async function insertRealTimePositions(target = 10000) {
  const trains = (await pool.query("SELECT id FROM trains")).rows.map(r => r.id);
  const tracks = (await pool.query("SELECT id, distance_km FROM tracks")).rows;
  const inserts = [];

  for (let i = 0; i < target; i++) {
    const train_id = faker.helpers.arrayElement(trains);
    const track = faker.helpers.arrayElement(tracks);
    const ts = faker.date.recent(7);
    const pos = faker.number.float({ min: 0, max: Number(track.distance_km), precision: 0.01 });
    inserts.push({ train_id, track_id: track.id, timestamp: ts, position_km: pos });
  }
  const chunks = chunkArray(inserts, CHUNK);
  for (let c of chunks) {
    const vals = [];
    const params = [];
    let idx = 1;
    for (let it of c) {
      vals.push(`($${idx++}, $${idx++}, $${idx++}, $${idx++})`);
      params.push(it.train_id, it.track_id, it.timestamp, it.position_km);
    }
    await pool.query(
      `INSERT INTO real_time_positions (train_id, track_id, timestamp, position_km)
       VALUES ${vals.join(",")}`,
      params
    );
  }
  console.log(`✅ Real-time positions inserted (~${target}).`);
}

/* 10) INCIDENTS */
async function insertIncidents(client, total = 10) {
    const trains = (await client.query("SELECT id FROM trains")).rows.map(r => r.id);
    const stations = (await client.query("SELECT id FROM stations")).rows.map(r => r.id);
    const tracks = (await client.query("SELECT id FROM tracks")).rows.map(r => r.id);
  
    if (trains.length === 0 || stations.length === 0 || tracks.length === 0) {
      console.log("⚠️ Skipping incidents: no trains/stations/tracks available.");
      return;
    }
  
    const inserts = [];
    for (let i = 0; i < total; i++) {
      inserts.push({
        train_id: faker.helpers.arrayElement(trains),
        station_id: faker.helpers.arrayElement(stations),
        track_id: faker.helpers.arrayElement(tracks),
        incident_time: faker.date.recent(90),
        description: faker.lorem.sentence()
      });
    }
  
    const vals = [];
    const params = [];
    let idx = 1;
    for (let it of inserts) {
      vals.push(`($${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++})`);
      params.push(it.train_id, it.station_id, it.track_id, it.incident_time, it.description);
    }
  
    await client.query(
      `INSERT INTO incidents (train_id, station_id, track_id, incident_time, description)
       VALUES ${vals.join(",")}`,
      params
    );
  
    console.log(`✅ ${total} incidents inserted.`);
  }
  

/* 11) WEATHER RECORDS */
async function insertWeatherRecords(client, stationsInput) {
    // Make it flexible: handle both query result and plain array
    const stations = Array.isArray(stationsInput) ? stationsInput : stationsInput.rows;
  
    if (!stations || stations.length === 0) {
      console.warn("⚠️ No stations found, skipping weather records.");
      return;
    }
  
    console.log("🌦️ Inserting weather records...");
  
    for (const s of stations) {
      await client.query(
        `INSERT INTO weather_records (station_id, recorded_at, temperature, rainfall_mm, visibility_km) 
         VALUES ($1, NOW(), $2, $3, $4)`,
        [
          s.id,
          (20 + Math.random() * 15).toFixed(2),   // temperature
          (Math.random() * 50).toFixed(2),        // rainfall in mm
          (Math.random() * 10).toFixed(2)         // visibility in km
        ]
      );
    }
  
    console.log(`✅ Weather records inserted (${stations.length}).`);
  }
  
/* 12) SAFETY SCENARIOS */
async function insertSafetyScenarios(total = 20) {
  const stations = (await pool.query("SELECT id FROM stations")).rows.map(r => r.id);
  const trains = (await pool.query("SELECT id FROM trains")).rows.map(r => r.id);
  const inserts = [];
  const risks = ["Signal Failure", "Track Blockage", "Over Speed", "Platform Overcrowding", "Collision Risk"];
  for (let i = 0; i < total; i++) {
    inserts.push({
      station_id: faker.helpers.arrayElement(stations),
      train_id: faker.helpers.arrayElement(trains),
      risk_type: faker.helpers.arrayElement(risks),
      severity: faker.number.int({ min: 1, max: 5 }),
      description: faker.lorem.sentence()
    });
  }
  const vals = [];
  const params = [];
  let idx = 1;
  for (let it of inserts) {
    vals.push(`($${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++})`);
    params.push(it.station_id, it.train_id, it.risk_type, it.severity, it.description);
  }
  await pool.query(
    `INSERT INTO safety_scenarios (station_id, train_id, risk_type, severity, description)
     VALUES ${vals.join(",")}`,
    params
  );
  console.log(`✅ Safety scenarios inserted (~${total}).`);
}

/* 13) CONGESTION DATA */
async function insertCongestionData() {
  const platforms = (await pool.query("SELECT id FROM platforms")).rows.map(r => r.id);
  const inserts = [];
  for (let p of platforms) {
    for (let d = 30; d >= 0; d--) {
      inserts.push({
        platform_id: p,
        date: nowMinusDays(d),
        average_wait_time: faker.number.float({ min: 0, max: 60, precision: 0.1 })
      });
    }
  }

  const chunks = chunkArray(inserts, CHUNK);
  for (let c of chunks) {
    const vals = [];
    const params = [];
    let idx = 1;
    for (let it of c) {
      vals.push(`($${idx++}, $${idx++}, $${idx++})`);
      params.push(it.platform_id, it.date, it.average_wait_time);
    }
    await pool.query(
      `INSERT INTO congestion_data (platform_id, date, average_wait_time)
       VALUES ${vals.join(",")}`,
      params
    );
  }
  console.log(`✅ Congestion data inserted (30 days).`);
}

/* MAIN */
/* MAIN */
async function main() {
    const client = await pool.connect();
  
    try {
      console.log("🚉 Starting full prototype dummy data generation...");
  
      await client.query(`
        TRUNCATE TABLE trains RESTART IDENTITY CASCADE;
        TRUNCATE TABLE stations RESTART IDENTITY CASCADE;
        TRUNCATE TABLE platforms RESTART IDENTITY CASCADE;
        TRUNCATE TABLE tracks RESTART IDENTITY CASCADE;
        TRUNCATE TABLE signals RESTART IDENTITY CASCADE;
        TRUNCATE TABLE timetable_events RESTART IDENTITY CASCADE;
        TRUNCATE TABLE train_movements RESTART IDENTITY CASCADE;
        TRUNCATE TABLE historical_data RESTART IDENTITY CASCADE;
        TRUNCATE TABLE real_time_positions RESTART IDENTITY CASCADE;
        TRUNCATE TABLE incidents RESTART IDENTITY CASCADE;
        TRUNCATE TABLE weather_records RESTART IDENTITY CASCADE;
        TRUNCATE TABLE safety_scenarios RESTART IDENTITY CASCADE;
        TRUNCATE TABLE congestion_data RESTART IDENTITY CASCADE;
      `);
      console.log("✅ Tables truncated.");
  
      await insertStations(client);
      console.log("✅ Stations inserted (11).");
  
      await insertPlatforms(client);
      console.log("✅ Platforms inserted.");
  
      await insertTracks(client);
      console.log("✅ Tracks inserted.");
  
      await insertSignals(client);
      console.log("✅ Signals inserted (~75).");
  
      await insertTrains(client);
      console.log("✅ 500 trains inserted.");
  
      await insertTimetableEvents(client);
      console.log("✅ Timetable events inserted (~10000).");
  
      await insertTrainMovements(client);
      console.log("✅ Train movements inserted (~50000).");
  
      await insertHistoricalData(client);
      console.log("✅ Historical data inserted (~50000).");
  
      await insertRealTimePositions(client);
      console.log("✅ Real-time positions inserted (~10000).");
  
      await insertIncidents(client);
      console.log("✅ 10 incidents inserted.");
  
      await insertWeatherRecords(client);
      console.log("✅ Weather records inserted (200).");
  
      await insertSafetyScenarios(client);
      console.log("✅ Safety scenarios inserted (~20).");
  
      await insertCongestionData(client);
      console.log("✅ Congestion data inserted (30 days per platform).");
  
    } finally {
      client.release();
    }
  }
  main().catch((err) => {
    console.error("❌ Error populating database:", err);
    process.exit(1);
  });
  