// routes/admin/MessageRoute.js
const express = require('express');
const router = express.Router();

const { getAllMessages } = require('../../controllers/admin/MessageController');

router.get('/', getAllMessages);

module.exports = router;
