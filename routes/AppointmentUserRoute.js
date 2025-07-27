// routes/appointment.js (or similar)
const express = require('express');
const router = express.Router();
const { bookAppointment, getUserAppointments, cancelAppointment } = require('../controllers/user/AppointmentUserController');

router.post('/book', bookAppointment);
router.get('/', getUserAppointments);
router.post('/:id/cancel', cancelAppointment);

module.exports = router;
