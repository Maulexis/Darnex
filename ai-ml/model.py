#!/usr/bin/env python3
"""
DARNEX RAILWAY AI MODEL - PHASE 1: DATA PIPELINE
==================================================

Phase 1: Data Reading, Cleaning, and Merging Foundation
- Read data from backend database
- Clean and format data properly 
- Merge important tables for AI training preparation

This is the foundation data pipeline for the DARNEX Railway AI system.
"""

import pandas as pd
import numpy as np
import psycopg2
import os
import warnings
from datetime import datetime, timedelta
import json
import pickle
# Suppress warnings for cleaner output
warnings.filterwarnings('ignore')

# ====================================================================
# DATABASE CONNECTION CONFIGURATION
# ====================================================================

DB_PARAMS = {
    'dbname': 'railwayai',
    'user': 'postgres', 
    'password': 'pj925fhpp5',
    'host': 'localhost',
    'port': '5432'
}

# Create models directory
MODELS_DIR = 'models'
os.makedirs(MODELS_DIR, exist_ok=True)

print("=" * 60)
print("DARNEX RAILWAY AI - PHASE 1: DATA PIPELINE")
print("=" * 60)

# ====================================================================
# SECTION 1: DATABASE CONNECTION AND DATA READING
# ====================================================================

def establish_database_connection():
    """Establish connection to PostgreSQL railway database"""
    try:
        conn = psycopg2.connect(**DB_PARAMS)
        print("✓ Database connection successful")
        return conn
    except psycopg2.OperationalError as e:
        print(f"✗ Database connection failed: {e}")
        exit(1)

def load_data(query, db_conn):
    """Load data from SQL with error handling"""
    try:
        with warnings.catch_warnings():
            warnings.simplefilter("ignore", UserWarning)
            return pd.read_sql_query(query, db_conn)
    except Exception as e:
        print(f"Error loading data: {e}")
        return pd.DataFrame()

# Connect to database
conn = establish_database_connection()

# ====================================================================
# SECTION 2: READ ALL RAILWAY TABLES FROM BACKEND
# ====================================================================

print("\nLoading comprehensive railway data from backend...")

# Read core railway tables
train_movements = load_data("SELECT * FROM train_movements ORDER BY actual_arrival", conn)
trains = load_data("SELECT * FROM trains", conn) 
tracks = load_data("SELECT * FROM tracks", conn)
timetable_events = load_data("SELECT * FROM timetable_events ORDER BY scheduled_arrival", conn)

# Additional railway infrastructure tables that may exist
try:
    stations = load_data("SELECT * FROM stations", conn)
    print(f"✓ Stations data loaded: {len(stations)} records")
except:
    stations = pd.DataFrame()
    print("- Stations table not found")

try:
    signals = load_data("SELECT * FROM signals", conn) 
    print(f"✓ Signals data loaded: {len(signals)} records")
except:
    signals = pd.DataFrame()
    print("- Signals table not found")

try:
    crossings = load_data("SELECT * FROM crossings", conn)
    print(f"✓ Crossings data loaded: {len(crossings)} records") 
except:
    crossings = pd.DataFrame()
    print("- Crossings table not found")

# ====================================================================
# SECTION 3: DATA VALIDATION AND QUALITY CHECKS
# ====================================================================

def validate_essential_data():
    """Validate that essential tables have data"""
    if train_movements.empty or trains.empty or timetable_events.empty:
        print("\n✗ ERROR: Essential tables are empty. Please run generate_data.py first.")
        conn.close()
        exit(1)

    print(f"\n✓ Data loaded successfully:")
    print(f"  - Train movements: {len(train_movements):,} records")
    print(f"  - Trains: {len(trains):,} records") 
    print(f"  - Tracks: {len(tracks):,} records")
    print(f"  - Timetable events: {len(timetable_events):,} records")

validate_essential_data()

# ====================================================================
# SECTION 4: DATA CLEANING AND PREPROCESSING  
# ====================================================================

print("\nCleaning and preprocessing railway data...")

