const { query } = require('./src/services/db'); // correct path
const readline = require('readline');

async function pause() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    return new Promise(resolve => rl.question('Press Enter to see next batch...', () => {
        rl.close();
        resolve();
    }));
}

async function showAllData() {
    console.log("=== Stations ===");
    const stations = await query('SELECT * FROM stations');
    console.table(stations.rows);

    console.log("=== Platforms ===");
    const platforms = await query(`
        SELECT p.*, s.code AS station_code
        FROM platforms p
        JOIN stations s ON p.station_id = s.id
    `);
    console.table(platforms.rows);

    console.log("=== Tracks ===");
    const tracks = await query(`
        SELECT t.*, s_from.code AS from_code, s_to.code AS to_code
        FROM tracks t
        JOIN stations s_from ON t.from_station = s_from.id
        JOIN stations s_to ON t.to_station = s_to.id
    `);
    console.table(tracks.rows);

    console.log("=== Trains ===");
    const trains = await query('SELECT * FROM trains');
    console.table(trains.rows);

    console.log("=== Train Movements (batches of 1000) ===");

    const totalMovementsResult = await query('SELECT COUNT(*) FROM train_movements');
    const totalMovements = parseInt(totalMovementsResult.rows[0].count, 10);

    const batchSize = 1000;
    for (let offset = 0; offset < totalMovements; offset += batchSize) {
        const movements = await query(`
            SELECT tm.*, t.train_no, s_from.code AS from_code, s_to.code AS to_code
            FROM train_movements tm
            JOIN trains t ON tm.train_id = t.id
            JOIN stations s_from ON tm.current_station = s_from.id
            JOIN stations s_to ON tm.next_station = s_to.id
            ORDER BY tm.timestamp ASC
            LIMIT $1 OFFSET $2
        `, [batchSize, offset]);

        console.table(movements.rows);
        if (offset + batchSize < totalMovements) {
            await pause(); // wait before next batch
        }
    }

    console.log("All train movements displayed.");
}

showAllData();
