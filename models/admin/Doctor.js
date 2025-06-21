const mongoose = require('mongoose');

const DoctorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  specialty: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  phone: { type: String, required: true },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'On Leave'],
    default: 'Active',
  },
  availability: { type: String, default: '' },
  appointments: { type: Number, default: 0 },
  filepath: { type: String }, // for future image uploads
}, { timestamps: true });

module.exports = mongoose.model('Doctor', DoctorSchema);
