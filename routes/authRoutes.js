const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  signup,
  login,
  refreshToken,
  logout,
} = require("../controllers/authController");

router.post("/signup", signup);
router.post("/login", login);
router.post("/token", refreshToken);
router.post("/logout", authMiddleware, logout);

module.exports = router;
