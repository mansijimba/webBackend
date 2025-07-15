const request = require("supertest");
const app = require("../index");
const User = require("../models/User");
const mongoose = require("mongoose");

afterAll(async () => {
  await mongoose.disconnect();
});

let authToken;

// 1. Describe
describe("User Authentication API", () => {

  // 2. Individual test
  test("can validate user while creating user", async () => {
    // 3. Action/Api call
    const res = await request(app).post("/api/auth/register").send({
      fullName: "Pika",
      email: "pika12@gmail.com",
    });
    // 4. Expect
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Missing fields");
    expect(res.body.success).toBe(false);
  });
  // .. more test
  test("can create a user with all fields", async () => {
    const res = await request(app).post("/api/auth/register").send({
      fullName: "Pika",
      phone: "9810266353",
      email: "pika12@gmail.com",
      password: "password",
    });
    expect(res.body.success).toBe(true);
  });

  // test login
  test("can login a user with a valid credentials", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "pika12@gmail.com",
      password: "password",
    });
    expect(res.statusCode).toBe(200);
    expect(res.body.token).toEqual(expect.any(String));
    authToken = res.body.token;
  });

  test("should not login user with wrong password", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "pika12@gmail.com",
      password: "pasword",
    });

    expect(res.statusCode).toBe(403); // Unauthorized
    expect(res.body.success).toBe(false);
  });
});
