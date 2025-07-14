const express = require('express');
const router = express.Router();
const doctorUserController= require('../controllers/user/DoctorUserController');

router.get('/', doctorUserController.getPublicDoctors );
router.get('/:id',doctorUserController.getDoctorById);

module.exports = router;
