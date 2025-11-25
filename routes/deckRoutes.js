const express = require("express");
const router = express.Router();
const {
  createDeck,
  getDeck,
  updateDeck,
  deleteDeck,
} = require("../controllers/deckController");

router.post("/", createDeck);
router.get("/:userID", getDeck);
router.put("/:deckID", updateDeck);
router.delete("/:deckID", deleteDeck);

module.exports = router;
