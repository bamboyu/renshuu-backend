const Deck = require("../models/Deck");
const Card = require("../models/Card");
const { DeleteObjectsCommand } = require("@aws-sdk/client-s3");
const s3 = require("../config/aws");

// Create a new deck
async function createDeck(req, res) {
  const { name } = req.body;

  const userID = req.user.id;

  if (!name) {
    return res.status(400).json({ message: "Missing deck name" });
  }

  try {
    const deck = await Deck.create({ name, userID });
    res.status(201).json(deck);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
}

// Get all decks for a user
async function getDecks(req, res) {
  const userID = req.user.id;

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
  const { name } = req.body;

  try {
    const deck = await Deck.findByIdAndUpdate(deckID, { name }, { new: true });
    if (!deck) return res.status(404).json({ message: "Deck not found" });
    res.json(deck);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
}

// Delete a deck and all its cards
async function deleteDeck(req, res) {
  const { deckID } = req.params;

  try {
    // 1. Check if deck exists
    const deck = await Deck.findById(deckID);
    if (!deck) {
      return res.status(404).json({ message: "Deck not found" });
    }

    // 2. Find all cards in this deck to get their file URLs
    const cards = await Card.find({ deckID: deckID });

    // 3. Collect all S3 Keys (images and sounds)
    let objectsToDelete = [];

    cards.forEach((card) => {
      // Handle Image
      if (card.image) {
        const key = decodeURIComponent(
          card.image.split("/").pop().split("?")[0]
        );
        objectsToDelete.push({ Key: key });
      }
      // Handle Sound
      if (card.sound) {
        const key = decodeURIComponent(
          card.sound.split("/").pop().split("?")[0]
        );
        objectsToDelete.push({ Key: key });
      }
    });

    // 4. Delete from S3 (Only if there are files to delete)
    if (objectsToDelete.length > 0) {
      try {
        const command = new DeleteObjectsCommand({
          Bucket: process.env.S3_BUCKET_NAME,
          Delete: {
            Objects: objectsToDelete, // Array of { Key: '...' }
          },
        });
        await s3.send(command);
        console.log(
          `Successfully deleted ${objectsToDelete.length} files from S3.`
        );
      } catch (s3Err) {
        console.error("Error deleting files from S3:", s3Err);
      }
    }

    // 5. Delete all cards in the deck from DB
    await Card.deleteMany({ deckID: deckID });

    // 6. Delete the deck from DB
    await Deck.findByIdAndDelete(deckID);

    res.json({
      message: "Deck, cards, and associated files deleted successfully",
    });
  } catch (err) {
    console.error("Delete Deck Error:", err);
    res.status(500).json({ message: "Failed to delete deck" });
  }
}

module.exports = { createDeck, getDecks, updateDeck, deleteDeck };
