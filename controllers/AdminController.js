const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

exports.adminLogin = async (req, res) => {
  const { email, password } = req.body;

  if (!process.env.SECRET) {
    return res.status(500).json({ message: "JWT secret not defined in environment" });
  }

  if (email !== process.env.ADMIN_EMAIL) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const match = await bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH);
  if (!match) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

const token = jwt.sign(
  { id: "SYSTEM_ADMIN", role: "admin" },
  process.env.SECRET,
  { expiresIn: "1h" } 
);

res
  .cookie("auth_token", token, {
    httpOnly: true,       
    secure: process.env.NODE_ENV === "production", 
    sameSite: "Strict",  
    maxAge: 60 * 60 * 1000,
  })
  .status(200)
  .json({
    message: "Admin login successful",
    user: { email: process.env.ADMIN_EMAIL, role: "admin" },
  });
};

exports.adminLogout = (req, res) => {
  res
    .clearCookie("auth_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
    })
    .status(200)
    .json({ message: "Admin logged out successfully" });
};