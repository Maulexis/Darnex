import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  Map,
  BarChart3,
  Compass,
  Lightbulb,
  Mail,
  HelpCircle,
  Info,
} from "lucide-react";
import { color } from "chart.js/helpers";

const Help = () => {
  const [faqOpen, setFaqOpen] = useState(null);

  const topButtons = [
    { name: "Home" },
    { name: "Performance" },
    { name: "Scheduler" },
    { name: "Help" },
  ];

  const sections = [
    {
      icon: <Bot size={22} />,
      title: "AI Recommendations",
      content: (
        <ul style={styles.ul}>
          <li>
            <strong>Accepted</strong> – Applied and removed from the list.
          </li>
          <li>
            <strong>Denied</strong> – Ignored and removed from the list.
          </li>
        </ul>
      ),
    },
    {
      icon: <Map size={22} />,
      title: "Map Section",
      content: (
        <p style={styles.p}>
          Shows key railway stations. Real-time positions in future versions.
        </p>
      ),
    },
    {
      icon: <BarChart3 size={22} />,
      title: "Detailed View",
      content: (
        <p style={styles.p}>
          Click <em>"Open Detailed View"</em> for train schedules and platform
          info.
        </p>
      ),
    },
    {
      icon: <Compass size={22} />,
      title: "Navigation",
      content: (
        <div style={styles.buttonContainer}>
          {topButtons.map((btn, i) => (
            <motion.button
              key={i}
              whileHover={{ scale: 1.05 }}
              style={styles.navButton}
            >
              {btn.name}
            </motion.button>
          ))}
        </div>
      ),
    },
    {
      icon: <Lightbulb size={22} />,
      title: "Tips",
      content: (
        <ul style={styles.ul}>
          <li>Review AI recommendations promptly.</li>
          <li>Check the map frequently.</li>
          <li>Use Detailed View for advanced management.</li>
        </ul>
      ),
    },
    {
      icon: <HelpCircle size={22} />,
      title: "FAQ",
      content: (
        <div>
          {[
            {
              q: "How do I accept AI recommendations?",
              a: "Click 'Accept' next to recommendation.",
            },
            {
              q: "What if the map doesn't load?",
              a: "Check your internet connection and refresh.",
            },
            {
              q: "How often is the train schedule updated?",
              a: "Updated in real-time when data changes.",
            },
          ].map((item, index) => (
            <div key={index} style={{ marginBottom: 10 }}>
              <button
                onClick={() => setFaqOpen(faqOpen === index ? null : index)}
                style={styles.faqButton}
              >
                {item.q} <span>{faqOpen === index ? "▲" : "▼"}</span>
              </button>
              <AnimatePresence>
                {faqOpen === index && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    style={styles.faqAnswer}
                  >
                    {item.a}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      ),
    },
    {
      icon: <Mail size={22} />,
      title: "Contact / Support",
      content: (
        <ul style={styles.ul}>
          <li>
            Email: <strong>support@railapp.com</strong>
          </li>
          <li>
            Phone: <strong>+91-XXXXXXXXXX</strong>
          </li>
        </ul>
      ),
    },
    {
      icon: <Info size={22} />,
      title: "Troubleshooting",
      content: (
        <ul style={styles.ul}>
          <li>Map not loading → Refresh or check connection.</li>
          <li>AI recommendation missing → Clear cache and retry.</li>
          <li>Schedule mismatch → Contact support.</li>
        </ul>
      ),
    },
  ];

  return (
    <main style={styles.main}>
      <h1 style={styles.h1}>🚆 Help & Guidance</h1>
      {sections.map((section, i) => (
        <motion.div
          key={i}
          style={styles.card}
          whileHover={{
            scale: 1.02,
            // boxShadow: "2px 8px 20px rgba(0.12,0.12,0.12,0.12)",
            boxShadow: " 8px 8px 8px rgba(1.2,1.2,1,0.12)",
          }}
        >
          <div style={styles.header}>
            <div style={styles.icon}>{section.icon}</div>
            <h2 style={styles.h2}>{section.title}</h2>
          </div>
          <div>{section.content}</div>
        </motion.div>
      ))}
    </main>
  );
};

// STYLES
const styles = {
  main: {
    padding: "30px 20px",

    margin: "auto",
    fontFamily: "Arial, sans-serif",

    background: "#00152D",
  },
  h1: {
    textAlign: "center",
    fontSize: "32px",
    marginBottom: "30px",
    color: "white",
    textShadow: "1px 1px 5px rgba(0,0,0,0.5)",
  },
  card: {
    // background: "#fff",
    background: "#00152D",
    padding: "25px 20px",
    marginBottom: "25px",

    boxShadow: "0 8px 20px rgba(0,0,0,0.2)",
    transition: "all 0.3s ease",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "15px",
  },
  icon: {
    width: "40px",
    height: "40px",
    background: "#007bff",
    color: "white",
    borderRadius: "50%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  h2: {
    fontSize: "20px",
    color: "white",
    borderLeft: "5px solid #007bff",
    paddingLeft: "10px",
    margin: 0,
    textShadow: "1px 1px 3px rgba(0,0,0,0.3)",
  },
  ul: {
    listStyle: "disc",
    paddingLeft: "25px",
    color: "#fff",
    marginTop: 0,
  },
  p: { color: "#fff", marginTop: 0 },
  buttonContainer: { display: "flex", gap: "10px", flexWrap: "wrap" },
  navButton: {
    background: "#007bff",
    color: "#fff",
    padding: "10px 20px",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    fontWeight: "bold",
  },
  faqButton: {
    width: "100%",
    textAlign: "left",
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    background: "#00152D",
    cursor: "pointer",
  },
  faqAnswer: {
    background: "#fafafa",
    padding: "10px",
    borderLeft: "3px solid #007bff",
    borderRadius: "0 0 8px 8px",
    marginTop: "2px",
    color: "#555",
    background: "#0c1a33", // dark but distinct from card
    color: "#fff",
    borderLeft: "4px solid #00bfff",
    boxShadow: "0 4px 8px rgba(0,0,0,0.15)",
  },
};

export default Help;
