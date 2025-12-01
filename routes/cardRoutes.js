const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  createCard,
  getCards,
  updateCard,
  deleteCard,
  getCardCount,
} = require("../controllers/cardController");

router.post("/", authMiddleware, createCard);
router.get("/:deckID", authMiddleware, getCards);
router.put("/:cardID", authMiddleware, updateCard);
router.delete("/:cardID", authMiddleware, deleteCard);
router.get("/count/:deckID", authMiddleware, getCardCount);

module.exports = router;
