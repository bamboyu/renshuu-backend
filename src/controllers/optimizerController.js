const Deck = require("../models/Deck");
const Card = require("../models/Card");
const ReviewLog = require("../models/Reviewlog");
const mongoose = require("mongoose");

const {
  computeParameters,
  convertCsvToFsrsItems,
} = require("@open-spaced-repetition/binding");

async function optimizeDeckWeights(req, res) {
  const { deckID } = req.params;

  try {
    const deck = await Deck.findById(deckID);
    if (!deck) return res.status(404).json({ message: "Deck not found" });

    // 1. Fetch all cards in this deck
    const cards = await Card.find({ deckID }).select("_id");
    const cardIds = cards.map((c) => c._id);
    console.log(`[Optimizer] Found ${cardIds.length} cards`);

    // 2. Fetch all review logs sorted chronologically
    const rawLogs = await ReviewLog.find({ cardID: { $in: cardIds } })
      .sort({ cardID: 1, review_date: 1 })
      .allowDiskUse(true)
      .maxTimeMS(60000)
      .lean();
    console.log(`[Optimizer] Found ${rawLogs.length} review logs`);

    if (rawLogs.length < 500) {
      return res.status(400).json({
        message: `Not enough data to optimize. You need at least 500 reviews. (Currently have ${rawLogs.length})`,
      });
    }

    const stateCounts = {};
    for (const log of rawLogs) {
      const s = log.state ?? "null";
      stateCounts[s] = (stateCounts[s] || 0) + 1;
    }
    console.log(`[Optimizer] State distribution:`, stateCounts);

    // 3. Build CSV in memory from MongoDB logs
    const csvLines = [
      "card_id,review_time,review_rating,review_state,review_duration",
    ];
    for (const log of rawLogs) {
      const cardId = log.cardID.toString();
      const reviewTime = Math.floor(new Date(log.review_date).getTime() / 1000);
      const rating = log.rating;
      const state = log.state ?? 2;
      const duration = 0;
      csvLines.push(`${cardId},${reviewTime},${rating},${state},${duration}`);
    }

    const csvBuffer = Buffer.from(csvLines.join("\n"), "utf-8");
    console.log(`[Optimizer] Generated CSV: ${csvLines.length - 1} rows`);

    // 4. Convert CSV to FSRS items
    const getTimezoneOffset = (ms, timeZone) => {
      const formatter = new Intl.DateTimeFormat("ia", {
        timeZone,
        timeZoneName: "shortOffset",
      });
      const timeZoneName = formatter
        .formatToParts(ms)
        .find((part) => part.type === "timeZoneName")?.value;

      if (!timeZoneName || timeZoneName === "GMT" || timeZoneName === "UTC") {
        return 0;
      }

      const [, sign, hours, minutes = "0"] =
        timeZoneName.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/) ?? [];

      if (!sign || !hours) return 0;

      const totalMinutes = Number(hours) * 60 + Number(minutes);
      return sign === "+" ? totalMinutes : -totalMinutes;
    };

    const items = convertCsvToFsrsItems(
      csvBuffer,
      4, // 4 rating options
      "Asia/Ho_Chi_Minh", // your timezone
      getTimezoneOffset,
    );
    console.log(`[Optimizer] Converted ${items.length} FSRS items`);

    if (items.length < 100) {
      return res.status(400).json({
        message: `Not enough valid FSRS items after conversion. Got ${items.length}, need at least 100.`,
      });
    }

    // 5. Run the optimizer
    console.log(`[Optimizer] Running computeParameters...`);
    const optimizationResult = await computeParameters(items, {
      enableShortTerm: true,
      numRelearningSteps: 1,
      timeout: 600000,
      progress: (current, total) => {
        console.log(`[Optimizer] Progress: ${current}/${total}`);
      },
    });
    console.log(`[Optimizer] Done! Weights:`, optimizationResult);

    // 6. Save the new weights to the Deck
    deck.fsrs_params.weights = optimizationResult;
    await deck.save();

    res.json({
      message: "Weights optimized successfully!",
      new_weights: deck.fsrs_params.weights,
    });
  } catch (err) {
    console.error("[Optimizer] ERROR:", err);
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
        _id: cardId,
        deckID,
        front: "Anki Import",
        back: "Anki Import",
        tag: "Mature",
      });

      // 3. Prepare all logs associated with this card
      cardHistory.forEach((entry, index) => {
        reviewLogsToInsert.push({
          cardID: cardId,
          rating: entry.rating,
          review_date: new Date(entry.review_date),
          state: index === 0 ? 0 : 2,
        });
      });
    }

    // 4. Bulk Insert everything at once (2 database calls total)
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
