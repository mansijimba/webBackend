// routes/appointment.js
const express = require('express');
const router = express.Router();
const { 
  bookAppointment, 
  getUserAppointments, 
  cancelAppointment,
  // ============ ESEWA PAYMENT HANDLERS (ADDED FOR PAYMENT INTEGRATION) ============
  appointmentPaymentSuccess,
  appointmentPaymentFailure
  // ============ END ESEWA PAYMENT HANDLERS ============
} = require('../controllers/user/AppointmentUserController');

// ============ SIMPLIFIED ROUTES (Book + Payment in one endpoint) ============
router.post('/book', bookAppointment);  // Creates appointment AND returns eSewa form data
router.get('/', getUserAppointments);
router.post('/:id/cancel', cancelAppointment);

// ============ ESEWA CALLBACK ROUTES (ADDED FOR PAYMENT INTEGRATION) ============
router.get('/payment/success', appointmentPaymentSuccess);
router.post('/payment/success', appointmentPaymentSuccess);
router.get('/payment/failure', appointmentPaymentFailure);
router.post('/payment/failure', appointmentPaymentFailure);
// ============ END ESEWA CALLBACK ROUTES ============

module.exports = router;