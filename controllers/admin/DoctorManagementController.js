const Doctor = require('../../models/admin/Doctor');

// Create a doctor
exports.createDoctor = async (req, res) => {
  try {
    const filepath = req.file?.path;
    const doctor = new Doctor({ ...req.body, image: filepath });
    await doctor.save();
    return res.status(201).json({
      success: true,
      message: 'Doctor created',
      data: doctor,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Get all doctors
exports.getAllDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find();
    return res.json({
      success: true,
      data: doctors,
      message: 'All doctors',
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Get single doctor by ID
exports.getDoctorById = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor)
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    return res.json({ success: true, data: doctor, message: 'Doctor found' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Update a doctor
exports.updateStatusAvailability = async (req, res) => {
  try {
    const { status, availability } = req.body;

    const updatedDoctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      { status, availability },
      { new: true }
    );

    if (!updatedDoctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Doctor status updated",
      data: updatedDoctor,
    });
  } catch (error) {
    console.error("Status update error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};


// Delete a doctor
exports.deleteDoctor = async (req, res) => {
  try {
    const result = await Doctor.findByIdAndDelete(req.params.id);
    if (!result)
      return res.status(404).json({ success: false, message: 'Doctor not found' });

    return res.json({ success: true, message: 'Doctor deleted' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};
