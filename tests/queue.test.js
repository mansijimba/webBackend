const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../index");

const Doctor = require("../models/admin/Doctor");
const Patient = require("../models/User");
const Appointment = require("../models/admin/Appointment");
const Queue = require("../models/admin/Queue");

let queueEntry;

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/testdb");
  }

  const doctor = await Doctor.create({
    name: "Dr. Test",
    email: "drtest4@example.com",
    password: "password",
    specialty: "General",
    phone: "9800000000",
  });

  const patient = await Patient.create({
    fullName: "John Doe",
    email: "johndoe4@example.com",
    password: "password",
    phone: "9812345678",
  });

  const appointment = await Appointment.create({
    doctor: doctor._id,
    patient: patient._id,
    date: new Date(),
    time: "10:00 AM",
    type: "Check-up",
    specialty: "general",
    status: "pending",
  });

  queueEntry = await Queue.create({
    patient: patient._id,
    doctor: doctor._id,
    appointment: appointment._id,
    queuePosition: 1,
    status: "Waiting",
    appointmentTime: "10:00 AM",
    waitTime: "15 min",
  });
});


describe("Queue Management API", () => {
  test("GET /api/admin/queues should return list of queues", async () => {
    const res = await request(app).get("/api/admin/queues");

    console.log("GET /api/admin/queues response:", res.body);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);

    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0]).toHaveProperty("status");
    expect(res.body.data[0]).toHaveProperty("queuePosition");
  });

  test("PATCH /api/admin/queues/:id should update queue status", async () => {
    const res = await request(app)
      .patch(`/api/admin/queues/${queueEntry._id}`)
      .send({ status: "Completed" });

    console.log("PATCH response:", res.body);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Queue updated successfully");

    expect(res.body.data).toHaveProperty("status", "Completed");
  });

  // New test 2: DELETE queue by ID
  test("DELETE /api/admin/queues/:id should delete the queue entry", async () => {
    const res = await request(app).delete(`/api/admin/queues/${queueEntry._id}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Queue entry deleted successfully");

    // Verify it was deleted
    const check = await Queue.findById(queueEntry._id);
    expect(check).toBeNull();
  });

  // New test 3: PATCH with invalid ID returns 404
  test("PATCH /api/admin/queues/:id with invalid ID should return 404", async () => {
    const invalidId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .patch(`/api/admin/queues/${invalidId}`)
      .send({ status: "Completed" });

    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Queue entry not found");
  });

  // New test 4: DELETE with invalid ID returns 404
  test("DELETE /api/admin/queues/:id with invalid ID should return 404", async () => {
    const invalidId = new mongoose.Types.ObjectId();
    const res = await request(app).delete(`/api/admin/queues/${invalidId}`);

    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Queue entry not found");
  });

  
});
