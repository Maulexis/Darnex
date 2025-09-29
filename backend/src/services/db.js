import 'dotenv/config';
import pg from "pg";
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// This is the NAMED export for the 'query' helper function.
// Your api.js file is looking for this.
export const query = (text, params) => pool.query(text, params);

// This is the DEFAULT export for the entire pool object, which can also be useful.
export default pool;