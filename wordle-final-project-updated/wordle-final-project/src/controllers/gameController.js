const { GameSession } = require("../models/GameSession");
const { sendMail } = require("../utils/mailer");
const { pickRandomWord, pickDailyWord, evaluateGuess, isValidWord, normalizeWord } = require("../utils/wordle");

function canAccessGame(reqUser, game) {
  if (!reqUser || !game) return false;
  if (reqUser.role === "admin") return true;
  return String(game.user) === String(reqUser._id);
}

async function createGame(req, res) {
  const { mode } = req.body;
  const secretWord = mode === "daily" ? pickDailyWord(new Date()) : pickRandomWord();

  const game = await GameSession.create({
    user: req.user._id,
    mode,
    secretWord,
    wordLength: 5,
    maxAttempts: 6,
  });

  const fresh = await GameSession.findById(game._id);
  return res.status(201).json({ game: fresh.toPublicJSON() });
}

async function listGames(req, res) {
  const query = req.user.role === "admin" ? {} : { user: req.user._id };
  const games = await GameSession.find(query).sort({ createdAt: -1 });
  return res.json({ games: games.map((g) => g.toPublicJSON()) });
}

async function getGame(req, res) {
  const game = await GameSession.findById(req.params.id);
  if (!game) return res.status(404).json({ message: "Game not found" });
  if (!canAccessGame(req.user, game)) return res.status(403).json({ message: "Forbidden" });

  return res.json({ game: game.toPublicJSON() });
}

// PUT /games/:id -> submit a guess (or update game)
async function submitGuess(req, res) {
  const { guess } = req.body;

  // Verify game
  const game = await GameSession.findById(req.params.id).select("+secretWord");
  if (!game) return res.status(404).json({ message: "Game not found" });
  if (!canAccessGame(req.user, game)) return res.status(403).json({ message: "Forbidden" });

  if (game.status !== "active") {
    return res.status(400).json({ message: `Game is already ${game.status}` });
  }

  const g = normalizeWord(guess);
  if (!isValidWord(g)) return res.status(400).json({ message: "Invalid word. Must be a valid 5-letter dictionary word." });

  if (game.guesses.some((x) => x.word === g)) {
    return res.status(400).json({ message: "You already tried this word" });
  }

  const result = evaluateGuess(game.secretWord, g);
  game.guesses.push({ word: g, result });

  const isWin = result.every((x) => x === "correct");
  const outOfAttempts = game.guesses.length >= game.maxAttempts;

  if (isWin) {
    game.status = "won";
    game.endedAt = new Date();
  } else if (outOfAttempts) {
    game.status = "lost";
    game.endedAt = new Date();
  }

  await game.save();

  // Email notification on game end (Advanced Feature: SMTP)
  if (game.status !== "active") {
    // Only email premium/admin users to demonstrate RBAC usage
    if (["premium", "admin"].includes(req.user.role)) {
      sendMail({
        to: req.user.email,
        subject: `Wordle game ${game.status.toUpperCase()}`,
        text: `Your game finished: ${game.status}. Attempts: ${game.guesses.length}/${game.maxAttempts}`,
        html: `<p>Your game finished: <b>${game.status}</b>.</p><p>Attempts: ${game.guesses.length}/${game.maxAttempts}</p>`,
      }).catch(() => {});
    }
  }

  const fresh = await GameSession.findById(game._id);
  return res.json({ game: fresh.toPublicJSON() });
}

async function deleteGame(req, res) {
  const game = await GameSession.findById(req.params.id);
  if (!game) return res.status(404).json({ message: "Game not found" });

  const isOwner = String(game.user) === String(req.user._id);
  const isAdmin = req.user.role === "admin";
  if (!isOwner && !isAdmin) return res.status(403).json({ message: "Forbidden" });

  await game.deleteOne();
  return res.json({ message: "Game deleted" });
}

module.exports = { createGame, listGames, getGame, submitGuess, deleteGame };
