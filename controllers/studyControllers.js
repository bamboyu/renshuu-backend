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

// Helper to format days/minutes for the frontend
const formatTime = (time, unit) => {
  if (unit === "minutes") return time + "m";
  if (time >= 365) return (time / 365).toFixed(1) + "y";
  if (time >= 30) return (time / 30).toFixed(1) + "mo";
  return Math.round(time) + "d";
};

// Get estimated next review times for all ratings
const getEstimates = (card) => {
  const estimates = {};

  [0, 1, 2, 3].forEach((rating) => {
    let result = "";

    // Temporary card object to simulate updates
    const tempCard = {
      tag: card.tag,
      lapses: card.lapses,
      interval: card.interval,
      repetition: card.repetition,
      easeFactor: card.easeFactor,
      learningStep: card.learningStep,
      learningSteps: card.learningSteps || [1, 5, 10], // Fallback to default if missing
    };

    if (tempCard.tag === "New" || tempCard.tag === "Learning") {
      const isRelearning = tempCard.lapses > 0;

      if (isRelearning) {
        // Relearning Logic
        if (rating === 0) {
          // Again -> 10m
          result = formatTime(10, "minutes");
        } else {
          // Pass
          const updated = sm2(tempCard, rating);
          const lapseFactor =
            tempCard.lapses > 0 ? Math.pow(0.9, tempCard.lapses) : 1;
          const newInterval = Math.max(
            1,
            Math.round(updated.interval * lapseFactor)
          );

          result = formatTime(newInterval, "days");
        }
      } else {
        // New Learning Logic
        if (rating === 0) {
          // Again
          const stepTime = tempCard.learningSteps[0];
          result = formatTime(stepTime, "minutes");
        } else {
          // Hard/Good/Easy -> Advance step
          const nextStep = tempCard.learningStep + 1;

          if (nextStep >= tempCard.learningSteps.length) {
            // Graduate -> 1 day
            result = formatTime(1, "days");
          } else {
            // Next learning step
            const stepTime = tempCard.learningSteps[nextStep];
            result = formatTime(stepTime, "minutes");
          }
        }
      }
    } else {
      // Young/Mature Learning Logic
      if (rating === 0) {
        // Lapse
        result = formatTime(10, "minutes");
      } else {
        // SM-2 Logic + Lapse Factor
        const updated = sm2(tempCard, rating);
        const lapseFactor =
          tempCard.lapses > 0 ? Math.pow(0.9, tempCard.lapses) : 1;
        const newInterval = Math.max(
          1,
          Math.round(updated.interval * lapseFactor)
        );

        result = formatTime(newInterval, "days");
      }
    }
    estimates[rating] = result;
  });

  return estimates;
};

// Return the next card due for review in a deck
async function getNextCard(req, res) {
  const { deckID } = req.params;
  const now = new Date();

  try {
    // Fetch new cards first
    let card = await Card.findOne({
      deckID,
      tag: "New",
    }).sort({ nextReview: 1 });

    // If no New cards, get due Learning/Review cards
    if (!card) {
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);

      card = await Card.findOne({
        deckID,
        $or: [
          { tag: "Learning", nextReview: { $lte: now } },
          { tag: { $in: ["Young", "Mature"] }, nextReview: { $lte: endOfDay } },
        ],
      }).sort({ nextReview: 1 });
    }

    // Let user finish all today cards
    if (!card) {
      const learnAheadTime = new Date(now.getTime() + 20 * 60 * 1000);

      card = await Card.findOne({
        deckID,
        tag: "Learning",
        nextReview: { $lte: learnAheadTime },
      }).sort({ nextReview: 1 });
    }

    if (!card) {
      return res.json({ message: "No cards available", card: null });
    }

    const estimates = getEstimates(card);

    res.json({ card, estimates });
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
      const isRelearning = card.lapses > 0;

      if (isRelearning) {
        // Relearning Logic
        if (rating === 0) {
          card.nextReview = setNextReview(10, "minutes");
          card.lapses += 1;
        } else {
          // Pass (Hard/Good/Easy) -> Graduate immediately
          // SM-2 logic
          const updated = sm2(card, rating);

          // Apply lapse factor
          const lapseFactor = card.lapses > 0 ? Math.pow(0.9, card.lapses) : 1;
          card.repetition = updated.repetition;
          card.interval = Math.max(
            1,
            Math.round(updated.interval * lapseFactor)
          );
          card.easeFactor = updated.easeFactor;
          card.nextReview = setNextReview(card.interval, "days");
          if (card.interval > 21) card.tag = "Mature";
          else card.tag = "Young";
          card.nextReview = setNextReview(card.interval, "days");
        }
      } else {
        // New Learning Logic
        if (rating === 0) {
          // Again -> stay in Learning (or go to Learning if New), reset step
          card.tag = "Learning";
          card.learningStep = 0;
          card.nextReview = setNextReview(
            card.learningSteps[card.learningStep],
            "minutes"
          );
        } else {
          // Passed
          if (card.tag === "New") card.tag = "Learning";

          // Advance step
          card.learningStep += 1;

          if (card.learningStep >= card.learningSteps.length) {
            // Graduates to review
            card.tag = "Young";
            card.repetition = 1;
            card.interval = 1; // first interval
            card.easeFactor = 2.5;
            card.nextReview = setNextReview(card.interval, "days");
          } else {
            // Stay in Learning, next step
            card.nextReview = setNextReview(
              card.learningSteps[card.learningStep],
              "minutes"
            );
          }
        }
      }
    } else {
      // Young/Mature card
      if (rating === 0) {
        // Lapse so go back to Learning
        card.tag = "Learning";
        card.lapses += 1;
        card.interval = Math.max(
          1,
          Math.round(card.interval * Math.pow(0.5, card.lapses))
        );
        card.nextReview = setNextReview(10, "minutes");
      } else {
        // SM-2 logic
        const updated = sm2(card, rating);

        const lapseFactor = card.lapses > 0 ? Math.pow(0.9, card.lapses) : 1;
        card.repetition = updated.repetition;
        card.interval = Math.max(1, Math.round(updated.interval * lapseFactor));
        card.easeFactor = updated.easeFactor;
        card.nextReview = setNextReview(card.interval, "days");
        if (card.interval > 21) card.tag = "Mature";
        else card.tag = "Young";
        card.lapses = 0;
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
