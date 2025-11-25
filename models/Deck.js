const { getDB } = require("../config/db");

const DeckSchema = new mongoose.Schema({
  userID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    required: true,
  },
});

// Auto timestamps
UserSchema.set("timestamps", true);

module.exports = mongoose.model("User", UserSchema);
