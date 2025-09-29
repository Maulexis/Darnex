// src/services/db.js
import pkg from "pg";
const { Pool } = pkg;
import dotenv from "dotenv";

dotenv.config();

// Database connection configuration.
// (pulls values from your .env file)
const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_DATABASE || "railway_sim_db",
  password: process.env.DB_PASSWORD || "Themedaksh990",
  port: process.env.DB_PORT || 5432,
});

// A simple function to query the database.
export async function query(text, params) {
  return pool.query(text, params);
}

// Default export pool (if you need raw connections)
export default pool;
