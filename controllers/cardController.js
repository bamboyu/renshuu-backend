const Card = require("../models/Card");
const { DeleteObjectCommand } = require("@aws-sdk/client-s3");
const s3 = require("../config/aws");

// Helper function to delete a file from S3
const deleteFromS3 = async (fileUrl) => {
  if (!fileUrl) return;

  try {
    // 1. Extract filename from URL
    // 2. Remove query params if any
    const rawFilename = fileUrl.split("/").pop().split("?")[0];

    // 3. Decode special chars
    const key = decodeURIComponent(rawFilename);

    console.log(`[S3 Delete] Removing old file: ${key}`);

    await s3.send(
      new DeleteObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: key,
      })
    );
  } catch (err) {
    console.error(`[S3 Delete Error] Could not delete ${fileUrl}:`, err);
  }
};

// Create a new card
async function createCard(req, res) {
  const { deckID, front, back, tag } = req.body;

  try {
    // Handle optional file uploads
    const image =
      req.files && req.files.image
        ? req.files.image[0].location
        : req.body.image || null;

    const sound =
      req.files && req.files.sound
        ? req.files.sound[0].location
        : req.body.sound || null;

    const card = await Card.create({
      deckID,
      front,
      back,
      image, // Saves either the S3 URL from upload OR the AI URL
      sound,
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

    // Update text fields
    if (front !== undefined) card.front = front;
    if (back !== undefined) card.back = back;
    if (tag !== undefined) card.tag = tag;

    // Handle image update
    if (req.files && req.files.image) {
      // If there is an existing image, delete it from AWS
      if (card.image) {
        await deleteFromS3(card.image);
      }
      // Set the new image URL
      card.image = req.files.image[0].location;
    } else if (req.body.image && req.body.image !== card.image) {
      // Handle case where frontend sends a URL string
      if (card.image) {
        await deleteFromS3(card.image);
      }
      card.image = req.body.image;
    }

    // Handle sound update
    if (req.files && req.files.sound) {
      // If there is an existing sound, delete it from AWS
      if (card.sound) {
        await deleteFromS3(card.sound);
      }
      // Set the new sound URL
      card.sound = req.files.sound[0].location;
    } else if (req.body.sound && req.body.sound !== card.sound) {
      if (card.sound) {
        await deleteFromS3(card.sound);
      }
      card.sound = req.body.sound;
    }

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

    // Use helper to delete image and sound from S3
    await deleteFromS3(card.image);
    await deleteFromS3(card.sound);

    // Delete the card from DB
    await Card.findByIdAndDelete(cardID);

    res.json({ message: "Card deleted successfully" });
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
