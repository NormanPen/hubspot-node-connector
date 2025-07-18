const axios = require('axios');
const qs = require('qs');
const { saveToken } = require('../db/tokens'); 

exports.handleOAuthRedirect = async (req, res) => {
  const code = req.query.code;
  const customerId = req.query.state; 

  if (!code) {
    return res.status(400).send('Kein Code vorhanden');
  }

  try {
    console.log('Sende Token Request mit:');
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

    res.send('<h1>Verbindung erfolgreich!</h1><p>Du kannst das Fenster jetzt schließen.</p>');
  } catch (err) {
    console.error('Token-Fehler:', err.response?.data || err.message);
    res.status(500).send('Fehler beim Abrufen des Tokens');
  }
};
