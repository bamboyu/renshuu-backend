const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  optimizeDeckWeights,
  importAnkiLogs,
} = require("../controllers/optimizerController");

router.post("/optimize/:deckID", authMiddleware, optimizeDeckWeights);
router.post("/import-logs/:deckID", authMiddleware, importAnkiLogs);

module.exports = router;
