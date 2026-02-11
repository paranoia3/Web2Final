const { GameSession } = require("../models/GameSession");
const mongoose = require("mongoose");

const WORDS = [
  "APPLE", "BRAVE", "CRANE", "DRIVE", "EAGLE",
  "HEART", "MUSIC", "OCEAN", "PIANO", "RIVER",
  "SMILE", "TRAIN", "WORLD", "GHOST", "HOUSE"
];

exports.createGame = async (req, res) => {
  try {
    const secretWord = WORDS[Math.floor(Math.random() * WORDS.length)];

    const game = new GameSession({
      user: req.user._id,
      secretWord: secretWord,
      mode: "daily",
      status: "active",
      guesses: [],
      maxAttempts: 6,
      wordLength: 5
    });

    await game.save();

    res.status(201).json({
      id: game._id,
      message: "Game started",
      wordLength: game.wordLength,
      maxAttempts: game.maxAttempts
    });
  } catch (error) {
    res.status(500).json({ message: "Error starting game", error: error.message });
  }
};

exports.submitGuess = async (req, res) => {
  try {
    const { id } = req.params;
    const { guess } = req.body;

    if (!guess || guess.length !== 5) {
      return res.status(400).json({ message: "Invalid guess length" });
    }

    const game = await GameSession.findOne({ _id: id, user: req.user._id }).select("+secretWord");

    if (!game) return res.status(404).json({ message: "Game not found" });
    if (game.status !== "active") return res.status(400).json({ message: "Game is finished" });

    const secretWord = game.secretWord.toUpperCase();
    const guessUpper = guess.toUpperCase();

    const result = Array(5).fill("absent");
    const secretArr = secretWord.split("");
    const guessArr = guessUpper.split("");

    for (let i = 0; i < 5; i++) {
      if (guessArr[i] === secretArr[i]) {
        result[i] = "correct";
        secretArr[i] = null;
        guessArr[i] = null;
      }
    }

    for (let i = 0; i < 5; i++) {
      if (guessArr[i] && secretArr.includes(guessArr[i])) {
        result[i] = "present";
        secretArr[secretArr.indexOf(guessArr[i])] = null;
      }
    }

    game.guesses.push({
      word: guessUpper,
      result: result
    });

    if (guessUpper === secretWord) {
      game.status = "won";
      game.endedAt = new Date();
    } else if (game.guesses.length >= game.maxAttempts) {
      game.status = "lost";
      game.endedAt = new Date();
    }

    await game.save();

    res.json({
      status: game.status,
      result: result,
      guesses: game.guesses,
      secretWord: game.status !== "active" ? secretWord : null
    });

  } catch (error) {
    res.status(500).json({ message: "Error processing guess", error: error.message });
  }
};

exports.listGames = async (req, res) => res.json({ message: "List games not implemented" });
exports.getGame = async (req, res) => res.json({ message: "Get game not implemented" });
exports.deleteGame = async (req, res) => res.json({ message: "Delete game not implemented" });