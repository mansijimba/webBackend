// const crypto = require("crypto");
// const csrfTokens = new Map();

// exports.generateCsrfToken = (req, res) => {
//   const token = crypto.randomBytes(24).toString("hex");
//   res.cookie("csrf_token", token, {
//     httpOnly: true,
//     secure: false, 
//     sameSite: "Lax",
//     maxAge: 1 * 60 * 60 * 1000, 
//   });

//   csrfTokens.set(token, true); 
//   return res.json({ csrfToken: token });
// };

// exports.verifyCsrfToken = (req, res, next) => {
//   const token = req.headers["x-csrf-token"] || req.cookies.csrf_token;
//   if (!token || !csrfTokens.has(token)) {
//     return res.status(403).json({ message: "Invalid CSRF token" });
//   }
//   next();
// };

// exports.invalidateCsrfToken = (req, res) => {
//   const token = req.cookies.csrf_token;
//   if (token && csrfTokens.has(token)) {
//     csrfTokens.delete(token);
//     res.clearCookie("csrf_token");
//   }
// };
