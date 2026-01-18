const jwt = require("jsonwebtoken");

exports.authenticateUser = (req, res, next) => {
  try {
    let token;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }

    if (!token && req.cookies?.auth_token) {
      token = req.cookies.auth_token;
    }

    if (!token) {
      return res.status(401).json({ message: "Authentication token required" });
    }

     if (req.cookies?.auth_token) {
      const csrfToken = req.headers["x-csrf-token"];
      if (!csrfToken) {
        return res.status(403).json({ message: "CSRF token missing" });
      }
    }

    const decoded = jwt.verify(token, process.env.SECRET);
    req.auth = decoded; 

    next();
  } catch (err) {
    console.error("JWT authentication error:", err.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
