const db = require('./index');
const { encrypt, decrypt } = require('../utils/crypto');

const DEBUG = process.env.DEBUG_TOKENS === 'true';

const saveToken = async ({ userId = null, service, accessToken, refreshToken, expiresIn }) => {
  const expiresAt = new Date(Date.now() + expiresIn * 1000);

  try {
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
      INSERT INTO tokens (user_id, service, access_token, refresh_token, expires_at)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (user_id, service)
      DO UPDATE SET
        access_token = EXCLUDED.access_token,
        refresh_token = EXCLUDED.refresh_token,
        expires_at = EXCLUDED.expires_at,
        created_at = NOW()
      `,
      [userId, service, encryptedAccess, encryptedRefresh, expiresAt]
    );

    console.log(`🔐 Token für ${service} (${userId || 'anonymous'}) verschlüsselt gespeichert`);
  } catch (err) {
    console.error('❌ Fehler beim Speichern des Tokens:', err);
  }
};

const getToken = async (userId, service) => {
  try {
    const result = await db.query(
      `
      SELECT access_token, refresh_token, expires_at
      FROM tokens
      WHERE ${userId === null ? 'user_id IS NULL' : 'user_id = $1'} AND service = $2
      ORDER BY created_at DESC
      LIMIT 1
      `,
      userId === null ? [service] : [userId, service]
    );

    if (result.rows.length === 0) {
      console.warn(`⚠️ Kein Token gefunden für ${service} (${userId || 'anonymous'})`);
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
