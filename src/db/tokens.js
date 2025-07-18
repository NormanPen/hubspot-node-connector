const db = require('./index');

const saveToken = async ({ userId = null, service, accessToken, refreshToken, expiresIn }) => {
  const expiresAt = new Date(Date.now() + expiresIn * 1000); 

  try {
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
      [userId, service, accessToken, refreshToken, expiresAt]
    );

    console.log(`Token für ${service} (${userId || 'anonymous'}) gespeichert oder aktualisiert`);
  } catch (err) {
    console.error('Fehler beim Speichern des Tokens:', err);
  }
};

const getToken = async (userId, service) => {
  try {
    let result;

    if (userId === null) {
      result = await db.query(
        `
        SELECT access_token, refresh_token, expires_at
        FROM tokens
        WHERE user_id IS NULL AND service = $1
        ORDER BY created_at DESC
        LIMIT 1
        `,
        [service]
      );
    } else {
      result = await db.query(
        `
        SELECT access_token, refresh_token, expires_at
        FROM tokens
        WHERE user_id = $1 AND service = $2
        ORDER BY created_at DESC
        LIMIT 1
        `,
        [userId, service]
      );
    }

    if (result.rows.length === 0) {
      console.warn(`⚠️ Kein Token gefunden für ${service} (${userId || 'anonymous'})`);
      return null;
    }

    return result.rows[0];
  } catch (err) {
    console.error('Fehler beim Abrufen des Tokens:', err);
    throw err;
  }
};

module.exports = {
  saveToken,
  getToken,
};
