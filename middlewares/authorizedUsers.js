const jwt = require("jsonwebtoken");
const Admin = require("../models/AdminAuth");

exports.authenticateAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization; // "Bearer <token>"
    if (!authHeader) {
      return res.status(401).json({ success: false, message: "Token required" });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ success: false, message: "Token missing" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.SECRET);
    } catch (err) {
      return res.status(401).json({ success: false, message: "Invalid token" });
    }

    const adminId = decoded.id;
    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(401).json({ success: false, message: "Admin not found" });
    }

    // Optional: check role if you store roles in Admin schema
    // if (decoded.role !== "admin") {
    //   return res.status(403).json({ success: false, message: "Access denied" });
    // }

    req.admin = admin; // Attach admin info to req object
    next();
  } catch (err) {
    console.error("Admin authentication error:", err);
    res.status(500).json({ success: false, message: "Authentication error" });
  }
};

exports.authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization; // "Bearer <token>"
    if (!authHeader) {
      return res.status(401).json({ success: false, message: "Token required" });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ success: false, message: "Token missing" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.SECRET);
    } catch (err) {
      return res.status(401).json({ success: false, message: "Invalid or expired token" });
    }

    req.user = decoded; // Attach user info to req object (contains _id, email, fullName)
    next();
  } catch (err) {
    console.error("User authentication error:", err);
    res.status(500).json({ success: false, message: "Authentication error" });
  }
};
