// src/api/mapLayout.js
// Express route that returns a map layout (GeoJSON + per-layer arrays)
// Uses your existing pool from src/services/db.js (ES module import).

import express from "express";
import pool from "../services/db.js";

const router = express.Router();

/**
 * Linear interpolation between two lat/lon points.
 * Good for short distances (tens of km). For high accuracy use PostGIS / turf.js.
 * from, to: { lat: number, lon: number }
 * frac: number between 0 and 1
 */
function interpLatLon(from, to, frac) {
  const f = Math.max(0, Math.min(1, Number(frac) || 0));
  return {
    lat: Number(from.lat) + f * (Number(to.lat) - Number(from.lat)),
    lon: Number(from.lon) + f * (Number(to.lon) - Number(from.lon))
  };
}

/**
 * Safely parse numeric coords; return null if not present.
 */
function safeNum(v) {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * GET /api/map-layout
 * Returns:
 * {
 *   type: "FeatureCollection",
 *   features: [...],
 *   layers: {
 *     stations: [...],
 *     platforms: [...],
 *     tracks: [...],
 *     signals: [...],
 *     realtime: [...],
 *     trains: [...]
 *   },
 *   meta: { counts... }
 * }
 */
router.get("/map-layout", async (req, res) => {
  const client = await pool.connect();
  try {
    // 1) Stations (basic)
    const stationsRes = await client.query(
      `SELECT id, code, name, lat, lon, distance_from_jaipur, attributes
       FROM stations`
    );
    const stations = stationsRes.rows.map((s) => ({
      id: s.id,
      code: s.code,
      name: s.name,
      lat: safeNum(s.lat),
      lon: safeNum(s.lon),
      distance_from_jaipur: safeNum(s.distance_from_jaipur),
      attributes: s.attributes || {}
    }));
    const stationMap = new Map(stations.map((s) => [s.id, s]));

    // 2) Platforms
    const platformsRes = await client.query(
      `SELECT id, station_id, platform_no, length_m FROM platforms ORDER BY station_id, platform_no`
    );
    const platforms = platformsRes.rows.map((p) => ({
      id: p.id,
      station_id: p.station_id,
      platform_no: p.platform_no,
      length_m: p.length_m
    }));
    // add platform counts into station objects (non-destructive)
    for (const p of platforms) {
      const st = stationMap.get(p.station_id);
      if (st) {
        st.platforms = st.platforms || [];
        st.platforms.push({ id: p.id, platform_no: p.platform_no, length_m: p.length_m });
      }
    }

    // 3) Tracks (with station coords)
    const tracksRes = await client.query(
      `SELECT t.id AS track_id, t.from_station, t.to_station, t.distance_km, t.length_m, t.type, t.allowed_speed,
              fs.lat AS from_lat, fs.lon AS from_lon, ts.lat AS to_lat, ts.lon AS to_lon
       FROM tracks t
       JOIN stations fs ON fs.id = t.from_station
       JOIN stations ts ON ts.id = t.to_station`
    );
    const tracks = tracksRes.rows.map((t) => ({
      id: t.track_id,
      from_station: t.from_station,
      to_station: t.to_station,
      distance_km: safeNum(t.distance_km),
      length_m: t.length_m,
      type: t.type,
      allowed_speed: t.allowed_speed,
      from_lat: safeNum(t.from_lat),
      from_lon: safeNum(t.from_lon),
      to_lat: safeNum(t.to_lat),
      to_lon: safeNum(t.to_lon)
    }));
    const trackMap = new Map(tracks.map((t) => [t.id, t]));

    // 4) Signals
    const signalsRes = await client.query(
      `SELECT id, track_id, position_km, status FROM signals`
    );
    const signals = signalsRes.rows.map((s) => ({
      id: s.id,
      track_id: s.track_id,
      position_km: safeNum(s.position_km),
      status: s.status
    }));

    // 5) Recent real-time positions (last N minutes)
    const realtimeWindowMinutes = Number(req.query.realtimeWindowMinutes) || 15;
    const rtpRes = await client.query(
      `SELECT id, train_id, track_id, timestamp, position_km, speed_kmph
       FROM real_time_positions
       WHERE timestamp >= now() - ($1::int * interval '1 minute')`,
      [realtimeWindowMinutes]
    );
    const realtime = rtpRes.rows.map((r) => ({
      id: r.id,
      train_id: r.train_id,
      track_id: r.track_id,
      timestamp: r.timestamp,
      position_km: safeNum(r.position_km),
      speed_kmph: safeNum(r.speed_kmph)
    }));

    // 6) Trains (for labels) - NOTE: trains may use 'length_m' in your schema
    const trainsRes = await client.query(
      `SELECT id, train_no, name, type, COALESCE(length, length_m) AS length
       FROM trains`
    );
    const trains = trainsRes.rows.map((tr) => ({
      id: tr.id,
      train_no: tr.train_no,
      name: tr.name,
      type: tr.type,
      length: safeNum(tr.length)
    }));

    // Build GeoJSON features:
    const features = [];

    // Station features (Point)
    for (const s of stations) {
      if (s.lat === null || s.lon === null) continue; // skip invalid
      features.push({
        type: "Feature",
        geometry: { type: "Point", coordinates: [s.lon, s.lat] },
        properties: {
          layer: "station",
          id: s.id,
          code: s.code,
          name: s.name,
          distance_from_jaipur: s.distance_from_jaipur,
          attributes: s.attributes,
          platform_count: (s.platforms || []).length
        }
      });
    }

    // Track features (LineString between from/to) - straight line
    for (const t of tracks) {
      if (t.from_lat === null || t.from_lon === null || t.to_lat === null || t.to_lon === null) continue;
      features.push({
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: [
            [t.from_lon, t.from_lat],
            [t.to_lon, t.to_lat]
          ]
        },
        properties: {
          layer: "track",
          id: t.id,
          from_station: t.from_station,
          to_station: t.to_station,
          distance_km: t.distance_km,
          type: t.type,
          allowed_speed: t.allowed_speed
        }
      });
    }

    // Signal features (Point interpolated along the track)
    for (const s of signals) {
      const t = trackMap.get(s.track_id);
      if (!t) continue;
      const totalKm = Number(t.distance_km) || 1;
      const frac = Math.max(0, Math.min(1, (Number(s.position_km || 0) / totalKm)));
      const pos = interpLatLon({ lat: t.from_lat, lon: t.from_lon }, { lat: t.to_lat, lon: t.to_lon }, frac);
      if (pos.lat === null || pos.lon === null) continue;
      features.push({
        type: "Feature",
        geometry: { type: "Point", coordinates: [pos.lon, pos.lat] },
        properties: {
          layer: "signal",
          id: s.id,
          track_id: s.track_id,
          position_km: s.position_km,
          status: s.status
        }
      });
    }

    // Real-time train positions (Point interpolated along the track)
    for (const p of realtime) {
      const t = trackMap.get(p.track_id);
      if (!t) continue;
      const totalKm = Number(t.distance_km) || 1;
      const frac = Math.max(0, Math.min(1, (Number(p.position_km || 0) / totalKm)));
      const pos = interpLatLon({ lat: t.from_lat, lon: t.from_lon }, { lat: t.to_lat, lon: t.to_lon }, frac);
      if (pos.lat === null || pos.lon === null) continue;
      features.push({
        type: "Feature",
        geometry: { type: "Point", coordinates: [pos.lon, pos.lat] },
        properties: {
          layer: "train",
          id: p.id,
          train_id: p.train_id,
          track_id: p.track_id,
          speed_kmph: p.speed_kmph,
          timestamp: p.timestamp
        }
      });
    }

    // Build layers object for easier frontend consumption
    const layers = {
      stations,     // stations array (with platforms added)
      platforms,    // raw platform rows
      tracks,       // raw tracks rows
      signals,      // raw signals rows
      realtime,     // raw realtime rows
      trains        // raw trains rows
    };

    const meta = {
      stationsCount: stations.length,
      platformsCount: platforms.length,
      tracksCount: tracks.length,
      signalsCount: signals.length,
      realtimeCount: realtime.length,
      trainsCount: trains.length
    };

    res.json({
      type: "FeatureCollection",
      features,
      layers,
      meta
    });
  } catch (err) {
    console.error("map-layout error:", err);
    res.status(500).json({ error: "Server error", detail: err.message });
  } finally {
    client.release();
  }
});

export default router;
