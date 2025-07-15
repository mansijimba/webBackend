const request = require('supertest');
const app = require('../index');
const mongoose = require('mongoose');
const Doctor = require('../models/admin/Doctor');
const User = require('../models/User');
const Appointment = require('../models/admin/Appointment');

let doctorId;
let patientId;
let appointmentId;

beforeAll(async () => {
  await Doctor.deleteOne({});
  await User.deleteOne({});
  await Appointment.deleteOne({});

  const doctor = await Doctor.create({
    name: 'Test Doctor',
    specialty: 'General',
    email: 'testdoctor@example.com',
    phone: '1234567890',
  });

  const patient = await User.create({
    fullName: 'Test Patient',
    email: 'testpatient@example.com',
    phone: '9876543210',  // Make sure phone is present since User requires it
    password: 'password123',
  });

  doctorId = doctor._id;
  patientId = patient._id;
});

afterAll(async () => {
  await mongoose.disconnect();
});

describe('Appointment Booking API', () => {
  test('Should book an appointment successfully', async () => {
    const res = await request(app).post('/api/appointment').send({
      doctorId,
      patientId,
      specialty: 'General',
      date: '2025-07-20',
      time: '10:00 AM',
      type: 'Consultation',
    });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.appointment).toHaveProperty('_id');
    expect(res.body.appointment.status).toBe('pending');

    appointmentId = res.body.appointment._id;
  });

  test('Should fail when required fields are missing', async () => {
    const res = await request(app).post('/api/appointment').send({
      doctorId,
      // Missing patientId
      specialty: 'General',
      date: '2025-07-20',
      time: '10:00 AM',
      type: 'Consultation',
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Missing required fields');
  });

    test('Should fetch all booked appointments', async () => {
    const res = await request(app).get('/api/admin/appointments');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

    test('Should update appointment status and time', async () => {
    const res = await request(app).patch(`/api/admin/appointments/${appointmentId}/status`).send({
      status: 'confirmed',
      time: '11:30 AM',
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('confirmed');
    expect(res.body.data.time).toBe('11:30 AM');
  });

  test('Should fetch single appointment by ID', async () => {
    const res = await request(app).get(`/api/admin/appointments/${appointmentId}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data._id).toBe(appointmentId.toString());
  });
});
