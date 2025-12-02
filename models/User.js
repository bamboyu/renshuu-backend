const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
});

// Auto timestamps
UserSchema.set("timestamps", true);

module.exports = mongoose.model("User", UserSchema);
