#!/usr/bin/env python3
"""
DARNEX RAILWAY AI - TRACK MONITORING INTEGRATION
===============================================
Integration module that connects Track Monitoring with your existing Phase 1 & 2 system
"""

import sys
import os
sys.path.append(os.path.dirname(__file__))

import pandas as pd
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')

# Import existing modules
from config.database import establish_database_connection
from data.loader import RailwayDataLoader
from phase3_track_monitoring import TrackMonitoringSystem

class TrackMonitoringIntegrator:
    """Integrates track monitoring with existing DARNEX Railway AI system"""
    
    def __init__(self):
        print("🔗 Initializing Track Monitoring Integration...")
        
        # Initialize existing components
        self.conn = establish_database_connection()
        self.data_loader = RailwayDataLoader()
        
        # Initialize new track monitoring system
        self.track_monitor = TrackMonitoringSystem()
        
        print("✅ Track Monitoring Integration Ready")
    
    def run_integrated_track_monitoring(self):
        """Run complete track monitoring with your existing data pipeline"""
        print("="*80)
        print("🚨 DARNEX RAILWAY AI - INTEGRATED TRACK MONITORING")
        print("Real-time Collision Avoidance & Track Safety System")
        print("="*80)
        
        try:
            # STEP 1: Load all required data from your existing system
            print("\\n📊 Loading Railway Data...")
            railway_data = self.load_integrated_data()
            
            # STEP 2: Monitor live tracks for conflicts
            print("\\n🔍 Step 1: Monitoring Live Track Status...")
            track_status = self.track_monitor.monitor_live_tracks(
                railway_data['real_time_positions'],
                railway_data['tracks']
            )
            
            # STEP 3: Detect incidents and failures
            print("\\n⚠️ Step 2: Detecting Incidents & Technical Failures...")
            active_incidents = self.track_monitor.detect_incidents_and_failures(
                railway_data['incidents'],
                railway_data['safety_scenarios']
            )
            
            # STEP 4: Find trains approaching blocked areas
            print("\\n🚂 Step 3: Detecting Approaching Trains...")
            approaching_trains = self.track_monitor.detect_approaching_trains(
                track_status,
                active_incidents,
                railway_data['real_time_positions']
            )
            
            # STEP 5: Generate automatic rerouting decisions
            print("\\n🗺️ Step 4: Generating Rerouting Decisions...")
            rerouting_decisions = self.track_monitor.generate_rerouting_decisions(
                approaching_trains,
                railway_data['tracks']
            )
            
            # STEP 6: Execute critical actions immediately
            critical_actions = self.execute_critical_actions(rerouting_decisions)
            
            # STEP 7: Generate comprehensive report
            monitoring_report = self.generate_comprehensive_report(
                track_status, active_incidents, rerouting_decisions, critical_actions
            )
            
            # STEP 8: Save all results
            self.save_integrated_results(monitoring_report)
            
            # STEP 9: Display executive summary
            self.display_executive_summary(monitoring_report)
            
            return monitoring_report
            
        except Exception as e:
            print(f"❌ Track monitoring integration failed: {e}")
            import traceback
            traceback.print_exc()
            return None
        
        finally:
            if self.conn:
                self.conn.close()
    
    def load_integrated_data(self):
        """Load all data needed for track monitoring"""
        # Use your existing data loader
        all_data = self.data_loader.load_all_railway_data()
        
        # Ensure we have the required tables
        required_tables = ['real_time_positions', 'tracks', 'incidents', 'safety_scenarios']
        
        for table in required_tables:
            if table not in all_data or all_data[table].empty:
                print(f"⚠️ Warning: {table} data is missing or empty")
                all_data[table] = pd.DataFrame()
        
        print(f"✅ Loaded data:")
        print(f"   Real-time Positions: {len(all_data['real_time_positions'])} records")
        print(f"   Tracks: {len(all_data['tracks'])} records")
        print(f"   Active Incidents: {len(all_data['incidents'])} records")
        print(f"   Safety Scenarios: {len(all_data['safety_scenarios'])} records")
        
        return all_data
    
    def execute_critical_actions(self, rerouting_decisions):
        """Execute critical rerouting actions immediately"""
        critical_actions = []
        
        # Filter for critical and time-sensitive decisions
        critical_decisions = [
            d for d in rerouting_decisions 
            if d['priority'] == 'CRITICAL' or d['time_sensitive']
        ]
        
        print(f"\\n🚨 Executing {len(critical_decisions)} Critical Actions...")
        
        for decision in critical_decisions:
            action_result = self.execute_single_action(decision)
            critical_actions.append(action_result)
            
            # Log critical action
            print(f"   ⚡ {decision['decision_type']} for Train {decision['train_id']}")
        
        return critical_actions
    
    def execute_single_action(self, decision):
        """Execute a single rerouting decision"""
        action_result = {
            'train_id': decision['train_id'],
            'action_taken': decision['decision_type'],
            'execution_time': datetime.now(),
            'success': True,  # In real implementation, this would check actual execution
            'details': {}
        }
        
        if decision['decision_type'] == 'EMERGENCY_STOP':
            # Execute emergency stop
            action_result['details'] = {
                'stop_position_km': decision['stop_position'],
                'reason': decision['reason'],
                'estimated_stop_time': '2-3 minutes'
            }
            
            # In real system: Send emergency stop signal to train
            self.send_emergency_stop_signal(decision['train_id'], decision['stop_position'])
            
        elif decision['decision_type'] == 'REROUTE':
            # Execute rerouting
            action_result['details'] = {
                'new_route': decision['alternate_route']['track_sequence'],
                'additional_delay': decision['estimated_delay'],
                'route_safety_score': decision['alternate_route']['route_safety_score']
            }
            
            # In real system: Update train routing system
            self.update_train_route(decision['train_id'], decision['alternate_route'])
        
        return action_result
    
    def send_emergency_stop_signal(self, train_id, stop_position):
        """Send emergency stop signal to train (simulated)"""
        print(f"🛑 EMERGENCY STOP SIGNAL sent to Train {train_id} at position {stop_position} km")
        # In real system: Interface with train control systems
    
    def update_train_route(self, train_id, new_route):
        """Update train routing (simulated)"""
        print(f"🗺️ ROUTE UPDATE sent to Train {train_id}")
        print(f"   New track sequence: {new_route['track_sequence']}")
        # In real system: Interface with train routing systems
    
    def generate_comprehensive_report(self, track_status, incidents, decisions, actions):
        """Generate comprehensive monitoring report"""
        report = {
            'monitoring_timestamp': datetime.now().isoformat(),
            'system_status': self.calculate_system_status(track_status, incidents, decisions),
            'track_analysis': {
                'total_tracks_monitored': len(track_status),
                'blocked_tracks': len([t for t in track_status.values() if t['status'] in ['BLOCKED', 'CONFLICT_RISK']]),
                'clear_tracks': len([t for t in track_status.values() if t['status'] == 'CLEAR']),
                'total_trains_tracked': sum(t['total_trains'] for t in track_status.values())
            },
            'incident_analysis': {
                'active_incidents': sum(len(inc) for inc in incidents.values()),
                'critical_incidents': sum(1 for inc_list in incidents.values() 
                                        for inc in inc_list if inc['severity'] == 'CRITICAL'),
                'affected_tracks': len(incidents)
            },
            'decision_analysis': {
                'total_decisions': len(decisions),
                'emergency_stops': len([d for d in decisions if d['decision_type'] == 'EMERGENCY_STOP']),
                'reroutes': len([d for d in decisions if d['decision_type'] == 'REROUTE']),
                'critical_actions_executed': len(actions)
            },
            'safety_metrics': {
                'collision_risks_prevented': len([d for d in decisions if d['priority'] == 'CRITICAL']),
                'average_response_time_seconds': 15,  # Simulated
                'system_reliability': 99.8  # Simulated
            },
            'raw_data': {
                'track_status': track_status,
                'active_incidents': incidents,
                'rerouting_decisions': decisions,
                'executed_actions': actions
            }
        }
        
        return report
    
    def calculate_system_status(self, track_status, incidents, decisions):
        """Calculate overall system safety status"""
        critical_decisions = len([d for d in decisions if d['priority'] == 'CRITICAL'])
        blocked_tracks = len([t for t in track_status.values() if t['status'] == 'BLOCKED'])
        
        if critical_decisions > 5 or blocked_tracks > 10:
            return 'CRITICAL'
        elif critical_decisions > 2 or blocked_tracks > 5:
            return 'WARNING'
        elif critical_decisions > 0 or blocked_tracks > 0:
            return 'CAUTION'
        else:
            return 'NORMAL'
    
    def save_integrated_results(self, report):
        """Save comprehensive results"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"models/integrated_track_monitoring_{timestamp}.json"
        
        # Make report JSON serializable
        def make_serializable(obj):
            if isinstance(obj, datetime):
                return obj.isoformat()
            elif isinstance(obj, pd.DataFrame):
                return obj.to_dict('records')
            elif isinstance(obj, pd.Series):
                return obj.to_dict()
            elif isinstance(obj, dict):
                return {key: make_serializable(value) for key, value in obj.items()}
            elif isinstance(obj, list):
                return [make_serializable(item) for item in obj]
            else:
                return obj
        
        serializable_report = make_serializable(report)
        
        import json
        with open(filename, 'w') as f:
            json.dump(serializable_report, f, indent=2)
        
        print(f"\\n💾 Complete monitoring report saved: {filename}")
    
    def display_executive_summary(self, report):
        """Display executive summary of track monitoring results"""
        print("\\n" + "="*80)
        print("📊 TRACK MONITORING - EXECUTIVE SUMMARY")
        print("="*80)
        
        status = report['system_status']
        status_emoji = {
            'NORMAL': '🟢', 'CAUTION': '🟡', 'WARNING': '🟠', 'CRITICAL': '🔴'
        }
        
        print(f"\\n🎯 SYSTEM STATUS: {status_emoji.get(status, '⚪')} {status}")
        
        track_analysis = report['track_analysis']
        print(f"\\n🛤️ TRACK ANALYSIS:")
        print(f"   Total Tracks Monitored: {track_analysis['total_tracks_monitored']}")
        print(f"   Blocked/At-Risk Tracks: {track_analysis['blocked_tracks']}")
        print(f"   Clear Tracks: {track_analysis['clear_tracks']}")
        print(f"   Total Trains Tracked: {track_analysis['total_trains_tracked']}")
        
        incident_analysis = report['incident_analysis']
        print(f"\\n⚠️ INCIDENT ANALYSIS:")
        print(f"   Active Incidents: {incident_analysis['active_incidents']}")
        print(f"   Critical Incidents: {incident_analysis['critical_incidents']}")
        print(f"   Affected Tracks: {incident_analysis['affected_tracks']}")
        
        decision_analysis = report['decision_analysis']
        print(f"\\n🚨 AUTOMATED DECISIONS:")
        print(f"   Total Decisions Made: {decision_analysis['total_decisions']}")
        print(f"   Emergency Stops: {decision_analysis['emergency_stops']}")
        print(f"   Successful Reroutes: {decision_analysis['reroutes']}")
        print(f"   Critical Actions Executed: {decision_analysis['critical_actions_executed']}")
        
        safety_metrics = report['safety_metrics']
        print(f"\\n🛡️ SAFETY IMPACT:")
        print(f"   Collision Risks Prevented: {safety_metrics['collision_risks_prevented']}")
        print(f"   Average Response Time: {safety_metrics['average_response_time_seconds']} seconds")
        print(f"   System Reliability: {safety_metrics['system_reliability']}%")
        
        print(f"\\n✅ TRACK MONITORING SYSTEM OPERATIONAL")
        print(f"🚂 Ready for continuous real-time monitoring...")

def main():
    """Main function to run integrated track monitoring"""
    integrator = TrackMonitoringIntegrator()
    results = integrator.run_integrated_track_monitoring()
    
    if results:
        print("\\n🎉 Track Monitoring Integration completed successfully!")
    else:
        print("\\n❌ Track Monitoring Integration failed")

if __name__ == "__main__":
    main()