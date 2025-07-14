const Doctor = require('../models/admin/Doctor');

exports.getPublicDoctors = async (req, res) => {
    console.log("Public doctor route hit")
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
