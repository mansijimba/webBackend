const Patient = require('../../models/admin/Patient');

exports.getAllPatients = async (req, res) => {
  try {
    const patients = await Patient.find().sort({ name: 1 }); // sorted by name
    res.json({ patients });
  } catch (error) {
    console.error("Error fetching patients:", error);
    res.status(500).json({ message: "Server error while fetching patients" });
  }
};

exports.createPatient = async (req, res) => {
  try {
    const patients = new Patient(req.body);
    await patients.save();
    res.status(201).json({
      success: true,
      message: "Patient created successfully",
      data: patients,
    });
  } catch (err) {
    console.error("Error creating patient:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};