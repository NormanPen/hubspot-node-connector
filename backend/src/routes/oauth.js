/**
 * @fileoverview Handles the OAuth redirect callback from HubSpot after user authorization.
 */

const express = require('express');
const router = express.Router();
const { handleOAuthRedirect } = require('../controllers/authController');

/**
 * OAuth callback route.
 *
 * This route is called by HubSpot after the user authorizes the app.
 * It expects a `code` and `state` as query parameters and exchanges
 * the code for access and refresh tokens.
 *
 * @route GET /
 * @queryparam {string} code - The authorization code from HubSpot
 * @queryparam {string} state - The original state value (usually user ID)
 *
 * @returns {string} A success or error message
 *
 * @example
 * // GET /?code=abc123&state=cust001
 */
router.get('/', handleOAuthRedirect);

module.exports = router;
