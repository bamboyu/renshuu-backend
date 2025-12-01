const Card = require("../models/Card");

// Create a new card
async function createCard(req, res) {
  const { deckID, front, back, image, sound } = req.body;

  if (!deckID || !front || !back) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const card = await Card.create({
      deckID,
      front,
      back,
      image,
      sound,
      repetition: 0,
      easeFactor: 2.5,
      interval: 0,
      nextReview: new Date(),
      tag: "New",
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

// Update card (front/back edits)
async function updateCard(req, res) {
  const { cardID } = req.params;
  const { front, back, image, sound } = req.body;

  try {
    const card = await Card.findByIdAndUpdate(
      cardID,
      { front, back, image, sound },
      { new: true }
    );

    if (!card) return res.status(404).json({ message: "Card not found" });

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
};
