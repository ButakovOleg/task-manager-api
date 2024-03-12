const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../src/app");
const Task = require("../src/models/task");
const {
  userOneId,
  userOne,
  userTwoId,
  userTwo,
  taskOne,
  taskTwo,
  taskThree,
  setupDatabase,
} = require("./fixtures/db");

beforeEach(setupDatabase);

afterAll(() => {
  mongoose.connection.close();
});

test("Should create task for user", async () => {
  const response = await request(app)
    .post("/tasks")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send({
      description: "From my test",
    });

  expect(response.status).toBe(201);

  const task = await Task.findById(response.body._id);
  expect(task).not.toBeNull();
  expect(task.completed).toBe(false);
});

test("Should not create task with invalid description", async () => {
  const response = await request(app)
    .post("/tasks")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send({ description: null });

  expect(response.status).toBe(400);
});

test("Should not create task with invalid completed", async () => {
  const response = await request(app)
    .post("/tasks")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send({ completed: "Invalid completed value" });

  expect(response.status).toBe(400);
});

test("Should get all tasks for user", async () => {
  const response = await request(app)
    .get("/tasks")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`);

  expect(response.status).toBe(200);
  expect(response.body.length).toBe(2);
});

test("Should fetch user task by id", async () => {
  const response = await request(app)
    .get(`/tasks/${taskTwo._id}`)
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`);

  expect(response.status).toBe(200);

  const task = await Task.findById(taskTwo._id);
  expect(response.body._id).toBe(taskTwo._id.toString());
  expect(response.body.owner).toBe(task.owner.toString());
});

test("Should not fetch user task by id if unauthenticated", async () => {
  const response = await request(app).get(`/tasks/${taskOne._id}`);

  expect(response.status).toBe(401);
});

test("Should not fetch other users task by id", async () => {
  const response = await request(app)
    .get(`/tasks/${taskTwo._id}`)
    .set("Authorization", `Bearer ${userTwo.tokens[0].token}`);

  expect(response.status).toBe(404);
});

test("Should fetch only completed tasks", async () => {
  const response = await request(app)
    .get("/tasks")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .query({ completed: true });

  expect(response.status).toBe(200);
  expect(response.body.length).toBe(1);
  expect(response.body[0].completed).toBe(true);
});

test("Should fetch only incomplete tasks", async () => {
  const response = await request(app)
    .get("/tasks")
    .set("Authorization", `Bearer ${userTwo.tokens[0].token}`)
    .query({ completed: false });

  expect(response.status).toBe(200);
  expect(response.body.length).toBe(0);
});

test("Should sort tasks by valid field", async () => {
  const response = await request(app)
    .get("/tasks")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .query({ sortBy: "createdAt:desc" });

  expect(response.status).toBe(200);
  expect(response.body.length).toBe(2);
  expect(response.body[0]._id).toBe(taskTwo._id.toString());
  expect(response.body[1]._id).toBe(taskOne._id.toString());
});

test("Should fetch page of tasks", async () => {
  const response = await request(app)
    .get("/tasks")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .query({ limit: 1, skip: 1 });

  expect(response.status).toBe(200);
  expect(response.body.length).toBe(1);
  expect(response.body[0]._id).toBe(taskTwo._id.toString());
});

test("Should not update other users task", async () => {
  const response = await request(app)
    .patch(`/tasks/${taskThree._id}`)
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send({ description: "Other users description" });

  expect(response.status).toBe(404);
});

test("Should not update task with invalid description", async () => {
  const response = await request(app)
    .patch(`/tasks/${taskOne._id}`)
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send({ description: null });

  expect(response.status).toBe(400);
});

test("Should not update task with invalid completed", async () => {
  const response = await request(app)
    .patch(`/tasks/${taskOne._id}`)
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send({ completed: "Invalid completed value" });

  expect(response.status).toBe(400);
});

test("Should delete user task", async () => {
  const response = await request(app)
    .delete(`/tasks/${taskTwo._id}`)
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`);

  expect(response.status).toBe(200);

  const task = await Task.findById(taskTwo._id);
  expect(task).toBeNull();
});

test("Should not delete task if unauthenticated", async () => {
  const response = await request(app).delete(`/tasks/${taskTwo._id}`);

  expect(response.status).toBe(401);

  const task = await Task.findById(taskTwo._id);
  expect(task).not.toBeNull();
});

test("Should not delete other user task", async () => {
  const response = await request(app)
    .delete(`/tasks/${taskOne._id}`)
    .set("Authorization", `Bearer ${userTwo.tokens[0].token}`);

  expect(response.status).toBe(404);

  const task = await Task.findById(taskOne._id);
  expect(task).not.toBeNull();
});
