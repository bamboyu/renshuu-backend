// Dependencies
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");
const path = require("path");
const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

// Route files
const authRoutes = require("./routes/authRoutes");
const deckRoutes = require("./routes/deckRoutes");
const cardRoutes = require("./routes/cardRoutes");
const studyRoutes = require("./routes/studyRoutes");
const generateRoutes = require("./routes/generateRoutes");

// Initialize app
const app = express();
const PORT = process.env.PORT || 5000;

// Swagger setup
const swaggerOptions = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title: "Flashcard API",
      version: "1.0.0",
      description: "API Documentation for Renshuu Flashcards",
    },
    servers: [
      {
        url: process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`,
        description: "Server",
      },
    ],
  },
  apis: ["./swagger.yaml"],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

// Middleware
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://renshuu-cu712u8v0-bamboyus-projects.vercel.app",
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/deck", deckRoutes);
app.use("/api/card", cardRoutes);
app.use("/api/study", studyRoutes);
app.use("/api/generate", generateRoutes);

// Swagger route
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Start server after DB connection
connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err);
  });
