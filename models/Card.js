const mongoose = require("mongoose");

const CardSchema = new mongoose.Schema({
  deckID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Deck",
    required: true,
  },
  front: { type: String, required: true },
  back: { type: String, required: true },
  image: { type: String },
  sound: { type: String },
  tag: {
    type: String,
    enum: ["New", "Learning", "Relearning", "Young", "Mature"],
    default: "New",
  },
  interval: {
    type: Number,
    default: 0, // number of days until next review
  },
});

CardSchema.set("timestamps", true);

module.exports = mongoose.model("Card", CardSchema);
