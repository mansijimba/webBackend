const express = require('express');
const router = express.Router();
const appointmentController = require('../../controllers/admin/AppointmentManagementController');
const { authenticateUser } = require('../../middlewares/authorizedUsers');
const adminOnly = require('../../middlewares/rolemiddleware')('admin');

// ✅ Admin-only access for all appointment routes
router.use(authenticateUser, adminOnly);

// GET all appointments
router.get('/', appointmentController.getAllAppointments);

// Create appointment
router.post('/', appointmentController.createAppointment);

// Update appointment
router.put('/:id', appointmentController.updateAppointment);

// Delete appointment
router.delete('/:id', appointmentController.deleteAppointment);

// Update appointment status
router.patch('/:id/status', appointmentController.updateAppointment);

module.exports = router;
