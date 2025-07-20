/**
 * @fileoverview Controller for handling the OAuth redirect from HubSpot.
 * Extracts the authorization code, exchanges it for tokens, and stores them securely.
 */

const axios = require('axios');
const qs = require('qs');
const { saveToken } = require('../db/tokens');

/**
 * Handles the OAuth redirect route after HubSpot authorization.
 * Expects `code` (authorization code) and `state` (custom user identifier) as query parameters.
 * Exchanges the code for access and refresh tokens, and stores them encrypted in the database.
 *
 * @param {import('express').Request} req - The Express request object
 * @param {import('express').Response} res - The Express response object
 */
exports.handleOAuthRedirect = async (req, res) => {
  const code = req.query.code;
  const customerId = req.query.state; // e.g. "cust001"

  if (!code) {
    return res.status(400).send('Missing authorization code');
  }

  try {
    console.log('Sending token request with:');
    console.log('client_id:', process.env.HUBSPOT_CLIENT_ID);
    console.log('client_secret:', process.env.HUBSPOT_CLIENT_SECRET);
    console.log('redirect_uri:', process.env.HUBSPOT_REDIRECT_URI);
    console.log('code:', code);
    console.log('State (customerId):', customerId);

    const data = qs.stringify({
      grant_type: 'authorization_code',
      client_id: process.env.HUBSPOT_CLIENT_ID,
      client_secret: process.env.HUBSPOT_CLIENT_SECRET,
      redirect_uri: process.env.HUBSPOT_REDIRECT_URI,
      code: code,
    });

    const tokenResponse = await axios.post('https://api.hubapi.com/oauth/v1/token', data, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const tokenData = tokenResponse.data;

    await saveToken({
      userId: customerId,
      service: 'hubspot',
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresIn: tokenData.expires_in,
    });

    res.send('<h1>Connection successful!</h1><p>You can now close this window.</p>');
  } catch (err) {
    console.error('Token exchange error:', err.response?.data || err.message);
    res.status(500).send('Failed to retrieve token');
  }
};
