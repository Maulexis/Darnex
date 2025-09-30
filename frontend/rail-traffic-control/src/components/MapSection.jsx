import React, { useEffect, useRef } from "react";

const MapSection = () => {
  const scrollRef = useRef(null);

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

  return (
    <div style={{ display: "flex", padding: "20px", gap: "20px" }}>
      {/* Left side: Map placeholder + AI instructions */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        <div
          style={{
            border: "1px solid #ccc",
            height: "400px",
            position: "relative",
            borderRadius: "8px",
            background: "#f1f1f1",
          }}
        >
          <p style={{ textAlign: "center", paddingTop: "180px" }}>
            Map will be displayed here
          </p>
          <button
            style={{ position: "absolute", bottom: "10px", right: "10px" }}
            className="btn-map"
          >
            Show Full Map
          </button>
        </div>

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
            <strong>AI Instructions:</strong>
          </p>
          <ul>
            <li>Reduce congestion at junction 5</li>
            <li>Prioritize express trains</li>
            <li>Optimize platform allocation</li>
          </ul>
        </div>
      </div>

      {/* Right side: Train details auto-scroll */}
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
        <h3>Train Details</h3>
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            style={{
              marginBottom: "12px",
              borderBottom: "1px solid #eee",
              paddingBottom: "8px",
            }}
          >
            <p>
              <strong>Train {i + 1}</strong>
            </p>
            <p>Platform: {(i % 5) + 1}</p>
            <p>Status: {i % 2 === 0 ? "Arrived" : "Coming"}</p>
            <p>Congestion Level: {Math.floor(Math.random() * 5) + 1}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MapSection;
