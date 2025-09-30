// src/db/utils/generateDummyData.js
// Full corrected dummy-data generator for the prototype
// - Uses client from ../../services/db.js
// - Inserts data in correct FK order
// - Chunked bulk inserts for large volumes
// - Station list is exactly what you requested
// - FIXED: Added status column to incidents
// - FIXED: Added real Indian train names by type

import pool from "../../services/db.js";
import { faker } from "@faker-js/faker";
// This is the modern ES Module syntax
import 'dotenv/config';

// Test the connection
pool.on('connect', () => {
  console.log('✅ Database connection pool created successfully.');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client', err);
  process.exit(-1);
});

export default pool;

// --- ADD THIS DEBUGGING CODE ---
console.log('--- Checking Environment Variables ---');
console.log('DB User:', process.env.DB_USER);
console.log('DB Password:', process.env.DB_PASSWORD);
console.log('DB Database:', process.env.DB_DATABASE);
console.log('------------------------------------');
// --- END OF DEBUGGING CODE ---

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

/* REAL INDIAN TRAIN NAMES BY TYPE */
const passengerNames = [
  "Jaipur-Delhi Passenger", "Ajmer-Jaipur Passenger", "Bikaner-Jodhpur Passenger", 
  "Udaipur-Ahmedabad Passenger", "Kota-Sawai Madhopur Passenger", "Bharatpur-Mathura Passenger",
  "Sikar-Jaipur Passenger", "Alwar-Delhi Passenger", "Ganganagar-Bikaner Passenger",
  "Mount Abu-Abu Road Passenger", "Chittorgarh-Udaipur Passenger", "Jhunjhunu-Sikar Passenger"
];

const expressNames = [
  "Ashram Express", "Chetak Express", "Mewar Express", "Aravali Express", 
  "Mandore Express", "Intercity Express", "Marudhar Express", "Suryanagari Express",
  "Golden Temple Mail", "Jodhpur Express", "Bikaner Express", "Udaipur City Express",
  "Kota Express", "Ajmer Express", "Haridwar Mail", "Dehradun Express"
];

const superfastNames = [
  "Pink City Rajdhani", "Ajmer Shatabdi", "Double Decker Express", "Duronto Express",
  "Gatimaan Express", "Tejas Express", "Vande Bharat Express", "Humsafar Express",
  "Antyodaya Express", "Suvidha Express", "Premium Tatkal Express", "Sampark Kranti Express"
];

const memuNames = [
  "Jaipur MEMU", "Ajmer MEMU", "Jodhpur MEMU", "Bikaner MEMU",
  "Udaipur MEMU", "Kota MEMU", "Bharatpur MEMU", "Alwar MEMU",
  "Sikar MEMU", "Churu MEMU", "Ganganagar MEMU", "Abu Road MEMU"
];

const goodsNames = [
  "Limestone Special", "Container Freight", "Iron Ore Express", "Coal Special",
  "Cement Loading", "Fertilizer Goods", "Steel Transport", "Petroleum Special",
  "Agricultural Goods", "Mineral Transport", "Industrial Freight", "Raw Material Express"
];

const typeToNames = {
  "Passenger": passengerNames,
  "Express": expressNames,
  "Superfast": superfastNames,
  "MEMU": memuNames,
  "Goods": goodsNames
};

/* INCIDENT STATUS OPTIONS */
const incidentStatuses = ["active", "resolved", "investigating", "pending"];

/* USER-SUPPLIED / FIXED STATIONS (you asked these exact ones) */
const FIXED_STATIONS = [
    { code: "JP", name: "Jaipur Junction", distance: 0.0, lat: 26.9245, lon: 75.7873, attributes: { "is_junction": true, "zone": "NWR" } },
    { code: "BSGD", name: "Bais Godam", distance: 2.0, lat: 26.908, lon: 75.782, attributes: { "is_junction": false, "zone": "NWR" } },
    { code: "DKBJ", name: "Dahar Ka Balaji", distance: 3.0, lat: 26.948, lon: 75.758, attributes: { "is_junction": false, "zone": "NWR" } },
    { code: "GADJ", name: "Jaipur Gandhinagar", distance: 5.0, lat: 26.877, lon: 75.808, attributes: { "is_junction": false, "zone": "NWR" } },
    { code: "DPA", name: "Durgapura", distance: 7.0, lat: 26.855, lon: 75.790, attributes: { "is_junction": false, "zone": "NWR" } },
    { code: "KKU", name: "Kanakpura", distance: 9.0, lat: 26.892, lon: 75.720, attributes: { "is_junction": false, "zone": "NWR" } },
    { code: "GTJT", name: "Getor Jagatpura", distance: 11.0, lat: 26.845, lon: 75.845, attributes: { "is_junction": false, "zone": "NWR" } },
    { code: "SNGN", name: "Sanganer", distance: 12.0, lat: 26.825, lon: 75.780, attributes: { "is_junction": false, "zone": "NWR" } },
    { code: "BDYK", name: "Bindayaka", distance: 14.0, lat: 26.923, lon: 75.660, attributes: { "is_junction": false, "zone": "NWR" } },
    { code: "KWP", name: "Khatipura", distance: 17.0, lat: 26.950, lon: 75.710, attributes: { "is_junction": false, "zone": "NWR" } }
];

