#!/usr/bin/env python3
"""
DARNEX RAILWAY AI - MAP INTEGRATION API
======================================
Fast API endpoints to serve AI model predictions to Leaflet map
"""

import os
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
import pandas as pd
import pickle
import joblib
import json
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import asyncio

# Add project directories to path
sys.path.append(os.path.dirname(__file__))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

# Import your modules
from config.database import establish_database_connection
from data.loader import RailwayDataLoader

app = FastAPI(title="DARNEX Railway AI API", version="1.0.0")

# Add CORS middleware for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure as needed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables to store loaded models
models = {}
data_cache = {}

class TrainPosition(BaseModel):
    train_id: int
    train_name: str
    lat: float
    lng: float
    speed: float
    status: str
    priority: int
    type: str

class TrackIncident(BaseModel):
    track_id: int
    lat: float
    lng: float
    status: str
    description: str
    severity: str

class TrainSchedule(BaseModel):
    train_id: int
    train_name: str
    from_station: str
    to_station: str
    departure_time: str
    arrival_time: str
    delay_minutes: int
    priority: str

@app.on_event("startup")
async def load_ai_models():
    """Load all trained AI models and cache data on startup"""
    global models, data_cache
    
    print("🚂 Loading DARNEX AI Models...")
    
    try:
        # Load trained models
        models_dir = "C:/Darnex/models"  # Adjust path as needed
        
        # Load AI models
        models['priority_calculator'] = joblib.load(f"{models_dir}/priority_calculator_model.pkl")
        models['scheduler'] = joblib.load(f"{models_dir}/scheduler_model.pkl")
        models['data_cleaner'] = joblib.load(f"{models_dir}/data_cleaner_model.pkl")
        
        # Load processed data
        data_cache['railway_df'] = pd.read_pickle(f"{models_dir}/unified_railway_dataset.pkl")
        data_cache['trains_data'] = pd.read_pickle(f"{models_dir}/trains_data.pkl")
        data_cache['final_schedule'] = pd.read_pickle(f"{models_dir}/final_schedule.pkl")
        data_cache['trains_with_delays'] = pd.read_pickle(f"{models_dir}/trains_with_delays.pkl")
        
        # Load metadata
        with open(f"{models_dir}/schedule_summary.json", 'r') as f:
            data_cache['schedule_summary'] = json.load(f)
        
        print("✅ AI Models loaded successfully")
        print(f"📊 Railway dataset: {data_cache['railway_df'].shape[0]} records")
        print(f"🚂 Trains: {len(data_cache['trains_data'])} trains")
        
    except Exception as e:
        print(f"❌ Error loading models: {e}")
        # Initialize database loader as fallback
        models['data_loader'] = RailwayDataLoader()

@app.get("/")
async def root():
    """API health check"""
    return {
        "message": "DARNEX Railway AI API", 
        "status": "active",
        "models_loaded": len(models),
        "cache_size": len(data_cache)
    }

@app.get("/api/trains/live-positions", response_model=List[TrainPosition])
async def get_live_train_positions():
    """Get current positions of all trains for map display"""
    try:
        # Connect to database
        data_loader = RailwayDataLoader()
        
        # Get real-time positions from database
        query = """
        SELECT 
            rtp.train_id,
            t.name as train_name,
            s1.lat as from_lat,
            s1.lon as from_lng,
            s2.lat as to_lat,
            s2.lon as to_lng,
            rtp.speed_kmph,
            tm.status,
            t.priority,
            t.type,
            tr.distance_km,
            rtp.position_km
        FROM real_time_positions rtp
        JOIN trains t ON rtp.train_id = t.id
        JOIN tracks tr ON rtp.track_id = tr.id
        JOIN stations s1 ON tr.from_station = s1.id
        JOIN stations s2 ON tr.to_station = s2.id
        LEFT JOIN train_movements tm ON tm.train_id = rtp.train_id
        WHERE rtp.timestamp > NOW() - INTERVAL '1 hour'
        ORDER BY rtp.timestamp DESC
        LIMIT 100;
        """
        
        df = data_loader.execute_query(query)
        
        positions = []
        for _, row in df.iterrows():
            # Calculate current position on track using linear interpolation
            if row['distance_km'] > 0:
                progress = min(row['position_km'] / row['distance_km'], 1.0)
                
                # Interpolate latitude and longitude
                current_lat = row['from_lat'] + (row['to_lat'] - row['from_lat']) * progress
                current_lng = row['from_lng'] + (row['to_lng'] - row['from_lng']) * progress
            else:
                current_lat = row['from_lat']
                current_lng = row['from_lng']
            
            positions.append(TrainPosition(
                train_id=int(row['train_id']),
                train_name=row['train_name'],
                lat=float(current_lat),
                lng=float(current_lng),
                speed=float(row['speed_kmph']) if row['speed_kmph'] else 0.0,
                status=row['status'] if row['status'] else 'UNKNOWN',
                priority=int(row['priority']),
                type=row['type']
            ))
        
        return positions
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching train positions: {str(e)}")

