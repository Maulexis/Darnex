#!/usr/bin/env python3
"""
DARNEX RAILWAY AI - UPDATED DATA CLEANER MODULE (FIXED)
=====================================================
Data cleaning and preprocessing functions - FIXED VERSION
"""

import pandas as pd
import numpy as np
from datetime import datetime

class RailwayDataCleaner:
    """Clean and preprocess railway data"""
    
    def __init__(self):
        print("🧹 Initializing Railway Data Cleaner...")
    
    def clean_train_movements_data(self, df):
        """Clean train movements data (FIXED - no priority access)"""
        if df.empty:
            return df
            
        df_clean = df.copy()
        
        # Handle missing values (REMOVED priority line since it's in trains table)
        if 'speed_kmph' in df_clean.columns:
            df_clean['speed_kmph'] = df_clean['speed_kmph'].fillna(df_clean['speed_kmph'].mean())
        
        if 'type' in df_clean.columns:
            df_clean['type'] = df_clean['type'].fillna('passenger')  # Most common type
        
        if 'status' in df_clean.columns:
            df_clean['status'] = df_clean['status'].fillna('IN_TRANSIT')
        
        # Convert datetime columns
        if 'actual_arrival' in df_clean.columns:
            df_clean['actual_arrival'] = pd.to_datetime(df_clean['actual_arrival'], utc=True)
        if 'actual_departure' in df_clean.columns:
            df_clean['actual_departure'] = pd.to_datetime(df_clean['actual_departure'], utc=True)
            
        print("✓ Train movements data cleaned")
        return df_clean
    
    def merge_train_priority_data(self, train_movements_df, trains_df):
        """Merge priority from trains table into train_movements"""
        if train_movements_df.empty or trains_df.empty:
            return train_movements_df
            
        # Select only needed columns from trains table
        trains_priority = trains_df[['id', 'priority']].rename(columns={'id': 'train_id_ref'})
        
        # Merge priority based on train_id
        merged_df = train_movements_df.merge(
            trains_priority,
            left_on='train_id',
            right_on='train_id_ref',
            how='left'
        ).drop('train_id_ref', axis=1)
        
        # Fill missing priorities with default (3 = passenger)
        merged_df['priority'] = merged_df['priority'].fillna(3)
        
        print(f"✓ Merged priority data: {len(merged_df)} records with priority")
        return merged_df
    
    def clean_timetable_events_data(self, df):
        """Clean timetable events data"""
        if df.empty:
            return df
            
        df_clean = df.copy()
        
        # Convert datetime columns
        if 'scheduled_arrival' in df_clean.columns:
            df_clean['scheduled_arrival'] = pd.to_datetime(df_clean['scheduled_arrival'], utc=True)
        if 'scheduled_departure' in df_clean.columns:
            df_clean['scheduled_departure'] = pd.to_datetime(df_clean['scheduled_departure'], utc=True)
            
        print("✓ Timetable events data cleaned")
        return df_clean
    
    def clean_tracks_data(self, df):
        """Clean tracks data"""
        if df.empty:
            return df
            
        df_clean = df.copy()
        
        # Handle missing track data
        if 'allowed_speed' in df_clean.columns:
            df_clean['allowed_speed'] = df_clean['allowed_speed'].fillna(df_clean['allowed_speed'].mean())
        if 'length_m' in df_clean.columns:
            df_clean['length_m'] = df_clean['length_m'].fillna(df_clean['length_m'].mean())
            
        print("✓ Tracks data cleaned")
        return df_clean
    
    def clean_supporting_data(self, data_tables):
        """Clean all supporting data tables"""
        print("🔧 Cleaning supporting database tables...")
        cleaned_data = {}
        
        # Clean stations data
        if 'stations' in data_tables and not data_tables['stations'].empty:
            stations_clean = data_tables['stations'].copy()
            stations_clean['lat'] = pd.to_numeric(stations_clean['lat'], errors='coerce')
            stations_clean['lon'] = pd.to_numeric(stations_clean['lon'], errors='coerce')
            stations_clean['distance_from_jaipur'] = pd.to_numeric(
                stations_clean['distance_from_jaipur'], errors='coerce'
            )
            cleaned_data['stations'] = stations_clean
            print(f"✓ Stations cleaned: {len(stations_clean)} records")
        
        # Clean tracks data
        if 'tracks' in data_tables and not data_tables['tracks'].empty:
            tracks_clean = data_tables['tracks'].copy()
            tracks_clean['distance_km'] = pd.to_numeric(tracks_clean['distance_km'], errors='coerce')
            tracks_clean['allowed_speed'] = pd.to_numeric(
                tracks_clean['allowed_speed'], errors='coerce'
            ).fillna(60)
            tracks_clean['length_m'] = pd.to_numeric(tracks_clean['length_m'], errors='coerce')
            cleaned_data['tracks'] = tracks_clean
            print(f"✓ Tracks cleaned: {len(tracks_clean)} records")
        
        # Clean timetable events
        if 'timetable_events' in data_tables and not data_tables['timetable_events'].empty:
            timetable_clean = data_tables['timetable_events'].copy()
            timetable_clean['scheduled_arrival'] = pd.to_datetime(
                timetable_clean['scheduled_arrival'], errors='coerce'
            )
            timetable_clean['scheduled_departure'] = pd.to_datetime(
                timetable_clean['scheduled_departure'], errors='coerce'
            )
            timetable_clean['delay_minutes'] = pd.to_numeric(
                timetable_clean['delay_minutes'], errors='coerce'
            ).fillna(0)
            cleaned_data['timetable'] = timetable_clean
            print(f"✓ Timetable events cleaned: {len(timetable_clean)} records")
        
        # Clean real-time positions
        if 'real_time_positions' in data_tables and not data_tables['real_time_positions'].empty:
            positions_clean = data_tables['real_time_positions'].copy()
            positions_clean['timestamp'] = pd.to_datetime(
                positions_clean['timestamp'], errors='coerce'
            )
            positions_clean['speed_kmph'] = pd.to_numeric(
                positions_clean['speed_kmph'], errors='coerce'
            ).fillna(0)
            positions_clean['position_km'] = pd.to_numeric(
                positions_clean['position_km'], errors='coerce'
            )
            cleaned_data['positions'] = positions_clean
            print(f"✓ Real-time positions cleaned: {len(positions_clean)} records")
        
        # Clean congestion data
        if 'congestion_data' in data_tables and not data_tables['congestion_data'].empty:
            congestion_clean = data_tables['congestion_data'].copy()
            congestion_clean['recorded_at'] = pd.to_datetime(
                congestion_clean['recorded_at'], errors='coerce'
            )
            congestion_clean['congestion_level'] = pd.to_numeric(
                congestion_clean['congestion_level'], errors='coerce'
            ).fillna(1)
            cleaned_data['congestion'] = congestion_clean
            print(f"✓ Congestion data cleaned: {len(congestion_clean)} records")
        
        return cleaned_data
    
    def create_unified_railway_dataset(self, train_movements_clean, trains, tracks_clean, 
                                     timetable_events_clean):
        """Merge all important railway tables into unified dataset for AI training"""
        print("Creating unified railway dataset...")
        
        # Step 1: Start with train movements as base
        unified_df = train_movements_clean.copy()
        print(f"✓ Base dataset: {len(unified_df):,} records")
        
        # Step 2: Add track information to train movements
        if not tracks_clean.empty and 'track_id' in unified_df.columns:
            # Create track mapping for current station info
            track_map = (tracks_clean.set_index('id')['to_station'].to_dict() 
                        if 'to_station' in tracks_clean.columns else {})
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
        
        print(f"✓ Unified railway dataset created: {len(unified_df):,} records with {len(unified_df.columns)} features")
        return unified_df
    
    def generate_data_summary(self, railway_df):
        """Generate comprehensive data summary"""
        print("\n" + "="*60)
        print("DATA CLEANING COMPLETION SUMMARY")
        print("="*60)
        
        print(f"\n📊 UNIFIED DATASET STATS:")
        print(f" Total Records: {len(railway_df):,}")
        print(f" Total Features: {len(railway_df.columns)}")
        print(f" Data Types: {railway_df.dtypes.value_counts().to_dict()}")
        
        print(f"\n🚂 TRAIN DATA:")
        if 'train_id' in railway_df.columns:
            print(f" Unique Trains: {railway_df['train_id'].nunique()}")
        if 'type' in railway_df.columns:
            print(f" Train Types: {railway_df['type'].value_counts().to_dict()}")
        
        print(f"\n🚉 STATION DATA:")
        if 'current_station' in railway_df.columns:
            print(f" Unique Stations: {railway_df['current_station'].nunique()}")
        
        print(f"\n🛤️ TRACK DATA:")
        if 'track_id' in railway_df.columns:
            print(f" Unique Tracks: {railway_df['track_id'].nunique()}")
        
        print(f"\n📈 DATA COMPLETENESS:")
        missing_data = railway_df.isnull().sum()
        if missing_data.sum() > 0:
            print(" Columns with missing data:")
            for col, missing in missing_data[missing_data > 0].items():
                percentage = (missing / len(railway_df)) * 100
                print(f" - {col}: {missing} ({percentage:.1f}%)")
        else:
            print(" ✓ No missing data detected")
        
        print(f"\n💾 MEMORY USAGE:")
        memory_mb = railway_df.memory_usage(deep=True).sum() / 1024 / 1024
        print(f" Dataset Size: {memory_mb:.2f} MB")