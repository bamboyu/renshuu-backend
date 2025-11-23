const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const bodyParser = require("body-parser");

const app = express();
const PORT = 5000;
const SECRET_KEY = "09052005";

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Connect to MongoDB
const client = new MongoClient("mongodb://127.0.0.1:27017");
const dbName = "renshuuDB";
let usersCollection;

async function connectToDB() {
  try {
    await client.connect();
    const db = client.db(dbName);
    usersCollection = db.collection("users");

    await usersCollection.createIndex({ username: 1 }, { unique: true });

    console.log("Connected to MongoDB!");
  } catch (err) {
    console.error("Error connecting to MongoDB:", err);
  }
}

connectToDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
});

app.post("/signup", async (req, res) => {
  const { username, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await usersCollection.insertOne({
      username,
      password: hashedPassword,
    });
    res
      .status(201)
      .send({ message: "User created", userId: result.insertedId });
  } catch (err) {
    if (err.code === 11000) {
      // Duplicate key error
      return res.status(400).send({ message: "Username already exists" });
    } else {
      res.status(500).send({ message: "Server error!", error: err.message });
    }
  }
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await usersCollection.findOne({ username });
    if (!user) {
      return res.status(400).send({ message: "Invalid username or password" });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).send({ message: "Invalid username or password" });
    }

    const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: "1h" });
    res.send({ message: "Login successful", token });
  } catch (err) {
    res.status(500).send({ message: "Server error!", error: err.message });
  }
});
