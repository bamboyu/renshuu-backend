const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  createDeck,
  getDecks,
  updateDeck,
  deleteDeck,
} = require("../controllers/deckController");

router.post("/", authMiddleware, createDeck);
router.get("/", authMiddleware, getDecks);
router.put("/:deckID", authMiddleware, updateDeck);
router.delete("/:deckID", authMiddleware, deleteDeck);

module.exports = router;
