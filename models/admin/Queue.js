// models/Queue.js
const mongoose = require('mongoose');

const QueueSchema = new mongoose.Schema({
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: true
  },
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  queuePosition: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['Waiting', 'In Progress', 'Not Arrived', 'Completed', 'No Show'],
    default: 'Waiting'
  },
  appointmentTime: {
    type: String, // e.g., "09:30 AM"
  },
  waitTime: {
    type: String, // e.g., "15 min"
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Queue', QueueSchema);
