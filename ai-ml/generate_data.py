import pandas as pd
import numpy as np
from faker import Faker
from sqlalchemy import create_engine
import random
from datetime import datetime, timedelta

# --- CONFIGURATION ---
NUM_STATIONS = 50
NUM_TRAINS = 200
MOVEMENTS_PER_TRIP = 15 # Number of "live" updates between stations

# --- DATABASE CONNECTION ---
# Use SQLAlchemy for efficient bulk inserts with pandas
DB_USER = 'postgres'
DB_PASS = 'pj925fhpp5' # Your password
DB_HOST = 'localhost'
DB_PORT = '5432'
DB_NAME = 'railway_ai'

# Create the database connection string
db_url = f"postgresql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
engine = create_engine(db_url)
print("SQLAlchemy engine created.")

# --- INITIALIZE FAKER ---
fake = Faker()

# --- DATA GENERATION ---

def generate_and_insert_data():
    # 1. GENERATE STATIONS
    print(f"Generating {NUM_STATIONS} stations...")
    stations_data = []
    for _ in range(NUM_STATIONS):
        stations_data.append({
            'code': ''.join(random.choices('ABCDEFGHIJKLMNOPQRSTUVWXYZ', k=3)),
            'name': fake.city() + " " + random.choice(["Junction", "Central", "Station"]),
            'lat': fake.latitude(),
            'lon': fake.longitude()
        })
    stations_df = pd.DataFrame(stations_data).drop_duplicates(subset=['code'])
    # Insert into database
    stations_df.to_sql('stations', engine, if_exists='append', index=False)
    print("Stations inserted.")

    # 2. GENERATE TRAINS
    print(f"Generating {NUM_TRAINS} trains...")
    trains_data = []
    for _ in range(NUM_TRAINS):
        trains_data.append({
            'train_no': str(random.randint(10000, 99999)),
            'name': fake.word().capitalize() + " Express",
            'type': random.choice(['express', 'freight', 'passenger']),
            'priority': random.randint(1, 5),
            'length_m': random.randint(200, 700)
        })
    trains_df = pd.DataFrame(trains_data).drop_duplicates(subset=['train_no'])
    # Insert into database
    trains_df.to_sql('trains', engine, if_exists='append', index=False)
    print("Trains inserted.")

    # 3. RETRIEVE IDs FROM DB TO USE AS FOREIGN KEYS
    # This ensures our data is connected correctly
    station_ids = pd.read_sql("SELECT id FROM stations", engine)['id'].tolist()
    train_ids = pd.read_sql("SELECT id FROM trains", engine)['id'].tolist()
    
    timetable_events_data = []
    train_movements_data = []

    print("Generating timetables and movements for each train (this will take a moment)...")
    # 4. GENERATE TIMETABLE AND MOVEMENTS FOR EACH TRAIN
    for train_id in train_ids:
        # Create a random route for this train (3 to 7 stops)
        num_stops = random.randint(3, 7)
        route_station_ids = random.sample(station_ids, num_stops)
        
        # Set a starting time for the journey
        current_time = datetime.now() + timedelta(hours=random.randint(1, 24))
        
        for i in range(num_stops):
            station_id = route_station_ids[i]
            
            # Arrival and Departure times
            arrival_time = current_time if i > 0 else None
            stop_duration = timedelta(minutes=random.randint(2, 10))
            departure_time = current_time + stop_duration if i < num_stops - 1 else None
            
            # Add to timetable events
            timetable_events_data.append({
                'train_id': train_id,
                'station_id': station_id,
                'scheduled_arrival': arrival_time,
                'scheduled_departure': departure_time,
                'platform_no': str(random.randint(1, 8)),
                'order_no': i + 1
            })
            
            # Simulate movements to the next station
            if departure_time:
                next_station_id = route_station_ids[i+1]
                trip_duration_minutes = random.randint(30, 180)
                
                # Add a delay for some trains
                delay = timedelta(minutes=random.randint(0, 20) if random.random() > 0.7 else 0)
                actual_departure_time = departure_time + delay
                
                for j in range(MOVEMENTS_PER_TRIP):
                    progress = j / MOVEMENTS_PER_TRIP
                    train_movements_data.append({
                        'train_id': train_id,
                        'current_station': station_id,
                        'next_station': next_station_id,
                        'status': 'IN_TRANSIT',
                        'speed_kmph': random.randint(60, 120) if progress > 0.1 and progress < 0.9 else 30,
                        'position_m': progress * 100000, # Simplified position
                        'delayed_minutes': delay.total_seconds() / 60,
                        'actual_departure': actual_departure_time,
                        'eta': arrival_time + timedelta(minutes=trip_duration_minutes) + delay if arrival_time else None
                    })
                
                # Update current time for the next stop
                current_time = departure_time + timedelta(minutes=trip_duration_minutes)

    # 5. BULK INSERT TIMETABLE AND MOVEMENTS
    timetable_df = pd.DataFrame(timetable_events_data)
    timetable_df.to_sql('timetable_events', engine, if_exists='append', index=False)
    print("Timetable events inserted.")

    movements_df = pd.DataFrame(train_movements_data)
    movements_df.to_sql('train_movements', engine, if_exists='append', index=False)
    print("Train movements inserted.")

# --- RUN THE SCRIPT ---
if __name__ == "__main__":
    # Optional: Clear old data before generating new data
    # with engine.connect() as connection:
    #     print("Clearing old data...")
    #     connection.execute(text("TRUNCATE TABLE stations, trains, timetable_events, train_movements CASCADE;"))
    #     connection.commit()
        
    generate_and_insert_data()
    print("\nMassive data generation complete!")