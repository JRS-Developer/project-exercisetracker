const express = require("express");
const app = express();
const cors = require("cors");
const crypto = require("crypto");
require("dotenv").config();

let users = {};
let exercises = {};

app.use(cors());
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

const generateRandomID = (length = 16) =>
  crypto.randomBytes(length).toString("hex");

app.post("/api/users", (req, res) => {
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({
      error: "Username is required",
    });
  }

  const id = generateRandomID();
  users[id] = username;

  res.status(201).json({
    _id: id,
    username,
  });
});

app.get("/api/users", (_req, res) => {
  const usersArr = Object.entries(users).map(([id, username]) => ({
    _id: id,
    username,
  }));

  res.json(usersArr);
});

app.post("/api/users/:userId/exercises", (req, res) => {
  const { userId } = req.params;
  let { description, duration, date } = req.body;

  if (!users[userId]) {
    return res.status(404).json({
      error: "User not found",
    });
  }

  if (!description || !duration) {
    return res.status(400).json({
      error: "Description and duration are required",
    });
  }

  const id = generateRandomID();
  const username = users[userId];
  const parsedDuration = Number(duration);
  let formattedDate;

  if (!date) {
    formattedDate = new Date().toDateString();
  } else {
    formattedDate = new Date(date).toDateString();
  }

  const newExercise = {
    userId,
    description,
    duration: parsedDuration,
    date: formattedDate,
  };

  exercises[id] = { ...newExercise };
  delete newExercise.userId;

  const response = {
    username,
    ...newExercise,
    _id: userId,
  };

  res.status(201).json(response);
});

app.get("/api/users/:userId/logs", (req, res) => {
  const { userId } = req.params;
  const username = users[userId];
  const { from, to, limit } = req.query;

  if (!username) {
    return res.status(404).json({
      error: "User not found",
    });
  }

  const userExercises = Object.entries(exercises).filter(
    ([_id, exercise]) => exercise.userId === userId
  );

  const filteredExercises = userExercises.filter(
    ([_id, exercise]) =>
      (!from || new Date(exercise.date) >= new Date(from)) &&
      (!to || new Date(exercise.date) <= new Date(to))
  );

  const sortedExercises = filteredExercises.sort(
    (a, b) => new Date(a[1].date) - new Date(b[1].date)
  );

  const limitedExercises = sortedExercises.slice(0, limit);

  const log = limitedExercises.map(([_id, exercise]) => {
    const copy = { ...exercise };
    delete copy.userId;
    return {
      ...copy,
    };
  });

  res.json({
    username,
    count: log.length,
    _id: userId,
    log,
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
