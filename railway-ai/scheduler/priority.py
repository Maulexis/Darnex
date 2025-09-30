#!/usr/bin/env python3
"""
DARNEX RAILWAY AI - TRAIN PRIORITY MODULE (FIXED)
================================================
Indian Railway priority system implementation - FIXED VERSION
"""

import pandas as pd

class TrainPriorityCalculator:
    """Calculate train priorities based on Indian Railway system"""
    
    def __init__(self):
        print("🚂 Initializing Indian Railway Priority System...")
        
        # Define exact priority system as per Indian Railways
        self.TRAIN_PRIORITIES = {
            'superfast': 1,    # Highest Priority
            'express': 2,      # High Priority
            'memu': 3,         # Medium Priority
            'passenger': 3,    # Medium Priority (same as MEMU)
            'goods': 4,        # Lowest Priority
            'freight': 4       # Same as goods
        }
        
        # Priority names for better readability
        self.PRIORITY_NAMES = {
            1: 'SUPERFAST (Highest)',
            2: 'EXPRESS (High)',
            3: 'MEMU/PASSENGER (Medium)',
            4: 'GOODS/FREIGHT (Lowest)'
        }
    
    def clean_train_data(self, trains_df):
        """Clean and prepare train data with correct priorities (FIXED VERSION)"""
        if trains_df.empty:
            print("✗ No train data available")
            return pd.DataFrame()
        
        print("\n🧹 Cleaning train data and assigning priorities...")
        trains_clean = trains_df.copy()
        
        # Clean train type data
        trains_clean['type'] = trains_clean['type'].fillna('passenger')
        trains_clean['type'] = trains_clean['type'].str.lower().str.strip()
        
        # Map train types to priority values
        trains_clean['priority_value'] = trains_clean['type'].map(self.TRAIN_PRIORITIES)
        
        # Handle unmapped types (default to passenger priority)
        trains_clean['priority_value'] = trains_clean['priority_value'].fillna(3)
        
        # Add priority names for clarity
        trains_clean['priority_name'] = trains_clean['priority_value'].map(self.PRIORITY_NAMES)
        
        # Clean numeric fields (FIXED - check if columns exist first)
        if 'capacity' in trains_clean.columns:
            trains_clean['capacity'] = pd.to_numeric(trains_clean['capacity'], errors='coerce').fillna(100)
        else:
            print("⚠ Column 'capacity' not found - using default value 100")
            trains_clean['capacity'] = 100
            
        if 'length' in trains_clean.columns:
            trains_clean['length'] = pd.to_numeric(trains_clean['length'], errors='coerce').fillna(200)
        else:
            print("⚠ Column 'length' not found - using default value 200")
            trains_clean['length'] = 200
        
        print(f"✓ Cleaned {len(trains_clean)} trains with priorities assigned")
        
        # Show priority distribution
        priority_counts = trains_clean['priority_name'].value_counts()
        print("\n📊 Train Priority Distribution:")
        for priority, count in priority_counts.items():
            print(f" {priority}: {count} trains")
        
        return trains_clean
    
    def calculate_delay_factors(self, trains_clean, historical_data, timetable_clean):
        """Calculate delay factors for each train based on historical performance"""
        delay_factors = {}
        
        if not historical_data.empty:
            # Calculate average delay from historical data
            if 'delay_minutes' in historical_data.columns:
                avg_delays = historical_data.groupby('train_id')['delay_minutes'].mean().to_dict()
                delay_factors.update(avg_delays)
                print(f"✓ Historical delay factors calculated for {len(avg_delays)} trains")
            else:
                print("⚠ No 'delay_minutes' column in historical data")
        
        if not timetable_clean.empty:
            # Calculate delay factors from timetable events
            if 'delay_minutes' in timetable_clean.columns:
                timetable_delays = timetable_clean.groupby('train_id')['delay_minutes'].mean().to_dict()
                
                # Merge with historical delays
                for train_id, delay in timetable_delays.items():
                    if train_id in delay_factors:
                        delay_factors[train_id] = (delay_factors[train_id] + delay) / 2
                    else:
                        delay_factors[train_id] = delay
                
                print(f"✓ Timetable delay factors calculated for {len(timetable_delays)} trains")
            else:
                print("⚠ No 'delay_minutes' column in timetable data")
        
        # Apply delay factors to trains
        if delay_factors:
            trains_clean['avg_delay_minutes'] = trains_clean['id'].map(delay_factors).fillna(0)
            # Penalty for frequently delayed trains (increases effective priority value)
            trains_clean['delay_penalty'] = trains_clean['avg_delay_minutes'] / 30  # 1 point per 30 minutes delay
        else:
            print("⚠ No delay data found - using default values")
            trains_clean['avg_delay_minutes'] = 0
            trains_clean['delay_penalty'] = 0
        
        return trains_clean
    
    def get_priority_mapping(self):
        """Get priority mapping for external use"""
        return self.TRAIN_PRIORITIES.copy()
    
    def get_priority_names(self):
        """Get priority names mapping"""
        return self.PRIORITY_NAMES.copy()
    
    def validate_priority_system(self, trains_df):
        """Validate that priority system is correctly applied"""
        if trains_df.empty:
            return False
        
        required_columns = ['priority_value', 'priority_name', 'type']
        for col in required_columns:
            if col not in trains_df.columns:
                print(f"✗ Missing required column: {col}")
                return False
        
        # Check priority value ranges
        valid_priorities = set(self.PRIORITY_NAMES.keys())
        actual_priorities = set(trains_df['priority_value'].unique())
        
        if not actual_priorities.issubset(valid_priorities):
            invalid = actual_priorities - valid_priorities
            print(f"✗ Invalid priority values found: {invalid}")
            return False
        
        print("✓ Priority system validation passed")
        return True