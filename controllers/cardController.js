const Card = require("../models/Card");
const { DeleteObjectCommand } = require("@aws-sdk/client-s3");
const s3 = require("../config/aws");

// Create a new card
async function createCard(req, res) {
  const { deckID, front, back, tag } = req.body;

  try {
    const card = await Card.create({
      deckID,
      front,
      back,
      image: req.files?.image ? req.files.image[0].location : null,
      sound: req.files?.sound ? req.files.sound[0].location : null,
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

// Delete a card
async function deleteCard(req, res) {
  const { cardID } = req.params;

  try {
    const card = await Card.findById(cardID);
    if (!card) {
      return res.status(404).json({ message: "Card not found" });
    }

    // Helper function to extract key from URL and delete from S3
    const deleteFromS3 = async (fileUrl) => {
      if (!fileUrl) return;

      try {
        // Split the URL to get the filename
        const rawFilename = fileUrl.split("/").pop();

        // DECODE the filename
        const fileKey = decodeURIComponent(rawFilename);

        console.log(`Attempting to delete Key: ${fileKey}`); // Debug log

        await s3.send(
          new DeleteObjectCommand({
            Bucket: process.env.S3_BUCKET_NAME,
            Key: fileKey,
          })
        );
        console.log(`Deleted S3 object: ${fileKey}`);
      } catch (s3Err) {
        console.error(`Failed to delete S3 object`, s3Err);
      }
    };

    // Delete image from S3 if it exists
    if (card.image) {
      await deleteFromS3(card.image);
    }

    // Delete sound from S3 if it exists
    if (card.sound) {
      await deleteFromS3(card.sound);
    }

    // Delete the card from DB
    await Card.findByIdAndDelete(cardID);

    res.json({ message: "Card and associated files deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete card" });
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
