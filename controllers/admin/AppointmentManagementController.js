// const Appointment = require('../../models/admin/Appointment');
// const Patient = require ('../../models/User')
// const Doctor = require ('../../models/admin/Doctor')
// exports.getAllAppointments = async (req, res) => {
//   try {
//     const appointments = await Appointment.find()
//       .populate('doctor', 'name specialty')   // Only get doctor's name and specialization
//       .populate('patient', 'fullName')  // Only get patient's name
//       .lean();                      // Avoid Mongoose circular references

//     res.status(200).json({
//       success: true,
//       message: "Appointments fetched successfully",
//       data: appointments,
//     });
//   } catch (err) {
//     console.error("Error fetching appointments:", err);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// };

// exports.createAppointment = async (req, res) => {
//   try {
//     const appointment = new Appointment(req.body);
//     await appointment.save();
//     res.status(201).json({
//       success: true,
//       message: "Appointment created successfully",
//       data: appointment,
//     });
//   } catch (err) {
//     console.error("Error creating appointment:", err);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// };

// // PATCH /api/admin/appointments/:id/status
// exports.updateAppointment = async (req, res) => {
//   try {
//     const { status, time } = req.body;

//     const updatedAppointment = await Appointment.findByIdAndUpdate(
//       req.params.id,
//       { status, time },
//       { new: true }
//     );

//     if (!updatedAppointment) {
//       return res.status(404).json({ success: false, message: "Appointment not found" });
//     }

//     return res.status(200).json({
//       success: true,
//       message: "Appointment updated",
//       data: updatedAppointment,
//     });
//   } catch (err) {
//     console.error("Update error:", err);
//     return res.status(500).json({ success: false, message: "Server Error" });
//   }
// };


// exports.deleteAppointment = async (req, res) => {
//   try {
//     const deleted = await Appointment.findByIdAndDelete(req.params.id);

//     if (!deleted) {
//       return res.status(404).json({ success: false, message: "Appointment not found" });
//     }

//     res.status(200).json({
//       success: true,
//       message: "Appointment deleted successfully",
//     });
//   } catch (err) {
//     console.error("Error deleting appointment:", err);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// };
