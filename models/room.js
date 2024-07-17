const mongoose = require('mongoose');
const playerSchema = require('./player');

const roomSchema = new mongoose.Schema({
    // Ocuupancy means how many players can be in a game room.
    occupancy:{
        type: Number,
        default: 2,
    },
    // How long the game will run after which we will stop it.
    maxRounds:{
        type: Number,
        default: 3,
    },
    // Which round we are now in the game
    currentRound: {
        required: true,
        type: Number,
        default: 1,
    },
    players : [playerSchema],
    // If room is joinable or not. After two players it will false
    isJoin: {
        type: Boolean,
        default: true,
    },
    // which players turn is there and it will change every round
    turn: playerSchema,
    // whoever creates room, that player index will be 0 orelse 1. This will help in tracking turns.
    turnIndex: {
        type: Number,
        default: 0
    }
});

// Convert Schena into Model
const roomModel = mongoose.model("Room",roomSchema);

module.exports = roomModel;