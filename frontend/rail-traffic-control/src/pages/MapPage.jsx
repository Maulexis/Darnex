// src/pages/MapPage.jsx
import React, { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export default function MapPage() {
  const [fullMap, setFullMap] = useState(false);

  const trains = [
    { id: 1, name: "Express 101", arrival: "12:30", platform: 2, moving: "No" },
    {
      id: 2,
      name: "Superfast 202",
      arrival: "12:45",
      platform: 4,
      moving: "Yes",
    },
    {
      id: 3,
      name: "Passenger 303",
      arrival: "13:00",
      platform: 1,
      moving: "No",
    },
  ];

  return (
    <div style={styles.page}>
      <div style={{ flex: 2, display: "flex", flexDirection: "column" }}>
        <div style={{ flex: 1, position: "relative" }}>
          <MapContainer
            center={[28.6139, 77.209]} // Delhi coords
            zoom={12}
            style={{ height: fullMap ? "600px" : "400px", width: "100%" }}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Marker position={[28.6139, 77.209]}>
              <Popup>New Delhi Station</Popup>
            </Marker>
          </MapContainer>
          <button style={styles.fullBtn} onClick={() => setFullMap(!fullMap)}>
            {fullMap ? "Shrink Map" : "Show Full Map"}
          </button>
        </div>
        <div style={styles.aiBox}>
          <h3>AI Instructions</h3>
          <p>Divert train Express 101 to Platform 3 to reduce congestion.</p>
        </div>
      </div>
      <div style={styles.rightPanel}>
        <h3>Train Details (Live)</h3>
        <marquee direction="up" scrollamount="2" height="400px">
          {trains.map((t) => (
            <div key={t.id} style={styles.trainCard}>
              <strong>{t.name}</strong>
              <br />
              Arrival: {t.arrival}
              <br />
              Platform: {t.platform}
              <br />
              Moving: {t.moving}
            </div>
          ))}
        </marquee>
      </div>
    </div>
  );
}

const styles = {
  page: { display: "flex", gap: "20px", padding: "20px" },
  fullBtn: {
    position: "absolute",
    bottom: 10,
    right: 10,
    padding: "8px 12px",
    background: "#646cff",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
  aiBox: { marginTop: 10, padding: 10, background: "#f3f4f6", borderRadius: 8 },
  rightPanel: {
    flex: 1,
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
    borderRadius: 8,
    padding: 10,
    overflow: "hidden",
  },
  trainCard: {
    padding: "8px",
    margin: "5px 0",
    borderBottom: "1px solid #ddd",
  },
};