/* 1) Stations */
async function insertStations(client) {
  const rows = FIXED_STATIONS.map(s => [s.code, s.name, s.distance, s.lat, s.lon, JSON.stringify(s.attributes)]);
  const inserted = await bulkInsert(client, "stations", ["code", "name", "distance_from_jaipur", "lat", "lon", "attributes"], rows);
  console.log(`✅ Stations inserted (${inserted}).`);
  // return full station rows (id, code)
  const res = await client.query("SELECT id, code FROM stations ORDER BY id");
  return res.rows;
}

/* 2) Platforms */
async function insertPlatforms(client) {
    const { rows: stations } = await client.query("SELECT id FROM stations");
    if (!stations.length) {
        console.warn("⚠️ No stations available for platforms.");
        return [];
    }
    const inserts = [];
    for (const s of stations) {
        const length_m = faker.number.int({ min: 400, max: 800 });
        const count = faker.number.int({ min: 2, max: 5 });
        for (let p = 1; p <= count; p++) {
            inserts.push([s.id, p, length_m]);
        }
    }
    const inserted = await bulkInsert(client, "platforms", ["station_id", "platform_no", "length_m"], inserts);
    console.log(`✅ Platforms inserted (${inserted}).`);
}

/* 3) Tracks - FINAL BULLETPROOF VERSION (NO DUPLICATES POSSIBLE) */
async function insertTracks(client) {
    const { rows: stations } = await client.query("SELECT id FROM stations ORDER BY id");
    if (stations.length < 2) {
        console.warn("⚠️ Not enough stations to create tracks.");
        return [];
    }

    console.log(`🛤️ Creating tracks for ${stations.length} stations...`);

    const inserts = [];
    const usedPairs = new Set(); // Track ALL used pairs (both directions)

    // Generate all possible unique station pairs
    for (let i = 0; i < stations.length; i++) {
        for (let j = i + 1; j < stations.length; j++) {
            // 40% chance to create a connection between these stations
            if (Math.random() < 0.4) {
                const stationA = stations[i].id;
                const stationB = stations[j].id;
                
                const distance_km = faker.number.float({ min: 5, max: 25, precision: 0.1 });
                const length_m = distance_km * 1000;
                const type = faker.helpers.arrayElement(['double-line', 'single-line', 'electrified']);
                const allowed_speed = faker.helpers.arrayElement([80, 100, 120, 140]);

                // Decide the direction(s) to create
                const createForward = Math.random() < 0.8; // 80% chance
                const createReverse = Math.random() < 0.6; // 60% chance

                if (createForward) {
                    const pairKey = `${stationA}-${stationB}`;
                    if (!usedPairs.has(pairKey)) {
                        inserts.push([stationA, stationB, distance_km, length_m, type, allowed_speed]);
                        usedPairs.add(pairKey);
                    }
                }

                if (createReverse) {
                    const pairKey = `${stationB}-${stationA}`;
                    if (!usedPairs.has(pairKey)) {
                        inserts.push([stationB, stationA, distance_km, length_m, type, allowed_speed]);
                        usedPairs.add(pairKey);
                    }
                }
            }
        }
    }

    console.log(`🚂 Generated ${inserts.length} unique track records`);
    console.log(`📝 Used pairs: ${usedPairs.size}`);

    // Verify no duplicates exist in our batch
    const checkDuplicates = new Set();
    for (const [from, to] of inserts) {
        const key = `${from}-${to}`;
        if (checkDuplicates.has(key)) {
            console.error(`❌ DUPLICATE FOUND IN BATCH: ${key}`);
            return 0;
        }
        checkDuplicates.add(key);
    }

    console.log(`✅ Verified: No duplicates in batch`);

    const inserted = await bulkInsert(client, "tracks", ["from_station", "to_station", "distance_km", "length_m", "type", "allowed_speed"], inserts);
    console.log(`✅ Tracks inserted (${inserted}) - GUARANTEED NO DUPLICATES.`);
    
    return inserted;
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

/* 5) Trains (500) - FIXED WITH REAL INDIAN TRAIN NAMES */
async function insertTrains(client, total = 500) {
    const inserts = [];
    const used = new Set();
    const trainTypes = ["Passenger", "Express", "Superfast", "Goods", "MEMU"];
    const priorityMap = { "Superfast": 1, "Express": 2, "Passenger": 3, "MEMU": 4, "Goods": 5 };

    function genUniqueTrainNo() {
        let v;
        do { v = faker.number.int({ min: 10000, max: 99999 }).toString(); } while (used.has(v));
        used.add(v);
        return v;
    }

    for (let i = 0; i < total; i++) {
        const type = faker.helpers.arrayElement(trainTypes);
        const nameArr = typeToNames[type];
        const trainName = faker.helpers.arrayElement(nameArr);
        
        inserts.push([
            genUniqueTrainNo(),
            trainName,
            type,
            priorityMap[type],
            faker.number.int({ min: 400, max: 700 })
        ]);
    }
    const inserted = await bulkInsert(client, "trains", ["train_no", "name", "type", "priority", "length_m"], inserts);
    console.log(`✅ Trains inserted (${inserted}) with real Indian train names.`);
}

/* 6) Timetable events (~10000) */
async function insertTimetableEvents(client, target = 10000) {
    const { rows: trainIds } = await client.query("SELECT id FROM trains");
    const { rows: stations } = await client.query("SELECT id FROM stations");
    const { rows: platforms } = await client.query("SELECT id, station_id FROM platforms");

    if (!trainIds.length || !stations.length || !platforms.length) {
        console.warn("⚠️ Missing prerequisite data for timetable events.");
        return 0;
    }

    const platformMap = new Map();
    for (const p of platforms) {
        if (!platformMap.has(p.station_id)) {
            platformMap.set(p.station_id, []);
        }
        platformMap.get(p.station_id).push(p.id);
    }

    const insertsByTrain = new Map();

    for (let i = 0; i < target; i++) {
        const train_id = faker.helpers.arrayElement(trainIds).id;
        const station_id = faker.helpers.arrayElement(stations).id;

        if (!insertsByTrain.has(train_id)) {
            insertsByTrain.set(train_id, []);
        }
        insertsByTrain.get(train_id).push({ station_id });
    }

    const finalInserts = [];
    for (const [train_id, events] of insertsByTrain.entries()) {
        let lastDeparture = faker.date.soon({ days: 30 });

        events.sort((a, b) => a.station_id - b.station_id).forEach((event, index) => {
            const station_id = event.station_id;
            const availablePlatforms = platformMap.get(station_id);
            if (!availablePlatforms) return;

            const scheduled_arrival = new Date(lastDeparture.getTime() + faker.number.int({ min: 30, max: 180 }) * 60000);
            const scheduled_departure = new Date(scheduled_arrival.getTime() + faker.number.int({ min: 2, max: 15 }) * 60000);

            const delay_minutes = faker.number.int({ min: 0, max: 45 });
            const actual_arrival = new Date(scheduled_arrival.getTime() + delay_minutes * 60000);
            const actual_departure = new Date(scheduled_departure.getTime() + delay_minutes * 60000);

            const platform_no = faker.helpers.arrayElement(availablePlatforms);
            const order_no = index + 1;

            finalInserts.push([
                train_id, station_id, scheduled_arrival, scheduled_departure,
                actual_arrival, actual_departure, delay_minutes, platform_no, order_no
            ]);

            lastDeparture = scheduled_departure;
        });
    }

    const inserted = await bulkInsert(client, "timetable_events",
        ["train_id", "station_id", "scheduled_arrival", "scheduled_departure", "actual_arrival", "actual_departure", "delay_minutes", "platform_no", "order_no"],
        finalInserts
    );
    console.log(`✅ Timetable events inserted (~${inserted}).`);
}

/* 7) Train movements (~50000) */
async function insertTrainMovements(client, target = 50000) {
    const { rows: trainIds } = await client.query("SELECT id FROM trains");
    const { rows: tracks } = await client.query("SELECT id, distance_km FROM tracks");

    if (!trainIds.length || !tracks.length) {
        console.warn("⚠️ Missing prerequisite data for train movements.");
        return 0;
    }

    const inserts = [];
    for (let i = 0; i < target; i++) {
        const train_id = faker.helpers.arrayElement(trainIds).id;
        const track = faker.helpers.arrayElement(tracks);

        const entry_time = faker.date.recent({ days: 30 });
        const travelMinutes = Math.max(5, (Number(track.distance_km) / faker.number.int({ min: 60, max: 120 })) * 60);
        const exit_time = new Date(entry_time.getTime() + travelMinutes * 60000);

        const delay_minutes = faker.number.int({ min: 0, max: 20 });
        const actual_arrival = new Date(exit_time.getTime() + delay_minutes * 60000);

        const travelHours = travelMinutes / 60;
        const speed_kmph = travelHours > 0 ? (Number(track.distance_km) / travelHours).toFixed(2) : 0;

        const status = delay_minutes > 10 ? 'DELAYED' : faker.helpers.arrayElement(['IN_TRANSIT', 'ON_TIME']);

        inserts.push([
            train_id, track.id, entry_time, exit_time, delay_minutes,
            actual_arrival, speed_kmph, status
        ]);
    }
    const inserted = await bulkInsert(client, "train_movements",
        ["train_id", "track_id", "entry_time", "exit_time", "delay_minutes", "actual_arrival", "speed_kmph", "status"],
        inserts
    );
    console.log(`✅ Train movements inserted (~${inserted}).`);
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
  
      // Train speed: mostly 60–90, but allow up to 120
      const speed = faker.number.int({ min: 60, max: 90 });
      const occasionalBoost = Math.random() < 0.1 ? faker.number.int({ min: 91, max: 120 }) : null;
      const finalSpeed = occasionalBoost || speed;
  
      inserts.push([train_id, track.id, ts, pos, finalSpeed]);
    }
  
    const inserted = await bulkInsert(
        client,
        "real_time_positions",
        ["train_id", "track_id", "timestamp", "position_km", "speed_kmph"],
        inserts
      );
      
    console.log(`✅ Real-time positions inserted (~${inserted}).`);
    return inserted;
}

