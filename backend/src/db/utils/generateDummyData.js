// src/db/utils/generateDummyData.js
const { query } = require('../../services/db');

async function generateDummyData(numRecords) {
    console.log(`Generating ${numRecords} historical records...`);

    const ajmerTrainId = (await query(`SELECT id FROM trains WHERE train_no = '12986'`)).rows[0].id;
    const freightTrainId = (await query(`SELECT id FROM trains WHERE train_no = 'FRT7890'`)).rows[0].id;
    const jpStationId = (await query(`SELECT id FROM stations WHERE code = 'JP'`)).rows[0].id;
    const ndlsStationId = (await query(`SELECT id FROM stations WHERE code = 'NDLS'`)).rows[0].id;
    const aiiStationId = (await query(`SELECT id FROM stations WHERE code = 'AII'`)).rows[0].id;

    let recordsInserted = 0;
    let batch = [];
    const batchSize = 5000;
    const startTime = Date.now();

    for (let i = 0; i < numRecords; i++) {
        const trainId = Math.random() < 0.5 ? ajmerTrainId : freightTrainId;
        const currentStationId = trainId === ajmerTrainId ? aiiStationId : ndlsStationId;
        const nextStationId = jpStationId;
        const status = 'enroute';
        const speed = trainId === ajmerTrainId ? Math.random() * (120 - 80) + 80 : Math.random() * (70 - 40) + 40;
        const position = Math.random() * 300000;
        
        // Generate historical timestamp (e.g., in the past year)
        const timestamp = new Date(Date.now() - Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000)).toISOString();
        
        batch.push([trainId, currentStationId, nextStationId, status, speed, position, timestamp]);

        if (batch.length === batchSize || i === numRecords - 1) {
            // Batch insert logic
            const values = batch.map(row => `(${row.map(val => `'${val}'`).join(', ')})`).join(', ');
            const insertQuery = `
                INSERT INTO train_movements (train_id, current_station, next_station, status, speed_kmph, position_m, timestamp)
                VALUES ${values}
            `;
            await query(insertQuery);
            recordsInserted += batch.length;
            console.log(`Inserted ${recordsInserted} of ${numRecords} records...`);
            batch = [];
        }
    }
    const endTime = Date.now();
    console.log(`Successfully generated ${numRecords} records in ${(endTime - startTime) / 1000} seconds.`);
}

const numRecords = 1000000;
generateDummyData(numRecords);