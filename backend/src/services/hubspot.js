const axios = require('axios');
const qs = require('qs');
const { getToken, saveToken } = require('../db/tokens');

/**
 * Holt die HubSpot-Portal-ID anhand des neuen Access Tokens
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
 * Frischt den Access Token mit dem Refresh Token auf – speichert neuen Token
 * @param {string} userIdentifier z. B. "cust001"
 */
const refreshAccessToken = async (userIdentifier, refreshToken) => {
  try {
    const data = qs.stringify({
      grant_type: 'refresh_token',
      client_id: process.env.HUBSPOT_CLIENT_ID,
      client_secret: process.env.HUBSPOT_CLIENT_SECRET,
      refresh_token: refreshToken,
    });

    const response = await axios.post('https://api.hubapi.com/oauth/v1/token', data, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const tokenData = response.data;

    await saveToken({
      userId: userIdentifier, // wichtig: userIdentifier, wird intern in user_id gemappt
      service: 'hubspot',
      accessToken: tokenData.access_token,
      refreshToken,
      expiresIn: tokenData.expires_in,
    });

    console.log(`🔁 Access Token für ${userIdentifier || 'anonymous'} wurde erneuert`);
    return tokenData.access_token;
  } catch (err) {
    console.error('❌ Fehler beim Token-Refresh:', err.response?.data || err.message);
    throw err;
  }
};

/**
 * Führt einen API-Call mit gültigem Token durch, versucht bei 401 Refresh
 */
const callHubspotApi = async ({ userId = null, service = 'hubspot', method = 'GET', endpoint, data = null }) => {
  let token = await getToken(userId, service);
  if (!token) throw new Error(`Kein gültiger Token für ${service} gefunden`);

  try {
    const response = await axios({
      method,
      url: `https://api.hubapi.com${endpoint}`,
      headers: {
        Authorization: `Bearer ${token.access_token}`,
        'Content-Type': 'application/json',
      },
      data,
    });

    return response.data;
  } catch (err) {
    if (err.response?.status === 401 && token.refresh_token) {
      console.warn(`⚠️ Token abgelaufen für ${userId || 'anonymous'} – versuche Refresh...`);
      const newAccessToken = await refreshAccessToken(userId, token.refresh_token);

      const retryResponse = await axios({
        method,
        url: `https://api.hubapi.com${endpoint}`,
        headers: {
          Authorization: `Bearer ${newAccessToken}`,
          'Content-Type': 'application/json',
        },
        data,
      });

      return retryResponse.data;
    }

    console.error('❌ Fehler beim HubSpot-API-Call:', err.response?.data || err.message);
    throw err;
  }
};

module.exports = {
  callHubspotApi,
  refreshAccessToken,
};
