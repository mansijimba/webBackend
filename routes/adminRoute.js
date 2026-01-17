const express = require("express");
const { adminLogin , adminLogout} = require("../controllers/AdminController");
const { authenticateUser } = require("../middlewares/authorizedUsers");
const adminOnly = require("../middlewares/rolemiddleware")("admin"); // <-- call it here

const router = express.Router();

// Public route
router.post("/login", adminLogin);
router.post("/logout", adminLogout);

// Protected route
router.get("/dashboard", authenticateUser, adminOnly, (req, res) => {
  res.json({
    message: "Welcome to Admin Dashboard",
    adminId: req.auth.id
  });
});

module.exports = router;
