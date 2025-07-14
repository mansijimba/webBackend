const express = require('express');
const router = express.Router();
const doctorUserController= require('../controllers/DoctorUserController');

router.get('/', doctorUserController.getPublicDoctors );

module.exports = router;
