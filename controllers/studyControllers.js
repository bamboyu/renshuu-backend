const Card = require("../models/Card");
const sm2 = require("../services/sm2");

// Default review time (all cards due same time)
const DEFAULT_REVIEW_HOUR = 20; // 8 PM
const DEFAULT_REVIEW_MINUTE = 0;

// Helper to set nextReview to the same time
const setNextReview = (time, unit = "days") => {
  const next = new Date();
  if (unit === "minutes") {
    next.setTime(next.getTime() + time * 60 * 1000);
  } else {
    next.setDate(next.getDate() + time);
    next.setHours(DEFAULT_REVIEW_HOUR, DEFAULT_REVIEW_MINUTE, 0, 0);
  }
  return next;
};

// Return the next card due for review in a deck
async function getNextCard(req, res) {
  const { deckID } = req.params;
  const now = new Date();

  try {
    // Show card before full interval if there aren't any cards no left
    let card = await Card.findOne({
      deckID,
      tag: { $in: ["New"] },
    }).sort({ nextReview: 1 });

    // If no new card, pick review cards that are due
    if (!card || card.nextReview > now) {
      card = await Card.findOne({
        deckID,
        tag: { $in: ["Learning", "Young", "Mature"] },
        nextReview: { $lte: now },
      }).sort({ nextReview: 1 });
    }

    if (!card) {
      return res.json({ message: "No cards available", card: null });
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
  const { rating } = req.body; // 0 = Again, 1 = Hard, 2 = Good, 3 = Easy

  if (rating === undefined)
    return res.status(400).json({ message: "Rating is required" });

  try {
    const card = await Card.findById(cardID);
    if (!card) return res.status(404).json({ message: "Card not found" });

    // Update card based on its tag
    if (card.tag === "New" || card.tag === "Learning") {
      // New/Learning card steps
      if (rating === 0) {
        // Again -> repeat same step
        card.learningStep = 0;
        card.nextReview = setNextReview(
          card.learningSteps[card.learningStep],
          "minutes"
        );
      } else {
        card.learningStep += 1;
        if (card.learningStep >= card.learningSteps.length) {
          // Graduates to review
          card.tag = "Young";
          card.repetition = 1;
          card.interval = 1; // first interval in days
          card.easeFactor = 2.5;
        }
      }
    } else {
      // Young/Mature card
      if (rating === 0) {
        // Lapse so go back to 10 minutes review
        card.lapses += 1;
        card.interval = Math.max(
          1,
          Math.round(card.interval * Math.pow(0.5, card.lapses))
        );
        card.nextReview = setNextReview(10, "minutes");
      } else {
        // SM-2 logic
        const updated = sm2(card, rating);

        // Adjust interval by lapses factor if there were previous lapses
        const lapseFactor = card.lapses > 0 ? Math.pow(0.9, card.lapses) : 1;
        card.repetition = updated.repetition;
        card.interval = Math.max(1, Math.round(updated.interval * lapseFactor));
        card.easeFactor = updated.easeFactor;
        card.lapses = 0; // reset lapses after successful review
        card.nextReview = setNextReview(card.interval, "days");
      }
    }

    await card.save();
    res.json({ message: "Review updated", card });
  } catch (err) {
    console.error("Review Card Error:", err);
    res.status(500).json({ message: "Server error" });
  }
}

module.exports = { getNextCard, reviewCard };