/* 10) Incidents (10) - FIXED WITH STATUS COLUMN */
async function insertIncidents(client, total = 10) {
  const trainIds = (await client.query("SELECT id FROM trains")).rows.map(r => r.id);
  const stationIds = (await client.query("SELECT id FROM stations")).rows.map(r => r.id);
  const trackIds = (await client.query("SELECT id FROM tracks")).rows.map(r => r.id);

  if (!trainIds.length || !stationIds.length || !trackIds.length) {
    console.warn("⚠️ Missing trains/stations/tracks for incidents.");
    return 0;
  }

  const incidentDescriptions = [
    "Track obstruction due to fallen tree",
    "Signal failure at junction",
    "Technical failure in locomotive engine",
    "Emergency brake system malfunction",
    "Overhead wire damage detected",
    "Track maintenance work in progress",
    "Suspicious package found on platform",
    "Medical emergency on train",
    "Weather-related visibility issues",
    "Track circuit failure detected"
  ];

  const inserts = [];
  for (let i = 0; i < total; i++) {
    inserts.push([
      faker.helpers.arrayElement(trainIds),
      faker.helpers.arrayElement(stationIds),
      faker.helpers.arrayElement(trackIds),
      faker.date.recent(90),
      faker.helpers.arrayElement(incidentDescriptions),
      faker.helpers.arrayElement(incidentStatuses), // ADD STATUS HERE
      faker.number.float({ min: 0, max: 20, precision: 0.01 }) // position_km
    ]);
  }

  const inserted = await bulkInsert(client, "incidents",
    ["train_id", "station_id", "track_id", "incident_time", "description", "status", "position_km"], 
    inserts);
  console.log(`✅ Incidents inserted (${inserted}) with status column.`);
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
      Number((20 + Math.random() * 15).toFixed(2)), // temperature_c
      Number((Math.random() * 50).toFixed(2)), // rainfall_mm
      Number((Math.random() * 10).toFixed(2)), // visibility_km
      Number((Math.random() * 30 + 10).toFixed(2)) // wind_speed_kmph
    ]);
  }

  const inserted = await bulkInsert(client, "weather_records",
    ["station_id", "recorded_at", "temperature_c", "rainfall_mm", "visibility_km", "wind_speed_kmph"], inserts);
  console.log(`✅ Weather records inserted (~${inserted}).`);
  return inserted;
}

