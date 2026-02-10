const mongoose = require("mongoose");

const guessSchema = new mongoose.Schema(
  {
    word: { type: String, required: true, minlength: 5, maxlength: 5 },
    // result is an array of 5 items: "correct" | "present" | "absent"
    result: [{ type: String, enum: ["correct", "present", "absent"], required: true }],
  },
  { _id: false, timestamps: true }
);

const gameSessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

    mode: { type: String, enum: ["random", "daily"], default: "random" },
    secretWord: { type: String, required: true, minlength: 5, maxlength: 5, select: false },

    wordLength: { type: Number, default: 5 },
    maxAttempts: { type: Number, default: 6 },

    guesses: { type: [guessSchema], default: [] },

    status: { type: String, enum: ["active", "won", "lost"], default: "active" },
    startedAt: { type: Date, default: Date.now },
    endedAt: { type: Date },
  },
  { timestamps: true }
);

gameSessionSchema.methods.toPublicJSON = function () {
  return {
    id: String(this._id),
    mode: this.mode,
    wordLength: this.wordLength,
    maxAttempts: this.maxAttempts,
    guesses: this.guesses,
    status: this.status,
    startedAt: this.startedAt,
    endedAt: this.endedAt,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

module.exports = { GameSession: mongoose.model("GameSession", gameSessionSchema) };
