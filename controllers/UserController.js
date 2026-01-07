const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const speakeasy = require('speakeasy');
const crypto = require('crypto');
const { sendUnlockEmail } = require('../utils/emailService');
const {
  validatePasswordStrength,
  checkPasswordHistory,
  isPasswordExpired,
  hashPasswordAndUpdateHistory
} = require("../utils/passwordValidator");

// Lockout policy
const MAX_FAILED_LOGIN = 5; // lock after 5 failed attempts
const LOCK_TIME_MS = 30 * 60 * 1000; // 30 minutes

// ====================== USER REGISTRATION ======================
exports.registerUser = async (req, res) => {
  const { fullName, phone, email, password, securityQuestions } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Missing fields", errors: [] });
  }

  const passwordValidation = validatePasswordStrength(password);
  if (!passwordValidation.valid) {
    return res.status(400).json({ success: false, message: "Password does not meet security requirements", errors: passwordValidation.errors });
  }

  try {
    const existingUser = await User.findOne({ $or: [{ fullName }, { email }] });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "User exists", errors: [] });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const passwordExpiry = new Date();
    passwordExpiry.setDate(passwordExpiry.getDate() + 90); // 90 days

    const newUser = new User({
      fullName,
      phone,
      email,
      password: hashedPassword,
      passwordHistory: [],
      passwordExpiry,
      passwordChangedAt: new Date(),
      isPasswordExpired: false
    });

    // Hash and store security question answers (if provided)
    if (securityQuestions && Array.isArray(securityQuestions) && securityQuestions.length > 0) {
      const hashed = [];
      for (const sq of securityQuestions) {
        if (!sq.question || !sq.answer) continue;
        const answerHash = await bcrypt.hash(sq.answer, 10);
        hashed.push({ question: sq.question, answerHash });
      }
      newUser.securityQuestions = hashed;
    }

    await newUser.save();

    return res.status(201).json({ success: true, message: "User Registered", errors: [] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error", errors: [err.message] });
  }
};

// ====================== LOGIN ======================
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) return res.status(400).json({ success: false, message: "Missing Field", errors: [] });

  try {
    const getUser = await User.findOne({ email });
    if (!getUser) return res.status(403).json({ success: false, message: "User not found", errors: [] });

    // Check lock
    if (getUser.isLocked && getUser.lockUntil && new Date() < new Date(getUser.lockUntil)) {
      return res.status(403).json({ success: false, message: "Account locked due to repeated failed login attempts. Try later.", errors: ["Account locked"], lockUntil: getUser.lockUntil });
    }

    if (getUser.isLocked && getUser.lockUntil && new Date() >= new Date(getUser.lockUntil)) {
      getUser.isLocked = false;
      getUser.failedLoginAttempts = 0;
      getUser.lockUntil = null;
      await getUser.save();
    }

    // Check password expiry
    if (isPasswordExpired(getUser.passwordExpiry)) {
      return res.status(403).json({ success: false, message: "Password has expired. Please reset your password.", errors: ["Password expired"], passwordExpired: true });
    }

    const passwordCheck = await bcrypt.compare(password, getUser.password);
    if (!passwordCheck) {
      getUser.failedLoginAttempts = (getUser.failedLoginAttempts || 0) + 1;

      // After 3 failed attempts, require security questions (but do not lock yet)
      if (getUser.failedLoginAttempts >= 3 && getUser.failedLoginAttempts < MAX_FAILED_LOGIN) {
        const tempToken = jwt.sign({ _id: getUser._id, securityChallenge: true }, process.env.SECRET, { expiresIn: '10m' });
        await getUser.save();
        const questions = (getUser.securityQuestions || []).map(sq => ({ question: sq.question }));
        return res.status(200).json({ success: true, message: 'Security questions required', securityRequired: true, questions, tempToken });
      }

      // If reached max failed attempts, lock account and generate unlock token
      if (getUser.failedLoginAttempts >= MAX_FAILED_LOGIN) {
        getUser.isLocked = true;
        getUser.lockUntil = new Date(Date.now() + LOCK_TIME_MS);
        const unlockToken = crypto.randomBytes(32).toString('hex');
        const unlockTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
        getUser.unlockToken = unlockToken;
        getUser.unlockTokenExpiry = unlockTokenExpiry;
        await getUser.save();
        return res.status(403).json({ success: false, message: 'Account locked. Request unlock link.', errors: [] });
      }

      await getUser.save();
      return res.status(403).json({ success: false, message: 'Invalid credentials', errors: ['Invalid credentials'] });
    }

    if (getUser.failedLoginAttempts && getUser.failedLoginAttempts > 0) {
      getUser.failedLoginAttempts = 0;
      getUser.isLocked = false;
      getUser.lockUntil = null;
      await getUser.save();
    }

    // MFA
    if (getUser.mfaEnabled) {
      const tempToken = jwt.sign({ _id: getUser._id, mfa: true }, process.env.SECRET, { expiresIn: '5m' });
      return res.status(200).json({ success: true, message: 'MFA required', mfaRequired: true, tempToken, errors: [] });
    }

    const payload = { _id: getUser._id, email: getUser.email, fullName: getUser.fullName };
    const token = jwt.sign(payload, process.env.SECRET, { expiresIn: "7d" });

    return res.status(200).json({ success: true, message: "Login Successful", user: getUser.toCleanJSON(), token, errors: [] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error", errors: [err.message] });
  }
};

// ====================== GET SECURITY QUESTIONS (separate endpoint) ======================
exports.getSecurityQuestions = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required', errors: ['Email missing'] });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: 'User not found', errors: [] });

    // Only return questions after user has reached the security challenge threshold
    if ((user.failedLoginAttempts || 0) < 3) {
      return res.status(400).json({ success: false, message: 'Security questions not available yet', errors: [] });
    }

    if (user.isLocked) {
      return res.status(403).json({ success: false, message: 'Account is locked', errors: [] });
    }

    const questions = (user.securityQuestions || []).map(sq => ({ question: sq.question }));
    const tempToken = jwt.sign({ _id: user._id, securityChallenge: true }, process.env.SECRET, { expiresIn: '10m' });

    return res.status(200).json({ success: true, questions, tempToken });
  } catch (err) {
    console.error('Get Security Questions Error:', err);
    return res.status(500).json({ success: false, message: 'Server error', errors: [err.message] });
  }
};

