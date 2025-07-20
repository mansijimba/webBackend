const mongoose = require('mongoose');

const PatientSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Reference User
  upcomingAppointment: Date,
  doctor: String, // You can expand this to ObjectId ref 'Doctor' if you want
});

module.exports = mongoose.model('Patient', PatientSchema);

