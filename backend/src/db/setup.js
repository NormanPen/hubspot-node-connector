/**
 * @fileoverview Sets up the PostgreSQL database schema for the HubSpot Connector.
 * Creates tables for organizations, users, and tokens if they do not exist.
 */

const db = require('./index');

/**
 * Creates database tables for organizations, users, and tokens.
 * Ensures proper relations between entities:
 * - A user belongs to an organization
 * - A token is linked to both a user and an organization
 *
 * Tables created:
 * - orgs: Stores HubSpot portal IDs
 * - users: Internal users linked to orgs
 * - tokens: Stores encrypted OAuth tokens per user/service
 *
 * Uses SQL `CREATE TABLE IF NOT EXISTS` statements.
 *
 * @async
 * @function createSchema
 * @returns {Promise<void>}
 */
const createSchema = async () => {
  try {
    // Organizations (HubSpot portal IDs)
    await db.query(`
      CREATE TABLE IF NOT EXISTS orgs (
        id SERIAL PRIMARY KEY,
        hubspot_portal_id TEXT UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Users with external identifiers like "cust001"
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        user_identifier TEXT UNIQUE NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        org_id INTEGER REFERENCES orgs(id) ON DELETE SET NULL
      );
    `);

    // Tokens (linked to user + organization)
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

    console.log('✅ Tables "orgs", "users", and "tokens" have been created if they did not exist.');
  } catch (err) {
    console.error('❌ Error while creating schema tables:', err);
  }
};

// Run on script execution
createSchema();