/* 12) Safety scenarios (~100) */
async function insertSafetyScenarios(client, total = 100) {
    console.log("⚠️ Inserting safety scenarios...");
  
    const severities = ["Low", "Medium", "High", "Critical"];
    const stationsRes = await client.query("SELECT id FROM stations");
    const tracksRes = await client.query("SELECT id FROM tracks");
    const stations = stationsRes.rows;
    const tracks = tracksRes.rows;
  
    const scenarioTypes = [
      "Signal malfunction detected",
      "Track obstruction reported", 
      "Overcrowding at platform",
      "Unauthorized entry detected",
      "Electrical fault in station premises",
      "Minor fire incident reported",
      "Suspicious package found",
      "Emergency brake failure test",
      "Medical emergency at station",
      "Flooding near tracks",
      "Technical failure in locomotive",
      "Communication system down"
    ];

    const scenarios = Array.from({ length: total }, () => [
      faker.helpers.arrayElement(stations).id, // station_id
      faker.helpers.arrayElement(tracks).id, // track_id
      faker.date.recent({ days: 90 }), // scenario_time
      faker.helpers.arrayElement(scenarioTypes),
      faker.helpers.arrayElement(severities),
      faker.number.float({ min: 0, max: 15, precision: 0.01 }) // position_km
    ]);
  
    await bulkInsert(
      client,
      "safety_scenarios",
      ["station_id", "track_id", "scenario_time", "scenario_type", "severity", "position_km"],
      scenarios
    );
  
    console.log(`✅ Safety scenarios inserted (${total}).`);
    return total;
}
  
