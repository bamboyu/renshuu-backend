const mongoose = require("mongoose");

const CardSchema = new mongoose.Schema({
  deckID: { type: mongoose.Schema.Types.ObjectId, ref: "Deck", required: true },
  front: { type: String, required: true },
  back: { type: String, required: true },
  image: { type: String },
  sound: { type: String },
  tag: {
    type: String,
    enum: ["New", "Learning", "Young", "Mature"],
    default: "New",
  },

  // SM-2 fields
  repetition: { type: Number, default: 0 },
  interval: { type: Number, default: 0 },
  easeFactor: { type: Number, default: 2.5 },
  nextReview: { type: Date, default: Date.now },

  // Learning / New card fields
  learningStep: { type: Number, default: 0 }, // index in learningSteps array
  learningSteps: { type: [Number], default: [1, 5, 10] }, // in minutes

  // Lapses for review cards
  lapses: { type: Number, default: 0 },
});

// Auto timestamps
CardSchema.set("timestamps", true);

module.exports = mongoose.model("Card", CardSchema);
