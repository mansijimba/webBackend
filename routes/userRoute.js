const express = require("express");
const router = express.Router();
const { authenticateUser } = require("../middlewares/authorizedUsers");
const {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  setupMfa,
  verifyMfaSetup,
  verifyMfaLogin,
  requestUnlock,
  unlockAccount,
  verifySecurityAnswers,
  getSecurityQuestions,
  logoutUser
} = require("../controllers/UserController");

// AUTH
router.post("/register", registerUser);
router.post("/login", loginUser);

// MFA
router.post('/mfa/setup', setupMfa);
router.post('/mfa/verify', verifyMfaSetup);
router.post('/mfa/verify-login', verifyMfaLogin);

// ACCOUNT UNLOCK
router.post('/request-unlock', requestUnlock);
router.get('/unlock-account', unlockAccount);
router.post('/unlock-account', unlockAccount);
router.post('/security/verify', verifySecurityAnswers);
router.post('/security/questions', getSecurityQuestions);

// PROFILE (protected routes)
router.get('/profile', authenticateUser, getProfile);
router.patch('/profile', authenticateUser, updateProfile);
router.post("/logout", logoutUser);
module.exports = router;
