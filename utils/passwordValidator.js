const bcrypt = require('bcrypt');

/**
 * Validates password strength
 * Requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
const validatePasswordStrength = (password) => {
  const errors = [];

  if (!password) {
    errors.push('Password is required');
    return { valid: false, errors };
  }

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&*()_+-=[]{};\'"\\|,.<>/?)')
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Checks if new password matches any of the last 5 passwords
 */
const checkPasswordHistory = async (newPassword, passwordHistory) => {
  if (!passwordHistory || passwordHistory.length === 0) {
    return false;
  }

  for (const oldPasswordEntry of passwordHistory) {
    const isMatch = await bcrypt.compare(newPassword, oldPasswordEntry.hashedPassword);
    if (isMatch) {
      return true;
    }
  }

  return false;
};

/**
 * Checks if password has expired
 */
const isPasswordExpired = (passwordExpiry) => {
  if (!passwordExpiry) {
    return false;
  }

  return new Date() > new Date(passwordExpiry);
};

/**
 * Hashes password and updates password history
 */
const hashPasswordAndUpdateHistory = async (newPassword, currentHashedPassword, currentPasswordHistory = []) => {
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // Add current password to history (keep only last 5)
  let updatedHistory = [...currentPasswordHistory];
  if (currentHashedPassword) {
    updatedHistory.unshift({
      hashedPassword: currentHashedPassword,
      createdAt: new Date()
    });
  }

  // Keep only last 5 passwords
  if (updatedHistory.length > 5) {
    updatedHistory = updatedHistory.slice(0, 5);
  }

  // Calculate new expiry date (90 days from now)
  const newExpiry = new Date();
  newExpiry.setDate(newExpiry.getDate() + 90);

  return {
    hashedPassword,
    passwordHistory: updatedHistory,
    passwordExpiry: newExpiry,
    passwordChangedAt: new Date(),
    isPasswordExpired: false
  };
};

module.exports = {
  validatePasswordStrength,
  checkPasswordHistory,
  isPasswordExpired,
  hashPasswordAndUpdateHistory
};
