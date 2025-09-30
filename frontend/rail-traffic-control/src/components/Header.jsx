// src/components/Header.jsx
import React from "react";
import { Link, useLocation } from "react-router-dom";

const Header = () => {
  const location = useLocation();
  const path = location.pathname;

  const isActive = (matchPath) => {
    // use startsWith so subpaths like /trains/123 still mark trains as active
    return path === matchPath || path.startsWith(matchPath + "/");
  };

  return (
    <header style={styles.header}>
      <div style={styles.left}>
        <Link to="/map">
          <img src="/logo.png" alt="Logo" style={styles.logo} />
        </Link>
      </div>

      <div style={styles.center}>
        <Link
          to="/map"
          style={isActive("/map") ? styles.activeLink : styles.link}
        >
          Map
        </Link>
        <Link
          to="/performance"
          style={isActive("/performance") ? styles.activeLink : styles.link}
        >
          Performance
        </Link>
        <Link
          to="/trains"
          style={isActive("/trains") ? styles.activeLink : styles.link}
        >
          Train Scheduler & Junction Data
        </Link>
      </div>

      <div style={styles.right}>
        <Link
          to="/help"
          style={isActive("/help") ? styles.activeLink : styles.link}
        >
          Help
        </Link>
      </div>
    </header>
  );
};

// const styles = {
//   header: {
//     display: "flex",
//     justifyContent: "space-between",
//     alignItems: "center",
//     padding: "15px 20px",
//     background: "#00152D",
//     position: "sticky",
//     top: 0,
//     zIndex: 1000,
//   },
//   left: { flex: 1 },
//   center: { flex: 2, display: "flex", justifyContent: "center", gap: "15px" },
//   right: { flex: 1, display: "flex", justifyContent: "flex-end" },
//   logo: { height: "45px" },
//   link: {
//     color: "#fff",
//     textDecoration: "none",
//     fontWeight: "500",
//     cursor: "pointer",
//     padding: 0, // remove all padding
//   },
//   activeLink: {
//     color: "#FFC107", // highlight active link
//     textDecoration: "underline", // optional
//     fontWeight: "bold",
//     cursor: "pointer",
//     padding: 0,
//   },
// };
const styles = {
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "15px 20px",
    background: " #000F22",
    position: "sticky",
    top: 0,
    zIndex: 1000,
  },
  left: { flex: 1 },
  center: {
    flex: 2,
    display: "flex",
    justifyContent: "center",
    gap: "25px", // add gap between links
  },
  right: { flex: 1, display: "flex", justifyContent: "flex-end" },
  logo: { height: "45px" },
  link: {
    color: "#fff",
    textDecoration: "none",
    fontWeight: "400",
    cursor: "pointer",
    padding: 0,
  },
  activeLink: {
    color: "#FFC107",
    textDecoration: "none",
    fontWeight: "bold",
    cursor: "pointer",
    padding: 0,
  },
};

export default Header;
