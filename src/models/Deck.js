const mongoose = require("mongoose");

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
});

// Auto timestamps
DeckSchema.set("timestamps", true);

module.exports = mongoose.model("Deck", DeckSchema);
