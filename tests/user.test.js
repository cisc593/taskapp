const request = require("supertest");
const app = require("../src/app");
const User = require("../src/models/user");
const {
  userOne,
  userOneId,
  setUpDatabase,
} = require("./fixtures/db");

beforeEach(setUpDatabase);

test("Should sign up a new user", async () => {
  const response = await request(app)
    .post("/users")
    .send({
      name: "John",
      email: "john@gmail.com",
      password: "mY8scsds&kV",
    })
    .expect(201);

  // Assert database was changed correctly
  const user = await User.findById(response.body.user._id);
  expect(user).not.toBeNull();

  // Assertion about response
  // Check user details saved in database match with what was sent
  expect(response.body).toMatchObject({
    user: {
      name: "John",
      email: "john@gmail.com",
    },
    token: user.tokens[0].token,
  });
});

test("Should login existing user", async () => {
  const response = await request(app)
    .post("/users/login")
    .send({
      email: userOne.email,
      password: userOne.password,
    })
    .expect(200);

  const user = await User.findById(userOneId);
  expect(response.body).toMatchObject({
    token: user.tokens[1].token,
  });
});

test("Should not login non-existent user", async () => {
  await request(app)
    .post("/users/login")
    .send({
      email: "lisa@gmail.com",
      password: "sofa@9e4PcJ9",
    })
    .expect(400);
});

test("Should read current user profile", async () => {
  await request(app)
    .get("/users/me")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);
});

test("Should not read profile for unauthenticated user", async () => {
  await request(app).get("/users/me").send().expect(401);
});

test("Should delete authenticated user profile", async () => {
  await request(app)
    .delete("/users/me")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);

  const user = await User.findById(userOneId);
  expect(user).toBeNull();
});

test("Should not delete unauthenticated user", async () => {
  await request(app).delete("/users/me").send().expect(401);
});

test("Should update valid user fields", async () => {
  await request(app)
    .patch("/users/me")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send({
      name: "Jay",
      age: 32,
    })
    .expect(200);

  const user = await User.findById(userOneId);
  expect(user.name).toEqual("Jay");
});

test("Should not update invalid user fields", async () => {
  await request(app)
    .patch("/users/me")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send({
      location: 16,
    })
    .expect(400);
});
