// const mongoose = require("mongoose");

// const AppointmentSchema = new mongoose.Schema(
//   {
//     doctor: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Doctor",
//       required: true,
//     },
//     patient: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },
//     specialty: {
//       type: String,
//       required: true
//     },
//     date: {
//       type: String, // store as 'YYYY-MM-DD' for simplicity
//       required: true,
//     },
//     time: {
//       type: String, // e.g., "10:30 AM"
//       required: true,
//     },
//     type: {
//       type: String,
//       enum: ["Check-up", "Follow-up", "Consultation"],
//       required: true,
//     },
//     status: {
//       type: String,
//       enum: ['pending', 'confirmed', 'completed', 'cancelled'], 
//       default: "pending",
//     },
//     // ============ ESEWA PAYMENT FIELDS (ADDED BY PAYMENT INTEGRATION) ============
//     appointmentFee: {
//       type: Number,
//       default: 0, // Set consultation fee based on appointment type
//     },
//     paymentStatus: {
//       type: String,
//       enum: ['unpaid', 'processing', 'completed', 'failed'],
//       default: 'unpaid',
//     },
//     paymentResult: {
//       transactionId: String,
//       status: String,
//       amount: Number,
//     },
//   },
//   {
//     timestamps: true,
//   }
// );

// module.exports = mongoose.model("Appointment", AppointmentSchema);