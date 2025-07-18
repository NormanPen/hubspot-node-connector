require('dotenv').config();
require('./db');
require('./db/setup');

const express = require('express');
const app = express();
const PORT = process.env.PORT || 3001;
const hubspotRoutes = require('./routes/hubspot');

app.use('/hubspot', hubspotRoutes);

const oauthRoutes = require('./routes/oauth');
app.use('/', oauthRoutes);

app.listen(PORT, () => {
    console.log(`Server läuft auf http://localhost:${PORT}`);
});
