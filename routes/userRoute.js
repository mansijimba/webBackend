const express = require("express");
const router = express.Router();
const { authenticateUser } = require("../middlewares/authorizedUsers");
const { verifyCsrfToken, generateCsrfToken } = require("../middlewares/csrfmiddleware");
const {
  registerUser,
  loginUser,
  verifyEmailOtp,
  getProfile,
  updateProfile,
  logoutUser,
  requestUnlock,      
  verifyUnlock
} = require("../controllers/UserController");

// CSRF Token
router.get("/csrf-token", generateCsrfToken);

// AUTH
router.post("/register", registerUser);
router.post("/login", loginUser); // sends OTP
router.post("/verify-otp", verifyEmailOtp); // verifies OTP and logs in

// PROFILE (protected)
router.get("/profile", authenticateUser, getProfile);
router.patch("/profile", authenticateUser, verifyCsrfToken, updateProfile);

// LOGOUT
router.post("/logout",logoutUser);

router.post("/request-unlock", requestUnlock);       // returns security question
router.post("/verify-unlock", verifyUnlock); 

module.exports = router;
