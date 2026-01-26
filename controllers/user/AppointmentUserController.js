const Appointment = require("../../models/admin/Appointment");
const Queue = require("../../models/admin/Queue");
const Message = require("../../models/admin/Message");
// ============ ESEWA PAYMENT IMPORTS (ADDED FOR PAYMENT INTEGRATION) ============
const { generateEsewaFormData, verifyEsewaPayment, generateTransactionUUID } = require("../../utils/esewaPayment");
// ============ END ESEWA PAYMENT IMPORTS ============

// ============ APPOINTMENT FEE CONFIGURATION (CUSTOMIZE AS NEEDED) ============
const APPOINTMENT_FEES = {
  'Check-up': 300,      // 300 NPR
  'Follow-up': 200,     // 200 NPR
  'Consultation': 400   // 400 NPR
};
// ============ END APPOINTMENT FEE CONFIGURATION ============

// ============ SIMPLIFIED: Book Appointment & Initiate Payment (SINGLE ENDPOINT) ============
/**
 * Books appointment AND initiates eSewa payment in one step
 * Creates appointment with unpaid status and returns eSewa form data
 * @route POST /api/appointment/book
 * @modified Combines prepare + initiate into single endpoint
 */
exports.bookAppointment = async (req, res) => {
  try {
    const { doctorId, patientId, specialty, date, time, type } = req.body;

    if (!doctorId || !patientId || !specialty || !date || !time || !type) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    // ============ STEP 1: Create Appointment with unpaid status ============
    const appointmentFee = APPOINTMENT_FEES[type] || 300;
    
    const appointment = await Appointment.create({
      doctor: doctorId,
      patient: patientId,
      specialty,
      date,
      time,
      type,
      status: "pending",
      appointmentFee,
      paymentStatus: 'unpaid',
    });
    // ============ END STEP 1 ============

    // ============ STEP 2: Generate eSewa Payment Form ============
    const transactionUUID = generateTransactionUUID();

    const protocol = req.protocol;
    const host = req.get('host');
    const backendCallbackUrl = `${protocol}://${host}/api/appointment/payment`;

    const esewaData = generateEsewaFormData({
      totalAmount: appointment.appointmentFee,
      transactionUUID: transactionUUID,
      productCode: 'EPAYTEST',
      successUrl: `${backendCallbackUrl}/success`,
      failureUrl: `${backendCallbackUrl}/failure`
    });

    // Update appointment with payment transaction info
    appointment.paymentResult = {
      transactionId: transactionUUID,
      status: 'pending',
      amount: appointment.appointmentFee
    };
    appointment.paymentStatus = 'processing';
    await appointment.save();
    // ============ END STEP 2 ============

    // ============ STEP 3: Return both appointment and payment data ============
    res.status(201).json({
      success: true,
      message: "Appointment created. Ready for payment.",
      data: {
        appointment,
        payment: {
          formData: esewaData,
          esewaUrl: process.env.ESEWA_API_URL || 'https://rc-epay.esewa.com.np/api/epay/main/v2/form',
          transactionUUID,
          appointmentFee
        }
      }
    });
    // ============ END STEP 3 ============

  } catch (err) {
    console.error("Error booking appointment:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
// ============ END SIMPLIFIED BOOK APPOINTMENT ============

// ============ NEW: Handle eSewa Payment Success (ADDED FOR ESEWA INTEGRATION) ============
/**
 * Handles eSewa payment success callback
 * Creates queue entry and confirms appointment
 * @route GET /api/appointment/payment/success
 */
exports.appointmentPaymentSuccess = async (req, res) => {
  try {
    const responseData = req.query;
    let decodedData = responseData;

    // Decode eSewa base64 data if present
    if (responseData.data) {
      const buff = Buffer.from(responseData.data, 'base64');
      decodedData = JSON.parse(buff.toString('utf-8'));
    }

    // Verify signature
    const isValidSignature = verifyEsewaPayment(decodedData);
    if (!isValidSignature) {
      console.error("Invalid signature detected in payment response");
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment-failure`);
    }

    // Find appointment by transaction ID
    const appointment = await Appointment.findOne({
      'paymentResult.transactionId': decodedData.transaction_uuid
    });

    if (!appointment) {
      console.error("Appointment not found for transaction:", decodedData.transaction_uuid);
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment-failure`);
    }

    // ============ UPDATE APPOINTMENT STATUS ============
    appointment.paymentStatus = 'completed';
    appointment.paymentResult.status = 'completed';
    appointment.status = 'confirmed';
    await appointment.save();
    // ============ END UPDATE APPOINTMENT STATUS ============

    // ============ CREATE QUEUE ENTRY ============
    const activeQueueCount = await Queue.countDocuments({
      doctor: appointment.doctor,
      status: { $in: ["Waiting", "In Progress"] },
    });

    await Queue.create({
      appointment: appointment._id,
      patient: appointment.patient,
      doctor: appointment.doctor,
      queuePosition: activeQueueCount + 1,
      status: "Waiting",
      appointmentTime: appointment.time,
    });
    // ============ END CREATE QUEUE ENTRY ============

    console.log(`Appointment ${appointment._id} confirmed and queue entry created`);
    
    // Redirect to frontend success page
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment-success?appointmentId=${appointment._id}`);

  } catch (error) {
    console.error('Payment success callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment-failure`);
  }
};
// ============ END PAYMENT SUCCESS HANDLER ============

// ============ NEW: Handle eSewa Payment Failure (ADDED FOR ESEWA INTEGRATION) ============
/**
 * Handles eSewa payment failure callback
 * @route GET /api/appointment/payment/failure
 */
exports.appointmentPaymentFailure = async (req, res) => {
  try {
    const responseData = req.query;
    let transaction_uuid = responseData.transaction_uuid;

    if (responseData.data) {
      const buff = Buffer.from(responseData.data, 'base64');
      const decoded = JSON.parse(buff.toString('utf-8'));
      transaction_uuid = decoded.transaction_uuid;
    }

    if (transaction_uuid) {
      await Appointment.findOneAndUpdate(
        { 'paymentResult.transactionId': transaction_uuid },
        { paymentStatus: 'failed' }
      );
    }

    console.log(`Payment failed for transaction: ${transaction_uuid}`);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment-failure`);
  } catch (error) {
    console.error('Payment failure callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment-failure`);
  }
};
// ============ END PAYMENT FAILURE HANDLER ============

// Original Book Appointment (DEPRECATED - Use prepareAppointment + Payment Flow Instead)
// ============ OLD DUPLICATE FUNCTION REMOVED - Using updated bookAppointment with eSewa payment above ============

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

    if (appointment.status === "cancelled") {
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