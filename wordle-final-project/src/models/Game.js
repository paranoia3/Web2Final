const mongoose = require('mongoose');

const GameSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    word: { type: String, required: true },
    attempts: { type: Number, required: true },
    isWin: { type: Boolean, required: true },
    date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Game', GameSchema);