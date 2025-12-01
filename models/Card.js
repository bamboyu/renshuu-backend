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

  // SM-2 fields
  repetition: { type: Number, default: 0 },
  easeFactor: { type: Number, default: 2.5 },
  interval: { type: Number, default: 0 },
  nextReview: { type: Date, default: Date.now },

  tag: {
    type: String,
    enum: ["New", "Learning", "Relearning", "Young", "Mature"],
    default: "New",
  },
});

CardSchema.set("timestamps", true);

module.exports = mongoose.model("Card", CardSchema);
