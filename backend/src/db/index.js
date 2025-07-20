/**
 * @fileoverview PostgreSQL connection pool setup using `pg` and environment variables.
 * Establishes a shared connection to be used across the backend.
 */

const { Pool } = require('pg');
require('dotenv').config();

/**
 * A PostgreSQL connection pool instance.
 * Uses the `DATABASE_URL` environment variable for configuration.
 *
 * @constant
 * @type {Pool}
 */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Establish initial connection to validate config
pool.connect()
  .then(() => console.log('✅ Verbindung zur Datenbank erfolgreich'))
  .catch((err) => console.error('❌ Fehler bei der DB-Verbindung:', err));

/**
 * Exports the connection pool for reuse throughout the application.
 * Enables querying with `pool.query(...)` or transactions with `pool.connect()`.
 */
module.exports = pool;
