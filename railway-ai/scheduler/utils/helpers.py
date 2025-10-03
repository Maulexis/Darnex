#!/usr/bin/env python3
"""
DARNEX RAILWAY AI - UTILITIES MODULE
===================================
Common utility functions and helpers
"""

import pandas as pd
import numpy as np
import os
import json
import pickle
from datetime import datetime

class RailwayUtils:
    """Utility functions for railway AI system"""
    
    def __init__(self, models_dir='models'):
        self.models_dir = models_dir
        os.makedirs(self.models_dir, exist_ok=True)
    
    def save_processed_data(self, railway_df, train_movements_clean, timetable_events_clean, tracks_clean):
        """Save the cleaned and merged data for AI training phases"""
        print(f"\n💾 Saving processed data...")
        
        # Save the unified dataset
        output_file = os.path.join(self.models_dir, 'unified_railway_dataset.pkl')
        railway_df.to_pickle(output_file)
        print(f"✓ Unified dataset saved: {output_file}")
        
        # Save individual cleaned tables as well
        train_movements_clean.to_pickle(os.path.join(self.models_dir, 'train_movements_clean.pkl'))
        timetable_events_clean.to_pickle(os.path.join(self.models_dir, 'timetable_events_clean.pkl'))
        tracks_clean.to_pickle(os.path.join(self.models_dir, 'tracks_clean.pkl'))
        
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
                'trains': 0,  # Will be updated
                'tracks': len(tracks_clean),
                'timetable_events': len(timetable_events_clean)
            }
        }
        
        with open(os.path.join(self.models_dir, 'phase1_metadata.json'), 'w') as f:
            json.dump(metadata, f, indent=2, default=str)
        print("✓ Processing metadata saved")
    
    def save_phase2_results(self, final_schedule, trains_with_delays, schedule_summary):
        """Save all Phase 2 scheduling results"""
        if not final_schedule.empty:
            # Save main schedule
            final_schedule.to_csv(os.path.join(self.models_dir, 'phase2_train_schedule.csv'), index=False)
            final_schedule.to_pickle(os.path.join(self.models_dir, 'phase2_train_schedule.pkl'))
            
            # Save clean train data with priorities
            trains_with_delays.to_pickle(os.path.join(self.models_dir, 'trains_with_priorities.pkl'))
            
            # Save scheduling metadata
            with open(os.path.join(self.models_dir, 'phase2_schedule_metadata.json'), 'w') as f:
                json.dump(schedule_summary, f, indent=2, default=str)
            
            print(f"\n💾 Phase 2 Results Saved:")
            print(f" 📄 phase2_train_schedule.csv - Complete schedule")
            print(f" 📦 phase2_train_schedule.pkl - Python format")
            print(f" 🚂 trains_with_priorities.pkl - Train data with priorities")
            print(f" 📋 phase2_schedule_metadata.json - Scheduling metadata")
    
    def load_saved_data(self, filename):
        """Load saved pickle data"""
        filepath = os.path.join(self.models_dir, filename)
        try:
            return pd.read_pickle(filepath)
        except Exception as e:
            print(f"Error loading {filename}: {e}")
            return pd.DataFrame()
    
    def load_metadata(self, filename):
        """Load JSON metadata"""
        filepath = os.path.join(self.models_dir, filename)
        try:
            with open(filepath, 'r') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading metadata {filename}: {e}")
            return {}
    
    def print_phase_header(self, phase_name, description):
        """Print formatted phase header"""
        print("\n" + "="*70)
        print(f"🚂 DARNEX AI {phase_name}")
        print(description)
        print("="*70)
    
    def print_completion_message(self, phase_name, achievements):
        """Print completion message with achievements"""
        print("\n" + "="*70)
        print(f"✅ {phase_name} COMPLETED SUCCESSFULLY!")
        print("="*70)
        
        print(f"\n🎯 {phase_name} ACHIEVEMENTS:")
        for achievement in achievements:
            print(f" ✓ {achievement}")
    
    def validate_data_integrity(self, dataframes_dict):
        """Validate data integrity across multiple DataFrames"""
        issues = []
        
        for name, df in dataframes_dict.items():
            if df.empty:
                issues.append(f"{name} is empty")
                continue
            
            # Check for excessive missing values
            missing_pct = (df.isnull().sum().sum() / (len(df) * len(df.columns))) * 100
            if missing_pct > 50:
                issues.append(f"{name} has {missing_pct:.1f}% missing values")
            
            # Check for duplicate records
            if df.duplicated().sum() > len(df) * 0.1:  # More than 10% duplicates
                issues.append(f"{name} has excessive duplicate records")
        
        if issues:
            print("⚠ Data integrity issues found:")
            for issue in issues:
                print(f" - {issue}")
            return False
        
        print("✓ Data integrity validation passed")
        return True
    
    def get_system_stats(self, dataframes_dict):
        """Get system statistics"""
        stats = {
            'total_tables': len(dataframes_dict),
            'total_records': sum(len(df) for df in dataframes_dict.values()),
            'total_memory_mb': sum(df.memory_usage(deep=True).sum() for df in dataframes_dict.values()) / 1024 / 1024,
            'processing_timestamp': datetime.now().isoformat()
        }
        
        return stats
    
    def create_backup(self, data, filename):
        """Create backup of important data"""
        backup_dir = os.path.join(self.models_dir, 'backups')
        os.makedirs(backup_dir, exist_ok=True)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_filename = f"{filename}_{timestamp}.pkl"
        backup_path = os.path.join(backup_dir, backup_filename)
        
        try:
            data.to_pickle(backup_path)
            print(f"✓ Backup created: {backup_filename}")
        except Exception as e:
            print(f"✗ Backup failed: {e}")
    
    def cleanup_old_files(self, days_old=7):
        """Clean up old files in models directory"""
        import glob
        from pathlib import Path
        
        cutoff_time = datetime.now() - pd.Timedelta(days=days_old)
        
        for filepath in glob.glob(os.path.join(self.models_dir, "*.pkl")):
            file_time = datetime.fromtimestamp(Path(filepath).stat().st_mtime)
            if file_time < cutoff_time:
                try:
                    os.remove(filepath)
                    print(f"✓ Cleaned up old file: {os.path.basename(filepath)}")
                except Exception as e:
                    print(f"✗ Failed to remove {filepath}: {e}")

