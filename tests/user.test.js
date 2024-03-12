const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../src/app");
const User = require("../src/models/user");
const { userOneId, userOne, setupDatabase } = require("./fixtures/db");

beforeEach(setupDatabase);

afterAll(() => {
  mongoose.connection.close();
});

test("Should signup a new user", async () => {
  const response = await request(app).post("/users").send({
    name: "Ben Lee",
    email: "bennylee@example.com",
    password: "Benpass123",
  });

  expect(response.status).toBe(201);

  // Assert that the database was changed correctly
  const user = await User.findById(response.body.user._id);
  expect(user).not.toBeNull();

  // Assertions about the response
  expect(response.body).toMatchObject({
    user: {
      name: "Ben Lee",
      email: "bennylee@example.com",
    },
    token: user.tokens[0].token,
  });

  expect(user.password).not.toBe("Benpass123");
});

test("Should not sign up user with invalid name", async () => {
  const response = await request(app).post("/users").send({
    email: "bennylee@example.com",
    password: "Benpass123",
  });

  expect(response.status).toBe(400);
});

test("Should not sign up user with invalid email", async () => {
  const response = await request(app).post("/users").send({
    name: "Dan Lee",
    email: "dannylee@.com",
    password: "Danpass123",
  });

  expect(response.status).toBe(400);
});

test("Should not sign up user with invalid password", async () => {
  const response = await request(app).post("/users").send({
    name: "Ken Lee",
    email: "kennylee@.com",
    password: "Kenpo",
  });

  expect(response.status).toBe(400);
});

test("Should login existing user", async () => {
  const response = await request(app).post("/users/login").send({
    email: userOne.email,
    password: userOne.password,
  });

  expect(response.status).toBe(200);

  const user = await User.findById(userOneId);
  expect(response.body.token).toBe(user.tokens[1].token);
});

test("Should not login nonexistent user", async () => {
  const response = await request(app).post("/users/login").send({
    email: "Frank Stein",
    password: "Frankystein123",
  });

  expect(response.status).toBe(400);
});

test("Should get profile for user", async () => {
  const response = await request(app)
    .get("/users/me")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`);

  expect(response.status).toBe(200);
});

test("Should not get profile for unauthenticated user", async () => {
  const response = await request(app).get("/users/me");

  expect(response.status).toBe(401);
});

test("Should delete account for user", async () => {
  const response = await request(app)
    .delete("/users/me")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`);

  expect(response.status).toBe(200);

  const user = await User.findById(userOneId);
  expect(user).toBeNull();
});

test("Should not delete account for unauthenticated user", async () => {
  const response = await request(app).delete("/users/me");

  expect(response.status).toBe(401);
});

test("Should upload avatar image", async () => {
  const response = await request(app)
    .post("/users/me/avatar")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .attach("avatar", "tests/fixtures/profile-pic.jpg");

  expect(response.status).toBe(200);

  const user = await User.findById(userOneId);
  expect(user.avatar).toEqual(expect.any(Buffer));
});

test("Should update valid user fields", async () => {
  const response = await request(app)
    .patch("/users/me")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send({ name: "Jack Storm" });

  expect(response.status).toBe(200);

  const user = await User.findById(userOneId);
  expect(user.name).toEqual("Jack Storm");
});

test("Should not update invalid user fields", async () => {
  const response = await request(app)
    .patch("/users/me")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send({ location: "New York" });

  expect(response.status).toBe(400);
});

test("Should not update user if unauthenticated", async () => {
  const response = await request(app)
    .patch("/users/me")
    .send({ name: "Robert Knight" });

  expect(response.status).toBe(401);
});

test("Should not update user with invalid name", async () => {
  const response = await request(app)
    .patch("/users/me")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send({ name: null });

  expect(response.status).toBe(400);
});

test("Should not update user with invalid email", async () => {
  const response = await request(app)
    .patch("/users/me")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send({ email: "brokenmail@.com" });

  expect(response.status).toBe(400);
});

test("Should not update user with invalid password", async () => {
  const response = await request(app)
    .patch("/users/me")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send({ password: "pass1" });

  expect(response.status).toBe(400);
});
