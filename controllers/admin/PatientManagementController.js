// userController.js
const User = require('../../models/User');

exports.getAllPatients = async (req, res) => {
  try {
    const users = await User.find().select('fullName email phone');
    res.json({ patients: users }); // Notice we're sending as 'patients' for frontend compatibility
  } catch (error) {
    console.error('Error fetching users as patients:', error);
    res.status(500).json({ message: 'Server error while fetching patients' });
  }
};
