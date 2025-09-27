-- 🚨 Reset schema
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

-- ======================
-- 1. Stations
-- ======================
CREATE TABLE stations (
    id SERIAL PRIMARY KEY,
    code VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    distance_from_jaipur NUMERIC(5,2) NOT NULL
);

-- ======================
-- 2. Platforms
-- ======================
CREATE TABLE platforms (
    id SERIAL PRIMARY KEY,
    station_id INT REFERENCES stations(id) ON DELETE CASCADE,
    platform_no INT NOT NULL,
    UNIQUE (station_id, platform_no)
);

-- ======================
-- 3. Tracks (between stations)
-- ======================
CREATE TABLE tracks (
    id SERIAL PRIMARY KEY,
    from_station INT REFERENCES stations(id) ON DELETE CASCADE,
    to_station INT REFERENCES stations(id) ON DELETE CASCADE,
    distance_km NUMERIC(5,2) NOT NULL,
    UNIQUE (from_station, to_station)
);

-- ======================
-- 4. Signals
-- ======================
CREATE TABLE signals (
    id SERIAL PRIMARY KEY,
    track_id INT REFERENCES tracks(id) ON DELETE CASCADE,
    position_km NUMERIC(5,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'GREEN'
);

-- ======================
-- 5. Trains
-- ======================
CREATE TABLE trains (
    id SERIAL PRIMARY KEY,
    train_no VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) DEFAULT 'Passenger'
);

-- ======================
-- 6. Timetable Events
-- ======================
CREATE TABLE timetable_events (
    id SERIAL PRIMARY KEY,
    train_id INT REFERENCES trains(id) ON DELETE CASCADE,
    station_id INT REFERENCES stations(id) ON DELETE CASCADE,
    scheduled_arrival TIMESTAMP,
    scheduled_departure TIMESTAMP,
    actual_arrival TIMESTAMP,
    actual_departure TIMESTAMP,
    delay_minutes INT DEFAULT 0
);

-- ======================
-- 7. Train Movements (per track segment)
-- ======================
CREATE TABLE train_movements (
    id SERIAL PRIMARY KEY,
    train_id INT REFERENCES trains(id) ON DELETE CASCADE,
    track_id INT REFERENCES tracks(id) ON DELETE CASCADE,
    entry_time TIMESTAMP,
    exit_time TIMESTAMP,
    delay_minutes INT DEFAULT 0
);

-- ======================
-- 8. Historical Data
-- ======================
CREATE TABLE historical_data (
    id SERIAL PRIMARY KEY,
    train_id INT REFERENCES trains(id) ON DELETE CASCADE,
    station_id INT REFERENCES stations(id),
    event_time TIMESTAMP,
    event_type VARCHAR(50), -- arrival, departure, signal_passed, etc
    delay_minutes INT DEFAULT 0
);

-- ======================
-- 9. Real-Time Positions
-- ======================
CREATE TABLE real_time_positions (
    id SERIAL PRIMARY KEY,
    train_id INT REFERENCES trains(id) ON DELETE CASCADE,
    track_id INT REFERENCES tracks(id),
    timestamp TIMESTAMP NOT NULL,
    position_km NUMERIC(5,2)
);

-- ======================
-- 10. Incidents
-- ======================
CREATE TABLE incidents (
    id SERIAL PRIMARY KEY,
    train_id INT REFERENCES trains(id),
    station_id INT REFERENCES stations(id),
    track_id INT REFERENCES tracks(id),
    incident_time TIMESTAMP NOT NULL,
    description TEXT
);

-- ======================
-- 11. Weather Records
-- ======================
CREATE TABLE weather_records (
    id SERIAL PRIMARY KEY,
    station_id INT REFERENCES stations(id),
    recorded_at TIMESTAMP NOT NULL,
    temperature NUMERIC(5,2),
    rainfall_mm NUMERIC(5,2),
    visibility_km NUMERIC(5,2)
);

-- ======================
-- 12. Safety Scenarios
-- ======================
CREATE TABLE safety_scenarios (
    id SERIAL PRIMARY KEY,
    scenario_time TIMESTAMP NOT NULL,
    description TEXT,
    severity VARCHAR(20)
);

-- ======================
-- 13. Congestion Data
-- ======================
CREATE TABLE congestion_data (
    id SERIAL PRIMARY KEY,
    station_id INT REFERENCES stations(id),
    platform_id INT REFERENCES platforms(id),
    recorded_at TIMESTAMP NOT NULL,
    congestion_level INT CHECK (congestion_level BETWEEN 0 AND 100)
);

-- ======================
-- ✅ Indexes for performance
-- ======================
CREATE INDEX idx_trains_no ON trains(train_no);
CREATE INDEX idx_tt_train ON timetable_events(train_id);
CREATE INDEX idx_tm_train ON train_movements(train_id);
CREATE INDEX idx_hist_train ON historical_data(train_id);
CREATE INDEX idx_rtp_train ON real_time_positions(train_id);
