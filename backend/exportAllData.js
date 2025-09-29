const { query } = require('./src/services/db');
const fs = require('fs');
const path = require('path');

async function exportTable(tableName, sqlQuery) {
    const result = await query(sqlQuery);
    const rows = result.rows;

    // Convert to CSV
    const headers = Object.keys(rows[0] || {});
    const csv = [headers.join(',')]; // header row
    rows.forEach(row => {
        const values = headers.map(h => `"${row[h]}"`); // wrap in quotes
        csv.push(values.join(','));
    });

    const filePath = path.join(__dirname, `${tableName}.csv`);
    fs.writeFileSync(filePath, csv.join('\n'));
    console.log(`${tableName}.csv exported with ${rows.length} rows.`);
}

async function exportAll() {
    await exportTable('stations', 'SELECT * FROM stations');
    await exportTable('platforms', `
        SELECT p.*, s.code AS station_code
        FROM platforms p
        JOIN stations s ON p.station_id = s.id
    `);
    await exportTable('tracks', `
        SELECT t.*, s_from.code AS from_code, s_to.code AS to_code
        FROM tracks t
        JOIN stations s_from ON t.from_station = s_from.id
        JOIN stations s_to ON t.to_station = s_to.id
    `);
    await exportTable('trains', 'SELECT * FROM trains');
    await exportTable('train_movements', `
        SELECT tm.*, t.train_no, s_from.code AS from_code, s_to.code AS to_code
        FROM train_movements tm
        JOIN trains t ON tm.train_id = t.id
        JOIN stations s_from ON tm.current_station = s_from.id
        JOIN stations s_to ON tm.next_station = s_to.id
    `);
    console.log("All tables exported!");
}

exportAll();
