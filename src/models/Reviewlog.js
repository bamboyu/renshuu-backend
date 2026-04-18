const mongoose = require("mongoose");

const ReviewLogSchema = new mongoose.Schema({
  cardID: { type: mongoose.Schema.Types.ObjectId, ref: "Card", required: true },
  rating: { type: Number, required: true }, // 1:Again, 2:Hard, 3:Good, 4:Easy
  state: Number, // State before the review (0-3)
  due: Date, // When it was scheduled to be reviewed
  stability: Number, // Stability before review
  difficulty: Number, // Difficulty before review
  elapsed_days: Number, // Actual days since last review
  scheduled_days: Number, // How many days it was scheduled for
  review_date: { type: Date, default: Date.now },
});

module.exports = mongoose.model("ReviewLog", ReviewLogSchema);
