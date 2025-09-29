import React, { useEffect } from "react";
import Chart from "chart.js/auto";

const TrainScheduler = () => {
  const schedules = [
    { train: "Rajdhani Express", platform: 1, status: "Arrived" },
    { train: "Shatabdi Express", platform: 3, status: "Coming" },
    { train: "Goods Freight", platform: 2, status: "Delayed" },
    { train: "Passenger Local", platform: 4, status: "Arrived" },
    { train: "Mail Express", platform: 5, status: "Coming" },
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
        options: {
          responsive: true,
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
      <h1 style={styles.h1}>🚆 Train Schedules & Junction Data</h1>

      {/* TRAIN SCHEDULES */}
      <section style={styles.section}>
        <h2 style={styles.h2}>Train Schedules</h2>
        <table style={styles.table}>
          <thead>
            <tr>
              <th>Train</th>
              <th>Platform</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {schedules.map((t, i) => (
              <tr key={i}>
                <td>{t.train}</td>
                <td>{t.platform}</td>
                <td>
                  <span
                    style={{
                      ...styles.badge,
                      background:
                        t.status === "Arrived"
                          ? "#28a745"
                          : t.status === "Coming"
                          ? "#ffc107"
                          : "#dc3545",
                      color: t.status === "Coming" ? "#000" : "#fff",
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
        <h2 style={styles.h2}>Junction Overview</h2>
        <div style={styles.cards}>
          <div style={{ ...styles.card, background: "#28a745" }}>
            <h3>Trains Passed</h3>
            <p>34</p>
          </div>
          <div style={{ ...styles.card, background: "#ffc107", color: "#000" }}>
            <h3>Trains Coming</h3>
            <p>12</p>
          </div>
          <div style={{ ...styles.card, background: "#17a2b8" }}>
            <h3>On Platform</h3>
            <p>6</p>
          </div>
        </div>
        <canvas id="congestionChart" width="400" height="200"></canvas>
      </section>
    </main>
  );
};

// STYLES
const styles = {
  main: {
    padding: "30px 20px",
    maxWidth: "1000px",
    margin: "auto",
    background: "#f9fafc",
    fontFamily: "Arial, sans-serif",
  },
  h1: {
    textAlign: "center",
    fontSize: "32px",
    marginBottom: "30px",
    color: "#007bff",
  },
  h2: {
    fontSize: "22px",
    marginBottom: "20px",
    color: "#333",
    borderLeft: "5px solid #007bff",
    paddingLeft: "10px",
  },
  section: {
    background: "white",
    padding: "25px 20px",
    marginBottom: "25px",
    borderRadius: "12px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "10px",
  },
  badge: {
    padding: "6px 12px",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: "bold",
    display: "inline-block",
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
  },
};

// Extra CSS (for table)
const tableStyles = document.createElement("style");
tableStyles.innerHTML = `
  table {
    border: 1px solid #ddd;
  }
  th, td {
    border: 1px solid #ddd;
    padding: 12px;
    text-align: center;
  }
  thead {
    background: #007bff;
    color: white;
  }
  tr:nth-child(even) {
    background: #f9f9f9;
  }
  tr:hover {
    background: #eef5ff;
    transition: 0.2s;
  }
`;
document.head.appendChild(tableStyles);

export default TrainScheduler;
