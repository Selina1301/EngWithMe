const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

app.get('/health', (req, res) => {
  res.json({ status: 'PvP Server Online' });
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*", // allow all origins for demo
    methods: ["GET", "POST"]
  }
});

// Store rooms data
// rooms[roomId] = { players: [{id, ready, score, name, color}], gameStarted: false }
const rooms = {};

const COLORS = ['#3b82f6', '#ef4444']; // Blue for p1, Red for p2

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // JOIN ROOM
  socket.on('join_room', (data) => {
    const { roomId, playerName } = data;
    
    // Join the socket to the room
    socket.join(roomId);
    
    if (!rooms[roomId]) {
      rooms[roomId] = {
        players: [],
        gameStarted: false,
        gameMode: null,
        level: null,
        topic: null
      };
    }

    const room = rooms[roomId];
    
    // Prevent more than 2 players
    if (room.players.length >= 2) {
      socket.emit('room_full', { message: 'Phòng đã đầy (tối đa 2 người).' });
      return;
    }

    // Add player
    const player = {
      id: socket.id,
      name: playerName || `Người chơi ${room.players.length + 1}`,
      ready: false,
      score: 0,
      color: COLORS[room.players.length]
    };
    room.players.push(player);

    console.log(`${player.name} joined room ${roomId}`);

    // Notify everyone in the room about the updated player list
    io.to(roomId).emit('room_update', {
      players: room.players,
      gameStarted: room.gameStarted,
      gameConfig: { mode: room.gameMode, level: room.level, topic: room.topic }
    });
  });

  // HOST CONFIGURES ROOM (Selects level/topic)
  socket.on('configure_room', (data) => {
    const { roomId, gameMode, level, topic } = data;
    const room = rooms[roomId];
    
    if (room) {
      // Only host (player 1) can configure
      if (room.players[0] && room.players[0].id === socket.id) {
        room.gameMode = gameMode;
        room.level = level;
        room.topic = topic;
        
        io.to(roomId).emit('room_update', {
          players: room.players,
          gameStarted: room.gameStarted,
          gameConfig: { mode: room.gameMode, level: room.level, topic: room.topic }
        });
      }
    }
  });

  // READY STATUS
  socket.on('player_ready', (data) => {
    const { roomId, isReady } = data;
    const room = rooms[roomId];
    
    if (room) {
      const player = room.players.find(p => p.id === socket.id);
      if (player) {
        player.ready = isReady;

        io.to(roomId).emit('room_update', {
          players: room.players,
          gameStarted: room.gameStarted,
          gameConfig: { mode: room.gameMode, level: room.level, topic: room.topic }
        });

        // Check if both players are ready
        if (room.players.length === 2 && room.players.every(p => p.ready)) {
          // If host hasn't selected a topic yet
          if (!room.topic) {
            socket.emit('error_msg', { message: 'Chủ phòng chưa chọn bài học.' });
            return;
          }
          
          room.gameStarted = true;
          io.to(roomId).emit('game_start', {
            gameConfig: { mode: room.gameMode, level: room.level, topic: room.topic },
            message: 'Game is starting!'
          });
        }
      }
    }
  });

  // UPDATE SCORE
  socket.on('update_score', (data) => {
    const { roomId, score, maxScore } = data;
    const room = rooms[roomId];
    
    if (room && room.gameStarted) {
      const player = room.players.find(p => p.id === socket.id);
      if (player) {
        player.score = score;
        
        // Broadcast the updated scores to everyone
        io.to(roomId).emit('score_update', {
          players: room.players
        });
        
        // Check win condition
        if (score >= maxScore) {
          room.gameStarted = false; // end game
          io.to(roomId).emit('game_over', {
            winnerId: socket.id,
            winnerName: player.name,
            players: room.players
          });
          
          // Reset ready state for next game
          room.players.forEach(p => p.ready = false);
        }
      }
    }
  });

  // DISCONNECT
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    // Find which room the user was in and remove them
    for (const roomId in rooms) {
      const room = rooms[roomId];
      const playerIndex = room.players.findIndex(p => p.id === socket.id);
      
      if (playerIndex !== -1) {
        const playerName = room.players[playerIndex].name;
        room.players.splice(playerIndex, 1);
        console.log(`${playerName} left room ${roomId}`);
        
        if (room.players.length === 0) {
          // Clean up empty room
          delete rooms[roomId];
        } else {
          // If a player disconnects during a game, reset game
          room.gameStarted = false;
          room.players.forEach(p => { p.ready = false; p.score = 0; });
          
          // Re-assign color to remaining player to ensure they are host (blue)
          if (room.players[0]) {
             room.players[0].color = COLORS[0];
          }
          
          io.to(roomId).emit('player_left', {
            message: `${playerName} đã rời phòng.`,
            players: room.players,
            gameStarted: false,
            gameConfig: { mode: room.gameMode, level: room.level, topic: room.topic }
          });
        }
        break;
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`PvP WebSocket Server is running on port ${PORT}`);
});
