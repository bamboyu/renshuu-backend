const Deck = require("../models/Deck");
const Card = require("../models/Card");
const ReviewLog = require("../models/Reviewlog");
const mongoose = require("mongoose");
// The binding exports the Rust-based optimizer
const { FSRSOptimizer } = require("@open-spaced-repetition/binding");

async function optimizeDeckWeights(req, res) {
  const { deckID } = req.params;

  try {
    const deck = await Deck.findById(deckID);
    if (!deck) return res.status(404).json({ message: "Deck not found" });

    // 1. Fetch all cards in this deck
    const cards = await Card.find({ deckID }).select("_id");
    const cardIds = cards.map((c) => c._id);

    // 2. Fetch all review logs for these cards, sorted chronologically
    const rawLogs = await ReviewLog.find({ cardID: { $in: cardIds } })
      .sort({ cardID: 1, review_date: 1 })
      .lean();

    if (rawLogs.length < 500) {
      return res.status(400).json({
        message: `Not enough data to optimize. You need at least 500 reviews. (Currently have ${rawLogs.length})`,
      });
    }

    // 3. Group logs by Card ID
    // The optimizer needs to see the chronological history of each individual card
    const historyByCard = {};
    for (const log of rawLogs) {
      const id = log.cardID.toString();
      if (!historyByCard[id]) historyByCard[id] = [];

      historyByCard[id].push({
        rating: log.rating, // 1, 2, 3, or 4
        review_time: log.review_date.getTime(), // Epoch timestamp in milliseconds
      });
    }

    // Convert the dictionary into a flat array of card histories
    const trainingData = Object.values(historyByCard);

    // 4. Initialize and run the Optimizer
    const optimizer = new FSRSOptimizer();

    // The optimizer computes the best 17 weights based on your users' actual memory decay
    const optimizationResult = optimizer.compute(trainingData);

    // 5. Save the new weights to the Deck
    deck.fsrs_params.weights = optimizationResult.weights;
    await deck.save();

    res.json({
      message: "Weights optimized successfully!",
      new_weights: deck.fsrs_params.weights,
    });
  } catch (err) {
    console.error("Optimization Error:", err);
    res.status(500).json({
      message: "Failed to optimize weights.",
      error: err.message,
      stack: err.stack,
    });
  }
}

async function importAnkiLogs(req, res) {
  // local only
  const { deckID } = req.params;
  const { logs } = req.body;
  // logs = array of card histories: [[{rating, review_date}, ...], ...]

  try {
    const deck = await Deck.findById(deckID);
    if (!deck) return res.status(404).json({ message: "Deck not found" });

    const cardsToInsert = [];
    const reviewLogsToInsert = [];

    for (const cardHistory of logs) {
      // 1. Generate a new ID in RAM (instant, 0 database calls)
      const cardId = new mongoose.Types.ObjectId();

      // 2. Prepare the dummy card
      cardsToInsert.push({
        _id: cardId, // Assign the pre-generated ID
        deckID,
        front: "Anki Import",
        back: "Anki Import",
        tag: "Mature",
      });

      // 3. Prepare all logs associated with this card
      for (const entry of cardHistory) {
        reviewLogsToInsert.push({
          cardID: cardId, // Link the log to the card we just "created" in RAM
          rating: entry.rating,
          review_date: new Date(entry.review_date),
          state: 2, // Treated as a review card
        });
      }
    }

    // 4. Bulk Insert everything in just 2 total operations!
    // This is thousands of times faster than a loop.
    await Card.insertMany(cardsToInsert, { ordered: false });
    await ReviewLog.insertMany(reviewLogsToInsert, { ordered: false });

    res.status(200).json({
      message: `Successfully imported ${reviewLogsToInsert.length} reviews from Anki!`,
      total_reviews: reviewLogsToInsert.length,
      total_cards: cardsToInsert.length,
    });
  } catch (err) {
    console.error("Import Anki Error:", err);
    res
      .status(500)
      .json({ message: "Error importing Anki data", error: err.message });
  }
}

module.exports = { optimizeDeckWeights, importAnkiLogs };
