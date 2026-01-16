const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");

const app = express();

// Connect DB
connectDB();

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));


// Middleware
app.use(express.json());

// Static
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/auth", require("./routes/userRoute"));
app.use("/api/admins", require("./routes/adminRoute"));
// ... other routes

module.exports = app;
