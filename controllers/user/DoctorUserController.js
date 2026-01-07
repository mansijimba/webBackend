const Doctor = require('../../models/admin/Doctor');

// Helper to normalize image path
const normalizePath = (filepath) => {
  if (!filepath) return null;
  return filepath.replace(/\\/g, '/');
};

exports.getPublicDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find(
      { status: 'Active' },
      'name specialty availability appointments filepath'
    );

    const normalizedDoctors = doctors.map((doc) => ({
      ...doc.toObject(),
      filepath: normalizePath(doc.filepath),
    }));

    return res.status(200).json({
      success: true,
      data: normalizedDoctors,
    });
  } catch (err) {
    console.error('Error fetching public doctors:', err);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
    });
  }
};

exports.getDoctorById = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found',
      });
    }

    const normalizedDoctor = {
      ...doctor.toObject(),
      filepath: normalizePath(doctor.filepath),
    };

    return res.status(200).json({
      success: true,
      data: normalizedDoctor,
    });
  } catch (err) {
    console.error('Error fetching doctor by ID:', err);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
    });
  }
};