def clean_train_movements_data(df):
    """Clean train movements data"""
    df_clean = df.copy()

    # Handle missing values
    df_clean['speed_kmph'] = df_clean['speed_kmph'].fillna(df_clean['speed_kmph'].mean())
    df_clean['priority'] = df_clean['priority'].fillna(df_clean['priority'].median()) 
    df_clean['type'] = df_clean['type'].fillna('passenger')  # Most common type
    df_clean['status'] = df_clean['status'].fillna('IN_TRANSIT')

    # Convert datetime columns
    if 'actual_arrival' in df_clean.columns:
        df_clean['actual_arrival'] = pd.to_datetime(df_clean['actual_arrival'], utc=True)
    if 'actual_departure' in df_clean.columns:
        df_clean['actual_departure'] = pd.to_datetime(df_clean['actual_departure'], utc=True)

    print("✓ Train movements data cleaned")
    return df_clean

def clean_timetable_events_data(df):
    """Clean timetable events data"""
    df_clean = df.copy()

    # Convert datetime columns
    if 'scheduled_arrival' in df_clean.columns:
        df_clean['scheduled_arrival'] = pd.to_datetime(df_clean['scheduled_arrival'], utc=True)
    if 'scheduled_departure' in df_clean.columns:
        df_clean['scheduled_departure'] = pd.to_datetime(df_clean['scheduled_departure'], utc=True)

    print("✓ Timetable events data cleaned")
    return df_clean

def clean_tracks_data(df):
    """Clean tracks data"""
    df_clean = df.copy()

    # Handle missing track data
    if 'allowed_speed' in df_clean.columns:
        df_clean['allowed_speed'] = df_clean['allowed_speed'].fillna(df_clean['allowed_speed'].mean())
    if 'length_m' in df_clean.columns:
        df_clean['length_m'] = df_clean['length_m'].fillna(df_clean['length_m'].mean())

    print("✓ Tracks data cleaned")
    return df_clean

# Apply cleaning functions
train_movements_clean = clean_train_movements_data(train_movements)
timetable_events_clean = clean_timetable_events_data(timetable_events)
tracks_clean = clean_tracks_data(tracks)

# ====================================================================
# SECTION 5: DATA MERGING AND UNIFIED DATASET CREATION
# ====================================================================

print("\nCreating unified railway dataset...")

def create_unified_railway_dataset():
    """Merge all important railway tables into unified dataset for AI training"""

    # Step 1: Start with train movements as base
    unified_df = train_movements_clean.copy()
    print(f"✓ Base dataset: {len(unified_df):,} records")

    # Step 2: Add track information to train movements
    if not tracks_clean.empty and 'track_id' in unified_df.columns:
        # Create track mapping for current station info
        track_map = tracks_clean.set_index('id')['to_station'].to_dict() if 'to_station' in tracks_clean.columns else {}

        if track_map:
            unified_df['current_station'] = unified_df['track_id'].map(track_map)
            print("✓ Track-to-station mapping added")

    # Step 3: Merge with trains table for train specifications  
    if not trains.empty:
        unified_df = unified_df.merge(
            trains, 
            left_on='train_id', 
            right_on='id', 
            how='left', 
            suffixes=('_move', '_train')
        )
        print(f"✓ Train specifications merged: {len(unified_df):,} records")

    # Step 4: Merge with timetable events for scheduled times
    if not timetable_events_clean.empty and 'current_station' in unified_df.columns:
        unified_df = unified_df.merge(
            timetable_events_clean,
            left_on=['train_id', 'current_station'],
            right_on=['train_id', 'station_id'], 
            how='left',
            suffixes=('_move', '_event')
        )
        print(f"✓ Timetable events merged: {len(unified_df):,} records")

    # Step 5: Add track infrastructure details
    if not tracks_clean.empty and 'current_station' in unified_df.columns:
        # Add track information for route planning
        track_info = tracks_clean.rename(columns={
            'from_station': 'current_station',
            'to_station': 'next_station'
        })

        if 'current_station' in track_info.columns and 'next_station' in track_info.columns:
            unified_df = unified_df.merge(
                track_info[['current_station', 'next_station', 'allowed_speed', 'length_m']],
                on='current_station',
                how='left'
            )
            print("✓ Track infrastructure details merged")

    print(f"\n✓ Unified railway dataset created: {len(unified_df):,} records with {len(unified_df.columns)} features")
    return unified_df

# Create the unified dataset
railway_df = create_unified_railway_dataset()

# ====================================================================
# SECTION 6: FINAL DATA QUALITY CHECKS AND SUMMARY
# ====================================================================

