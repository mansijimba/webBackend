const express = require('express');
const router = express.Router();
const patientController = require('../../controllers/admin/PatientManagementController');
const { authenticateUser } = require('../../middlewares/authorizedUsers');
const adminOnly = require('../../middlewares/rolemiddleware')('admin');

router.use(authenticateUser, adminOnly);

router.get('/', patientController.getAllPatients);

module.exports = router;