// ====================== REQUEST ACCOUNT UNLOCK ======================
exports.requestUnlock = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Email is required", errors: ["Email missing"] });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: "User not found", errors: [] });
    if (!user.isLocked) return res.status(400).json({ success: false, message: "Account is not locked", errors: [] });

    const unlockToken = crypto.randomBytes(32).toString('hex');
    const unlockTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    user.unlockToken = unlockToken;
    user.unlockTokenExpiry = unlockTokenExpiry;
    await user.save();

    // send email (preview URL returned from sendUnlockEmail is ignored in production)
    try {
      await sendUnlockEmail(email, unlockToken);
    } catch (e) {
      console.error('Failed to send unlock email:', e);
    }

    const frontendUnlockLink = `http://localhost:5050/reset-password?token=${unlockToken}`;
    return res.status(200).json({ success: true, unlockLink: frontendUnlockLink });
  } catch (err) {
    console.error("Request Unlock Error:", err);
    return res.status(500).json({ message: "Server error", errors: [err.message] });
  }
};

// ====================== UNLOCK ACCOUNT ======================
// Now supports GET request from frontend link like:
// http://localhost:5050/reset-password?token=XYZ
exports.unlockAccount = async (req, res) => {
  try {
    const token = req.query.token || req.body.token;
    if (!token) return res.status(400).json({ success: false, message: "Unlock token is required", errors: ["Token missing"] });

    const user = await User.findOne({ unlockToken: token });
    if (!user) return res.status(404).json({ success: false, message: "Invalid or expired unlock token", errors: [] });

    if (new Date() > new Date(user.unlockTokenExpiry)) {
      user.unlockToken = null;
      user.unlockTokenExpiry = null;
      await user.save();
      return res.status(400).json({ success: false, message: "Unlock token has expired. Request a new one.", errors: ["Token expired"] });
    }

    // Unlock account
    user.isLocked = false;
    user.failedLoginAttempts = 0;
    user.lockUntil = null;
    user.unlockToken = null;
    user.unlockTokenExpiry = null;
    await user.save();

    return res.status(200).json({ success: true, message: "Account unlocked successfully. You can now log in.", errors: [] });
  } catch (err) {
    console.error("Unlock Account Error:", err);
    return res.status(500).json({ message: "Server error", errors: [err.message] });
  }
};

// ====================== PROFILE ======================
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user._id; // From JWT middleware
    if (!userId) return res.status(400).json({ success: false, message: 'User ID required', errors: ['User ID missing'] });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found', errors: [] });

    return res.status(200).json({ success: true, user: user.toCleanJSON(), errors: [] });
  } catch (err) {
    console.error('Get Profile Error:', err);
    return res.status(500).json({ success: false, message: 'Server error', errors: [err.message] });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user._id; // From JWT middleware
    const { fullName, phone } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found', errors: [] });

    if (fullName) user.fullName = fullName;
    if (phone) user.phone = phone;

    await user.save();

    return res.status(200).json({ success: true, message: 'Profile updated', user: user.toCleanJSON(), errors: [] });
  } catch (err) {
    console.error('Update Profile Error:', err);
    return res.status(500).json({ success: false, message: 'Server error', errors: [err.message] });
  }
};

// ====================== MFA ======================
exports.setupMfa = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required', errors: ['Email missing'] });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: 'User not found', errors: [] });

    const secret = speakeasy.generateSecret({ length: 20 });
    user.mfaTempSecret = secret.base32;
    await user.save();

    return res.status(200).json({ success: true, message: 'MFA temp secret generated', secret: secret.base32, otpauth_url: secret.otpauth_url, errors: [] });
  } catch (err) {
    console.error('Setup MFA Error:', err);
    return res.status(500).json({ success: false, message: 'Server error', errors: [err.message] });
  }
};

