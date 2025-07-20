const Patient = require('../../models/admin/Patient');
const User = require('../../models/User');

exports.createPatient = async (req, res) => {
  try {
    const { userId, upcomingAppointment, doctor } = req.body;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Create patient with user ref
    const patient = new Patient({
      user: userId,
      upcomingAppointment,
      doctor,
    });

    await patient.save();

    res.status(201).json({
      success: true,
      message: 'Patient created successfully',
      data: patient,
    });
  } catch (error) {
    console.error('Error creating patient:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
exports.getAllPatients = async (req, res) => {
  try {
    const patients = await Patient.find()
      .populate('user', 'fullName email phone') // populate selected User fields
      .sort({ 'user.fullName': 1 }); // sort by user fullName

    res.json({ patients });
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({ message: 'Server error while fetching patients' });
  }
};
