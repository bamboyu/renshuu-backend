const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

const {
  createCard,
  getCards,
  updateCard,
  deleteCard,
  getCardCount,
} = require("../controllers/cardController");

// Create card
router.post(
  "/",
  authMiddleware,
  upload.fields([{ name: "image" }, { name: "sound" }]),
  createCard
);

// Get all cards in a deck
router.get("/:deckID", authMiddleware, getCards);

// Update card
router.put(
  "/:cardID",
  authMiddleware,
  upload.fields([{ name: "image" }, { name: "sound" }]),
  updateCard
);

// Delete card
router.delete("/:cardID", authMiddleware, deleteCard);

// Get card count in a deck
router.get("/count/:deckID", authMiddleware, getCardCount);

module.exports = router;
