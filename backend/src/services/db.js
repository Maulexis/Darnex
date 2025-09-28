import 'dotenv/config';
import pg from "pg";
const { Pool } = pg;

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "railway_ai",
  password: "pj925fhpp5",
  port: 5432,
});

export const query = (text, params) => pool.query(text, params);
export default pool;
