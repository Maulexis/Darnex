import React from "react";
import { motion } from "framer-motion";
import {
  Info,
  Map,
  BarChart3,
  Compass,
  Train,
  Home,
  Database,
} from "lucide-react";
import { Link } from "react-router-dom";
import Help from "../components/Help"; // ⬅️ Import the Help component

const HelpPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-white to-gray-100 flex flex-col">
      {/* 🔹 Header */}
      <header className="fixed top-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4"></div>
      </header>

      {/* 🔹 Main Content */}
      <main className="flex-1 max-w-6xl mx-auto px-6 pt-28 pb-12">
        {/* Importing Help component */}
        <Help />
      </main>
    </div>
  );
};

export default HelpPage;
