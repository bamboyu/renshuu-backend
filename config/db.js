const { MongoClient } = require("mongodb");
const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017";
const client = new MongoClient(uri);
const dbName = "renshuuDB";

let db;

async function connectDB() {
  try {
    await client.connect();
    db = client.db(dbName);
    console.log("MongoDB connected!");
  } catch (err) {
    console.error(err);
  }
}

function getDB() {
  if (!db) throw new Error("Database not connected");
  return db;
}

module.exports = { connectDB, getDB };
