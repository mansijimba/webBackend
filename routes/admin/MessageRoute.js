const express = require('express');
const router = express.Router();

const { getAllMessages } = require('../../controllers/admin/MessageController');
const { authenticateUser } = require('../../middlewares/authorizedUsers');
const adminOnly = require('../../middlewares/rolemiddleware')('admin');

router.use(authenticateUser, adminOnly);

router.get('/', getAllMessages);

module.exports = router;