@app.get("/api/incidents/active", response_model=List[TrackIncident])
async def get_active_incidents():
    """Get active track incidents for map display"""
    try:
        data_loader = RailwayDataLoader()
        
        query = """
        SELECT 
            i.track_id,
            s.lat,
            s.lon,
            i.status,
            i.description,
            'High' as severity
        FROM incidents i
        JOIN tracks tr ON i.track_id = tr.id
        JOIN stations s ON tr.from_station = s.id
        WHERE i.status = 'active'
        ORDER BY i.incident_time DESC;
        """
        
        df = data_loader.execute_query(query)
        
        incidents = []
        for _, row in df.iterrows():
            incidents.append(TrackIncident(
                track_id=int(row['track_id']),
                lat=float(row['lat']),
                lng=float(row['lon']),
                status=row['status'],
                description=row['description'],
                severity=row['severity']
            ))
        
        return incidents
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching incidents: {str(e)}")

@app.get("/api/schedule/predictions", response_model=List[TrainSchedule])
async def get_schedule_predictions(hours_ahead: int = Query(default=6, ge=1, le=24)):
    """Get AI-predicted train schedules for next N hours"""
    try:
        # Use cached schedule data with AI predictions
        if 'final_schedule' not in data_cache:
            raise HTTPException(status_code=503, detail="AI models not loaded")
        
        schedule_df = data_cache['final_schedule'].copy()
        
        # Filter for next N hours
        now = datetime.now()
        future_time = now + timedelta(hours=hours_ahead)
        
        # Convert scheduled times to datetime (adjust this based on your data structure)
        schedule_df['departure_datetime'] = pd.to_datetime(schedule_df.get('scheduled_departure', now))
        
        # Filter schedules
        upcoming = schedule_df[
            (schedule_df['departure_datetime'] >= now) & 
            (schedule_df['departure_datetime'] <= future_time)
        ].head(50)
        
        schedules = []
        for _, row in upcoming.iterrows():
            schedules.append(TrainSchedule(
                train_id=int(row.get('train_id', 0)),
                train_name=row.get('train_name', 'Unknown Train'),
                from_station=row.get('from_station', 'Unknown'),
                to_station=row.get('to_station', 'Unknown'),
                departure_time=row.get('departure_datetime', now).isoformat(),
                arrival_time=row.get('arrival_datetime', now).isoformat(),
                delay_minutes=int(row.get('delay_minutes', 0)),
                priority=row.get('priority_level', 'Medium')
            ))
        
        return schedules
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching predictions: {str(e)}")

@app.get("/api/analytics/summary")
async def get_analytics_summary():
    """Get railway system analytics summary"""
    try:
        if 'schedule_summary' not in data_cache:
            raise HTTPException(status_code=503, detail="Analytics not available")
        
        summary = data_cache['schedule_summary']
        
        # Add real-time statistics
        data_loader = RailwayDataLoader()
        
        # Get current active trains
        active_trains = data_loader.execute_query("""
            SELECT COUNT(DISTINCT train_id) as count 
            FROM real_time_positions 
            WHERE timestamp > NOW() - INTERVAL '1 hour'
        """).iloc[0]['count']
        
        # Get active incidents
        active_incidents = data_loader.execute_query("""
            SELECT COUNT(*) as count 
            FROM incidents 
            WHERE status = 'active'
        """).iloc[0]['count']
        
        return {
            "total_trains": summary.get('total_trains', 0),
            "active_trains": int(active_trains),
            "active_incidents": int(active_incidents),
            "system_status": "NORMAL" if active_incidents < 5 else "ALERT",
            "average_delay": summary.get('average_delay', 71.0),
            "on_time_performance": max(0, 100 - (summary.get('average_delay', 71.0) / 2)),
            "priority_distribution": summary.get('priority_distribution', {}),
            "last_updated": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching analytics: {str(e)}")

@app.post("/api/predictions/delay")
async def predict_train_delay(train_id: int):
    """Use AI to predict delay for specific train"""
    try:
        if 'priority_calculator' not in models:
            raise HTTPException(status_code=503, detail="AI models not loaded")
        
        # Get train data
        train_data = data_cache['trains_data'][data_cache['trains_data']['id'] == train_id]
        
        if train_data.empty:
            raise HTTPException(status_code=404, detail="Train not found")
        
        # Use AI model to predict delay (simplified example)
        priority_calc = models['priority_calculator']
        
        # This would use your actual AI prediction logic
        predicted_delay = 45  # Placeholder
        confidence = 0.85
        
        return {
            "train_id": train_id,
            "predicted_delay_minutes": predicted_delay,
            "confidence": confidence,
            "factors": ["Weather conditions", "Track congestion", "Historical patterns"],
            "recommendation": "Monitor closely" if predicted_delay > 60 else "Normal operation"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error predicting delay: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    print("🚂 Starting DARNEX Railway AI API...")
    uvicorn.run(app, host="0.0.0.0", port=8000)