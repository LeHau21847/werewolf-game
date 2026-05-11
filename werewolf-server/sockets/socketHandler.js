const engine = require('../gameEngine/Engine');
const GameClock = require('../gameEngine/GameClock');

module.exports = (io) => {
  const clock = new GameClock(io, engine);

  io.on('connection', (socket) => {
    console.log(`[Socket] User connected: ${socket.id}`);

    // Rejoin / Join logic (Fault Tolerance for reconnecting)
    socket.on('JOIN_ROOM', ({ roomId, playerId, playerName }) => {
      socket.join(roomId);
      const room = engine.getRoom(roomId);
      // Associate socket ID with player ID
      room.addPlayer(playerId, playerName, socket.id);
      socket.playerId = playerId;
      socket.roomId = roomId;
      
      console.log(`[Socket] ${playerName} (ID: ${playerId}) joined ${roomId}`);

      // Gửi Full Sync State kèm theo endTime của Timer hiện tại để phục vụ Re-hydration
      const syncState = room.getSyncState();
      syncState.endTime = clock.roomTimers[roomId] ? clock.roomTimers[roomId].endTime : null;

      socket.emit('state:FULL_SYNC', syncState);
      io.to(roomId).emit('state:PLAYER_STATUS', Object.values(room.players).map(p => p.getPublicState()));
    });

    socket.on('action:START_GAME', () => {
      const { roomId } = socket;
      if (!roomId) return;

      const room = engine.getRoom(roomId);
      if (room.phase === 'LOBBY') {
        console.log(`[Game] Starting game for room: ${roomId}`);
        // Chuyển sang phase Đêm đầu tiên
        room.phase = 'NIGHT_PHASE';
        clock.startPhase(roomId, 'NIGHT_PHASE');
      }
    });

    socket.on('action:VOTE_PLAYER', ({ targetId }) => {
      const { roomId, playerId } = socket;
      if (!roomId || !playerId) return;

      const success = engine.handleVote(roomId, playerId, targetId);
      if (success) {
        // Zero-Trust: If authorized, broadcast authoritative update
        const room = engine.getRoom(roomId);
        io.to(roomId).emit('state:VOTE_UPDATED', { votes: room.dayVotes });
      }
    });

    socket.on('disconnect', () => {
       console.log(`[Socket] Disconnected: ${socket.id} (Player: ${socket.playerId})`);
       if (socket.roomId && socket.playerId) {
           const room = engine.getRoom(socket.roomId);
           room.markPlayerOffline(socket.playerId);
           // Alert room securely
           io.to(socket.roomId).emit('state:PLAYER_OFFLINE', { playerId: socket.playerId });
       }
    });
  });
};
