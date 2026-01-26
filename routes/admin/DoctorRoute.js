const express = require('express');
const router = express.Router();
const doctorController = require('../../controllers/admin/DoctorManagementController');
const upload = require('../../middlewares/fileupload');
const { authenticateUser } = require('../../middlewares/authorizedUsers');
const adminOnly = require('../../middlewares/rolemiddleware')('admin');

// 🔐 Apply admin authentication to ALL routes below
router.use(authenticateUser, adminOnly);

// ✅ Create doctor (with image upload)
router.post(
  '/',
  upload.single('image'),
  doctorController.createDoctor
);

// ✅ Get all doctors
router.get('/', doctorController.getAllDoctors);

// ✅ Get single doctor by ID
router.get('/:id', doctorController.getDoctorById);

// ✅ Delete doctor
router.delete('/:id', doctorController.deleteDoctor);

// ✅ Update only status & availability
router.patch(
  '/:id/status',
  doctorController.updateStatusAvailability
);

module.exports = router;
