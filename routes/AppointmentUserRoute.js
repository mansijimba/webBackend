// routes/appointment.js
const express = require('express');
const router = express.Router();
const { 
  bookAppointment, 
  getUserAppointments, 
  cancelAppointment,

  appointmentPaymentSuccess,
  appointmentPaymentFailure

} = require('../controllers/user/AppointmentUserController');

router.post('/book', bookAppointment);  
router.get('/', getUserAppointments);
router.post('/:id/cancel', cancelAppointment);

router.get('/payment/success', appointmentPaymentSuccess);
router.post('/payment/success', appointmentPaymentSuccess);
router.get('/payment/failure', appointmentPaymentFailure);
router.post('/payment/failure', appointmentPaymentFailure);

module.exports = router;