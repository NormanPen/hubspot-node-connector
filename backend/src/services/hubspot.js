/**
 * @fileoverview Functions to call HubSpot APIs and refresh access tokens.
 * Handles token refresh flow and token storage.
 */

const axios = require('axios');
const qs = require('qs');
const { getToken, saveToken } = require('../db/tokens');

/**
 * Retrieves the HubSpot portal ID (hub_id) using an access token.
 *
 * @param {string} accessToken - The access token to query HubSpot with.
 * @returns {Promise<string>} The `hub_id` of the authenticated HubSpot account.
 * @throws Will throw if the token is invalid or the request fails.
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
 * Refreshes the HubSpot access token using a refresh token and stores the result.
 *
 * @param {string} userIdentifier - Internal user ID (e.g. "cust001").
 * @param {string} refreshToken - The valid refresh token to use for renewing the access token.
 * @returns {Promise<string>} The new access token.
 * @throws Will throw if the refresh fails.
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
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    const tokenData = response.data;

    await saveToken({
      userId: userIdentifier,
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
 * Calls a HubSpot API endpoint using the stored access token. Refreshes the token on 401.
 *
 * @param {Object} options - The request parameters.
 * @param {string|null} [options.userId=null] - The internal user identifier.
 * @param {string} [options.service='hubspot'] - The service name (default: "hubspot").
 * @param {string} [options.method='GET'] - HTTP method (e.g. "GET", "POST").
 * @param {string} options.endpoint - API endpoint to call (e.g. "/crm/v3/objects/contacts").
 * @param {Object|null} [options.data=null] - Payload for POST/PUT requests.
 * @returns {Promise<any>} The response data from HubSpot.
 * @throws Will throw if the call or retry fails.
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
