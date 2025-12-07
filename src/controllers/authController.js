const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const User = require("../models/User");

const SECRET_KEY = process.env.SECRET_KEY;

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

    const accessToken = jwt.sign({ email, id: user._id }, SECRET_KEY, {
      expiresIn: "19y",
    });

    res.json({
      message: "Login successful",
      accessToken,
      user: { id: user._id, email: user.email },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
}

// Logout
async function logout(req, res) {
  res.json({ message: "Logged out successfully" });
}

// Update Account
async function updateAccount(req, res) {
  const userId = req.user.id;
  const { email, currentPassword, newPassword } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Verify Current Password (Required for security)
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect current password" });
    }

    // Update Email if changed
    if (email && email !== user.email) {
      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(400).json({ message: "Email already in use" });
      }
      user.email = email;
    }

    // Update Password if provided
    if (newPassword) {
      const hashed = await bcrypt.hash(newPassword, 10);
      user.password = hashed;
    }

    await user.save();

    res.json({
      message: "Account updated successfully",
      user: { id: user._id, email: user.email },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
}

// Request Password Reset
async function forgotPassword(req, res) {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.json({
        message: "If that email exists, a reset link has been sent.",
      });
    }

    // Generate token
    const token = crypto.randomBytes(20).toString("hex");

    // Set token and expiration (1 hour)
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000;

    await user.save();

    // Send Email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const frontendUrl = process.env.CLIENT_URL || "http://localhost:5173";

    // Email options
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Password Reset - Renshuu",
      text: `You are receiving this because you have requested the reset of the password for your account.\n\n
Please click on the following link, or paste this into your browser to complete the process:\n\n
${frontendUrl}/reset-password/${token}\n\n
If you did not request this, please ignore this email and your password will remain unchanged.\n`,
    };

    await transporter.sendMail(mailOptions);

    res.json({ message: "Password reset link sent to email" });
  } catch (err) {
    console.error("Forgot Password Error:", err);
    res.status(500).json({ message: "Server error sending email" });
  }
}

// Reset Password with Token
async function resetPassword(req, res) {
  const { token } = req.params;
  const { newPassword } = req.body;

  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Token is invalid or has expired" });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;

    await user.save();

    res.json({ message: "Password has been reset successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
}

module.exports = {
  signup,
  login,
  logout,
  updateAccount,
  forgotPassword,
  resetPassword,
};
