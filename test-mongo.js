// test-mongo.js
import { MongoClient } from "mongodb";

// Connection URI
const uri = "mongodb://127.0.0.1:27017"; // default localhost for MongoDB

// Database name
const dbName = "renshuuDB";

async function main() {
  const client = new MongoClient(uri);

  try {
    // Connect to MongoDB
    await client.connect();
    console.log("Connected to MongoDB!");

    // Create / switch to database
    const db = client.db(dbName);

    // Create / get a collection
    const users = db.collection("users");

    // Insert a test document
    const result = await users.insertOne({
      username: "testuser",
      password: "1234",
    });
    console.log("Inserted document with _id:", result.insertedId);

    // Find all documents
    const allUsers = await users.find({}).toArray();
    console.log("All users:", allUsers);
  } catch (err) {
    console.error("Error connecting to MongoDB:", err);
  } finally {
    // Close the connection
    await client.close();
  }
}

main();
