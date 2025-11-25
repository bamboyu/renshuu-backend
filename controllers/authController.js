// /controllers/authController.js
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("../models/User");

const SECRET_KEY = process.env.SECRET_KEY || "09052005";

// Signup
async function signup(req, res) {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ message: "Missing email or password" });

  try {
    const existing = await User.findOne({ email });
    if (existing)
      return res.status(400).json({ message: "Email already exists" });

    const hashed = await bcrypt.hash(password, 10);

    await User.create({
      email,
      password: hashed,
    });

    res.status(201).json({ message: "User created successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
}

// Login
async function login(req, res) {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid login" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid login" });

    const accessToken = jwt.sign({ email }, SECRET_KEY, { expiresIn: "1h" });
    const refreshToken = jwt.sign({ email }, SECRET_KEY, { expiresIn: "10y" });

    user.refreshToken = refreshToken;
    await user.save();

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "Strict",
      secure: false,
      path: "/api/auth/token",
      maxAge: 10 * 365 * 24 * 60 * 60 * 1000,
    });

    res.json({ message: "Login successful", accessToken });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
}

// Refresh Access Token
async function refreshToken(req, res) {
  const token = req.cookies.refreshToken;

  if (!token) return res.status(401).json({ message: "No refresh token" });

  try {
    const decoded = jwt.decode(token);
    const user = await User.findOne({ email: decoded.email });

    if (!user || user.refreshToken !== token)
      return res.status(403).json({ message: "Invalid refresh token" });

    jwt.verify(token, SECRET_KEY, (err) => {
      if (err) return res.status(403).json({ message: "Invalid token" });

      const newAccessToken = jwt.sign({ email: user.email }, SECRET_KEY, {
        expiresIn: "1h",
      });

      res.json({ accessToken: newAccessToken });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
}

// Logout
async function logout(req, res) {
  const token = req.cookies.refreshToken;

  if (token) {
    const decoded = jwt.decode(token);
    await User.updateOne({ email: decoded.email }, { refreshToken: null });
  }

  res.clearCookie("refreshToken", { path: "/api/auth/token" });
  res.json({ message: "Logged out successfully" });
}

module.exports = { signup, login, refreshToken, logout };
