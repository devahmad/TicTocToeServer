const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
    playername: {
        type: String,
        trim: true,
    },
    socketID: {
        type: String,
    },
    points: {
        type: Number,
        default: 0,
    },
    // Symbol: X or O
    playerType: {
        required: true,
        type: String,
    }
});

module.exports = playerSchema;