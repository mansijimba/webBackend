const request = require("supertest")
const mongoose = require("mongoose")
const bcrypt = require("bcrypt")
const app = require("../index")
const Admin = require("../models/AdminAuth")

let adminToken

afterAll(async () => {
    await mongoose.disconnect()
})

describe("Admin Authentication Tests", () => {

    beforeAll(async () => {
        await Admin.deleteOne({ email: "admin@mediqueue.com" })

        const hashedPassword = await bcrypt.hash("Mediqueqe@08", 10)

        await Admin.create({
            email: "admin@mediqueue.com",
            password: hashedPassword
        })
    })

    test("Admin can login successfully with correct password", async () => {
        const res = await request(app)
            .post("/api/admins/login")
            .send({
                email: "admin@mediqueue.com",
                password: "Mediqueqe@08"
            })

        expect(res.statusCode).toBe(200)
        expect(res.body.token).toEqual(expect.any(String))
        expect(res.body.user.email).toBe("admin@mediqueue.com")
        adminToken = res.body.token
    })

    test("Admin login fails with wrong password", async () => {
        const res = await request(app)
            .post("/api/admins/login")
            .send({
                email: "admin@mediqueue.com",
                password: "wrongpassword"
            })

        expect(res.statusCode).toBe(401)
        expect(res.body.message).toBe("Invalid email or password")
    })
})
