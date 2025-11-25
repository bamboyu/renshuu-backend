const Deck = require("../models/Deck");

// Create a new deck
async function createDeck(req, res) {
  const { name, userID } = req.body;

  if (!name || !userID)
    return res.status(400).json({ message: "Missing name or UserID" });

  try {
    const deck = await Deck.create({ name, userID });
    res.status(201).json(deck);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
}

// Get all decks for a user
async function getDeck(req, res) {
  const { userID } = req.params;

  try {
    const deck = await Deck.find({ userID });
    res.json(deck);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
}

// Update deck
async function updateDeck(req, res) {
  const { deckID } = req.params;
  const { name } = req.req;

  try {
    const deck = await Deck.findByIdAndUpdate(deckID, { name }, { new: true });
    if (!deck) return res.status(404).json({ message: "Deck not found" });
    res.json(deck);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
}

// Delete deck
async function deleteDeck(req, res) {
  const { deckID } = req.params;

  try {
    const deck = await Deck.findByIdAndDelete(deckID);
    if (!deck) return res.status(404).json({ message: "Deck not found" });
    res.json({ message: "Deleted succesfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
}

module.exports = { createDeck, getDeck, updateDeck, deleteDeck };
