import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Demo stations
const stations = {
  Jaipur: [26.9124, 75.7873],
  Delhi: [28.6139, 77.209],
  Mumbai: [19.076, 72.8777],
  Kolkata: [22.5726, 88.3639],
};

export default function MapPage() {
  const navigate = useNavigate();
  const [fromStation, setFromStation] = useState("");
  const [toStation, setToStation] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [aiDecisions, setAiDecisions] = useState({});

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
    <div className="relative h-screen w-screen p-4 bg-gray-100">
      {/* Map */}
      <div
        style={{
          height: "400px",
          border: "1px solid #ccc",
          borderRadius: "8px",
          position: "relative",
        }}
      >
        <MapContainer
          center={[22.9734, 78.6569]}
          zoom={5}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {Object.entries(stations).map(([name, pos]) => (
            <Marker key={name} position={pos}>
              <Popup>{name}</Popup>
            </Marker>
          ))}
          {submitted && stations[fromStation] && stations[toStation] && (
            <Polyline
              positions={[stations[fromStation], stations[toStation]]}
              color="red"
            />
          )}
        </MapContainer>
      </div>

      {/* Station Select */}
      <div className="mt-4 flex gap-2">
        <select
          value={fromStation}
          onChange={(e) => setFromStation(e.target.value)}
          className="border p-1 rounded w-40"
        >
          <option value="">From Station</option>
          {Object.keys(stations).map((station) => (
            <option key={station} value={station}>
              {station}
            </option>
          ))}
        </select>

        <select
          value={toStation}
          onChange={(e) => setToStation(e.target.value)}
          className="border p-1 rounded w-40"
        >
          <option value="">To Station</option>
          {Object.keys(stations).map((station) => (
            <option key={station} value={station}>
              {station}
            </option>
          ))}
        </select>

        <button
          onClick={() => setSubmitted(true)}
          style={{
            padding: "5px 10px",
            background: "#28a745",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Show Route
        </button>
      </div>
      {/* Heading below map */}
      <h2
        style={{
          marginTop: "16px",
          fontSize: "1.5rem",
          fontWeight: "bold",
          color: "black",
          textAlign: "center",
        }}
      >
        AI Analytics
      </h2>

      {/* AI Recommendations in 3-column Grid */}
      <div
        className="mt-6 gap-4"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "26px",
          background: "white",
        }}
      >
        {aiInsights.map((insight, i) => (
          <div
            key={i}
            className="bg-white border border-gray-300 rounded-2xl p-4 shadow"
          >
            <p className="text-sm">{insight}</p>
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => handleDecision(i, "accepted")}
                style={{
                  padding: "5px 10px",
                  background: "#28a745",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                ✅ Accept
              </button>
              <button
                onClick={() => handleDecision(i, "denied")}
                style={{
                  padding: "5px 10px",
                  background: "#dc3545",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
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
          </div>
        ))}
      </div>

      {/* Bottom-right button */}
      <button
        onClick={() => navigate("/detailed-map")}
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          padding: "10px 16px",
          background: "#28a745",
          color: "white",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          zIndex: 1000,
        }}
      >
        Open Detailed View
      </button>
    </div>
  );
}
