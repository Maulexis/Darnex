// Example: in a file like backend/src/db.js or backend/src/database.js

import pg from 'pg';
// This line loads variables from your .env file for local (non-Docker) development
import 'dotenv/config';

const { Pool } = pg;

// The Pool will automatically use the DATABASE_URL from the environment
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // For production deployments, you might add SSL configuration here
  // ssl: {
  //   rejectUnauthorized: false
  // }
});

export default pool;