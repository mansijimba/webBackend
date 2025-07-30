const request = require("supertest");
const app = require("../index");
const mongoose = require("mongoose");
const Doctor = require("../models/admin/Doctor");

let doctorId;

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/testdb");
  }
  // Clear doctors collection before tests to avoid duplicate key errors
  await Doctor.deleteMany({});
});

afterAll(async () => {
  await mongoose.disconnect();
});

describe("Doctor API tests", () => {
  
  test("Create a doctor successfully", async () => {
    const res = await request(app)
      .post("/api/admin/doctors")
      .send({
        name: "Dr. Strange",
        specialty: "Magic",
        email: "strange1@example.com",
        phone: "1234567890",
        status: "Active",
        availability: "mon-fri",
        appointments: 0,
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("_id");
    expect(res.body.data.name).toBe("Dr. Strange");

    doctorId = res.body.data._id;
  });

  test("Get all doctors", async () => {
    const res = await request(app).get("/api/admin/doctors");

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  test("Get doctor by ID", async () => {
    const res = await request(app).get(`/api/admin/doctors/${doctorId}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data._id).toBe(doctorId);
  });

  test("Update doctor's status and availability", async () => {
    const res = await request(app)
      .patch(`/api/admin/doctors/${doctorId}/status`)
      .send({
        status: "On Leave",
        availability: "Not available this week"
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe("On Leave");
    expect(res.body.data.availability).toBe("Not available this week");
  });

  test("Should not create a doctor with missing required fields", async () => {
    const res = await request(app)
      .post("/api/admin/doctors")
      .send({
        specialty: "Cardiology",
        phone: "1234567890"
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/required/i);
  });

  test("Should return 404 for non-existing doctor ID", async () => {
    const fakeId = "6123456789abcdef01234567"; // valid ObjectId but no doctor
    const res = await request(app).get(`/api/admin/doctors/${fakeId}`);

    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Doctor not found");
  });

  test("Delete doctor", async () => {
    const res = await request(app).delete(`/api/admin/doctors/${doctorId}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Doctor deleted");
  });

  test("Delete non-existing doctor should return 404", async () => {
    const res = await request(app).delete(`/api/admin/doctors/${doctorId}`);

    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Doctor not found");
  });


test("Should return 500 for invalid doctor ID format", async () => {
  const res = await request(app).get(`/api/admin/doctors/invalid-id`);

  expect(res.statusCode).toBe(500);
  expect(res.body.success).toBe(false);
  expect(res.body.message).toBe("Server Error");
});

test("Should return 404 when updating a non-existing doctor", async () => {
  const fakeId = "6123456789abcdef01234567";
  const res = await request(app)
    .patch(`/api/admin/doctors/${fakeId}/status`)
    .send({ status: "Retired", availability: "None" });

  expect(res.statusCode).toBe(404);
  expect(res.body.message).toBe("Doctor not found");
});
test("Should ignore unknown fields in doctor creation", async () => {
  const res = await request(app)
    .post("/api/admin/doctors")
    .send({
      name: "Dr. Extra",
      specialty: "Dermatology",
      email: "extra@example.com",
      phone: "2222222222",
      status: "Active",
      availability: "mon-fri",
      unknownField: "ThisShouldBeIgnored"
    });

  expect(res.statusCode).toBe(201);
  expect(res.body.success).toBe(true);
  expect(res.body.data).not.toHaveProperty("unknownField");

  // Clean up
  await request(app).delete(`/api/admin/doctors/${res.body.data._id}`);
});
test("Should not create doctor with empty string for required fields", async () => {
  const res = await request(app)
    .post("/api/admin/doctors")
    .send({
      name: "",
      specialty: "",
      email: "",
      phone: "",
    });

  expect(res.statusCode).toBe(400);
  expect(res.body.success).toBe(false);
});
test("Should allow partial update of doctor status only", async () => {
  const doctorRes = await request(app)
    .post("/api/admin/doctors")
    .send({
      name: "Dr. Partial",
      specialty: "ENT",
      email: "partial@example.com",
      phone: "3333333333",
      status: "Active",
      availability: "Weekdays",
    });

  const doctorId = doctorRes.body.data._id;

  const updateRes = await request(app)
    .patch(`/api/admin/doctors/${doctorId}/status`)
    .send({ status: "On Leave" });

  expect(updateRes.statusCode).toBe(200);
  expect(updateRes.body.success).toBe(true);
  expect(updateRes.body.data.status).toBe("On Leave");

  // Clean up
  await request(app).delete(`/api/admin/doctors/${doctorId}`);
});

test("Should not allow creating a doctor with duplicate email", async () => {
  const doctorData = {
    name: "Dr. Duplicate",
    specialty: "Psychiatry",
    email: "duplicate@example.com",
    phone: "7777777777",
    status: "Active",
    availability: "Weekdays",
  };

  // First creation should succeed
  const firstRes = await request(app).post("/api/admin/doctors").send(doctorData);
  expect(firstRes.statusCode).toBe(201);

  // Second creation with same email should fail
  const secondRes = await request(app).post("/api/admin/doctors").send(doctorData);
  expect([400, 500]).toContain(secondRes.statusCode); // Depending on controller

  // Clean up
  await request(app).delete(`/api/admin/doctors/${firstRes.body.data._id}`);
});

test("Get all doctors should return empty array if none exist", async () => {
  await Doctor.deleteMany({}); // Clear all records

  const res = await request(app).get("/api/admin/doctors");

  expect(res.statusCode).toBe(200);
  expect(res.body.success).toBe(true);
  expect(Array.isArray(res.body.data)).toBe(true);
  expect(res.body.data.length).toBe(0);
});




});
