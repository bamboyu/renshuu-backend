const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { optimizeDeckWeights } = require("../controllers/optimizerController");

router.post("/optimize/:deckID", authMiddleware, optimizeDeckWeights);

module.exports = router;
