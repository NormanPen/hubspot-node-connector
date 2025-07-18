const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.connect()
  .then(() => console.log('✅ Verbindung zur Datenbank erfolgreich'))
  .catch((err) => console.error('❌ Fehler bei der DB-Verbindung:', err));

module.exports = pool;
