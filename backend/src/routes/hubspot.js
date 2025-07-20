/**
 * @fileoverview Route to test authenticated calls to the HubSpot API.
 */

const express = require('express');
const router = express.Router();
const { callHubspotApi } = require('../services/hubspot');

/**
 * Test route to fetch contacts from HubSpot.
 *
 * @route GET /hubspot/test
 * @queryparam {string} [user] - Optional user identifier (e.g. cust001)
 * @returns {Object[]} JSON list of HubSpot contacts
 *
 * @example
 * // GET /hubspot/test?user=cust001
 */
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
