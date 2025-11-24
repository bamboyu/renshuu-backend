const { getDB } = require("../config/db");
const bcrypt = require("bcrypt");

const collectionName = "users";

async function createUser(email, password) {
  const db = getDB();
  const hashed = await bcrypt.hash(password, 10);
  const result = await db
    .collection(collectionName)
    .insertOne({ email, password: hashed, refreshToken: null });
  return result;
}

async function findUserByEmail(email) {
  const db = getDB();
  return db.collection(collectionName).findOne({ email });
}

async function updateRefreshToken(email, refreshToken) {
  const db = getDB();
  return db
    .collection(collectionName)
    .updateOne({ email }, { $set: { refreshToken } });
}

module.exports = { createUser, findUserByEmail, updateRefreshToken };
