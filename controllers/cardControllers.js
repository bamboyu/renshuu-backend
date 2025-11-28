const Card = require("../models/Card");

// Create a new card
async function createCard(req, res) {
  const { deckID, front, back, image, sound, tag, interval } = req.body;

  if (!deckID || !front || !back)
    return res.status(400).json({ message: "Missing required fields" });

  try {
    const card = await Card.create({
      deckID,
      front,
      back,
      image,
      sound,
      tag,
      interval,
    });

    res.status(201).json(card);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
}

// Get all cards in a deck
async function getCardsInDeck(req, res) {
  const { deckID } = req.params;
  try {
    const cards = await Card.find({ deckID });
    res.json(cards);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
}

// Update card
async function updateCard(req, res) {
  const { cardID } = req.params;
  const { front, back, image, sound, tag, interval } = req.body;
  try {
    const card = await Card.findByIdAndUpdate(
      cardID,
      { front, back, image, sound, tag, interval },
      { new: true }
    );
    if (!card) return res.status(404).json({ message: "Card not found" });
    res.json(card);
  } catch (err) {
    console.error(err);
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
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
}

module.exports = { createCard, getCardsInDeck, updateCard, deleteCard };
