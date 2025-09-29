-- Reset schema (full replacement)
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

-- ======================
-- 1. Stations
-- ======================
CREATE TABLE stations (
    id SERIAL PRIMARY KEY,
    code VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    lat NUMERIC(9,6),
    lon NUMERIC(9,6),
    distance_from_jaipur NUMERIC(6,2), -- added to match generator's inserts
    attributes JSONB
);

-- ======================
-- 2. Platforms
-- ======================
CREATE TABLE platforms (
    id SERIAL PRIMARY KEY,
    station_id INT REFERENCES stations(id) ON DELETE CASCADE,
    platform_no VARCHAR(10) NOT NULL,
    length_m INT,
    UNIQUE (station_id, platform_no)
);

-- ======================
-- 3. Tracks
-- ======================
CREATE TABLE tracks (
    id SERIAL PRIMARY KEY,
    from_station INT REFERENCES stations(id) ON DELETE CASCADE,
    to_station INT REFERENCES stations(id) ON DELETE CASCADE,
    distance_km NUMERIC(7,2), -- REQUIRED by generator
    length_m INT,             -- legacy / optional
    type VARCHAR(50),
    allowed_speed INT,
    UNIQUE (from_station, to_station)
);

-- ======================
-- 4. Signals (NEW — required by generator)
-- ======================
CREATE TABLE signals (
    id SERIAL PRIMARY KEY,
    track_id INT REFERENCES tracks(id) ON DELETE CASCADE,
    position_km NUMERIC(7,3) NOT NULL,
    status VARCHAR(10) NOT NULL CHECK (status IN ('GREEN','YELLOW','RED'))
);

-- ======================
-- 5. Trains
-- ======================
CREATE TABLE trains (
    id SERIAL PRIMARY KEY,
    train_no VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) DEFAULT 'Passenger',
    capacity INT,
    length INT
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
    delay_minutes INT DEFAULT 0,
    platform_no VARCHAR(10),
    order_no INT,
    UNIQUE(train_id, order_no)
);

-- ======================
-- 7. Train Movements
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
    event_type VARCHAR(50),
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
    position_km NUMERIC(6,3),
    speed_kmph NUMERIC(5,2) -- ADDED to match generator
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
    rainfall_mm NUMERIC(6,2),
    visibility_km NUMERIC(5,2)
);

-- ======================
-- 12. Safety Scenarios
-- ======================
CREATE TABLE safety_scenarios (
    id SERIAL PRIMARY KEY,
    station_id INT REFERENCES stations(id),
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
-- Indexes
-- ======================
CREATE INDEX idx_trains_no ON trains(train_no);
CREATE INDEX idx_tt_train ON timetable_events(train_id);
CREATE INDEX idx_tm_train ON train_movements(train_id);
CREATE INDEX idx_hist_train ON historical_data(train_id);
CREATE INDEX idx_rtp_train ON real_time_positions(train_id);
