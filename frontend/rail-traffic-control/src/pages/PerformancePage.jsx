import React, { useEffect } from "react";
import Chart from "chart.js/auto";
import { color } from "chart.js/helpers";

const PerformancePge = () => {
  useEffect(() => {
    // Animate metrics
    const counters = document.querySelectorAll(".count");
    counters.forEach((counter) => {
      const target = +counter.getAttribute("data-target");
      let count = 0;
      const increment = target / 100;
      const interval = setInterval(() => {
        count += increment;
        if (count >= target) {
          counter.textContent =
            target + (counter.textContent.includes("%") ? "%" : "");
          clearInterval(interval);
        } else {
          counter.textContent =
            Math.floor(count) + (counter.textContent.includes("%") ? "%" : "");
        }
      }, 20);
    });

    // Workflow animation
    const steps = document.querySelectorAll(".step");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.3 }
    );
    steps.forEach((step) => observer.observe(step));

    // Chart.js: Performance Chart
    let chart1, chart2;
    const ctx1 = document.getElementById("performanceChart");
    if (ctx1) {
      chart1 = new Chart(ctx1, {
        type: "bar",
        data: {
          labels: [
            "Delay Reduction %",
            "Platform Utilization %",
            "Train Throughput",
          ],
          datasets: [
            {
              label: "Performance Metrics",
              data: [20, 30, 145],
              backgroundColor: ["#28a745", "#17a2b8", "#ffc107"],
            },
          ],
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true } },
        },
      });
    }

    // Chart.js: Trend Chart
    const ctx2 = document.getElementById("trendChart");
    if (ctx2) {
      chart2 = new Chart(ctx2, {
        type: "line",
        data: {
          labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
          datasets: [
            {
              label: "Average Delay (min)",
              data: [15, 14, 13, 12],
              borderColor: "#dc3545",
              backgroundColor: "rgba(220,53,69,0.2)",
              fill: true,
              tension: 0.3,
            },
          ],
        },
        options: { responsive: true },
      });
    }

    // ✅ Cleanup when component unmounts
    return () => {
      if (chart1) chart1.destroy();
      if (chart2) chart2.destroy();
      observer.disconnect();
    };
  }, []);

  return (
    <main style={styles.main}>
      <h1 style={styles.h1}>System Performance Overview</h1>

      {/* Workflow */}
      <section style={styles.section}>
        <h2 style={styles.h2}>How Our System Works</h2>
        <div style={styles.workflow}>
          <div className="step" style={styles.step}>
            <h4>Train Arrival</h4>
            <p>
              Trains enter the station and system logs arrival time and track.
            </p>
          </div>
          <div className="step" style={styles.step}>
            <h4>AI Evaluation</h4>
            <p>AI analyzes congestion, priority, and track availability.</p>
          </div>
          <div className="step" style={styles.step}>
            <h4>Recommendation</h4>
            <p>Dynamic recommendation is generated for train movement.</p>
          </div>
          <div className="step" style={styles.step}>
            <h4>Controller Action</h4>
            <p>Controller accepts or denies AI recommendation.</p>
          </div>
        </div>
      </section>

      {/* Metrics */}
      <section style={styles.section}>
        <h2 style={styles.h2}>Key Performance Metrics</h2>
        <div style={styles.metrics}>
          <div className="metric" style={styles.metric}>
            <h3>Delay Reduction</h3>
            <p className="count" data-target="20">
              0%
            </p>
          </div>
          <div className="metric" style={styles.metric}>
            <h3>Platform Utilization</h3>
            <p className="count" data-target="30">
              0%
            </p>
          </div>
          <div className="metric" style={styles.metric}>
            <h3>Train Throughput</h3>
            <p className="count" data-target="145">
              0
            </p>
          </div>
        </div>
        <canvas id="performanceChart" width="400" height="200"></canvas>
        <canvas id="trendChart" width="400" height="200"></canvas>
      </section>

      {/* Comparison Table */}
      <section style={styles.section}>
        <h2 style={styles.h2}>Before vs After AI Implementation</h2>
        <table style={styles.table}>
          <thead>
            <tr>
              <th>Metric</th>
              <th>Manual System</th>
              <th>AI System</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Average Delay</td>
              <td>15 min</td>
              <td>12 min</td>
            </tr>
            <tr>
              <td>Trains per Day</td>
              <td>120</td>
              <td>145</td>
            </tr>
            <tr>
              <td>Platform Utilization</td>
              <td>70%</td>
              <td>91%</td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* Highlights */}
      <section style={styles.section}>
        <h2 style={styles.h2}>System Highlights</h2>
        <span style={{ ...styles.badge, background: "#28a745" }}>
          Real-Time Recommendations
        </span>
        <span style={{ ...styles.badge, background: "#007bff" }}>
          Enhanced Safety
        </span>
        <span style={{ ...styles.badge, background: "#ffc107", color: "#000" }}>
          Higher Throughput
        </span>
        <span style={{ ...styles.badge, background: "#6f42c1" }}>
          Efficient Queues
        </span>
      </section>
    </main>
  );
};

// STYLES
const styles = {
  main: {
    padding: "30px 20px",
    // maxWidth: "1000px",
    margin: "auto",
    background: "#00152D",
    // background: "#f0f4f8",
  },
  h1: {
    textAlign: "center",
    fontSize: "32px",
    marginBottom: "20px",
    // color: "#007bff",
    color: "white",
  },
  h2: {
    fontSize: "24px",
    marginBottom: "15px",
    color: "white",
    // borderLeft: "5px solid #007bff",
    borderLeft: " #002147",
    paddingLeft: "10px",
  },

  section: {
    background: "#00152D",
    padding: "25px 20px",
    marginBottom: "25px",
    borderRadius: "12px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
  },
  workflow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "15px",
    marginTop: "15px",
  },
  step: {
    flex: "1 1 220px",
    background: "#00B7C2",
    color: "white",
    padding: "20px",
    borderRadius: "12px",
    textAlign: "center",
    boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
  },
  metrics: {
    display: "flex",
    gap: "15px",
    marginTop: "15px",
    flexWrap: "wrap",
  },
  metric: {
    flex: "1 1 250px",
    background: "#00B7C2",
    color: "white",
    padding: "20px",
    borderRadius: "12px",
    textAlign: "center",
  },
  table: {
    color: "white",
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "15px",
  },
  badge: {
    display: "inline-block",
    padding: "5px 12px",
    borderRadius: "12px",
    margin: "5px 5px 0 0",
    fontSize: "14px",
    fontWeight: "bold",
    color: "white",
  },
};

export default PerformancePge;