def format_time_duration(start_time, end_time):
    """Format time duration in human readable format"""
    duration = end_time - start_time
    
    hours, remainder = divmod(duration.total_seconds(), 3600)
    minutes, seconds = divmod(remainder, 60)
    
    if hours > 0:
        return f"{int(hours)}h {int(minutes)}m {int(seconds)}s"
    elif minutes > 0:
        return f"{int(minutes)}m {int(seconds)}s"
    else:
        return f"{int(seconds)}s"

def create_directory_structure():
    """Create the organized directory structure"""
    directories = [
        'models',
        'models/backups',
        'logs',
        'config',
        'data',
        'scheduler',
        'utils'
    ]
    
    for directory in directories:
        os.makedirs(directory, exist_ok=True)
    
    print("✓ Directory structure created")

def print_file_structure():
    """Print the organized file structure"""
    print("\n📁 ORGANIZED RAILWAY AI STRUCTURE:")
    print("railway-ai/")
    print("├── config/")
    print("│   └── database.py          # Database connections")
    print("├── data/")
    print("│   ├── loader.py           # Data loading functions")
    print("│   └── cleaner.py          # Data cleaning functions")
    print("├── scheduler/")
    print("│   ├── priority.py         # Priority calculations")
    print("│   └── optimizer.py        # Schedule optimization")
    print("├── utils/")
    print("│   └── helpers.py          # Utility functions")
    print("├── models/                 # Generated models & data")
    print("├── logs/                   # Log files")
    print("└── main.py                 # Main orchestrator")