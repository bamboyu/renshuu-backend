const Card = require("../models/Card");

// Create a new card
async function createCard(req, res) {
  const { deckID, front, back, tag } = req.body;

  try {
    const card = await Card.create({
      deckID,
      front,
      back,
      image: req.files?.image ? req.files.image[0].location : null, // S3 URL
      sound: req.files?.sound ? req.files.sound[0].location : null, // S3 URL
      tag: tag || "New",
      repetition: 0,
      easeFactor: 2.5,
      interval: 0,
      nextReview: new Date(),
    });

    res.status(201).json(card);
  } catch (err) {
    console.error("Create Card Error:", err);
    res.status(500).json({ message: "Server error" });
  }
}

// Get all cards in a deck
async function getCards(req, res) {
  const { deckID } = req.params;
  try {
    const cards = await Card.find({ deckID });
    res.json(cards);
  } catch (err) {
    console.error("Get Cards Error:", err);
    res.status(500).json({ message: "Server error" });
  }
}

// Get a single card by ID
async function getCardByID(req, res) {
  const { cardID } = req.params;

  try {
    const card = await Card.findById(cardID);
    if (!card) return res.status(404).json({ message: "Card not found" });
    res.json(card);
  } catch (err) {
    console.error("Get Card Error:", err);
    res.status(500).json({ message: "Server error" });
  }
}

// Update card (front/back edits)
async function updateCard(req, res) {
  const { cardID } = req.params;
  const { front, back, tag } = req.body;

  try {
    const card = await Card.findById(cardID);
    if (!card) return res.status(404).json({ message: "Card not found" });

    // Update fields
    if (front !== undefined) card.front = front;
    if (back !== undefined) card.back = back;
    if (tag !== undefined) card.tag = tag;

    // Update files if new ones are uploaded
    if (req.files?.image) card.image = req.files.image[0].location;
    if (req.files?.sound) card.sound = req.files.sound[0].location;

    await card.save();

    res.json(card);
  } catch (err) {
    console.error("Update Card Error:", err);
    res.status(500).json({ message: "Server error" });
  }
}

// Delete card
async function deleteCard(req, res) {
  const { cardID } = req.params;

  try {
    const card = await Card.findByIdAndDelete(cardID);
    if (!card) return res.status(404).json({ message: "Card not found" });

    res.json({ message: "Deleted successfully" });
  } catch (err) {
    console.error("Delete Card Error:", err);
    res.status(500).json({ message: "Server error" });
  }
}

// Count cards in a deck
async function getCardCount(req, res) {
  const { deckID } = req.params;

  try {
    const count = await Card.countDocuments({ deckID });
    res.json({ deckID, count });
  } catch (err) {
    console.error("Get Card Count Error:", err);
    res.status(500).json({ message: "Server error" });
  }
}

module.exports = {
  createCard,
  getCards,
  updateCard,
  deleteCard,
  getCardCount,
  getCardByID,
};
