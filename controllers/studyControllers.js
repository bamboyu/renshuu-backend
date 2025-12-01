const Card = require("../models/Card");
const sm2 = require("../services/sm2");

// Return the next card due for review in a deck
async function getNextCard(req, res) {
  const { deckID } = req.params;

  try {
    const now = new Date();

    // Find the oldest card that is due
    const card = await Card.findOne({
      deckID,
      nextReview: { $lte: now },
    }).sort({ nextReview: 1 });

    if (!card) {
      return res.json({ message: "No cards due", card: null });
    }

    res.json({ card });
  } catch (err) {
    console.error("Error fetching next card:", err);
    res.status(500).json({ message: "Server error" });
  }
}

// Review a card and update its scheduling data
async function reviewCard(req, res) {
  const { cardID } = req.params;
  const { rating } = req.body;

  if (rating === undefined) {
    return res.status(400).json({ message: "Rating is required" });
  }

  try {
    const card = await Card.findById(cardID);
    if (!card) return res.status(404).json({ message: "Card not found" });

    // Run SM2 logic
    const updated = sm2(card, rating);

    card.interval = updated.interval;
    card.EF = updated.EF;
    card.reps = updated.reps;
    card.nextReview = updated.nextReview;

    // Update tag based on repetition
    if (card.reps < 3) card.tag = "Learning";
    else if (card.reps < 7) card.tag = "Young";
    else card.tag = "Mature";

    await card.save();

    res.json({ message: "Review updated", card });
  } catch (err) {
    console.error("Error reviewing card:", err);
    res.status(500).json({ message: "Server error" });
  }
}

module.exports = { getNextCard, reviewCard };
