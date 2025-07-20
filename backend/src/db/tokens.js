/**
 * @fileoverview Functions to manage OAuth tokens and related entities in the database.
 * Includes helpers to fetch the HubSpot portal ID, ensure related orgs and users exist,
 * and store/retrieve encrypted tokens.
 */

const db = require('./index');
const axios = require('axios');
const { encrypt, decrypt } = require('../utils/crypto');

const DEBUG = process.env.DEBUG_TOKENS === 'true';

/**
 * Fetches the HubSpot portal ID (hub_id) using the given access token.
 *
 * @param {string} accessToken - The access token to query HubSpot with
 * @returns {Promise<string>} The hub_id associated with the token
 * @throws {Error} If the API call fails
 */
const fetchHubspotHubId = async (accessToken) => {
  try {
    const res = await axios.get(`https://api.hubapi.com/oauth/v1/access-tokens/${accessToken}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    return res.data.hub_id;
  } catch (err) {
    console.error('❌ Fehler beim Abrufen der hub_id:', err.response?.data || err.message);
    throw err;
  }
};

/**
 * Ensures that a HubSpot organization exists in the DB and returns its ID.
 *
 * @param {string} hubId - The HubSpot portal ID
 * @returns {Promise<number>} The internal org ID
 */
const ensureOrgExists = async (hubId) => {
  const existing = await db.query(
    'SELECT id FROM orgs WHERE hubspot_portal_id = $1',
    [hubId]
  );
  if (existing.rows.length > 0) {
    return existing.rows[0].id;
  }

  const inserted = await db.query(
    'INSERT INTO orgs (hubspot_portal_id) VALUES ($1) RETURNING id',
    [hubId]
  );
  return inserted.rows[0].id;
};

/**
 * Ensures that a user exists for a given identifier and org ID.
 *
 * @param {string} userIdentifier - The logical user ID (e.g., "cust001")
 * @param {number} orgId - The ID of the organization this user belongs to
 * @returns {Promise<number>} The internal user ID
 */
const ensureUserExists = async (userIdentifier, orgId) => {
  const existing = await db.query(
    'SELECT id FROM users WHERE user_identifier = $1',
    [userIdentifier]
  );

  if (existing.rows.length > 0) {
    return existing.rows[0].id;
  }

  const inserted = await db.query(
    'INSERT INTO users (user_identifier, org_id) VALUES ($1, $2) RETURNING id',
    [userIdentifier, orgId]
  );
  return inserted.rows[0].id;
};

/**
 * Saves a new OAuth token, encrypted and linked to the correct user and org.
 *
 * @param {Object} params
 * @param {string} params.userId - The external identifier for the user
 * @param {string} params.service - The service name (e.g., 'hubspot')
 * @param {string} params.accessToken - The new access token
 * @param {string} params.refreshToken - The corresponding refresh token
 * @param {number} params.expiresIn - Seconds until token expiration
 */
const saveToken = async ({ userId, service, accessToken, refreshToken, expiresIn }) => {
  const expiresAt = new Date(Date.now() + expiresIn * 1000);

  try {
    const hubId = await fetchHubspotHubId(accessToken);
    const orgId = await ensureOrgExists(hubId);
    const internalUserId = await ensureUserExists(userId, orgId);

    const encryptedAccess = encrypt(accessToken);
    const encryptedRefresh = encrypt(refreshToken);

    if (DEBUG) {
      console.log('🔑 Klartext Access Token:', accessToken);
      console.log('🔑 Klartext Refresh Token:', refreshToken);
      console.log('🧊 Verschlüsselt Access Token:', encryptedAccess);
      console.log('🧊 Verschlüsselt Refresh Token:', encryptedRefresh);
    }

    await db.query(
      `
      INSERT INTO tokens (user_id, service, access_token, refresh_token, expires_at, org_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (user_id, service)
      DO UPDATE SET
        access_token = EXCLUDED.access_token,
        refresh_token = EXCLUDED.refresh_token,
        expires_at = EXCLUDED.expires_at,
        org_id = EXCLUDED.org_id,
        created_at = NOW()
      `,
      [internalUserId, service, encryptedAccess, encryptedRefresh, expiresAt, orgId]
    );

    console.log(`🔐 Token für ${service} (${userId}) gespeichert (User-ID: ${internalUserId}, Org-ID: ${orgId}, Hub-ID: ${hubId})`);
  } catch (err) {
    console.error('❌ Fehler beim Speichern des Tokens:', err);
  }
};

/**
 * Retrieves and decrypts the latest stored token for a user and service.
 *
 * @param {string} userIdentifier - The external user ID (e.g., "cust001")
 * @param {string} service - The name of the service (e.g., 'hubspot')
 * @returns {Promise<Object|null>} The decrypted token or null if not found
 */
const getToken = async (userIdentifier, service) => {
  try {
    const result = await db.query(
      `
      SELECT t.access_token, t.refresh_token, t.expires_at
      FROM tokens t
      JOIN users u ON t.user_id = u.id
      WHERE u.user_identifier = $1 AND t.service = $2
      ORDER BY t.created_at DESC
      LIMIT 1
      `,
      [userIdentifier, service]
    );

    if (result.rows.length === 0) {
      console.warn(`⚠️ Kein Token gefunden für ${service} (${userIdentifier})`);
      return null;
    }

    const { access_token, refresh_token, expires_at } = result.rows[0];

    const decryptedAccess = decrypt(access_token);
    const decryptedRefresh = decrypt(refresh_token);

    if (DEBUG) {
      console.log('🧊 Verschlüsselt aus DB (Access):', access_token);
      console.log('🧊 Verschlüsselt aus DB (Refresh):', refresh_token);
      console.log('🔓 Entschlüsselt (Access):', decryptedAccess);
      console.log('🔓 Entschlüsselt (Refresh):', decryptedRefresh);
    }

    return {
      access_token: decryptedAccess,
      refresh_token: decryptedRefresh,
      expires_at,
    };
  } catch (err) {
    console.error('❌ Fehler beim Abrufen des Tokens:', err);
    throw err;
  }
};

module.exports = {
  saveToken,
  getToken,
};
