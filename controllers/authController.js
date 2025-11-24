const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const {
  createUser,
  findUserByEmail,
  updateRefreshToken,
} = require("../models/userModel");

const SECRET_KEY = process.env.SECRET_KEY || "09052005";

// Signup
async function signup(req, res) {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).send({ message: "Missing email or password" });

  try {
    const existingUser = await findUserByEmail(email);
    if (existingUser)
      return res.status(400).send({ message: "Email already exists" });

    await createUser(email, password);

    res.status(201).send({ message: "User created successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Server error", error: err.message });
  }
}

// Login
async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).send({ message: "Missing email or password" });

  try {
    const user = await findUserByEmail(email);
    if (!user)
      return res.status(400).send({ message: "Invalid email or password" });

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid)
      return res.status(400).send({ message: "Invalid email or password" });

    // Access token (short-lived)
    const accessToken = jwt.sign({ email }, SECRET_KEY, { expiresIn: "1h" });

    // Refresh token (long-lived)
    const refreshToken = jwt.sign({ email }, SECRET_KEY, { expiresIn: "10y" });

    // Save refresh token in DB
    await updateRefreshToken(email, refreshToken);

    // Set HttpOnly cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false, // true in production with HTTPS
      sameSite: "Strict",
      path: "/api/auth/token",
      maxAge: 10 * 365 * 24 * 60 * 60 * 1000, // 10 years
    });

    res.send({ message: "Login successful", accessToken });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Server error", error: err.message });
  }
}

// Refresh token
async function refreshToken(req, res) {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken)
    return res.status(401).send({ message: "No token provided" });

  try {
    const user = await findUserByEmail(jwt.decode(refreshToken)?.email);
    if (!user || user.refreshToken !== refreshToken)
      return res.status(403).send({ message: "Invalid refresh token" });

    jwt.verify(refreshToken, SECRET_KEY, (err) => {
      if (err) return res.status(403).send({ message: "Invalid token" });

      const newAccessToken = jwt.sign({ email: user.email }, SECRET_KEY, {
        expiresIn: "1h",
      });
      res.send({ accessToken: newAccessToken });
    });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Server error", error: err.message });
  }
}

// Logout
async function logout(req, res) {
  const refreshToken = req.cookies.refreshToken;
  if (refreshToken) {
    try {
      const user = await findUserByEmail(jwt.decode(refreshToken)?.email);
      if (user) {
        await updateRefreshToken(user.email, null);
      }
    } catch (err) {
      console.error(err);
    }
  }

  res.clearCookie("refreshToken", { path: "/api/auth/token" });
  res.send({ message: "Logged out successfully" });
}

module.exports = { signup, login, refreshToken, logout };
