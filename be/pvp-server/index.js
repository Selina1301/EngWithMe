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
    const { roomId, playerName, playerAvatar } = data;
    
    // Join the socket to the room
    socket.join(roomId);
    
    if (!rooms[roomId]) {
      rooms[roomId] = {
        players: [],
        gameStarted: false,
        gameMode: 'match',
        level: 'easy',
        topic: 'family'
      };
    }

    const room = rooms[roomId];
    
    // Check if player with same name or slot is already in room (re-joining during page transition)
    let existingPlayer = room.players.find(p => p.name === playerName || p.id === socket.id);
    if (existingPlayer) {
      existingPlayer.id = socket.id;
      if (playerAvatar) existingPlayer.avatar = playerAvatar;
      if (existingPlayer.disconnectTimeout) {
        clearTimeout(existingPlayer.disconnectTimeout);
        existingPlayer.disconnectTimeout = null;
      }
      console.log(`${playerName} re-joined room ${roomId} with socket ${socket.id}`);

      io.to(roomId).emit('room_update', {
        players: room.players,
        gameStarted: room.gameStarted,
        gameConfig: { mode: room.gameMode, level: room.level, topic: room.topic }
      });
      return;
    }

    // If room already has 2 players, re-assign this socket to the matching slot
    if (room.players.length >= 2) {
      let slotToAssign = room.players.find(p => !p.connected) || room.players[0];
      if (slotToAssign) {
        slotToAssign.id = socket.id;
        if (playerName) slotToAssign.name = playerName;
        if (playerAvatar) slotToAssign.avatar = playerAvatar;
        io.to(roomId).emit('room_update', {
          players: room.players,
          gameStarted: room.gameStarted,
          gameConfig: { mode: room.gameMode, level: room.level, topic: room.topic }
        });
        return;
      }
      socket.emit('room_full', { message: 'Phòng đã đầy (tối đa 2 người).' });
      return;
    }

    // Add player
    const player = {
      id: socket.id,
      name: playerName || `Người chơi ${room.players.length + 1}`,
      avatar: playerAvatar || null,
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
      if (room.players[0]) {
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
      const player = room.players.find(p => p.id === socket.id) || room.players[0];
      if (player) {
        player.ready = isReady;

        io.to(roomId).emit('room_update', {
          players: room.players,
          gameStarted: room.gameStarted,
          gameConfig: { mode: room.gameMode, level: room.level, topic: room.topic }
        });

        // Check if both players are ready
        if (room.players.length === 2 && room.players.every(p => p.ready)) {
          if (!room.topic) room.topic = 'family';
          if (!room.level) room.level = 'easy';
          if (!room.gameMode) room.gameMode = 'match';
          
          room.gameStarted = true;
          // Random 50/50 starter selection
          const starterIndex = Math.floor(Math.random() * room.players.length);
          const starterId = room.players[starterIndex].id;
          room.starterId = starterId;

          io.to(roomId).emit('game_start', {
            gameConfig: { mode: room.gameMode, level: room.level, topic: room.topic, starterId: starterId },
            message: 'Game is starting!'
          });
        }
      }
    }
  });

  // FINISH GAME
  socket.on('finish_game', (data) => {
    const { roomId, winnerId } = data;
    const room = rooms[roomId];
    if (room) {
      room.gameStarted = false;
      const winner = room.players.find(p => p.id === winnerId) || room.players.find(p => p.id !== socket.id) || room.players[0];
      if (winner) winner.score = (winner.score || 0) + 1;

      io.to(roomId).emit('game_over', {
        winnerId: winner ? winner.id : winnerId,
        winnerName: winner ? winner.name : 'Người chơi',
        players: room.players,
        gameMode: room.gameMode,
        topic: room.topic
      });

      room.players.forEach(p => p.ready = false);
    }
  });

  // UPDATE SCORE
  socket.on('update_score', (data) => {
    const { roomId, score, maxScore } = data;
    const room = rooms[roomId];
    if (room) {
      let player = room.players.find(p => p.id === socket.id);
      if (!player) {
        player = room.players[0];
      }
      if (player) {
        player.score = score;
        io.to(roomId).emit('score_update', { players: room.players });

        if (maxScore && score >= maxScore) {
          room.gameStarted = false;
          io.to(roomId).emit('game_over', {
            winnerId: player.id,
            winnerName: player.name,
            players: room.players,
            gameMode: room.gameMode,
            topic: room.topic
          });
          room.players.forEach(p => p.ready = false);
        }
      }
    }
  });

  // REQUEST REMATCH
  socket.on('pvp_request_rematch', (data) => {
    const { roomId } = data;
    const room = rooms[roomId];
    if (room) {
      let player = room.players.find(p => p.id === socket.id);
      if (!player) {
        // Fallback: match un-rematched slot
        player = room.players.find(p => !p.requestedRematch) || room.players[0];
        if (player) player.id = socket.id;
      }

      if (player) {
        player.requestedRematch = true;
        console.log(`Rematch requested by ${player.name} in room ${roomId}`);
        
        socket.to(roomId).emit('pvp_rematch_requested', {
          requestedByName: player.name
        });

        const rematchCount = room.players.filter(p => p.requestedRematch).length;
        if (room.players.length >= 2 && rematchCount >= 2) {
          room.players.forEach(p => {
            p.ready = false;
            p.requestedRematch = false;
          });
          console.log(`Both players accepted rematch in room ${roomId}. Broadcasting pvp_rematch_start...`);
          io.to(roomId).emit('pvp_rematch_start', {
            roomId: roomId,
            gameConfig: { mode: room.gameMode, level: room.level, topic: room.topic }
          });
        }
      }
    }
  });
  // GENERIC GAME ACTION FOR CUSTOM GAMES (Bomb, Tug, Meteor, etc.)
  socket.on('game_action', (data) => {
    const { roomId, action, payload } = data;
    const room = rooms[roomId];
    
    if (room && room.gameStarted) {
      // Forward the action to everyone else in the room
      socket.to(roomId).emit('game_action', {
        senderId: socket.id,
        action: action,
        payload: payload
      });
    }
  });

  // DISCONNECT
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    for (const roomId in rooms) {
      const room = rooms[roomId];
      const playerIndex = room.players.findIndex(p => p.id === socket.id);
      
      if (playerIndex !== -1) {
        const player = room.players[playerIndex];
        const playerName = player.name;

        // If game is started, give a 5-second grace period for page transitions (game.html -> vocabulary-study.html)
        if (room.gameStarted) {
          if (player.disconnectTimeout) clearTimeout(player.disconnectTimeout);
          player.disconnectTimeout = setTimeout(() => {
            const idx = room.players.findIndex(p => p.id === socket.id);
            if (idx !== -1) {
              room.players.splice(idx, 1);
              console.log(`${playerName} left room ${roomId} after grace period`);
              if (room.players.length === 0) {
                delete rooms[roomId];
              } else {
                room.gameStarted = false;
                const winner = room.players[0];
                io.to(roomId).emit('game_over', {
                  winnerId: winner ? winner.id : null,
                  winnerName: winner ? winner.name : 'Người chơi',
                  players: room.players,
                  gameMode: room.gameMode,
                  topic: room.topic,
                  isOpponentLeft: true,
                  message: `${playerName} đã thoát trận đấu!`
                });

                room.players.forEach(p => p.ready = false);
              }
            }
          }, 5000);
        } else {
          room.players.splice(playerIndex, 1);
          console.log(`${playerName} left room ${roomId}`);
          
          if (room.players.length === 0) {
            delete rooms[roomId];
          } else {
            room.gameStarted = false;
            room.players.forEach(p => { p.ready = false; p.score = 0; });
            if (room.players[0]) room.players[0].color = COLORS[0];
            
            io.to(roomId).emit('player_left', {
              message: `${playerName} đã rời phòng.`,
              players: room.players,
              gameStarted: false,
              gameConfig: { mode: room.gameMode, level: room.level, topic: room.topic }
            });
          }
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
