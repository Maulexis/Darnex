-- Seed Data for Railway Simulation System

-- Insert Stations
INSERT INTO stations (code, name, lat, lon, attributes) VALUES
('JP', 'Jaipur Junction', 26.9124, 75.7873, '{"city": "Jaipur", "state": "Rajasthan"}'),
('AII', 'Ajmer Junction', 26.4683, 74.6399, '{"city": "Ajmer", "state": "Rajasthan"}'),
('NDLS', 'New Delhi', 28.6436, 77.2222, '{"city": "Delhi", "state": "Delhi"}');

-- Insert Platforms for Jaipur
INSERT INTO platforms (station_id, platform_no, length_m) VALUES
((SELECT id FROM stations WHERE code = 'JP'), '1', 550),
((SELECT id FROM stations WHERE code = 'JP'), '2', 550),
((SELECT id FROM stations WHERE code = 'JP'), '3', 600),
((SELECT id FROM stations WHERE code = 'JP'), '4', 550),
((SELECT id FROM stations WHERE code = 'JP'), '5', 550),
((SELECT id FROM stations WHERE code = 'JP'), '6', 600),
((SELECT id FROM stations WHERE code = 'JP'), '7', 550),
((SELECT id FROM stations WHERE code = 'JP'), '8', 550);

-- Insert Tracks
INSERT INTO tracks (from_station, to_station, length_m, type, allowed_speed) VALUES
((SELECT id FROM stations WHERE code = 'JP'), (SELECT id FROM stations WHERE code = 'AII'), 135000, 'double-line', 120),
((SELECT id FROM stations WHERE code = 'JP'), (SELECT id FROM stations WHERE code = 'NDLS'), 309000, 'double-line', 140);

-- Insert Trains
INSERT INTO trains (train_no, name, type, priority, length_m) VALUES
('12986', 'Ajmer Shatabdi Express', 'express', 1, 300),
('FRT7890', 'Freight Train 7890', 'freight', 5, 600);