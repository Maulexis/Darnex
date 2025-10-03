import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const MapSection = () => {
  const mapRef = useRef(null);
  const scrollRef = useRef(null);
  const [map, setMap] = useState(null);
  const [trains, setTrains] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [aiInstructions, setAiInstructions] = useState([]);
  const [analytics, setAnalytics] = useState({});
  
  // API base URL - adjust if your backend runs on different port
  const API_BASE = "http://localhost:8000/api";

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapRef.current || map) return;

    // Create Leaflet map
    const leafletMap = L.map(mapRef.current).setView([28.6139, 77.2090], 10); // Delhi coordinates

    // Add tile layer
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© OpenStreetMap contributors'
    }).addTo(leafletMap);

    setMap(leafletMap);

    return () => {
      leafletMap.remove();
    };
  }, [mapRef.current]);

  // Fetch live train positions from AI backend
  const fetchTrainPositions = async () => {
    try {
      const response = await fetch(`${API_BASE}/trains/live-positions`);
      const data = await response.json();
      setTrains(data);
      
      if (map) {
        // Clear existing train markers
        map.eachLayer((layer) => {
          if (layer.options && layer.options.isTrainMarker) {
            map.removeLayer(layer);
          }
        });

        // Add train markers to map
        data.forEach(train => {
          const icon = getTrainIcon(train.type, train.priority);
          const marker = L.marker([train.lat, train.lng], { 
            icon,
            isTrainMarker: true 
          }).addTo(map);

          // Train popup with AI info
          marker.bindPopup(`
            <div>
              <h4>${train.train_name}</h4>
              <p><strong>Type:</strong> ${train.type}</p>
              <p><strong>Speed:</strong> ${train.speed} km/h</p>
              <p><strong>Status:</strong> ${train.status}</p>
              <p><strong>Priority:</strong> Level ${train.priority}</p>
              <button onclick="predictDelay(${train.train_id})">🔮 Predict Delay</button>
            </div>
          `);
        });
      }
    } catch (error) {
      console.error("Error fetching train positions:", error);
    }
  };

  // Fetch active incidents
  const fetchIncidents = async () => {
    try {
      const response = await fetch(`${API_BASE}/incidents/active`);
      const data = await response.json();
      setIncidents(data);

      if (map) {
        // Clear existing incident markers
        map.eachLayer((layer) => {
          if (layer.options && layer.options.isIncidentMarker) {
            map.removeLayer(layer);
          }
        });

        // Add incident markers
        data.forEach(incident => {
          const marker = L.marker([incident.lat, incident.lng], {
            icon: getIncidentIcon(),
            isIncidentMarker: true
          }).addTo(map);

          marker.bindPopup(`
            <div>
              <h4>⚠️ Track Incident</h4>
              <p><strong>Track:</strong> ${incident.track_id}</p>
              <p><strong>Status:</strong> ${incident.status}</p>
              <p><strong>Description:</strong> ${incident.description}</p>
            </div>
          `);
        });
      }
    } catch (error) {
      console.error("Error fetching incidents:", error);
    }
  };

  // Fetch AI analytics and instructions
  const fetchAIInstructions = async () => {
    try {
      const response = await fetch(`${API_BASE}/analytics/summary`);
      const data = await response.json();
      setAnalytics(data);

      // Generate AI instructions based on system status
      const instructions = [];
      
      if (data.active_incidents > 0) {
        instructions.push(`🚨 ${data.active_incidents} active incidents - Monitor affected routes`);
      }
      
      if (data.on_time_performance < 80) {
        instructions.push("⏱️ On-time performance below 80% - Optimize scheduling");
      }
      
      if (data.average_delay > 60) {
        instructions.push("🔄 High average delays detected - Implement priority routing");
      }

      instructions.push("🚄 Prioritize Superfast and Express trains during peak hours");
      instructions.push("📊 AI monitoring active - System learning from patterns");
      
      setAiInstructions(instructions);
    } catch (error) {
      console.error("Error fetching AI instructions:", error);
    }
  };

  // Get train icon based on type and priority
  const getTrainIcon = (type, priority) => {
    const colors = {
      Superfast: "#ff0000",
      Express: "#ff8800", 
      Passenger: "#0088aa",
      MEMU: "#00aa88",
      Goods: "#888888"
    };

    const color = colors[type] || "#666666";
    
    return L.divIcon({
      className: 'train-marker',
      html: `<div style="
        background-color: ${color}; 
        width: 16px; 
        height: 16px; 
        border-radius: 50%; 
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 10px;
        font-weight: bold;
      ">${priority}</div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });
  };

  // Get incident icon
  const getIncidentIcon = () => {
    return L.divIcon({
      className: 'incident-marker',
      html: `<div style="
        background-color: #ffff00; 
        width: 20px; 
        height: 20px; 
        border-radius: 50%; 
        border: 2px solid #ff0000;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: pulse 2s infinite;
      ">⚠️</div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });
  };

  // Auto-scroll train info
  useEffect(() => {
    const interval = setInterval(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop += 1;
        if (
          scrollRef.current.scrollTop + scrollRef.current.clientHeight >=
          scrollRef.current.scrollHeight
        ) {
          scrollRef.current.scrollTop = 0;
        }
      }
    }, 50);

    return () => clearInterval(interval);
  }, []);

  // Start real-time updates
  useEffect(() => {
    // Initial load
    fetchTrainPositions();
    fetchIncidents();
    fetchAIInstructions();

    // Set up polling every 30 seconds
    const interval = setInterval(() => {
      fetchTrainPositions();
      fetchIncidents();
      
      // Update AI instructions every 2 minutes
      if (Date.now() % 120000 < 30000) {
        fetchAIInstructions();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [map]);

  // Global function for delay prediction
  window.predictDelay = async (trainId) => {
    try {
      const response = await fetch(`${API_BASE}/predictions/delay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ train_id: trainId })
      });
      const prediction = await response.json();
      
      alert(`🔮 AI Prediction for Train ${trainId}:
      
Predicted Delay: ${prediction.predicted_delay_minutes} minutes
Confidence: ${(prediction.confidence * 100).toFixed(1)}%
Recommendation: ${prediction.recommendation}

Factors: ${prediction.factors.join(', ')}`);
    } catch (error) {
      console.error("Error predicting delay:", error);
      alert("Error getting AI prediction. Please try again.");
    }
  };

  const showFullMap = () => {
    // Navigate to full map page or expand map
    window.location.href = '/detailed-map';
  };

  return (
    <div style={{ display: "flex", padding: "20px", gap: "20px" }}>
      {/* Left side: Live AI Map + AI instructions */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        {/* Live Leaflet Map */}
        <div
          ref={mapRef}
          style={{
            border: "1px solid #ccc",
            height: "400px",
            position: "relative",
            borderRadius: "8px",
            background: "#f1f1f1",
          }}
        >
          <button
            style={{ 
              position: "absolute", 
              bottom: "10px", 
              right: "10px", 
              zIndex: 1000,
              padding: "8px 16px",
              backgroundColor: "#007cba",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer"
            }}
            onClick={showFullMap}
          >
            Show Full Map
          </button>
        </div>

        {/* AI Instructions Panel */}
        <div
          style={{
            border: "1px solid #ccc",
            borderRadius: "8px",
            padding: "15px",
            background: "#fff",
            height: "180px",
            overflowY: "auto",
          }}
        >
          <p>
            <strong>🤖 Live AI Instructions:</strong>
          </p>
          <div style={{ fontSize: "14px", lineHeight: "1.4" }}>
            {analytics.system_status && (
              <p>
                <strong>System Status:</strong> 
                <span style={{ 
                  color: analytics.system_status === 'NORMAL' ? 'green' : 'orange',
                  marginLeft: '8px'
                }}>
                  {analytics.system_status}
                </span>
              </p>
            )}
            
            {analytics.on_time_performance && (
              <p>
                <strong>On-Time Performance:</strong> {analytics.on_time_performance.toFixed(1)}%
              </p>
            )}

            <ul style={{ margin: "10px 0", paddingLeft: "20px" }}>
              {aiInstructions.map((instruction, index) => (
                <li key={index} style={{ marginBottom: "8px" }}>
                  {instruction}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Right side: Live Train details auto-scroll */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          border: "1px solid #ccc",
          borderRadius: "8px",
          height: "600px",
          overflow: "hidden",
          padding: "15px",
          background: "#fff",
        }}
      >
        <h3>🚂 Live Train Details ({trains.length})</h3>
        
        {analytics.active_trains && (
          <p style={{ color: "#666", fontSize: "14px", marginBottom: "15px" }}>
            Active: {analytics.active_trains} | Incidents: {analytics.active_incidents || 0}
          </p>
        )}

        {trains.map((train, i) => (
          <div
            key={train.train_id}
            style={{
              marginBottom: "12px",
              borderBottom: "1px solid #eee",
              paddingBottom: "8px",
            }}
          >
            <p>
              <strong>{train.train_name}</strong>
              <span style={{ 
                marginLeft: "10px", 
                fontSize: "12px",
                backgroundColor: getPriorityColor(train.priority),
                color: "white",
                padding: "2px 6px",
                borderRadius: "3px"
              }}>
                {train.type}
              </span>
            </p>
            <p>Speed: {train.speed} km/h</p>
            <p>Status: <span style={{ color: getStatusColor(train.status) }}>{train.status}</span></p>
            <p>Priority Level: {train.priority}</p>
            <p style={{ fontSize: "12px", color: "#666" }}>
              Lat: {train.lat.toFixed(4)}, Lng: {train.lng.toFixed(4)}
            </p>
          </div>
        ))}

        {trains.length === 0 && (
          <p style={{ textAlign: "center", color: "#666", marginTop: "50px" }}>
            Loading live train data from AI system...
          </p>
        )}
      </div>

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.7; }
          100% { transform: scale(1); opacity: 1; }
        }
        
        .incident-marker {
          animation: pulse 2s infinite;
        }
      `}</style>
    </div>
  );
};

// Helper functions
const getPriorityColor = (priority) => {
  const colors = {
    1: '#ff0000', // Highest (Superfast)
    2: '#ff8800', // High (Express) 
    3: '#ffaa00', // Medium (MEMU/Passenger)
    4: '#88aa00', // Low (Goods)
    5: '#00aa00'  // Lowest
  };
  return colors[priority] || '#666666';
};

const getStatusColor = (status) => {
  const colors = {
    'ON_TIME': '#00aa00',
    'DELAYED': '#ff8800', 
    'IN_TRANSIT': '#0088aa',
    'STOPPED': '#ff0000',
    'UNKNOWN': '#666666'
  };
  return colors[status] || '#666666';
};

export default MapSection;

