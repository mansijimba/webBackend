// routes/appointment.js (or similar)
const express = require('express');
const router = express.Router();
const { bookAppointment } = require('../controllers/user/AppointmentUserController');

router.post('/', bookAppointment);

module.exports = router;
