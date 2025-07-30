const request = require('supertest')
const app = require('../index') // Adjust if needed
const mongoose = require('mongoose')
const Appointment = require('../models/admin/Appointment')
const Doctor = require('../models/admin/Doctor')
const User = require('../models/User')

let appointmentId
let doctorId
let patientId

afterAll(async () => {
  await mongoose.disconnect()
})

describe('Appointment API tests', () => {

beforeAll(async () => {
  // Remove previous test data if it exists
  await Appointment.deleteOne({});
  await Doctor.deleteOne({ email: 'who@example.com' });
  await User.deleteOne({ email: 'john@example.com' });

  // Create dummy doctor
  const doctor = await Doctor.create({
    name: 'Dr. Who',
    specialty: 'Time Travel',
    email: 'who@example.com',
    phone: '9999999999'
  });
  doctorId = doctor._id;

  // Create dummy patient
  const patient = await User.create({
    fullName: 'John Doe',
    phone: '8888888888',
    email: 'john@example.com',
    password: 'password123'
  });
  patientId = patient._id;
});


  test('Create an appointment successfully', async () => {
    const res = await request(app)
      .post('/api/admin/appointments')
      .send({
        doctor: doctorId,
        patient: patientId,
        specialty: 'Time Travel',
        date: '2025-07-20',
        time: '10:30 AM',
        type: 'Consultation'
      })

    expect(res.statusCode).toBe(201)
    expect(res.body.success).toBe(true)
    expect(res.body.data).toHaveProperty('_id')

    appointmentId = res.body.data._id
  })

  test('Get all appointments', async () => {
    const res = await request(app).get('/api/admin/appointments')

    expect(res.statusCode).toBe(200)
    expect(res.body.success).toBe(true)
    expect(Array.isArray(res.body.data)).toBe(true)
    expect(res.body.data.length).toBeGreaterThan(0)
  })

  test('Update appointment status & time', async () => {
    const res = await request(app)
      .patch(`/api/admin/appointments/${appointmentId}/status`)
      .send({
        status: 'confirmed',
        time: '11:00 AM'
      })

    expect(res.statusCode).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.status).toBe('confirmed')
    expect(res.body.data.time).toBe('11:00 AM')
  });

  test('Should return 404 when updating non-existing appointment', async () => {
    const res = await request(app)
      .patch('/api/admin/appointments/6123456789abcdef01234567/status')
      .send({ status: 'completed', time: '1:00 PM' })

    expect(res.statusCode).toBe(404)
    expect(res.body.message).toBe('Appointment not found')
  });

const mongoose = require("mongoose");

  test('Fetch appointment with non-existing valid ID', async () => {
    const res = await request(app)
      .get('/api/admin/appointments/6123456789abcdef01234567');

    expect(res.statusCode).toBe(404);
  });

  

})
