#!/usr/bin/env python3
"""
DARNEX RAILWAY AI - DATA LOADER MODULE
=====================================
Loads data from all railway database tables
"""

import pandas as pd
import warnings
from config.database import establish_database_connection

# Suppress warnings for cleaner output
warnings.filterwarnings('ignore')

def load_data(query, db_conn):
    """Load data from SQL with error handling"""
    try:
        with warnings.catch_warnings():
            warnings.simplefilter("ignore", UserWarning)
            return pd.read_sql_query(query, db_conn)
    except Exception as e:
        print(f"Error loading data: {e}")
        return pd.DataFrame()

def load_table_data(query, db_conn, table_name):
    """Load data from database table with validation"""
    try:
        with warnings.catch_warnings():
            warnings.simplefilter("ignore", UserWarning)
            df = pd.read_sql_query(query, db_conn)
            if not df.empty:
                print(f"✓ {table_name}: {len(df):,} records loaded")
            else:
                print(f"⚠ {table_name}: Empty table")
            return df
    except Exception as e:
        print(f"✗ Error loading {table_name}: {e}")
        return pd.DataFrame()

class RailwayDataLoader:
    """Comprehensive railway data loader for all 13 tables"""
    
    def __init__(self):
        self.conn = establish_database_connection()
        self.data_tables = {}
        
    def load_all_railway_data(self):
        """Load all railway database tables"""
        print("📊 Loading all railway database tables...")
        
        # Load all 13 tables from your database schema
        queries = {
            'stations': "SELECT * FROM stations ORDER BY id",
            'platforms': "SELECT * FROM platforms ORDER BY station_id, platform_no",
            'tracks': "SELECT * FROM tracks ORDER BY from_station, to_station",
            'signals': "SELECT * FROM signals ORDER BY track_id, position_km",
            'trains': "SELECT * FROM trains ORDER BY train_no",
            'timetable_events': "SELECT * FROM timetable_events ORDER BY scheduled_arrival",
            'train_movements': "SELECT * FROM train_movements ORDER BY entry_time",
            'historical_data': "SELECT * FROM historical_data ORDER BY event_time DESC",
            'real_time_positions': "SELECT * FROM real_time_positions ORDER BY timestamp DESC",
            'incidents': "SELECT * FROM incidents ORDER BY incident_time DESC",
            'weather_records': "SELECT * FROM weather_records ORDER BY recorded_at DESC",
            'safety_scenarios': "SELECT * FROM safety_scenarios ORDER BY scenario_time DESC",
            'congestion_data': "SELECT * FROM congestion_data ORDER BY recorded_at DESC"
        }
        
        for table_name, query in queries.items():
            self.data_tables[table_name] = load_table_data(query, self.conn, table_name)
            
        return self.data_tables
    
    def load_core_tables(self):
        """Load only core railway tables (Phase 1)"""
        print("Loading core railway data from backend...")
        
        # Read core railway tables
        self.data_tables['train_movements'] = load_data(
            "SELECT * FROM train_movements ORDER BY actual_arrival", self.conn
        )
        self.data_tables['trains'] = load_data("SELECT * FROM trains", self.conn)
        self.data_tables['tracks'] = load_data("SELECT * FROM tracks", self.conn)
        self.data_tables['timetable_events'] = load_data(
            "SELECT * FROM timetable_events ORDER BY scheduled_arrival", self.conn
        )
        
        # Additional railway infrastructure tables
        additional_tables = ['stations', 'signals', 'crossings']
        for table in additional_tables:
            try:
                data = load_data(f"SELECT * FROM {table}", self.conn)
                self.data_tables[table] = data
                print(f"✓ {table.title()} data loaded: {len(data)} records")
            except:
                self.data_tables[table] = pd.DataFrame()
                print(f"- {table.title()} table not found")
                
        return self.data_tables
    
    def get_table_data(self, table_name):
        """Get specific table data"""
        return self.data_tables.get(table_name, pd.DataFrame())
    
    def validate_essential_data(self):
        """Validate that essential tables have data"""
        essential_tables = ['train_movements', 'trains', 'timetable_events']
        
        for table in essential_tables:
            if table not in self.data_tables or self.data_tables[table].empty:
                print(f"✗ ERROR: {table} table is empty. Please run generate_data.py first.")
                self.conn.close()
                exit(1)
        
        print(f"✓ Data loaded successfully:")
        for table in essential_tables:
            print(f" - {table}: {len(self.data_tables[table]):,} records")
    
    def get_data_summary(self):
        """Get summary of loaded data"""
        summary = {}
        for table_name, df in self.data_tables.items():
            summary[table_name] = {
                'records': len(df),
                'columns': len(df.columns) if not df.empty else 0,
                'memory_mb': df.memory_usage(deep=True).sum() / 1024 / 1024 if not df.empty else 0
            }
        return summary
    
    def close_connection(self):
        """Close database connection"""
        if self.conn:
            self.conn.close()
            print("✓ Database connection closed")