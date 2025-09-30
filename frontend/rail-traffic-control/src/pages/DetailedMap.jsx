// src/pages/DetailedView.jsx
import React, { useState } from "react";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  CircleMarker,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Custom train icon
const trainIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/69/69524.png",
  iconSize: [28, 28],
});

export default function DetailedView() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [showPath, setShowPath] = useState(false);
  const [aiDecisions, setAiDecisions] = useState({});

  // Major stations mock data
  const stations = {
    Delhi: [28.7041, 77.1025],
    Jaipur: [26.9124, 75.7873],
    Mumbai: [19.076, 72.8777],
    Kolkata: [22.5726, 88.3639],
    Chennai: [13.0827, 80.2707],
    Bangalore: [12.9716, 77.5946],
  };

  const handleOk = () => {
    if (stations[from] && stations[to]) {
      setShowPath(true);
    } else {
      alert(
        "Enter valid stations (Delhi, Jaipur, Mumbai, Kolkata, Chennai, Bangalore)"
      );
    }
  };

  // Trains mock data
  const trains = [
    {
      id: 1,
      name: "Rajdhani Express",
      arrival: "10:30",
      departure: "10:50",
      platform: 2,
      status: "On Time",
      congestion: "High",
    },
    {
      id: 2,
      name: "Shatabdi Express",
      arrival: "11:00",
      departure: "11:15",
      platform: 1,
      status: "Delayed",
      congestion: "Medium",
    },
    {
      id: 3,
      name: "Duronto Express",
      arrival: "11:30",
      departure: "11:40",
      platform: 3,
      status: "On Platform",
      congestion: "Low",
    },
    {
      id: 4,
      name: "Superfast Express",
      arrival: "12:00",
      departure: "12:20",
      platform: 4,
      status: "Coming",
      congestion: "Medium",
    },
    {
      id: 5,
      name: "Local Passenger",
      arrival: "12:10",
      departure: "12:30",
      platform: 5,
      status: "On Platform",
      congestion: "Low",
    },
  ];

  // AI Insights with Accept/Deny
  const aiInsights = [
    "Divert Rajdhani Express to Platform 3 at Delhi.",
    "Prioritize Express trains over Local Passengers.",
    "Reroute via Kota to reduce Jaipur–Delhi congestion.",
    "Predictive delay: Shatabdi +15 mins.",
  ];

  const handleDecision = (index, decision) => {
    setAiDecisions((prev) => ({ ...prev, [index]: decision }));
  };

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        gap: "20px",
        padding: "20px",
        // background: "#f5f7fa",
        background: "#00152D",
      }}
    >
      {/* Left Side */}
      <div
        style={{
          flex: 2,
          display: "flex",
          flexDirection: "column",
          gap: "15px",
        }}
      >
        {/* Map */}
        <div
          style={{
            flex: 2,
            position: "relative",
            borderRadius: 8,
            overflow: "hidden",
            boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
          }}
        >
          <MapContainer
            center={[22.9734, 78.6569]}
            zoom={5}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

            {/* Train markers */}
            <Marker position={stations.Delhi} icon={trainIcon}>
              <Popup>Rajdhani Express at Delhi Platform 2</Popup>
            </Marker>
            <Marker position={stations.Jaipur} icon={trainIcon}>
              <Popup>Shatabdi Express arriving Jaipur</Popup>
            </Marker>
            <Marker position={stations.Mumbai} icon={trainIcon}>
              <Popup>Duronto Express enroute Mumbai</Popup>
            </Marker>

            {/* Congestion heat */}
            <CircleMarker
              center={stations.Delhi}
              radius={40}
              pathOptions={{ color: "red", fillColor: "red", opacity: 0.3 }}
            />
            <CircleMarker
              center={stations.Jaipur}
              radius={25}
              pathOptions={{
                color: "orange",
                fillColor: "orange",
                opacity: 0.3,
              }}
            />

            {/* Path */}
            {showPath && (
              <Polyline
                positions={[stations[from], stations[to]]}
                pathOptions={{ color: "blue", weight: 4 }}
              />
            )}
          </MapContainer>
          {/* Controls */}
          <div
            style={{
              position: "absolute",
              top: 15,
              left: 15,
              background: "white",
              padding: 10,
              borderRadius: 6,
              boxShadow: "0px 2px 6px rgba(0,0,0,0.2)",
              width: 200,
            }}
          >
            <input
              type="text"
              placeholder="From"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              style={{ display: "block", marginBottom: 5, width: "100%" }}
            />
            <input
              type="text"
              placeholder="To"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              style={{ display: "block", marginBottom: 5, width: "100%" }}
            />
            <button
              onClick={handleOk}
              style={{
                width: "100%",
                padding: "6px",
                background: "#007bff",
                color: "white",
                border: "none",
                borderRadius: 4,
              }}
            >
              OK
            </button>
          </div>
          {/* Detailed View button */}

          <div style={{ position: "absolute", bottom: 15, right: 15 }}>
            <button
              style={{
                padding: "8px 12px",
                background: "#28a745",
                color: "white",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
              }}
            >
              Open Detailed View
            </button>
          </div>
        </div>

        {/* AI Insights with Accept/Deny */}
        <div
          style={{
            flex: 1,
            // background: "white",
            background: "#00152D",
            // border: "1px solid #ccc",
            borderRadius: 8,
            padding: "15px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            overflowY: "auto",
          }}
        >
          <h3 style={{ color: "white" }}>🤖 AI Insights</h3>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {aiInsights.map((insight, i) => (
              <li
                key={i}
                style={{
                  marginBottom: "12px",
                  padding: "10px",
                  //   border: "1px solid ",
                  borderRadius: "6px",
                  background: "#00152D",
                  color: "white",
                }}
              >
                <p style={{ margin: 0 }}>{insight}</p>
                <div style={{ marginTop: "6px", display: "flex", gap: "10px" }}>
                  <button
                    style={{
                      padding: "5px 10px",
                      background: "#28a745",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}
                    onClick={() => handleDecision(i, "accepted")}
                  >
                    ✅ Accept
                  </button>
                  <button
                    style={{
                      padding: "5px 10px",
                      background: "#dc3545",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}
                    onClick={() => handleDecision(i, "denied")}
                  >
                    ❌ Deny
                  </button>
                </div>
                {aiDecisions[i] && (
                  <p
                    style={{
                      marginTop: "6px",
                      fontSize: "0.9em",
                      color: aiDecisions[i] === "accepted" ? "green" : "red",
                      fontWeight: "bold",
                    }}
                  >
                    {aiDecisions[i] === "accepted" ? "✔ Accepted" : "✖ Denied"}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Right Side */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: "15px",
        }}
      >
        {/* Train Details */}
        <div
          style={{
            flex: 2,
            // background: "white",
            background: "#00152D",
            color: "white",
            // border: "1px solid #ccc",
            borderRadius: 8,
            padding: "15px",
            overflowY: "scroll",
          }}
        >
          <h3>🚆 Train Details</h3>
          {trains.map((t) => (
            <div
              key={t.id}
              style={{
                marginBottom: "12px",
                borderBottom: "1px solid #eee",
                paddingBottom: "8px",
              }}
            >
              <p>
                <strong>{t.name}</strong>
              </p>
              <p>
                Arrival: {t.arrival} | Departure: {t.departure}
              </p>
              <p>Platform: {t.platform}</p>
              <p>Status: {t.status}</p>
              <p>Congestion: {t.congestion}</p>
            </div>
          ))}
        </div>

        {/* Performance Analysis */}
        <div
          style={{
            flex: 1,
            background: "#00152D",
            // border: "1px solid #ccc",
            borderRadius: 8,
            padding: "15px",
          }}
        >
          <h3 style={{ background: "#00152D", color: "white" }}>
            📊 Performance Analysis
          </h3>
          <ul style={{ background: "#00152D", color: "white" }}>
            <li>Average Delay: 7 mins</li>
            <li>On-time %: 82%</li>
            <li>Most congested: Delhi</li>
            <li>Bottleneck: Jaipur → Delhi</li>
          </ul>
        </div>

        {/* Junction Data */}
        <div
          style={{
            flex: 1,
            background: "#00152D",
            color: "white",
            border: "1px solid #ccc",
            borderRadius: 8,
            padding: 0,
            overflowY: "auto",
          }}
        >
          <h3>📍 Junction Data</h3>
          <table
            border="1"
            cellPadding="6"
            style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}
          >
            <thead style={{ background: "#00152D", color: "white" }}>
              <tr>
                <th>Station</th>
                <th>Trains</th>
                <th>Platforms</th>
                <th>Congestion</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Delhi</td>
                <td>12</td>
                <td>10</td>
                <td>High</td>
              </tr>
              <tr>
                <td>Jaipur</td>
                <td>8</td>
                <td>6</td>
                <td>Medium</td>
              </tr>
              <tr>
                <td>Mumbai</td>
                <td>15</td>
                <td>12</td>
                <td>Low</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
