const express = require ("express")
const cors = require("cors")
const connectDB = require ("./config/db")

const path = require("path")
const app = express();

let corsOptions = {
    origin: "*" // or list of domain to whitelist
}
app.use(cors(corsOptions))

app.use(express.json());
app.use(cors());

app.use("/uploads", express.static(path.join(__dirname,"uploads")))

const PORT = process.env.PORT
const userRoute = require('./routes/userRoute')
const appointmnetRoute = require ('./routes/admin/AppointmentRoute')
const queueRoute = require ('./routes/admin/QueueRoute')
const doctorRoute = require ('./routes/admin/DoctorRoute')
const adminRoute = require ('./routes/adminRoute')
const patientRoute = require ('./routes/admin/PatientRoute')
const doctorUserRoute = require ('./routes/DoctorUserRoute')
const userappointment = require ('./routes/AppointmentUserRoute')

app.use('/api/auth', userRoute)
app.use('/api/admin/appointments', appointmnetRoute)
app.use('/api/admin/queues', queueRoute)
app.use('/api/admin/doctors', doctorRoute)
app.use('/api/admins', adminRoute)
app.use('/api/admin/patients', patientRoute)
app.use('/api/doctor', doctorUserRoute)
app.use('/api/appointment', userappointment)

module.exports = app
