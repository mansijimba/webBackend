const express = require('express');
const router = express.Router();
const appointmentController = require('../../controllers/admin/AppointmentManagementController');

router.get('/', appointmentController.getAllAppointments);
router.post('/', appointmentController.createAppointment);
router.put('/:id', appointmentController.updateAppointment);
router.delete('/:id', appointmentController.deleteAppointment);
router.patch('/:id/status', appointmentController.updateAppointment);

module.exports = router;
