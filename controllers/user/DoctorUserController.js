const Doctor = require('../../models/admin/Doctor');

exports.getPublicDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find(
      { status: 'Active' },
      'name specialty availability appointments filepath'
    );
    return res.status(200).json({ success: true, data: doctors });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.getDoctorById = async (req, res) => {
  const { id } = req.params;

  try {
    const doctor = await Doctor.findById(id);

    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    return res.status(200).json({ success: true, data: doctor });
  } catch (err) {
    console.error('Error fetching doctor by ID:', err);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

