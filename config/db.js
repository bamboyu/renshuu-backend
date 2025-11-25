const mongoose = require("mongoose");

const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/renshuuDB";

async function connectDB() {
  try {
    await mongoose.connect(uri);
    console.log("Mongoose connected!");
  } catch (err) {
    console.error("Mongoose connection error:", err);
  }
}

module.exports = connectDB;
