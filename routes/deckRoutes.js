const express = require("express");
const router = express.Router();
const {
  createDeck,
  getDeck,
  updateDeck,
  deleteDeck,
} = require("../controllers/deckController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/", authMiddleware, createDeck);
router.get("/:userID", authMiddleware, getDeck);
router.put("/:deckID", authMiddleware, updateDeck);
router.delete("/:deckID", authMiddleware, deleteDeck);

module.exports = router;
