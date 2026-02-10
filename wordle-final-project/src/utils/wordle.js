const fs = require("fs");
const path = require("path");

// Load local word list (5-letter words)
const WORDS_PATH = path.join(__dirname, "..", "data", "words.json");
const WORDS = JSON.parse(fs.readFileSync(WORDS_PATH, "utf8"));

function normalizeWord(word) {
  return String(word || "").trim().toLowerCase();
}

function isValidWord(word) {
  const w = normalizeWord(word);
  return w.length === 5 && /^[a-z]{5}$/.test(w) && WORDS.includes(w);
}

function pickRandomWord() {
  return WORDS[Math.floor(Math.random() * WORDS.length)];
}

// Deterministic “daily word” so everyone gets the same word for the day.
// Uses UTC date so it’s consistent on deployment.
function pickDailyWord(date = new Date()) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  const key = `${y}-${m}-${d}`;

  // simple hash -> index
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  const idx = hash % WORDS.length;
  return WORDS[idx];
}

// Wordle evaluation algorithm (with duplicate-letter handling)
function evaluateGuess(secret, guess) {
  secret = normalizeWord(secret);
  guess = normalizeWord(guess);

  const result = Array(5).fill("absent");
  const secretChars = secret.split("");
  const guessChars = guess.split("");

  // 1) Mark correct (green)
  const usedSecret = Array(5).fill(false);
  for (let i = 0; i < 5; i++) {
    if (guessChars[i] === secretChars[i]) {
      result[i] = "correct";
      usedSecret[i] = true;
    }
  }

  // 2) Mark present (yellow) with counts
  for (let i = 0; i < 5; i++) {
    if (result[i] === "correct") continue;

    const ch = guessChars[i];
    let foundIdx = -1;
    for (let j = 0; j < 5; j++) {
      if (!usedSecret[j] && secretChars[j] === ch) {
        foundIdx = j;
        break;
      }
    }

    if (foundIdx !== -1) {
      result[i] = "present";
      usedSecret[foundIdx] = true;
    }
  }

  return result;
}

module.exports = {
  normalizeWord,
  isValidWord,
  pickRandomWord,
  pickDailyWord,
  evaluateGuess,
};
