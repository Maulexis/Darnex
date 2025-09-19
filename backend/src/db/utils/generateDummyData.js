const { query } = require('../../services/db');

async function setupStationsAndTrains() {
    console.log("Setting up initial stations and trains...");

    // --- Insert stations safely ---
    await query(`
        INSERT INTO stations (code, name, lat, lon, attributes)
        VALUES 
            ('JP', 'Jaipur Junction', 26.9124, 75.7873, '{"city": "Jaipur", "state": "Rajasthan"}'),
            ('AII', 'Ajmer Junction', 26.4683, 74.6399, '{"city": "Ajmer", "state": "Rajasthan"}'),
            ('NDLS', 'New Delhi', 28.6436, 77.2222, '{"city": "Delhi", "state": "Delhi"}')
        ON CONFLICT (code) DO NOTHING
    `);

    // --- Insert platforms for Jaipur safely ---
    const jpId = (await query(`SELECT id FROM stations WHERE code = 'JP'`)).rows[0].id;
    for (let i = 1; i <= 8; i++) {
        const length = i === 3 || i === 6 ? 600 : 550;
        await query(`
            INSERT INTO platforms (station_id, platform_no, length_m)
            VALUES ($1, $2, $3)
            ON CONFLICT (station_id, platform_no) DO NOTHING
        `, [jpId, i.toString(), length]);
    }

    // --- Insert tracks safely ---
    const aiiId = (await query(`SELECT id FROM stations WHERE code = 'AII'`)).rows[0].id;
    const ndlsId = (await query(`SELECT id FROM stations WHERE code = 'NDLS'`)).rows[0].id;
    await query(`
        INSERT INTO tracks (from_station, to_station, length_m, type, allowed_speed)
        VALUES ($1, $2, 135000, 'double-line', 120),
               ($1, $3, 309000, 'double-line', 140)
        ON CONFLICT DO NOTHING
    `, [jpId, aiiId, ndlsId]);

    // --- Insert trains safely ---
    await query(`
        INSERT INTO trains (train_no, name, type, priority, length_m)
        VALUES 
            ('12986', 'Ajmer Shatabdi Express', 'express', 1, 300),
            ('FRT7890', 'Freight Train 7890', 'freight', 5, 600)
        ON CONFLICT (train_no) DO NOTHING
    `);

    console.log("Stations, platforms, tracks, and trains setup complete.");
}

async function generateTrainJourneys(numRecords) {
    console.log(`Generating ${numRecords} journey records...`);

    const trains = (await query(`SELECT * FROM trains`)).rows;
    const stations = (await query(`SELECT * FROM stations`)).rows;

    const toStation = stations.find(s => s.code === 'JP');
    const possibleFromStations = stations.filter(s => s.code !== 'JP');

    if (!toStation || possibleFromStations.length === 0) {
        console.error("Error: Stations data incomplete. Cannot generate journeys.");
        return;
    }

    const batchSize = 1000;
    let batch = [];

    for (let i = 0; i < numRecords; i++) {
        const train = trains[Math.floor(Math.random() * trains.length)];
        const fromStation = possibleFromStations[Math.floor(Math.random() * possibleFromStations.length)];

        const distance = Math.random() * 300000;
        const avgSpeed = Math.random() * (120 - 40) + 40;
        const travelTimeSeconds = distance / (avgSpeed / 3.6);
        const delayedMinutes = Math.random() < 0.2 ? Math.floor(Math.random() * 30) : 0;
        const currentTime = new Date();
        const scheduledDeparture = new Date(currentTime.getTime() - travelTimeSeconds * 1000).toISOString();
        const actualDeparture = new Date(new Date(scheduledDeparture).getTime() + delayedMinutes * 60 * 1000).toISOString();
        const actualArrival = new Date(new Date(scheduledDeparture).getTime() + travelTimeSeconds * 1000).toISOString();
        const position_m = Math.random() * distance;
        const eta = new Date(currentTime.getTime() + (travelTimeSeconds * (1 - (position_m / distance))) * 1000).toISOString();

        batch.push([
            train.id,
            currentTime.toISOString(),
            fromStation.id,
            toStation.id,
            'enroute',
            avgSpeed,
            position_m,
            delayedMinutes,
            actualArrival,
            actualDeparture,
            eta,
            null
        ]);

        // Insert batch when full or last record
        if (batch.length === batchSize || i === numRecords - 1) {
            const placeholders = batch.map((_, idx) => {
                const offset = idx * 12;
                return `($${offset + 1},$${offset + 2},$${offset + 3},$${offset + 4},$${offset + 5},$${offset + 6},$${offset + 7},$${offset + 8},$${offset + 9},$${offset + 10},$${offset + 11},$${offset + 12})`;
            }).join(',');

            const flatValues = batch.flat();
            await query(`
                INSERT INTO train_movements 
                (train_id, timestamp, current_station, next_station, status, speed_kmph, position_m, delayed_minutes, actual_arrival, actual_departure, eta, etd)
                VALUES ${placeholders}
            `, flatValues);

            batch = [];
            console.log(`Inserted ${i + 1} of ${numRecords} journey records...`);
        }
    }

    console.log("Journey records generation complete.");
}

async function run() {
    await setupStationsAndTrains();
    await generateTrainJourneys(10000);
    console.log("Database population complete!");
}

run();
