// routes/public/appointmentRoutes.js
const express = require('express');
const router = express.Router();
const Appointment = require('../models/admin/Appointment'); // Or wherever your model is

// POST /api/appointments — for public user booking
router.post('/', async (req, res) => {
  try {
    const { doctorId, patientName, contact, appointmentDate } = req.body;

    if (!doctorId || !patientName || !contact || !appointmentDate) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const newAppointment = await Appointment.create({
      doctorId,
      patientName,
      contact,
      appointmentDate,
      status: 'Pending',
    });

    res.status(201).json({ success: true, data: newAppointment });
  } catch (err) {
    console.error('Error booking appointment:', err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

module.exports = router;
