const Appointment = require('../../models/admin/Appointment');

exports.bookAppointment = async (req, res) => {
   console.log("Request body:", req.body);
  try {
    const { doctorId, patientId, specialty, date, time, type } = req.body;

    if (!doctorId || !patientId || !specialty || !date || !time || !type) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Optionally validate the doctorId, patientId existence in your DB

    const appointment = new Appointment({
      doctor: doctorId,
      patient: patientId,
      specialty,
      date,
      time,
      type,
      status: 'pending', // or default status
    });

    await appointment.save();

    res.status(201).json({ success: true, message: 'Appointment booked successfully', appointment });
  } catch (err) {
    console.error('Error booking appointment:', err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
