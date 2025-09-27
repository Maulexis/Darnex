const express = require('express');
const router = express.Router();
const { query } = require('../services/db'); // ✅

// Station snapshot
router.get('/v1/sections/:station_code/snapshot', async (req,res)=>{
    const { station_code } = req.params;
    try {
        const station = (await query('SELECT * FROM stations WHERE code=$1',[station_code])).rows[0];
        if(!station) return res.status(404).json({error:'Station not found'});

        const platforms = (await query('SELECT platform_no,length_m FROM platforms WHERE station_id=$1',[station.id])).rows;

        const tracks = (await query(`
            SELECT t.id AS track_id, s1.code AS from_station_code, s2.code AS to_station_code, t.length_m
            FROM tracks t
            JOIN stations s1 ON t.from_station=s1.id
            JOIN stations s2 ON t.to_station=s2.id
            WHERE s1.id=$1 OR s2.id=$1
        `,[station.id])).rows;

        const trainsData = (await query(`
            SELECT t.train_no, t.name, t.type, tm.status, tm.eta, tm.etd,
                   s.code AS current_station_code, s2.code AS next_station_code
            FROM train_movements tm
            JOIN trains t ON tm.train_id=t.id
            JOIN stations s ON tm.current_station=s.id
            LEFT JOIN stations s2 ON tm.next_station=s2.id
            WHERE tm.current_station=$1 OR tm.next_station=$1
        `,[station.id])).rows;

        const trains = trainsData.map(t=>({
            train_no: t.train_no,
            name: t.name,
            type: t.type,
            current_status:{
                status: t.status,
                current_station: t.current_station_code,
                next_station: t.next_station_code,
                eta: t.eta,
                etd: t.etd
            }
        }));

        res.json({
            station:{code:station.code,name:station.name},
            platforms,
            tracks,
            trains,
            timestamp: new Date().toISOString()
        });
    } catch(err){ console.error(err); res.status(500).json({error:'Internal Server Error'}); }
});

// Train details
router.get('/v1/trains/:train_no', async(req,res)=>{
    const { train_no } = req.params;
    try{
        const train = (await query('SELECT * FROM trains WHERE train_no=$1',[train_no])).rows[0];
        if(!train) return res.status(404).json({error:'Train not found'});

        const timetable = (await query(`
            SELECT te.scheduled_arrival, te.scheduled_departure, te.platform_no,
                   s.code AS station_code, s.name AS station_name
            FROM timetable_events te
            JOIN stations s ON te.station_id=s.id
            WHERE te.train_id=$1
            ORDER BY te.order_no
        `,[train.id])).rows;

        const movements = (await query(`
            SELECT tm.timestamp, tm.status, tm.speed_kmph, tm.position_m,
                   s1.code AS current_station_code, s2.code AS next_station_code
            FROM train_movements tm
            JOIN stations s1 ON tm.current_station=s1.id
            LEFT JOIN stations s2 ON tm.next_station=s2.id
            WHERE tm.train_id=$1
            ORDER BY tm.timestamp DESC
        `,[train.id])).rows;

        res.json({train:{train_no:train.train_no,name:train.name,type:train.type},timetable,movements});
    }catch(err){console.error(err); res.status(500).json({error:'Internal Server Error'});}
});

// Sim command placeholder
router.post('/v1/sim/command', (req,res)=>{
    const { train_no, command } = req.body;
    console.log(`Command '${command}' received for train ${train_no}`);
    res.json({status:'success', message:`Command '${command}' received for train ${train_no}`});
});

module.exports = router;