exports.verifyMfaSetup = async (req, res) => {
  try {
    const { email, token } = req.body;
    if (!email || !token) return res.status(400).json({ success: false, message: 'Email and token are required', errors: ['Missing fields'] });

    const user = await User.findOne({ email });
    if (!user || !user.mfaTempSecret) return res.status(404).json({ success: false, message: 'MFA setup not initiated', errors: [] });

    const verified = speakeasy.totp.verify({ secret: user.mfaTempSecret, encoding: 'base32', token });
    if (!verified) return res.status(400).json({ success: false, message: 'Invalid token', errors: [] });

    user.mfaSecret = user.mfaTempSecret;
    user.mfaTempSecret = null;
    user.mfaEnabled = true;
    await user.save();

    return res.status(200).json({ success: true, message: 'MFA enabled', errors: [] });
  } catch (err) {
    console.error('Verify MFA Setup Error:', err);
    return res.status(500).json({ success: false, message: 'Server error', errors: [err.message] });
  }
};

exports.verifyMfaLogin = async (req, res) => {
  try {
    const { email, token } = req.body;
    if (!email || !token) return res.status(400).json({ success: false, message: 'Email and token are required', errors: ['Missing fields'] });

    const user = await User.findOne({ email });
    if (!user || !user.mfaEnabled || !user.mfaSecret) return res.status(404).json({ success: false, message: 'MFA not enabled for this user', errors: [] });

    const verified = speakeasy.totp.verify({ secret: user.mfaSecret, encoding: 'base32', token });
    if (!verified) return res.status(400).json({ success: false, message: 'Invalid token', errors: [] });

    const payload = { _id: user._id, email: user.email, fullName: user.fullName };
    const finalToken = jwt.sign(payload, process.env.SECRET, { expiresIn: '7d' });

    return res.status(200).json({ success: true, message: 'MFA verification successful', user: user.toCleanJSON(), token: finalToken, errors: [] });
  } catch (err) {
    console.error('Verify MFA Login Error:', err);
    return res.status(500).json({ success: false, message: 'Server error', errors: [err.message] });
  }
};

// ====================== SECURITY QUESTION VERIFICATION (LOGIN) ======================
exports.verifySecurityAnswers = async (req, res) => {
  try {
    const { email, answers, tempToken } = req.body;
    if (!email || !answers || !Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ success: false, message: 'Email and answers are required', errors: ['Missing fields'] });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: 'User not found', errors: [] });

    // Verify tempToken if provided
    if (!tempToken) return res.status(400).json({ success: false, message: 'Temporary token required', errors: ['tempToken missing'] });
    try {
      const payload = jwt.verify(tempToken, process.env.SECRET);
      if (!payload || payload._id.toString() !== user._id.toString() || !payload.securityChallenge) {
        return res.status(403).json({ success: false, message: 'Invalid temporary token', errors: [] });
      }
    } catch (err) {
      return res.status(403).json({ success: false, message: 'Invalid or expired temporary token', errors: [] });
    }

    if (!user.securityQuestions || user.securityQuestions.length === 0) {
      return res.status(400).json({ success: false, message: 'No security questions configured for this account', errors: [] });
    }

    // Verify answers
    let allMatch = true;
    for (const provided of answers) {
      const stored = user.securityQuestions.find(sq => sq.question === provided.question);
      if (!stored) {
        allMatch = false;
        break;
      }
      const ok = await bcrypt.compare(provided.answer, stored.answerHash);
      if (!ok) {
        allMatch = false;
        break;
      }
    }

    if (!allMatch) {
      // increment failed attempts and possibly lock
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      if (user.failedLoginAttempts >= MAX_FAILED_LOGIN) {
        user.isLocked = true;
        user.lockUntil = new Date(Date.now() + LOCK_TIME_MS);
        const unlockToken = crypto.randomBytes(32).toString('hex');
        user.unlockToken = unlockToken;
        user.unlockTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);
      }
      await user.save();

      return res.status(403).json({ success: false, message: 'Security answers incorrect', errors: [] });
    }

    // Answers correct: reset counters and log the user in
    user.failedLoginAttempts = 0;
    user.isLocked = false;
    user.lockUntil = null;
    user.unlockToken = null;
    user.unlockTokenExpiry = null;
    await user.save();

    const payload = { _id: user._id, email: user.email, fullName: user.fullName };
    const token = jwt.sign(payload, process.env.SECRET, { expiresIn: '7d' });

    return res.status(200).json({ success: true, message: 'Login successful', user: user.toCleanJSON(), token });
  } catch (err) {
    console.error('Verify Security Answers Error:', err);
    return res.status(500).json({ success: false, message: 'Server error', errors: [err.message] });
  }
};
