// src/components/Header.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Header = () => {
  const location = useLocation();
  const path = location.pathname;

  const isActive = (matchPath) => {
    // use startsWith so subpaths like /trains/123 still mark trains as active
    return path === matchPath || path.startsWith(matchPath + '/');
  };

  return (
    <header style={styles.header}>
      <div style={styles.left}>
        <Link to="/map"><img src="/logo.png" alt="Logo" style={styles.logo} /></Link>
      </div>

      <div style={styles.center}>
        <Link to="/map"><button className={`btn-map ${isActive('/map') ? 'active' : ''}`}>Map</button></Link>
        <Link to="/performance"><button className={`btn-performance ${isActive('/performance') ? 'active' : ''}`}>Performance</button></Link>
        <Link to="/trains"><button className={`btn-scheduler ${isActive('/trains') ? 'active' : ''}`}>Train Scheduler & Junction Data</button></Link>
      </div>

      <div style={styles.right}>
        <Link to="/help"><button className={`btn-help ${isActive('/help') ? 'active' : ''}`}>Help</button></Link>
      </div>
    </header>
  );
};

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '15px 20px',
    background: '#ffffff',
    borderBottom: '1px solid #e5e7eb',
    position: 'sticky',
    top: 0,
    zIndex: 1000,
  },
  left: { flex: 1 },
  center: { flex: 2, display: 'flex', justifyContent: 'center', gap: '15px' },
  right: { flex: 1, display: 'flex', justifyContent: 'flex-end' },
  logo: { height: '45px' },
};

export default Header;
