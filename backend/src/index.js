/**
 * @fileoverview Entry point for the Express server.
 * Initializes environment variables, database connection, and registers routes.
 */

/**
 * @requires dotenv
 * Loads environment variables from the .env file.
 */
require('dotenv').config();

/**
 * @requires ./db
 * Initializes the PostgreSQL database connection.
 */
require('./db');

/**
 * @requires ./db/setup
 * Creates required tables if they do not exist.
 */
require('./db/setup');

/**
 * @requires express
 */
const express = require('express');
const app = express();

/**
 * The port on which the server will listen.
 * @constant {number}
 */
const PORT = process.env.PORT || 3001;

/**
 * @requires ./routes/hubspot
 * Routes related to HubSpot API access.
 */
const hubspotRoutes = require('./routes/hubspot');

/**
 * @requires ./routes/oauth
 * Routes for handling OAuth authorization flows.
 */
const oauthRoutes = require('./routes/oauth');

/**
 * Registers routes under the "/hubspot" prefix.
 */
app.use('/hubspot', hubspotRoutes);

/**
 * Registers OAuth-related routes (e.g. redirect handler).
 */
app.use('/', oauthRoutes);

/**
 * Starts the Express server.
 */
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
