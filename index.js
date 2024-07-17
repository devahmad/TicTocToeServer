const express = require('express');
const socket = require('socket.io');
const http = require('http');
const mongoose = require('mongoose');
const Room = require('./models/room');

// Initialize express
const app =  express();

// Create server and socket io
const server = http.createServer(app);
const io = socket(server);

io.on('connection',(socket)=>{
    console.log("Socket Connected");

    socket.on('createRoom', async ({playername})=>{
        try{
         // Create a Room object
         let room = new Room();
         let player = {
            socketID: socket.id,
            playername: playername,
            playerType: 'X',
         };
         // Add properties in room object
         room.players.push(player); // Push since its an array
         room.turn = player;
         // Save Room data in mongodb
         room = await room.save();
         // Save room id (_id) which is returned after saving
         const roomId = room._id.toString();
        // this socket will listen only whoever emits events in this roomId
         socket.join(roomId);

        // Tell client that room has been created
        // io send data to everyone in that room. Whereas socket sends to yourself.
         io.to(roomId).emit('createRoomSuccess',room);


        }catch(e){
            console.log(e);
        }
    });


    socket.on('joinRoom', async ({playername,roomId})=>{
        try {
          // check if roomId is a valid mongoose id or not
          if(!roomId.match(/^[0-9a-fA-F]{24}$/)){
            socket.emit('errorOccured','Please enter a valid room ID');
            return;
          }
          let room = await Room.findById(roomId);
          if(room.isJoin){
            let player = {
                playername:playername,
                socketID: socket.id,
                playerType: "O"
            };
            socket.join(roomId);
            room.players.push(player);
            room.isJoin = false;
            room = await room.save();
            io.to(roomId).emit('joinRoomSuccess', room);
            io.to(roomId).emit('updatePlayers', room.players);
            io.to(roomId).emit('updateRoom', room);
          } else {
            socket.emit('errorOccured','The game is already in progress, Try another room.');
          }
        }catch(e){
            console.log(e);
        }
    });

    socket.on('tap', async ({index,roomId})=>{
        try {
            let room = await Room.findById(roomId);

            let choice = room.turn.playerType; // Either X or O
            if(room.turnIndex == 0){
                // if player1 tapped
                room.turn = room.players[1];
                room.turnIndex = 1;
            } else {
                room.turn = room.players[0];
                room.turnIndex = 0;
            }
            room = await room.save();
            io.to(roomId).emit('tapped',{
                index,
                choice,
                room
            });
        }catch(e){
            console.log(e);
        }
    });


    socket.on('winner', async ({winnerSocketId,roomId})=>{
        try {
            let room = await Room.findById(roomId);
            let player = room.players.find((player) => player.socketID == winnerSocketId);
            player.points += 1;
            room = await room.save();

            // if game reaches the number of rounds that can be played;
            if(player.points >= room.maxRounds){
                io.to(roomId).emit('endGame',player);
            }else {
                io.to(roomId).emit('pointIncrease',player);
            }
        }catch(e){
            console.log(e);
        }
    });


});

//Middle ware : 
//convert data in json 
app.use(express.json());

const DB = "mongodb+srv://kobusinessme:7cnxGqk3xQ7vapov@cluster0.2jcql92.mongodb.net/";
mongoose.connect(DB).then(()=>{
    console.log("Mongo DB connnection succesfull");
}).catch((e)=> {
    console.log(e);
});

const PORT =  process.env.PORT || 3000;

server.listen(PORT, '0.0.0.0', () =>(console.log(`Server running on Port ${PORT}`)));
