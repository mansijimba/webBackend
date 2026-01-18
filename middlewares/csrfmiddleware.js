const crypto = require("crypto");

// Simple in-memory CSRF store (you can also use a DB or Redis for production)
const csrfTokens = new Map();

exports.generateCsrfToken = (req, res) => {
  const token = crypto.randomBytes(24).toString("hex");
  // Save token associated with a user/session (for demo, use cookie)
  res.cookie("csrf_token", token, {
    httpOnly: true,
    secure: false, // true in production with HTTPS
    sameSite: "Lax",
    maxAge: 1 * 60 * 60 * 1000, // 1 hour
  });

  csrfTokens.set(token, true); // store valid token
  return res.json({ csrfToken: token });
};

exports.verifyCsrfToken = (req, res, next) => {
  const token = req.headers["x-csrf-token"] || req.cookies.csrf_token;
  if (!token || !csrfTokens.has(token)) {
    return res.status(403).json({ message: "Invalid CSRF token" });
  }
  next();
};

// Remove CSRF token (after logout)
exports.invalidateCsrfToken = (req, res) => {
  const token = req.cookies.csrf_token;
  if (token && csrfTokens.has(token)) {
    csrfTokens.delete(token);
    res.clearCookie("csrf_token");
  }
};
