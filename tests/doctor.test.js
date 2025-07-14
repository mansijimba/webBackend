const request = require("supertest")
const app = require("../index") // Adjust path if needed
const mongoose = require("mongoose")
const Doctor = require("../models/admin/Doctor") // Adjust path if needed

let doctorId

afterAll(async () => {
  await mongoose.disconnect()
})

describe("Doctor API tests", () => {

  beforeAll(async () => {
    // Clean up doctors collection before tests
    await Doctor.deleteMany({})
  })

  test("Create a doctor successfully", async () => {
    const res = await request(app)
      .post("/api/admin/doctors")  // Adjust route based on your routing
      .send({
        name: "Dr. Strange",
        specialty: "Magic",
        email: "strange@example.com",
        phone: "1234567890"
      })

    expect(res.statusCode).toBe(201)
    expect(res.body.success).toBe(true)
    expect(res.body.data).toHaveProperty("_id")
    expect(res.body.data.name).toBe("Dr. Strange")

    doctorId = res.body.data._id
  })

  test("Get all doctors", async () => {
    const res = await request(app)
      .get("/api/admin/doctors") // Adjust route accordingly

    expect(res.statusCode).toBe(200)
    expect(res.body.success).toBe(true)
    expect(Array.isArray(res.body.data)).toBe(true)
    expect(res.body.data.length).toBeGreaterThan(0)
  })

  test("Get doctor by ID", async () => {
    const res = await request(app)
      .get(`/api/admin/doctors/${doctorId}`) // Use the id from created doctor

    expect(res.statusCode).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data._id).toBe(doctorId)
  })

  test("Update doctor's status and availability", async () => {
    console.log("doctorId:", doctorId)
    const res = await request(app)
      .put(`/api/admin/doctors/${doctorId}/status`)
      .send({
        status: "On Leave",
        availability: "Not available this week"
      })

    expect(res.statusCode).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.status).toBe("On Leave")
    expect(res.body.data.availability).toBe("Not available this week")
  })

  test("Delete a doctor by ID", async () => {
    const res = await request(app)
      .delete(`/api/admin/doctors/${doctorId}`)

    expect(res.statusCode).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.message).toBe("Doctor deleted")
  })

})
