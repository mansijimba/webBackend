const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");
const cookieParser = require("cookie-parser");

const app = express();

// Connect DB
connectDB();

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));

app.use(cookieParser());
// Middleware
app.use(express.json());

// Static
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/auth", require("./routes/userRoute"));
app.use("/api/admins", require("./routes/adminRoute"));
app.use('/api/admin/appointments', require("./routes/admin/AppointmentRoute"));
app.use('/api/admin/queues', require('./routes/admin/QueueRoute'));
app.use('/api/admin/doctors', require('./routes/admin/DoctorRoute'));

app.use('/api/admin/patients', require('./routes/admin/PatientRoute'));
app.use('/api/doctor', require('./routes/DoctorUserRoute'));
app.use('/api/appointment', require('./routes/AppointmentUserRoute'));
app.use('/api/queue/status', require('./routes/QueueUserRoute'));
app.use('/api/admin/messages', require('./routes/admin/MessageRoute'));


module.exports = app;
