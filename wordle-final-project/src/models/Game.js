const mongoose = require('mongoose');

const GameSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    word: { type: String, required: true },
    guesses: [String],
    status: { type: String, enum: ['win', 'loss'], required: true },
    attempts: { type: Number, required: true },
    date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Game', GameSchema);