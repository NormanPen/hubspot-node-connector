const express = require('express');
const router = express.Router();
const { callHubspotApi } = require('../services/hubspot');

router.get('/test', async (req, res) => {
  const userId = req.query.user || null;

  try {
    const daten = await callHubspotApi({
      userId,
      endpoint: '/crm/v3/objects/contacts',
    });

    res.json(daten);
  } catch (err) {
    console.error('API-Call-Fehler:', err.message);
    res.status(500).send('Fehler beim API-Call');
  }
});

module.exports = router;
