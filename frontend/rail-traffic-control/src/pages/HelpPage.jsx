import React from "react";
import { motion } from "framer-motion";
import { Info, Map, BarChart3, Compass, Train, Home, Database } from "lucide-react";
import { Link } from "react-router-dom";
import Help from "../components/Help"; // ⬅️ Import the Help component

const HelpPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-white to-gray-100 flex flex-col">
      {/* 🔹 Header */}
      <header className="fixed top-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2 text-xl font-bold">
            <Train size={26} /> RailOps
          </div>

          <nav className="flex gap-6 text-sm md:text-base">
            <Link to="/" className="hover:text-yellow-300 flex items-center gap-1 transition">
              <Home size={18} /> Home
            </Link>
            <Link to="/map" className="hover:text-yellow-300 flex items-center gap-1 transition">
              <Map size={18} /> Map
            </Link>
            <Link to="/performance" className="hover:text-yellow-300 flex items-center gap-1 transition">
              <BarChart3 size={18} /> Performance
            </Link>
            <Link to="/scheduler" className="hover:text-yellow-300 flex items-center gap-1 transition">
              <Compass size={18} /> Scheduler
            </Link>
            <Link to="/junction-data" className="hover:text-yellow-300 flex items-center gap-1 transition">
              <Database size={18} /> Junction Data
            </Link>
            <Link
              to="/help"
              className="hover:text-yellow-300 flex items-center gap-1 transition font-semibold"
            >
              <Info size={18} /> Help
            </Link>
          </nav>
        </div>
      </header>

      {/* 🔹 Main Content */}
      <main className="flex-1 max-w-6xl mx-auto px-6 pt-28 pb-12">
        <motion.h1
          className="text-4xl font-bold text-center text-blue-700 mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Help & User Guide
        </motion.h1>

        {/* Importing Help component */}
        <Help />
      </main>
    </div>
  );
};

export default HelpPage;
