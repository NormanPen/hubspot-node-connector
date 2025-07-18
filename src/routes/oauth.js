const express = require('express');
const router = express.Router();
const { handleOAuthRedirect } = require('../controllers/authController');

router.get('/', handleOAuthRedirect);

module.exports = router;
