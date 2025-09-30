import React, { useEffect } from "react";
import Chart from "chart.js/auto";
import { color } from "chart.js/helpers";

const TrainPage = () => {
  const schedules = [
    {
      train: "Rajdhani Express",
      platform: 1,
      time: "10:30 AM",
      type: "Express",
      status: "Arrived",
    },
    {
      train: "Shatabdi Express",
      platform: 3,
      time: "11:15 AM",
      type: "Express",
      status: "Coming",
    },
    {
      train: "Goods Freight",
      platform: 2,
      time: "11:45 AM",
      type: "Freight",
      status: "Delayed",
    },
    {
      train: "Passenger Local",
      platform: 4,
      time: "12:00 PM",
      type: "Passenger",
      status: "Arrived",
    },
    {
      train: "Mail Express",
      platform: 5,
      time: "12:30 PM",
      type: "Mail",
      status: "Coming",
    },
  ];

  const updates = [
    "🚉 Shatabdi Express arriving at Platform 3 in 5 mins.",
    "⚠️ Goods Freight delayed by 20 mins.",
    "✅ Rajdhani Express has departed from Platform 1.",
    "📢 Mail Express expected at Platform 5 by 12:30 PM.",
  ];

  useEffect(() => {
    let chart;
    const ctx = document.getElementById("congestionChart");
    if (ctx) {
      chart = new Chart(ctx, {
        type: "doughnut",
        data: {
          labels: ["Free Platforms", "Busy Platforms", "Congested"],
          datasets: [
            {
              data: [4, 6, 2],
              backgroundColor: ["#28a745", "#ffc107", "#dc3545"],
            },
          ],
        },
        // options: {
        //   responsive: true,
        //   plugins: { legend: { position: "bottom" } },
        // },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: "bottom" } },
        },
      });
    }
    return () => {
      if (chart) chart.destroy();
    };
  }, []);

  return (
    <main style={styles.main}>
      <h1 style={styles.h1}>🚂 Train Scheduler & Junction Data (Live)</h1>

      {/* TRAIN SCHEDULES */}
      <section style={styles.section}>
        <h2 style={styles.h2}>📋 Train Schedules</h2>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Train</th>
              <th style={styles.th}>Type</th>
              <th style={styles.th}>Platform</th>
              <th style={styles.th}>Time</th>
              <th style={{ ...styles.th, textAlign: "center" }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {schedules.map((t, i) => (
              <tr key={i} style={i % 2 === 0 ? styles.rowEven : styles.rowOdd}>
                <td style={styles.td}>{t.train}</td>
                <td style={styles.td}>{t.type}</td>
                <td style={styles.td}>{t.platform}</td>
                <td style={styles.td}>{t.time}</td>
                <td style={{ ...styles.td, textAlign: "center" }}>
                  <span
                    style={{
                      ...styles.badge,
                      background:
                        t.status === "Arrived"
                          ? "#28a745"
                          : t.status === "Coming"
                          ? "#ffc107"
                          : "#dc3545",
                      color: t.status === "Coming" ? "#fff" : "#fff",
                      borderRadius: "20px",
                    }}
                  >
                    {t.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* JUNCTION DETAILS */}
      <section style={styles.section}>
        <h2 style={styles.h2}>🛤️ Junction Overview</h2>
        <div style={styles.cards}>
          <div style={{ ...styles.card, background: "#28a745" }}>
            <h3>Trains Passed</h3>
            <p>34</p>
          </div>
          <div style={{ ...styles.card, background: "#ffc107", color: "#fff" }}>
            <h3>Incoming</h3>
            <p>12</p>
          </div>
          <div style={{ ...styles.card, background: "#17a2b8" }}>
            <h3>On Platform</h3>
            <p>6</p>
          </div>
          <div style={{ ...styles.card, background: "#6f42c1" }}>
            <h3>Avg Delay</h3>
            <p>8 mins</p>
          </div>
        </div>
        {/* <canvas id="congestionChart" width="50" height="50"></canvas> */}
        <div style={{ width: "400px", height: "400px", margin: "auto" }}>
          <canvas id="congestionChart"></canvas>
        </div>
      </section>

      {/* LIVE UPDATES */}
      <section style={styles.section}>
        <h2 style={styles.h2}>📢 Live Updates</h2>
        <div style={styles.ticker}>
          <marquee behavior="scroll" direction="left" scrollamount="6">
            {updates.join(" | ")}
          </marquee>
        </div>
      </section>
    </main>
  );
};

// STYLES
const styles = {
  main: {
    padding: "30px 20px",
    // maxWidth: "1200px",
    margin: "auto",
    // background: "#f0f4f8",
    background: "#00152D",
  },
  h1: {
    textAlign: "center",
    fontSize: "32px",
    marginBottom: "25px",
    color: "white",
  },
  h2: {
    fontSize: "22px",
    marginBottom: "15px",
    // color: "#333",
    color: "white",
    borderLeft: "5px solid  #fff",
    paddingLeft: "10px",
  },
  section: {
    // background: "white",
    background: "#00152D",
    padding: "25px 20px",
    marginBottom: "30px",
    borderRadius: "12px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    // background: "#fff",
    // background: " #002147",
    background: "#00152D",
  },
  th: {
    border: "1px solid #ddd",
    padding: "12px",
    fontSize: "15px",
    // background: "#f8f9fa",
    color: "white",
    textAlign: "left",
  },
  td: {
    border: "1px solid #ddd",
    padding: "10px",
    fontSize: "14px",
    // background: " #002147",
    background: "#00152D",
    color: "white",
  },
  rowEven: {
    background: "#ffffff",
  },
  rowOdd: {
    background: "#f9f9f9",
  },
  badge: {
    padding: "6px 12px",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: "bold",
    display: "inline-block",
    minWidth: "80px",
    textAlign: "center",
  },
  cards: {
    display: "flex",
    gap: "15px",
    marginBottom: "20px",
    flexWrap: "wrap",
  },
  card: {
    flex: "1 1 200px",
    color: "white",
    padding: "20px",
    borderRadius: "12px",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: "18px",
    boxShadow: "0 3px 8px rgba(0,0,0,0.1)",
  },
  ticker: {
    background: "#007bff",
    color: "white",
    padding: "10px",
    borderRadius: "8px",
    fontWeight: "bold",
  },
};

export default TrainPage;
