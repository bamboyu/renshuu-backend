const Card = require("../models/Card");
const Deck = require("../models/Deck");
const ReviewLog = require("../models/Reviewlog");
const sm2 = require("../services/sm2");
const { fsrs } = require("ts-fsrs");

// Default review time (all cards due same time)
const DEFAULT_REVIEW_HOUR = 24; // Midnight
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

// Helper to graduate a card (SM-2)
function graduateCard(card) {
  card.tag = "Young";
  card.repetition = 1;
  card.interval = 1;
  card.easeFactor = 2.5;
  card.nextReview = setNextReview(card.interval, "days");
}

// Get estimated next review times for all ratings
const getEstimates = (card, deck) => {
  const estimates = {};

  // -- FSRS ESTIMATES --
  if (deck && deck.algorithm === "FSRS") {
    const f = fsrs({
      w: deck.fsrs_params?.weights,
      request_retention: deck.fsrs_params?.request_retention || 0.9,
      maximum_interval: deck.fsrs_params?.maximum_interval || 36500,
    });

    const fsrsCard = {
      stability: card.stability || 0,
      difficulty: card.difficulty || 0,
      elapsed_days: card.elapsed_days || 0,
      scheduled_days: card.scheduled_days || 0,
      reps: card.reps || 0,
      lapses: card.lapses || 0,
      state: card.state || 0,
      last_review: card.last_review || new Date(),
    };

    const now = new Date();
    const schedulingCards = f.repeat(fsrsCard, now);

    // Map the ratings 0-3 to the FSRS 1-4 results
    [0, 1, 2, 3].forEach((rating) => {
      const fsrsRating = rating + 1; // 1:Again, 2:Hard, 3:Good, 4:Easy
      const resultCard = schedulingCards[fsrsRating].card;

      if (resultCard.scheduled_days === 0) {
        // If scheduled days is 0, calculate the minutes until 'due'
        const diffMins = Math.round(
          (resultCard.due.getTime() - now.getTime()) / 60000,
        );
        estimates[rating] = formatTime(Math.max(1, diffMins), "minutes");
      } else {
        estimates[rating] = formatTime(resultCard.scheduled_days, "days");
      }
    });

    return estimates;
  }

  // -- SM-2 ESTIMATES --
  [0, 1, 2, 3].forEach((rating) => {
    let result = "";
    const tempCard = {
      tag: card.tag,
      lapses: card.lapses,
      interval: card.interval,
      repetition: card.repetition,
      easeFactor: card.easeFactor,
      learningStep: card.learningStep,
      learningSteps: card.learningSteps || [1, 5, 10],
    };

    if (tempCard.tag === "New" || tempCard.tag === "Learning") {
      const isRelearning = tempCard.lapses > 0;
      if (isRelearning) {
        if (rating === 0) result = formatTime(10, "minutes");
        else {
          const updated = sm2(tempCard, rating);
          const lapseFactor =
            tempCard.lapses > 0 ? Math.pow(0.9, tempCard.lapses) : 1;
          const newInterval = Math.max(
            1,
            Math.round(updated.interval * lapseFactor),
          );
          result = formatTime(newInterval, "days");
        }
      } else {
        if (rating === 0) {
          result = formatTime(tempCard.learningSteps[0], "minutes");
        } else if (rating === 1) {
          const nextStep = tempCard.learningStep + 1;
          result =
            nextStep >= tempCard.learningSteps.length
              ? formatTime(1, "days")
              : formatTime(tempCard.learningSteps[nextStep], "minutes");
        } else if (rating === 2) {
          const nextStep = tempCard.learningStep + 2;
          result =
            nextStep >= tempCard.learningSteps.length
              ? formatTime(1, "days")
              : formatTime(tempCard.learningSteps[nextStep], "minutes");
        } else {
          result = formatTime(3, "days");
        }
      }
    } else {
      if (rating === 0) {
        result = formatTime(10, "minutes");
      } else {
        const updated = sm2(tempCard, rating);
        const lapseFactor =
          tempCard.lapses > 0 ? Math.pow(0.9, tempCard.lapses) : 1;
        const newInterval = Math.max(
          1,
          Math.round(updated.interval * lapseFactor),
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
    const deck = await Deck.findById(deckID);
    if (!deck) return res.status(404).json({ message: "Deck not found" });

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

    const estimates = getEstimates(card, deck);

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
    const card = await Card.findById(cardID).populate("deckID");
    if (!card) return res.status(404).json({ message: "Card not found" });

    const deck = card.deckID;
    const now = new Date();

    if (deck.algorithm === "FSRS") {
      // --- FSRS LOGIC ---
      const f = fsrs({
        w: deck.fsrs_params?.weights,
        request_retention: deck.fsrs_params?.request_retention || 0.9,
        maximum_interval: deck.fsrs_params?.maximum_interval || 36500,
      });

      const fsrsCard = {
        stability: card.stability || 0,
        difficulty: card.difficulty || 0,
        elapsed_days: card.elapsed_days || 0,
        scheduled_days: card.scheduled_days || 0,
        reps: card.reps || 0,
        lapses: card.lapses || 0,
        state: card.state || 0,
        last_review: card.last_review || now,
      };

      const fsrsRating = rating + 1; // Map 0-3 to 1-4
      const schedulingCards = f.repeat(fsrsCard, now);
      const { card: updatedFSRSCard } = schedulingCards[fsrsRating];

      // Create Review Log for future optimizations
      const reviewLog = new ReviewLog({
        cardID: card._id,
        rating: fsrsRating,
        state: fsrsCard.state,
        due: card.nextReview,
        stability: fsrsCard.stability,
        difficulty: fsrsCard.difficulty,
        elapsed_days: updatedFSRSCard.elapsed_days,
        scheduled_days: updatedFSRSCard.scheduled_days,
        review_date: now,
      });
      await reviewLog.save();

      // Apply FSRS updates to DB Card
      Object.assign(card, {
        stability: updatedFSRSCard.stability,
        difficulty: updatedFSRSCard.difficulty,
        elapsed_days: updatedFSRSCard.elapsed_days,
        scheduled_days: updatedFSRSCard.scheduled_days,
        reps: updatedFSRSCard.reps,
        lapses: updatedFSRSCard.lapses,
        state: updatedFSRSCard.state,
        last_review: updatedFSRSCard.last_review,
        nextReview: updatedFSRSCard.due,
      });

      // Keep tags synced for frontend visual consistency
      if (card.state === 0) card.tag = "New";
      else if (card.state === 1 || card.state === 3) card.tag = "Learning";
      else if (card.state === 2)
        card.tag = card.scheduled_days > 21 ? "Mature" : "Young";
    } else {
      // --- SM-2 LOGIC ---
      if (card.tag === "New" || card.tag === "Learning") {
        const isRelearning = card.lapses > 0;

        if (isRelearning) {
          if (rating === 0) {
            card.nextReview = setNextReview(10, "minutes");
            card.lapses += 1;
          } else {
            const updated = sm2(card, rating);
            const lapseFactor =
              card.lapses > 0 ? Math.pow(0.9, card.lapses) : 1;
            card.repetition = updated.repetition;
            card.interval = Math.max(
              1,
              Math.round(updated.interval * lapseFactor),
            );
            card.easeFactor = updated.easeFactor;
            card.nextReview = setNextReview(card.interval, "days");
            if (card.interval > 21) card.tag = "Mature";
            else card.tag = "Young";
          }
        } else {
          if (card.tag === "New") card.tag = "Learning";

          if (rating === 0) {
            card.learningStep = 0;
            card.nextReview = setNextReview(
              card.learningSteps[card.learningStep],
              "minutes",
            );
          } else if (rating === 1) {
            card.learningStep += 1;
            if (card.learningStep >= card.learningSteps.length)
              graduateCard(card);
            else
              card.nextReview = setNextReview(
                card.learningSteps[card.learningStep],
                "minutes",
              );
          } else if (rating === 2) {
            card.learningStep += 2;
            if (card.learningStep >= card.learningSteps.length)
              graduateCard(card);
            else
              card.nextReview = setNextReview(
                card.learningSteps[card.learningStep],
                "minutes",
              );
          } else {
            card.tag = "Young";
            card.repetition = 1;
            card.interval = 3;
            card.easeFactor = 2.5;
            card.nextReview = setNextReview(card.interval, "days");
          }
        }
      } else {
        if (rating === 0) {
          card.tag = "Learning";
          card.lapses += 1;
          card.interval = Math.max(
            1,
            Math.round(card.interval * Math.pow(0.5, card.lapses)),
          );
          card.nextReview = setNextReview(10, "minutes");
        } else {
          const updated = sm2(card, rating);
          const lapseFactor = card.lapses > 0 ? Math.pow(0.9, card.lapses) : 1;
          card.repetition = updated.repetition;
          card.interval = Math.max(
            1,
            Math.round(updated.interval * lapseFactor),
          );
          card.easeFactor = updated.easeFactor;
          card.nextReview = setNextReview(card.interval, "days");
          if (card.interval > 21) card.tag = "Mature";
          else card.tag = "Young";
          card.lapses = 0;
        }
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
