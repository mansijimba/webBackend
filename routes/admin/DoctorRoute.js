const express = require('express');
const router = express.Router();
const doctorController = require('../../controllers/admin/DoctorManagementController');
const upload = require('../../middlewares/fileupload');
const { authenticateUser } = require('../../middlewares/authorizedUsers');
const adminOnly = require('../../middlewares/rolemiddleware')('admin');


router.use(authenticateUser, adminOnly);

router.post(
  '/',
  upload.single('image'),
  doctorController.createDoctor
);

router.get('/', doctorController.getAllDoctors);

router.get('/:id', doctorController.getDoctorById);

router.delete('/:id', doctorController.deleteDoctor);

router.patch(
  '/:id/status',
  doctorController.updateStatusAvailability
);

module.exports = router;
