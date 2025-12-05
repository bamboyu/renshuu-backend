const express = require("express");
const router = express.Router();
const { getNextCard, reviewCard } = require("../controllers/studyControllers");
const authMiddleware = require("../middleware/authMiddleware");

// Get next due card in a deck
router.get("/:deckID", authMiddleware, getNextCard);

// Review a card (SM2)
router.post("/review/:cardID", authMiddleware, reviewCard);

module.exports = router;
