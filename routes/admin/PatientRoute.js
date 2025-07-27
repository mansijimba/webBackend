const express = require('express');
const router = express.Router();
const patientController = require('../../controllers/admin/PatientManagementController');

// GET /api/admin/patients
router.get('/', patientController.getAllPatients);

module.exports = router;
