require('dotenv').config();
const { Pool } = require('pg');

// Koneksi memakai Environment Variable DATABASE_URL (jangan hardcode di kode)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 5,
});

module.exports = pool;
