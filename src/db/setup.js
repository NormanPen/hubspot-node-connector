const db = require('./index');

const createTokensTable = async () => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS tokens (
        id SERIAL PRIMARY KEY,
        user_id TEXT,
        service TEXT NOT NULL,
        access_token TEXT NOT NULL,
        refresh_token TEXT NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log('Tabelle "tokens" ist bereit');
  } catch (err) {
    console.error('Fehler beim Anlegen der Tabelle:', err);
  }
};

createTokensTable();