def generate_data_summary():
    """Generate comprehensive data summary"""

    print("\n" + "="*60)
    print("PHASE 1 COMPLETION SUMMARY")
    print("="*60)

    print(f"\n📊 UNIFIED DATASET STATS:")
    print(f"   Total Records: {len(railway_df):,}")
    print(f"   Total Features: {len(railway_df.columns)}")
    print(f"   Data Types: {railway_df.dtypes.value_counts().to_dict()}")

    print(f"\n🚂 TRAIN DATA:")
    if 'train_id' in railway_df.columns:
        print(f"   Unique Trains: {railway_df['train_id'].nunique()}")
    if 'type' in railway_df.columns:
        print(f"   Train Types: {railway_df['type'].value_counts().to_dict()}")

    print(f"\n🚉 STATION DATA:")
    if 'current_station' in railway_df.columns:
        print(f"   Unique Stations: {railway_df['current_station'].nunique()}")

    print(f"\n🛤️ TRACK DATA:")
    if 'track_id' in railway_df.columns:
        print(f"   Unique Tracks: {railway_df['track_id'].nunique()}")

    print(f"\n📈 DATA COMPLETENESS:")
    missing_data = railway_df.isnull().sum()
    if missing_data.sum() > 0:
        print("   Columns with missing data:")
        for col, missing in missing_data[missing_data > 0].items():
            percentage = (missing / len(railway_df)) * 100
            print(f"     - {col}: {missing} ({percentage:.1f}%)")
    else:
        print("   ✓ No missing data detected")

    print(f"\n💾 MEMORY USAGE:")
    memory_mb = railway_df.memory_usage(deep=True).sum() / 1024 / 1024
    print(f"   Dataset Size: {memory_mb:.2f} MB")

generate_data_summary()

# ====================================================================
# SECTION 7: SAVE PROCESSED DATA FOR NEXT PHASES
# ====================================================================

def save_processed_data():
    """Save the cleaned and merged data for AI training phases"""

    # Save the unified dataset
    output_file = os.path.join(MODELS_DIR, 'unified_railway_dataset.pkl')
    railway_df.to_pickle(output_file)
    print(f"\n💾 Unified dataset saved: {output_file}")

    # Save individual cleaned tables as well  
    train_movements_clean.to_pickle(os.path.join(MODELS_DIR, 'train_movements_clean.pkl'))
    timetable_events_clean.to_pickle(os.path.join(MODELS_DIR, 'timetable_events_clean.pkl'))
    tracks_clean.to_pickle(os.path.join(MODELS_DIR, 'tracks_clean.pkl'))

    # Save data processing metadata
    metadata = {
        'processing_timestamp': datetime.now().isoformat(),
        'dataset_info': {
            'total_records': len(railway_df),
            'total_features': len(railway_df.columns),
            'unique_trains': railway_df['train_id'].nunique() if 'train_id' in railway_df.columns else 0,
            'unique_stations': railway_df['current_station'].nunique() if 'current_station' in railway_df.columns else 0,
            'data_quality': 'clean' if railway_df.isnull().sum().sum() == 0 else 'needs_attention'
        },
        'tables_processed': {
            'train_movements': len(train_movements_clean),
            'trains': len(trains),
            'tracks': len(tracks_clean), 
            'timetable_events': len(timetable_events_clean)
        }
    }

    import json
    with open(os.path.join(MODELS_DIR, 'phase1_metadata.json'), 'w') as f:
        json.dump(metadata, f, indent=2, default=str)

    print("✓ Processing metadata saved")

save_processed_data()

# Close database connection
conn.close()

print("\n" + "="*60) 
print("✅ PHASE 1 COMPLETED SUCCESSFULLY!")
print("="*60)
print("\n🎯 READY FOR PHASE 2: AI Model Development")
print("   - Unified railway dataset created and saved")
print("   - Data cleaned and quality checked") 
print("   - All tables properly merged")
print("   - Metadata and processing logs saved")
print("\n📂 Generated Files:")
print("   - models/unified_railway_dataset.pkl")
print("   - models/train_movements_clean.pkl") 
print("   - models/timetable_events_clean.pkl")
print("   - models/tracks_clean.pkl")
print("   - models/phase1_metadata.json")

# now lets move to phase 2
#in the phase 2 we will now start creating our scheduler which will schdule all the train according to their priority and assing them their time and their slot and their track for arrival



#dhruv you have to continue from here 


<<<<<<< HEAD
=======
# Close database connection
conn.close()
<<<<<<< HEAD
>>>>>>> 230ee4cd325408633d0b9f99b0f49a4c546452d3
=======
>>>>>>> dbcc0da53dc5473be949a73b6362eee5c8373bbd
