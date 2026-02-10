const express = require("express");
const path = require("path");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const { connectDB } = require("./src/config/db");
const apiRoutes = require("./src/routes");
const { notFound } = require("./src/middleware/notFound");
const { errorHandler } = require("./src/middleware/errorHandler");

const app = express();

// --- Security & basic middleware ---
app.use(helmet());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false }));

// CORS (allow your frontend origin)
const origin = process.env.CLIENT_ORIGIN || "*";
app.use(cors({ origin, credentials: true }));

// Logging
if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

// Rate limit for auth routes (basic protection)
const authLimiter = rateLimit({
  windowMs: (Number(process.env.AUTH_RATE_LIMIT_WINDOW_MIN) || 15) * 60 * 1000,
  max: Number(process.env.AUTH_RATE_LIMIT_MAX) || 50,
  standardHeaders: true,
  legacyHeaders: false,
});

// --- Static web client (simple Wordle UI) ---
app.use(express.static(path.join(__dirname, "public")));

// --- API ---
app.use("/api/auth", authLimiter);
app.use("/api", apiRoutes);

// Aliases to match the assignment wording exactly (optional but helpful)
app.use("/register", authLimiter, (req, res, next) => {
  req.url = "/auth/register";
  next();
}, apiRoutes);
app.use("/login", authLimiter, (req, res, next) => {
  req.url = "/auth/login";
  next();
}, apiRoutes);
app.use("/users", (req, res, next) => {
  req.url = "/users" + req.url;
  next();
}, apiRoutes);
app.use("/resource", (req, res, next) => {
  // In this project, "resource" = game sessions
  req.url = "/games" + req.url;
  next();
}, apiRoutes);

// Health check (useful for deployment)
app.get("/health", (req, res) => res.json({ ok: true, uptime: process.uptime() }));

// SPA fallback (so refresh works on /)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// --- Error handling ---
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

async function start() {
  await connectDB();
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}

start().catch((err) => {
  console.error("❌ Failed to start server:", err);
  process.exit(1);
});
