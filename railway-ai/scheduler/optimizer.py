#!/usr/bin/env python3
"""
DARNEX RAILWAY AI - SCHEDULE OPTIMIZER MODULE
=============================================
AI-powered train scheduling optimization
"""

import pandas as pd
from datetime import datetime, timedelta

class ScheduleOptimizer:
    """AI optimizer for train scheduling"""
    
    def __init__(self, priority_calculator):
        self.priority_calculator = priority_calculator
        self.scheduled_trains = pd.DataFrame()
        print("🚀 Initializing AI Schedule Optimizer...")
    
    def generate_priority_schedule(self, trains_clean, cleaned_data):
        """Generate optimized train schedule based on priority system"""
        print("\n🚀 Generating AI-optimized train schedule...")
        
        if trains_clean.empty:
            print("✗ No train data available for scheduling")
            return pd.DataFrame()
        
        # Calculate final scheduling priority (lower number = higher priority)
        trains_clean['final_priority'] = trains_clean['priority_value'] + trains_clean['delay_penalty']
        
        # Sort trains by final priority (ascending = higher priority first)
        priority_sorted = trains_clean.sort_values(['final_priority', 'capacity'], ascending=[True, False])
        print(f"✓ Trains sorted by priority: {len(priority_sorted)} trains")
        
        # Generate schedule data
        schedule_data = []
        current_time = datetime.now().replace(hour=5, minute=0, second=0, microsecond=0)  # Start at 5 AM
        
        # Get station information for routing
        stations_info = cleaned_data.get('stations', pd.DataFrame())
        timetable_info = cleaned_data.get('timetable', pd.DataFrame())
        
        for idx, train in priority_sorted.iterrows():
            train_id = train['id']
            train_no = train.get('train_no', f'T{train_id}')
            train_name = train.get('name', f'Train {train_no}')
            train_type = train['type']
            priority_value = train['priority_value']
            priority_name = train['priority_name']
            final_priority = train['final_priority']
            
            # Get train's route from timetable if available
            if not timetable_info.empty:
                train_route = timetable_info[timetable_info['train_id'] == train_id].sort_values('order_no')
            else:
                train_route = pd.DataFrame()
            
            if train_route.empty:
                # Create a basic route using available stations
                if not stations_info.empty:
                    sample_stations = stations_info.head(3)['id'].tolist()
                else:
                    sample_stations = [1, 2, 3]  # Default station IDs
                
                for i, station_id in enumerate(sample_stations):
                    departure_time = current_time + timedelta(minutes=i*20)  # 20 min between stations
                    arrival_time = departure_time - timedelta(minutes=2)  # 2 min stop time
                    
                    station_name = f"Station {station_id}"
                    if not stations_info.empty:
                        station_row = stations_info[stations_info['id'] == station_id]
                        if not station_row.empty:
                            station_name = station_row.iloc[0].get('name', station_name)
                    
                    schedule_data.append({
                        'schedule_id': len(schedule_data) + 1,
                        'train_id': train_id,
                        'train_no': train_no,
                        'train_name': train_name,
                        'train_type': train_type.upper(),
                        'priority_value': priority_value,
                        'priority_name': priority_name,
                        'final_priority': round(final_priority, 2),
                        'station_id': station_id,
                        'station_name': station_name,
                        'scheduled_arrival': arrival_time,
                        'scheduled_departure': departure_time,
                        'platform_no': 1,
                        'track_id': 1,
                        'order_no': i + 1,
                        'avg_delay_minutes': round(train['avg_delay_minutes'], 1)
                    })
            else:
                # Use existing timetable data
                for route_idx, event in train_route.iterrows():
                    station_name = f"Station {event['station_id']}"
                    if not stations_info.empty:
                        station_row = stations_info[stations_info['id'] == event['station_id']]
                        if not station_row.empty:
                            station_name = station_row.iloc[0].get('name', station_name)
                    
                    schedule_data.append({
                        'schedule_id': len(schedule_data) + 1,
                        'train_id': train_id,
                        'train_no': train_no,
                        'train_name': train_name,
                        'train_type': train_type.upper(),
                        'priority_value': priority_value,
                        'priority_name': priority_name,
                        'final_priority': round(final_priority, 2),
                        'station_id': event['station_id'],
                        'station_name': station_name,
                        'scheduled_arrival': event.get('scheduled_arrival', current_time),
                        'scheduled_departure': event.get('scheduled_departure', current_time + timedelta(minutes=5)),
                        'platform_no': event.get('platform_no', 1),
                        'track_id': event.get('track_id', 1),
                        'order_no': event.get('order_no', 1),
                        'avg_delay_minutes': round(train['avg_delay_minutes'], 1)
                    })
            
            # Time increment based on priority (higher priority gets better slots)
            if priority_value == 1:  # Superfast
                time_increment = 15
            elif priority_value == 2:  # Express
                time_increment = 20
            elif priority_value == 3:  # MEMU/Passenger
                time_increment = 25
            else:  # Goods/Freight
                time_increment = 30
            
            current_time += timedelta(minutes=time_increment)
        
        # Create schedule DataFrame
        self.scheduled_trains = pd.DataFrame(schedule_data)
        
        if not self.scheduled_trains.empty:
            print(f"✓ Generated optimized schedule: {len(self.scheduled_trains)} schedule entries")
            print(f"✓ Covering {self.scheduled_trains['train_id'].nunique()} unique trains")
        
        return self.scheduled_trains
    
    def optimize_time_slots(self, schedule_df):
        """Optimize time slots to minimize conflicts"""
        if schedule_df.empty:
            return schedule_df
        
        print("🔧 Optimizing time slots for conflicts...")
        
        # Sort by station and time to detect conflicts
        schedule_sorted = schedule_df.sort_values(['station_id', 'scheduled_arrival'])
        
        # Track platform availability
        platform_availability = {}
        
        for idx, row in schedule_sorted.iterrows():
            station_id = row['station_id']
            platform_no = row['platform_no']
            arrival_time = row['scheduled_arrival']
            departure_time = row['scheduled_departure']
            
            # Create platform key
            platform_key = f"{station_id}_{platform_no}"
            
            # Check if platform is available
            if platform_key in platform_availability:
                last_departure = platform_availability[platform_key]
                if arrival_time < last_departure + timedelta(minutes=5):  # 5 min buffer
                    # Conflict detected - shift time or change platform
                    new_arrival = last_departure + timedelta(minutes=5)
                    new_departure = new_arrival + (departure_time - arrival_time)
                    
                    schedule_df.loc[idx, 'scheduled_arrival'] = new_arrival
                    schedule_df.loc[idx, 'scheduled_departure'] = new_departure
                    
                    platform_availability[platform_key] = new_departure
                else:
                    platform_availability[platform_key] = departure_time
            else:
                platform_availability[platform_key] = departure_time
        
        print("✓ Time slot optimization completed")
        return schedule_df
    
    def generate_schedule_summary(self):
        """Generate comprehensive scheduling summary"""
        if self.scheduled_trains.empty:
            return {}
        
        summary = {
            'generation_timestamp': datetime.now().isoformat(),
            'total_trains': self.scheduled_trains['train_id'].nunique(),
            'total_schedule_entries': len(self.scheduled_trains),
            'priority_distribution': {},
            'train_type_distribution': self.scheduled_trains['train_type'].value_counts().to_dict(),
            'average_delays': {},
            'time_span': {
                'earliest_departure': str(self.scheduled_trains['scheduled_departure'].min()),
                'latest_arrival': str(self.scheduled_trains['scheduled_arrival'].max())
            },
            'scheduling_algorithm': 'Indian Railway Priority System',
            'priority_order': 'Superfast > Express > MEMU/Passenger > Goods'
        }
        
        # Calculate priority distribution
        priority_names = self.priority_calculator.get_priority_names()
        for priority_val in [1, 2, 3, 4]:
            count = len(self.scheduled_trains[self.scheduled_trains['priority_value'] == priority_val])
            priority_name = priority_names.get(priority_val, f'Priority {priority_val}')
            summary['priority_distribution'][priority_name] = count
        
        # Calculate average delays by priority
        delay_by_priority = self.scheduled_trains.groupby('priority_value')['avg_delay_minutes'].mean()
        for priority_val, avg_delay in delay_by_priority.items():
            priority_name = priority_names.get(priority_val, f'Priority {priority_val}')
            summary['average_delays'][priority_name] = round(avg_delay, 2)
        
        return summary
    
    def display_scheduling_results(self, summary):
        """Display comprehensive scheduling results"""
        print("\n" + "="*70)
        print("🎯 AI TRAIN SCHEDULING RESULTS")
        print("="*70)
        
        if self.scheduled_trains.empty:
            print("❌ No schedule generated")
            return
        
        print(f"\n📊 SCHEDULING SUMMARY:")
        print(f" Total Trains Scheduled: {summary['total_trains']}")
        print(f" Total Schedule Entries: {summary['total_schedule_entries']}")
        
        print(f"\n🚂 PRIORITY DISTRIBUTION (Indian Railway System):")
        for priority_name, count in summary['priority_distribution'].items():
            print(f" {priority_name}: {count} trains")
        
        print(f"\n🚃 TRAIN TYPE DISTRIBUTION:")
        for train_type, count in summary['train_type_distribution'].items():
            print(f" {train_type}: {count} entries")
        
        print(f"\n⏱️ AVERAGE DELAYS BY PRIORITY:")
        for priority_name, avg_delay in summary['average_delays'].items():
            print(f" {priority_name}: {avg_delay} minutes")
        
        print(f"\n📋 TOP 10 HIGHEST PRIORITY TRAINS:")
        print("-" * 70)
        top_priority = self.scheduled_trains.drop_duplicates('train_id').head(10)
        for _, train in top_priority.iterrows():
            print(f" {train['train_no']} | {train['train_name'][:25]:<25} | {train['train_type']:<10} | {train['priority_name']}")
    
    def get_scheduled_trains(self):
        """Get the scheduled trains DataFrame"""
        return self.scheduled_trains.copy() if not self.scheduled_trains.empty else pd.DataFrame()