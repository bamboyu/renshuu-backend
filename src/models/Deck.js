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

  algorithm: { type: String, enum: ["SM2", "FSRS"], default: "SM2" },

  fsrs_params: {
    // Default weights for FSRS
    weights: {
      type: [Number],
      default: [
        0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 0.01, 1.49, 0.14, 0.94, 2.18,
        0.05, 0.34, 1.26, 0.29, 2.61,
      ],
    },
    // Defaults to 90% requested retention
    request_retention: { type: Number, default: 0.9 },
    maximum_interval: { type: Number, default: 36500 },
  },
});

// Auto timestamps
DeckSchema.set("timestamps", true);

module.exports = mongoose.model("Deck", DeckSchema);
