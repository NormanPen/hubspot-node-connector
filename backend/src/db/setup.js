const db = require('./index');

const createSchema = async () => {
  try {
    // Organisationen (HubSpot-Portal-ID)
    await db.query(`
      CREATE TABLE IF NOT EXISTS orgs (
        id SERIAL PRIMARY KEY,
        hubspot_portal_id TEXT UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Nutzer mit Identifier wie "cust001"
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        user_identifier TEXT UNIQUE NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        org_id INTEGER REFERENCES orgs(id) ON DELETE SET NULL
      );
    `);

    // Tokens (zugeordnet zu Nutzer + Organisation)
    await db.query(`
      CREATE TABLE IF NOT EXISTS tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        service TEXT NOT NULL,
        access_token TEXT NOT NULL,
        refresh_token TEXT NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        org_id INTEGER REFERENCES orgs(id) ON DELETE SET NULL,
        CONSTRAINT unique_user_service UNIQUE (user_id, service)
      );
    `);

    console.log('✅ Tabellen "orgs", "users" und "tokens" wurden angelegt (falls nicht vorhanden)');
  } catch (err) {
    console.error('❌ Fehler beim Anlegen der Tabellen:', err);
  }
};

createSchema();