/* 13) Congestion data: 30 days per platform (platform_id, recorded_at, congestion_level) */
async function insertCongestionData(client, total = 1000) {
    const platformsRes = await client.query("SELECT id, station_id FROM platforms");
    const platforms = platformsRes.rows;
  
    const congestionRecords = Array.from({ length: total }, () => {
      const platform = faker.helpers.arrayElement(platforms);
      return [
        platform.station_id, // station_id
        platform.id,         // platform_id
        faker.date.recent({ days: 30 }),
        faker.number.int({ min: 1, max: 100 }) // congestion_level
      ];
    });
  
    await bulkInsert(
      client,
      "congestion_data",
      ["station_id", "platform_id", "recorded_at", "congestion_level"],
      congestionRecords
    );
  
    console.log(`✅ Congestion data inserted (${total}).`);
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
        trains
      RESTART IDENTITY CASCADE;
    `);

    console.log("✅ Tables truncated.");

    // 1 Stations
    // await insertStations(client);

    // // 2 Platforms
    // await insertPlatforms(client);

    // // 3 Tracks
    // await insertTracks(client);

    // 4 Signals (create after tracks so they can reference track ids)
    await insertSignals(client, 75);

    // 5 Trains - WITH REAL INDIAN NAMES
    await insertTrains(client, 500);

    // 6 Timetable events
    await insertTimetableEvents(client, 10000);

    // 7 Train movements
    await insertTrainMovements(client, 50000);

    // 8 Historical data
    await insertHistoricalData(client, 50000);

    // 9 Real-time positions
    await insertRealTimePositions(client, 10000);

    // 10 Incidents - WITH STATUS COLUMN
    await insertIncidents(client, 10);

    // 11 Weather records
    await insertWeatherRecords(client, 50000);

    // 12 Safety scenarios
    await insertSafetyScenarios(client, 100);

    console.log("✅ Safety scenarios inserted.");

    // 13 Congestion data (30 days per platform)
    await insertCongestionData(client);

    console.log("🎉 Dummy data generation complete!");
  } catch (err) {
    console.error("❌ Error during dummy data generation:", err);
  } finally {
    console.log("🏁 Releasing database client.");
    client.release();
    await pool.end(); // Close all connections in the pool
  }
}

main().catch(err => {
  console.error("Unhandled error:", err);
  process.exit(1);
});