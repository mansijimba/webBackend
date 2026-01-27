const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { sendOTPEmail } = require("../utils/emailService");
const {
  validatePasswordStrength,
  isPasswordExpired,
} = require("../utils/passwordValidator");
const { invalidateCsrfToken } = require("../middlewares/csrfmiddleware");

// Lockout policy
const MAX_FAILED_LOGIN = 5; // lock after 5 failed attempts
const LOCK_TIME_MS = 1 * 60 * 1000; // 30 minutes
const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

exports.registerUser = async (req, res) => {
  const { fullName, phone, email, password, securityQuestions } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Missing fields" });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "User exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const hashedQuestions = [];
    if (securityQuestions && Array.isArray(securityQuestions)) {
      for (const sq of securityQuestions) {
        if (!sq.question || !sq.answer) continue;
        const answerHash = await bcrypt.hash(sq.answer, 10);
        hashedQuestions.push({ question: sq.question, answerHash });
      }
    }

    const newUser = new User({
      fullName,
      phone,
      email,
      password: hashedPassword,
      securityQuestions: hashedQuestions,
    });

    await newUser.save();

    return res.status(201).json({ success: true, message: "User Registered" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ====================== LOGIN (Email + Password → OTP) ======================
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res
      .status(400)
      .json({ success: false, message: "Missing Field", errors: [] });

  try {
    const user = await User.findOne({ email });
    if (!user)
      return res
        .status(403)
        .json({ success: false, message: "User not found", errors: [] });

    // Check lock
    if (
      user.isLocked &&
      user.lockUntil &&
      new Date() < new Date(user.lockUntil)
    ) {
      return res.status(403).json({
        success: false,
        locked: true,
        message:
          "Account locked due to repeated failed login attempts. Answer the security question to unlock.",
        securityQuestions:
          user.securityQuestions?.map((sq) => ({
            question: sq.question,
            _id: sq._id.toString(), // Ensure _id is a string
          })) || [],
        lockUntil: user.lockUntil,
        email: user.email, // Include email for unlock process
      });
    }
    // Unlock if lock period expired
    if (
      user.isLocked &&
      user.lockUntil &&
      new Date() >= new Date(user.lockUntil)
    ) {
      user.isLocked = false;
      user.failedLoginAttempts = 0;
      user.lockUntil = null;
      await user.save();
    }

    // Password expiry check
    if (isPasswordExpired(user.passwordExpiry)) {
      return res.status(403).json({
        success: false,
        message: "Password has expired. Please reset your password.",
        passwordExpired: true,
      });
    }

    const passwordCheck = await bcrypt.compare(password, user.password);
    if (!passwordCheck) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;

      // Lock account if max attempts reached
   if (user.failedLoginAttempts >= MAX_FAILED_LOGIN) {
  user.isLocked = true;
  user.lockUntil = new Date(Date.now() + LOCK_TIME_MS);
  await user.save();
  return res.status(403).json({
    success: false,
    locked: true,
    message: "Account locked due to repeated failed login attempts. Answer the security question to unlock.",
    securityQuestions: user.securityQuestions?.map(sq => ({ 
      _id: sq._id.toString(), 
      question: sq.question 
    })) || [],
    lockUntil: user.lockUntil,
    email: user.email // Include email for unlock process
  });
}

      await user.save();
      return res
        .status(403)
        .json({ success: false, message: "Invalid credentials" });
    }

    // Reset failed attempts on successful password
    if (user.failedLoginAttempts && user.failedLoginAttempts > 0) {
      user.failedLoginAttempts = 0;
      user.isLocked = false;
      user.lockUntil = null;
      await user.save();
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.emailOtp = otp;
    user.emailOtpExpiry = new Date(Date.now() + OTP_EXPIRY_MS);
    await user.save();

    // Send OTP via email
    await sendOTPEmail(user.email, otp);

    return res.status(200).json({
      success: true,
      message: "OTP sent to your email. Valid for 5 minutes.",
      tempUserId: user._id, // use this for OTP verification
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.verifyEmailOtp = async (req, res) => {
  const { userId, otp } = req.body;

  if (!userId || !otp)
    return res.status(400).json({ message: "User ID and OTP are required" });

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.emailOtp || new Date() > new Date(user.emailOtpExpiry)) {
      return res.status(403).json({ message: "OTP expired" });
    }

    if (user.emailOtp !== otp) {
      return res.status(403).json({ message: "Invalid OTP" });
    }

    user.emailOtp = null;
    user.emailOtpExpiry = null;
    await user.save();

    const payload = {
      _id: user._id,
      email: user.email,
      fullName: user.fullName,
    };
    const token = jwt.sign(payload, process.env.SECRET, { expiresIn: "7d" });

    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      user: user.toCleanJSON(),
    });
  } catch (err) {
    console.error("Verify OTP error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ====================== GET PROFILE ======================
exports.getProfile = async (req, res) => {
  try {
    const userId = req.auth._id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    return res.status(200).json({ success: true, user: user.toCleanJSON() });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};

// ====================== UPDATE PROFILE ======================
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.auth._id;
    const { fullName, phone } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (fullName) user.fullName = fullName;
    if (phone) user.phone = phone;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated",
      user: user.toCleanJSON(),
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};

// ====================== LOGOUT ======================
exports.logoutUser = async (req, res) => {
  try {
    res.clearCookie("auth_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
    });
    invalidateCsrfToken(req, res);

    return res.status(200).json({ success: true, message: "Logged out" });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};

// ------------------ Request Unlock / Fetch Security Question ----------------
exports.requestUnlock = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });
    if (!user.isLocked)
      return res.status(400).json({ message: "Account is not locked" });

    if (!user.securityQuestions || user.securityQuestions.length === 0) {
      return res.status(400).json({ message: "No security questions set" });
    }

    // Return full array
    return res.json({
      securityQuestions: user.securityQuestions.map((sq) => ({
        question: sq.question,
        _id: sq._id,
      })),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ------------------ Verify Security Answer / Unlock ----------------
exports.verifyUnlock = async (req, res) => {
  const { email, answer } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });
    if (!user.isLocked)
      return res.status(400).json({ message: "Account is not locked" });

    let matched = false;
    for (const sq of user.securityQuestions) {
      if (await bcrypt.compare(answer, sq.answerHash)) {
        matched = true;
        break;
      }
    }

    if (!matched) return res.status(400).json({ message: "Incorrect answer" });

    user.isLocked = false;
    user.failedLoginAttempts = 0;
    user.lockUntil = null;
    await user.save();

    return res.json({ message: "Account unlocked successfully!" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};
