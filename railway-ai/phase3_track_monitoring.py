#!/usr/bin/env python3
"""
DARNEX RAILWAY AI - REAL-TIME TRACK MONITORING & COLLISION AVOIDANCE
===================================================================
AI system that monitors live tracks, detects blockages/incidents, 
and automatically reroutes approaching trains to prevent collisions
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import json
import warnings
warnings.filterwarnings('ignore')

class TrackMonitoringSystem:
    """Real-time track monitoring and collision avoidance AI"""
    
    def __init__(self, models_dir='models'):
        self.models_dir = models_dir
        
        # Safety parameters
        self.SAFETY_DISTANCE_KM = 5.0  # Minimum safe distance between trains
        self.APPROACH_WARNING_KM = 10.0  # Distance to start monitoring approaching trains
        self.CRITICAL_SPEED_KMPH = 80  # Speed above which collision risk is critical
        
        # Track monitoring status
        self.blocked_tracks = set()
        self.monitored_trains = {}
        self.active_alerts = []
        
        print("🚨 Real-time Track Monitoring System Initialized")
        print(f"   Safety Distance: {self.SAFETY_DISTANCE_KM} km")
        print(f"   Approach Warning: {self.APPROACH_WARNING_KM} km")
    
    def monitor_live_tracks(self, real_time_positions, tracks_data):
        """Monitor all tracks for train positions and potential conflicts"""
        print("\\n🔍 Monitoring Live Track Status...")
        
        if real_time_positions.empty or tracks_data.empty:
            print("❌ No real-time data available for monitoring")
            return {}
        
        track_status = {}
        current_time = datetime.now()
        
        # Group trains by track
        trains_by_track = real_time_positions.groupby('track_id')
        
        for track_id, track_trains in trains_by_track:
            track_info = tracks_data[tracks_data['id'] == track_id]
            
            if track_info.empty:
                continue
                
            track_length = float(track_info.iloc[0].get('distance_km', 10))
            track_name = f"Track {track_id}"
            
            # Sort trains by position on track
            track_trains_sorted = track_trains.sort_values('position_km')
            
            track_status[track_id] = {
                'track_name': track_name,
                'track_length_km': track_length,
                'total_trains': len(track_trains_sorted),
                'trains_on_track': [],
                'potential_conflicts': [],
                'status': 'CLEAR'
            }
            
            # Analyze each train on this track
            for idx, (_, train) in enumerate(track_trains_sorted.iterrows()):
                train_info = {
                    'train_id': train['train_id'],
                    'position_km': float(train.get('position_km', 0)),
                    'speed_kmph': float(train.get('speed_kmph', 0)),
                    'timestamp': train['timestamp'],
                    'status': 'MOVING' if train.get('speed_kmph', 0) > 5 else 'STATIONARY'
                }
                
                # Check if train is stationary (potential blockage)
                if train_info['speed_kmph'] < 5:
                    train_info['stationary_duration'] = self.calculate_stationary_duration(
                        train['train_id'], train['timestamp']
                    )
                    
                    # If stationary for more than 10 minutes, consider it a blockage
                    if train_info['stationary_duration'] > 10:
                        train_info['blockage_risk'] = 'HIGH'
                        track_status[track_id]['status'] = 'BLOCKED'
                        self.blocked_tracks.add(track_id)
                    else:
                        train_info['blockage_risk'] = 'MEDIUM'
                else:
                    train_info['blockage_risk'] = 'LOW'
                
                track_status[track_id]['trains_on_track'].append(train_info)
            
            # Check for potential train-to-train conflicts
            track_status[track_id]['potential_conflicts'] = self.detect_train_conflicts(
                track_status[track_id]['trains_on_track']
            )
            
            if track_status[track_id]['potential_conflicts']:
                track_status[track_id]['status'] = 'CONFLICT_RISK'
        
        print(f"✅ Monitored {len(track_status)} tracks with {sum(ts['total_trains'] for ts in track_status.values())} trains")
        
        return track_status
    
    def detect_incidents_and_failures(self, incidents_data, safety_scenarios):
        """Detect active incidents and technical failures on tracks"""
        print("\\n⚠️ Detecting Track Incidents and Technical Failures...")
        
        active_incidents = {}
        
        # Process active incidents
        if not incidents_data.empty:
            recent_incidents = incidents_data[
                (incidents_data['status'] == 'active') &
                (pd.to_datetime(incidents_data['incident_time']) >= datetime.now() - timedelta(hours=6))
            ]
            
            for _, incident in recent_incidents.iterrows():
                track_id = incident['track_id']
                
                if track_id not in active_incidents:
                    active_incidents[track_id] = []
                
                incident_info = {
                    'incident_id': incident['id'],
                    'incident_type': self.classify_incident_type(incident.get('description', '')),
                    'severity': self.calculate_incident_severity(incident),
                    'position_km': float(incident.get('position_km', 0)),
                    'description': incident.get('description', 'Unknown incident'),
                    'incident_time': incident['incident_time'],
                    'estimated_clearance_time': self.estimate_clearance_time(incident)
                }
                
                active_incidents[track_id].append(incident_info)
                
                # Mark track as blocked if severe incident
                if incident_info['severity'] in ['HIGH', 'CRITICAL']:
                    self.blocked_tracks.add(track_id)
        
        # Process safety scenarios (technical failures)
        if not safety_scenarios.empty:
            recent_scenarios = safety_scenarios[
                pd.to_datetime(safety_scenarios['scenario_time']) >= datetime.now() - timedelta(hours=2)
            ]
            
            for _, scenario in recent_scenarios.iterrows():
                if 'failure' in str(scenario.get('scenario_type', '')).lower():
                    track_id = scenario.get('track_id')
                    
                    if track_id and track_id not in active_incidents:
                        active_incidents[track_id] = []
                    
                    if track_id:
                        failure_info = {
                            'incident_id': f"TECH_{scenario['id']}",
                            'incident_type': 'TECHNICAL_FAILURE', 
                            'severity': 'HIGH',
                            'position_km': float(scenario.get('position_km', 0)),
                            'description': f"Technical failure: {scenario.get('scenario_type', 'Unknown')}",
                            'incident_time': scenario['scenario_time'],
                            'estimated_clearance_time': datetime.now() + timedelta(hours=2)
                        }
                        
                        active_incidents[track_id].append(failure_info)
                        self.blocked_tracks.add(track_id)
        
        print(f"✅ Detected incidents on {len(active_incidents)} tracks")
        for track_id, incidents in active_incidents.items():
            print(f"   Track {track_id}: {len(incidents)} active incidents")
        
        return active_incidents
    
    def detect_approaching_trains(self, track_status, incidents, real_time_positions):
        """Detect trains approaching blocked or incident tracks"""
        print("\\n🚂 Detecting Trains Approaching Blocked Areas...")
        
        approaching_trains = []
        
        for track_id in self.blocked_tracks:
            if track_id not in track_status:
                continue
            
            # Find all trains on adjacent tracks that might approach this blocked track
            adjacent_trains = self.find_trains_approaching_track(
                track_id, real_time_positions, track_status
            )
            
            for train_info in adjacent_trains:
                # Calculate collision risk
                collision_risk = self.calculate_collision_risk(
                    train_info, track_id, incidents.get(track_id, [])
                )
                
                if collision_risk['risk_level'] in ['HIGH', 'CRITICAL']:
                    approaching_trains.append({
                        'train_id': train_info['train_id'],
                        'current_track': train_info['current_track'],
                        'target_track': track_id,
                        'distance_to_conflict': collision_risk['distance_km'],
                        'time_to_conflict': collision_risk['time_minutes'],
                        'current_speed': train_info['speed_kmph'],
                        'risk_level': collision_risk['risk_level'],
                        'recommended_action': collision_risk['recommended_action']
                    })
        
        print(f"⚠️ Found {len(approaching_trains)} trains requiring immediate attention")
        
        return approaching_trains
    
    def generate_rerouting_decisions(self, approaching_trains, tracks_data):
        """Generate automatic rerouting decisions for approaching trains"""
        print("\\n🗺️ Generating Automatic Rerouting Decisions...")
        
        rerouting_decisions = []
        
        for train in approaching_trains:
            train_id = train['train_id']
            current_track = train['current_track']
            blocked_track = train['target_track']
            
            # Find alternate routes
            alternate_routes = self.find_alternate_routes(
                current_track, blocked_track, tracks_data
            )
            
            if alternate_routes:
                # Select best alternate route
                best_route = self.select_best_route(alternate_routes, train)
                
                decision = {
                    'train_id': train_id,
                    'decision_type': 'REROUTE',
                    'current_track': current_track,
                    'blocked_track': blocked_track,
                    'alternate_route': best_route,
                    'priority': train['risk_level'],
                    'time_sensitive': train['time_to_conflict'] < 15,  # Less than 15 minutes
                    'decision_time': datetime.now(),
                    'estimated_delay': best_route.get('additional_time_minutes', 0)
                }
            else:
                # No alternate route - emergency stop required
                decision = {
                    'train_id': train_id,
                    'decision_type': 'EMERGENCY_STOP',
                    'current_track': current_track,
                    'blocked_track': blocked_track,
                    'stop_position': max(0, train['distance_to_conflict'] - self.SAFETY_DISTANCE_KM),
                    'priority': 'CRITICAL',
                    'time_sensitive': True,
                    'decision_time': datetime.now(),
                    'reason': 'No alternate route available'
                }
            
            rerouting_decisions.append(decision)
        
        # Sort by priority and time sensitivity
        rerouting_decisions.sort(key=lambda x: (
            x['priority'] == 'CRITICAL',
            x['time_sensitive'],
            x['decision_time']
        ), reverse=True)
        
        print(f"✅ Generated {len(rerouting_decisions)} rerouting decisions")
        
        return rerouting_decisions
    
    def calculate_stationary_duration(self, train_id, current_timestamp):
        """Calculate how long a train has been stationary"""
        # This would typically check historical positions
        # For now, return a simulated duration
        return np.random.randint(5, 30)  # 5-30 minutes
    
    def detect_train_conflicts(self, trains_on_track):
        """Detect potential conflicts between trains on same track"""
        conflicts = []
        
        for i in range(len(trains_on_track) - 1):
            train1 = trains_on_track[i]
            train2 = trains_on_track[i + 1]
            
            distance = abs(train2['position_km'] - train1['position_km'])
            
            if distance < self.SAFETY_DISTANCE_KM:
                # Check relative speeds and directions
                speed_diff = abs(train2['speed_kmph'] - train1['speed_kmph'])
                
                conflict = {
                    'train1_id': train1['train_id'],
                    'train2_id': train2['train_id'],
                    'distance_km': round(distance, 2),
                    'speed_difference': round(speed_diff, 2),
                    'risk_level': 'HIGH' if distance < 2 else 'MEDIUM',
                    'estimated_conflict_time': max(1, distance / max(speed_diff, 1) * 60)  # minutes
                }
                
                conflicts.append(conflict)
        
        return conflicts
    
    def classify_incident_type(self, description):
        """Classify incident type from description"""
        desc_lower = str(description).lower()
        
        if any(word in desc_lower for word in ['signal', 'red', 'communication']):
            return 'SIGNAL_FAILURE'
        elif any(word in desc_lower for word in ['derail', 'accident', 'collision']):
            return 'DERAILMENT'
        elif any(word in desc_lower for word in ['engine', 'brake', 'technical']):
            return 'TECHNICAL_FAILURE'
        elif any(word in desc_lower for word in ['track', 'rail', 'infrastructure']):
            return 'TRACK_DAMAGE'
        else:
            return 'OTHER'
    
    def calculate_incident_severity(self, incident):
        """Calculate severity of incident"""
        desc = str(incident.get('description', '')).lower()
        
        if any(word in desc for word in ['critical', 'emergency', 'derail', 'collision']):
            return 'CRITICAL'
        elif any(word in desc for word in ['major', 'signal', 'failure']):
            return 'HIGH'
        elif any(word in desc for word in ['minor', 'delay', 'slow']):
            return 'MEDIUM'
        else:
            return 'LOW'
    
    def estimate_clearance_time(self, incident):
        """Estimate when incident will be cleared"""
        severity = self.calculate_incident_severity(incident)
        incident_time = pd.to_datetime(incident['incident_time'])
        
        clearance_hours = {
            'CRITICAL': 6,
            'HIGH': 3,
            'MEDIUM': 1.5,
            'LOW': 0.5
        }
        
        return incident_time + timedelta(hours=clearance_hours.get(severity, 2))
    
    def find_trains_approaching_track(self, blocked_track_id, real_time_positions, track_status):
        """Find trains that are approaching a blocked track"""
        approaching = []
        
        # This is a simplified version - you'd need track topology data
        for _, train in real_time_positions.iterrows():
            current_track = train['track_id']
            
            # Skip if already on blocked track
            if current_track == blocked_track_id:
                continue
            
            # Check if train might be heading toward blocked track
            # This would need proper route/topology analysis
            if train['speed_kmph'] > 10:  # Moving train
                approaching.append({
                    'train_id': train['train_id'],
                    'current_track': current_track,
                    'position_km': float(train.get('position_km', 0)),
                    'speed_kmph': float(train.get('speed_kmph', 0)),
                    'timestamp': train['timestamp']
                })
        
        return approaching
    
    def calculate_collision_risk(self, train_info, blocked_track_id, incidents):
        """Calculate collision risk for approaching train"""
        # Simplified risk calculation
        speed = train_info['speed_kmph']
        distance = np.random.uniform(5, 20)  # Simulated distance
        
        time_to_conflict = (distance / max(speed, 1)) * 60  # minutes
        
        if time_to_conflict < 10 and speed > 60:
            risk_level = 'CRITICAL'
            action = 'EMERGENCY_STOP'
        elif time_to_conflict < 20:
            risk_level = 'HIGH'
            action = 'IMMEDIATE_REROUTE'
        else:
            risk_level = 'MEDIUM'
            action = 'PLAN_REROUTE'
        
        return {
            'risk_level': risk_level,
            'distance_km': distance,
            'time_minutes': time_to_conflict,
            'recommended_action': action
        }
    
    def find_alternate_routes(self, current_track, blocked_track, tracks_data):
        """Find alternate routes avoiding blocked track"""
        # This would use your existing graph pathfinding logic
        # For now, return simulated alternate routes
        
        alternate_routes = []
        
        # Simulate 2-3 possible alternate routes
        for i in range(2):
            route = {
                'route_id': f"ALT_ROUTE_{i+1}",
                'track_sequence': [current_track + 100 + i, current_track + 200 + i],
                'total_distance_km': np.random.uniform(15, 30),
                'additional_time_minutes': np.random.randint(10, 45),
                'route_safety_score': np.random.uniform(0.7, 0.95)
            }
            alternate_routes.append(route)
        
        return alternate_routes
    
    def select_best_route(self, alternate_routes, train_info):
        """Select the best alternate route based on multiple criteria"""
        if not alternate_routes:
            return None
        
        # Score routes based on time, safety, and distance
        for route in alternate_routes:
            route['total_score'] = (
                route['route_safety_score'] * 0.4 +  # 40% safety weight
                (1 / max(route['additional_time_minutes'], 1)) * 0.3 +  # 30% time weight
                (1 / max(route['total_distance_km'], 1)) * 0.3  # 30% distance weight
            )
        
        # Return route with highest score
        return max(alternate_routes, key=lambda r: r['total_score'])
    
    def save_monitoring_report(self, track_status, incidents, rerouting_decisions):
        """Save comprehensive track monitoring report"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"models/track_monitoring_report_{timestamp}.json"
        
        report = {
            'report_timestamp': datetime.now().isoformat(),
            'monitoring_summary': {
                'total_tracks_monitored': len(track_status),
                'blocked_tracks': len(self.blocked_tracks),
                'active_incidents': sum(len(inc) for inc in incidents.values()),
                'rerouting_decisions': len(rerouting_decisions),
                'critical_alerts': len([d for d in rerouting_decisions if d['priority'] == 'CRITICAL'])
            },
            'track_status': track_status,
            'active_incidents': incidents,
            'rerouting_decisions': rerouting_decisions,
            'blocked_tracks': list(self.blocked_tracks)
        }
        
        # Make report serializable
        def make_serializable(obj):
            if isinstance(obj, (datetime, pd.Timestamp)):
                return obj.isoformat()
            elif isinstance(obj, np.integer):
                return int(obj)
            elif isinstance(obj, np.floating):
                return float(obj)
            elif isinstance(obj, dict):
                return {key: make_serializable(value) for key, value in obj.items()}
            elif isinstance(obj, list):
                return [make_serializable(item) for item in obj]
            else:
                return obj
        
        serializable_report = make_serializable(report)
        
        with open(filename, 'w') as f:
            json.dump(serializable_report, f, indent=2)
        
        print(f"✅ Track monitoring report saved: {filename}")
        return filename

def main():
    """Main function to run track monitoring system"""
    print("🚨 DARNEX TRACK MONITORING & COLLISION AVOIDANCE SYSTEM")
    print("=" * 60)
    
    # Initialize system
    monitor = TrackMonitoringSystem()
    
    # This would be called with real data from your database
    print("\\n🔄 System ready for real-time monitoring...")
    print("📞 Call monitor.monitor_live_tracks() with real-time data")

if __name__ == "__main__":
    main()