// src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Header from "./components/Header";

// pages
import MapPage from "./pages/MapPage";
import PerformancePage from "./pages/PerformancePage";
import TrainPage from "./pages/TrainPage";
import HelpPage from "./pages/HelpPage";
import DetailedMap from "./pages/DetailedMap";

function App() {
  return (
    <BrowserRouter>
      <Header /> {/* header stays visible across routes */}
      <Routes>
        <Route path="/" element={<Navigate to="/map" replace />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/performance" element={<PerformancePage />} />
        <Route path="/trains" element={<TrainPage />} />
        <Route path="/help" element={<HelpPage />} />
        <Route path="/detailed-map" element={<DetailedMap />} />

        <Route
          path="*"
          element={<div style={{ padding: 20 }}>404 — Page not found</div>}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
