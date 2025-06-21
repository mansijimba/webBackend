const mongoose = require('mongoose');

const PatientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  age: Number,
  gender: String,
  email: String,
  phone: String,
  lastVisit: Date,
  upcomingAppointment: Date,
  doctor: String,  // You can use ObjectId ref if you want relations
});

module.exports = mongoose.model('Patient', PatientSchema);
