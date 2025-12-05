const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  generateBack,
  generateImage,
} = require("../controllers/generateController");

router.post("/back", authMiddleware, generateBack);
router.post("/image", authMiddleware, generateImage);

module.exports = router;
