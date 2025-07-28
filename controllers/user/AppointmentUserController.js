const Appointment = require("../../models/admin/Appointment");
const Queue = require("../../models/admin/Queue");
const Message = require("../../models/admin/Message");

// Book Appointment + Add to Queue
exports.bookAppointment = async (req, res) => {
  try {
    const { doctorId, patientId, specialty, date, time, type } = req.body;

    if (!doctorId || !patientId || !specialty || !date || !time || !type) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }
    // Step 1: Save the Appointment
    const appointment = await Appointment.create({
      doctor: doctorId,
      patient: patientId,
      specialty,
      date,
      time,
      type,
      status: "pending",
    });
    
    // Step 2: Calculate next queue position
    const activeQueueCount = await Queue.countDocuments({
      doctor: doctorId,
      status: { $in: ["Waiting", "In Progress"] },
    });

    // Step 3: Save Queue Entry
    await Queue.create({
      appointment: appointment._id,
      patient: patientId,
      doctor: doctorId,
      queuePosition: activeQueueCount + 1,
      status: "Waiting",
      appointmentTime: time,
    });

    res
      .status(201)
      .json({
        success: true,
        message: "Appointment booked & queue created",
        appointment,
      });
  } catch (err) {
    console.error("Error booking appointment:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Get User's Appointments
exports.getUserAppointments = async (req, res) => {
  try {
    const { patientId } = req.query;

    if (!patientId) {
      return res
        .status(400)
        .json({ success: false, message: "patientId is required" });
    }

    const appointments = await Appointment.find({ 
      patient: patientId, 
      status: { $ne: "cancelled" }   
    })
    .populate("doctor", "name specialty")
    .sort({ date: -1, time: -1 });

    res.json({ success: true, appointments });
  } catch (err) {
    console.error("Error fetching appointments:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
// Cancel Appointment + Notify Admin
exports.cancelAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    const appointment = await Appointment.findById(id)
      .populate("doctor")
      .populate("patient");

    if (!appointment) {
      return res
        .status(404)
        .json({ success: false, message: "Appointment not found" });
    }

    if (appointment.status === "Canceled") {
      return res
        .status(400)
        .json({ success: false, message: "Appointment already canceled" });
    }

    appointment.status = "cancelled";
    await appointment.save();

    const patientName = appointment.patient?.fullName || "Unknown Patient";
    const doctorName = appointment.doctor?.name || "Unknown Doctor";
    const appointmentDate = appointment.date
      ? new Date(appointment.date).toLocaleDateString()
      : "Unknown Date";

    const messageContent = `User ${patientName} canceled their appointment with Dr. ${doctorName} on ${appointmentDate} at ${appointment.time}.`;

    await Message.create({ content: messageContent });

    res.json({
      success: true,
      message: "Appointment canceled & admin notified",
    });
  } catch (err) {
    console.error("Error canceling appointment:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
