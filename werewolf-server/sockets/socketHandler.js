const engine = require('../gameEngine/Engine');
const GameClock = require('../gameEngine/GameClock');

module.exports = (io) => {
  const clock = new GameClock(io, engine);
  const phaseScale = Math.max(0.05, Number(process.env.PHASE_SCALE || 1));
  const scaledDelay = (ms) => Math.max(250, Math.round(ms * phaseScale));

  io.on('connection', (socket) => {
    console.log(`[Socket] Connected: ${socket.id}`);

    // ─── JOIN / REJOIN ──────────────────────────────────────────────────────
    socket.on('JOIN_ROOM', ({ roomId, playerId, playerName }) => {
      if (!roomId || !playerId || !playerName) return;

      socket.join(roomId);
      const room = engine.getRoom(roomId);
      room.addPlayer(playerId, playerName, socket.id);
      socket.playerId = playerId;
      socket.roomId = roomId;

      console.log(`[Socket] ${playerName} joined room ${roomId}`);

      // Full sync to the joining player
      const syncState = room.getSyncState();
      syncState.endTime = clock.roomTimers[roomId]?.endTime ?? null;
      socket.emit('state:FULL_SYNC', syncState);

      // If game already running, also send their private role
      const player = room.players[playerId];
      if (room.phase !== 'LOBBY' && player.role !== 'VILLAGER') {
        socket.emit('state:ROLE_ASSIGNED', {
          role: player.role,
          roleData: engine.getRoleData(player.role)
        });
      }

      // Broadcast updated player list to room
      io.to(roomId).emit('state:PLAYER_STATUS', Object.values(room.players).map(p => p.getPublicState()));
    });

    // ─── START GAME ─────────────────────────────────────────────────────────
    socket.on('action:START_GAME', () => {
      const { roomId, playerId } = socket;
      if (!roomId) return;

      const room = engine.getRoom(roomId);
      if (room.phase !== 'LOBBY') return;

      // Only host can start
      if (room.hostId && room.hostId !== playerId) {
        socket.emit('state:ERROR', { message: 'Chỉ chủ phòng mới có thể bắt đầu!' });
        return;
      }

      const playerCount = Object.keys(room.players).length;
      if (playerCount < 4) {
        socket.emit('state:ERROR', { message: `Cần ít nhất 4 người chơi! (Hiện có: ${playerCount})` });
        return;
      }

      // Assign roles
      engine.assignRoles(roomId);

      // Send private role to each player
      Object.values(room.players).forEach(player => {
        const sock = io.sockets.sockets.get(player.socketId);
        if (sock) {
          sock.emit('state:ROLE_ASSIGNED', {
            role: player.role,
            roleData: engine.getRoleData(player.role)
          });
        }
      });

      // Broadcast game started with public state
      room.phase = 'NIGHT_PHASE';
      io.to(roomId).emit('state:GAME_STARTED', room.getSyncState());

      // Start first night after role reveal delay (8 seconds)
      setTimeout(() => {
        clock.startPhase(roomId, 'NIGHT_PHASE');
      }, 8000);
    });

    // ─── NIGHT ACTION (Wolf / Bodyguard / Witch) ────────────────────────────
    socket.on('action:NIGHT_ACTION', ({ type, targetId, skillType }) => {
      const { roomId, playerId } = socket;
      if (!roomId || !playerId) return;

      const room = engine.getRoom(roomId);
      if (!room || room.phase !== 'NIGHT_PHASE') return;

      const actor = room.players[playerId];
      if (!actor || !actor.isAlive) return;

      engine.queueNightAction(roomId, { actorId: playerId, targetId, type, skillType });
      socket.emit('state:ACTION_CONFIRMED', { type, targetId });
      console.log(`[Night] ${actor.name} → ${type} on ${targetId}`);

      // If wolf targets someone, secretly notify Witch
      if (type === 'WOLF') {
        const witch = Object.values(room.players).find(p => p.role === 'WITCH' && p.isAlive);
        if (witch) {
          const witchSock = io.sockets.sockets.get(witch.socketId);
          if (witchSock) {
            witchSock.emit('state:WOLF_TARGET', { targetId, targetName: room.players[targetId]?.name });
          }
        }
      }
    });

    // ─── SEER INVESTIGATE ──────────────────────────────────────────────────
    socket.on('action:SEER_CHECK', ({ targetId }) => {
      const { roomId, playerId } = socket;
      if (!roomId || !playerId) return;

      const room = engine.getRoom(roomId);
      if (!room || room.phase !== 'NIGHT_PHASE') return;

      const actor = room.players[playerId];
      if (!actor || !actor.isAlive || actor.role !== 'SEER') return;

      const target = room.players[targetId];
      if (!target) return;

      const roleData = engine.getRoleData(target.role);
      socket.emit('state:SEER_RESULT', {
        targetId,
        targetName: target.name,
        side: roleData.side,
        role: target.role,
        roleData
      });
    });

    // ─── DAY VOTING ─────────────────────────────────────────────────────────
    socket.on('action:VOTE_PLAYER', ({ targetId }) => {
      const { roomId, playerId } = socket;
      if (!roomId || !playerId) return;

      const room = engine.getRoom(roomId);
      if (!room || room.phase !== 'VOTING_PHASE') return;

      const actor = room.players[playerId];
      if (!actor || !actor.isAlive) return;

      const success = engine.handleVote(roomId, playerId, targetId);
      if (success) {
        io.to(roomId).emit('state:VOTE_UPDATED', { votes: room.dayVotes });
      }
    });

    // ─── HUNTER SHOOTS ──────────────────────────────────────────────────────
    socket.on('action:HUNTER_SHOOT', ({ targetId }) => {
      const { roomId, playerId } = socket;
      if (!roomId || !playerId) return;

      const room = engine.getRoom(roomId);
      if (!room || room.phase !== 'WAIT_HUNTER') return;

      const actor = room.players[playerId];
      if (!actor || actor.role !== 'HUNTER') return;

      const target = room.players[targetId];
      if (target && target.isAlive) {
        target.isAlive = false;
        target.deathReason = 'SHOT_BY_HUNTER';

        io.to(roomId).emit('state:PLAYER_EXECUTED', {
          type: 'HUNTER_SHOT',
          executedId: targetId,
          executedName: target.name,
          executedRole: target.role,
          message: `${target.name} bị Thợ Săn bắn hạ!`
        });
      }

      // Check win, then continue
      const win = engine.checkWinCondition(roomId);
      if (win) {
        setTimeout(() => io.to(roomId).emit('state:GAME_OVER', win), 4000);
        clock.clearTimer(roomId);
        return;
      }

      room.phase = 'NIGHT_PHASE';
      setTimeout(() => clock.startPhase(roomId, 'NIGHT_PHASE'), 4000);
    });

    // ─── CHAT ────────────────────────────────────────────────────────────────
    socket.on('action:CHAT_MSG', ({ message }) => {
      const { roomId, playerId } = socket;
      if (!roomId || !playerId) return;
      const room = engine.getRoom(roomId);
      if (!room) return;
      const player = room.players[playerId];
      if (!player) return;

      // Only allow chat during day discussion and voting
      if (!['DAY_DISCUSSION', 'VOTING_PHASE', 'LOBBY'].includes(room.phase)) return;

      const text = String(message || '').trim().slice(0, 200);
      if (!text) return;

      io.to(roomId).emit('state:CHAT_MSG', {
        playerId,
        playerName: player.name,
        message: text,
        isAlive: player.isAlive,
        timestamp: Date.now()
      });
    });

    // ─── WEBRTC SIGNALING ─────────────────────────────────────────────────────
    socket.on('signal:READY', () => {
      const { roomId, playerId } = socket;
      if (!roomId) return;
      // Tell all OTHER clients in room that this peer is ready to connect
      socket.to(roomId).emit('signal:PEER_JOINED', { socketId: socket.id, playerId });
    });

    socket.on('signal:OFFER', ({ to, offer }) => {
      const target = io.sockets.sockets.get(to);
      if (target) target.emit('signal:OFFER', { from: socket.id, fromPlayerId: socket.playerId, offer });
    });

    socket.on('signal:ANSWER', ({ to, answer }) => {
      const target = io.sockets.sockets.get(to);
      if (target) target.emit('signal:ANSWER', { from: socket.id, answer });
    });

    socket.on('signal:ICE', ({ to, candidate }) => {
      const target = io.sockets.sockets.get(to);
      if (target) target.emit('signal:ICE', { from: socket.id, candidate });
    });

    socket.on('signal:SPEAKING', ({ speaking }) => {
      const { roomId, playerId } = socket;
      if (!roomId || !playerId) return;
      // Only relay if alive
      const room = engine.getRoom(roomId);
      const player = room?.players[playerId];
      if (player && !player.isAlive) return;
      socket.to(roomId).emit('signal:SPEAKING', { playerId, speaking });
    });

    // ─── CHARACTER ────────────────────────────────────────────────────────────
    socket.on('action:UPDATE_CHARACTER', (charData) => {
      const { roomId, playerId } = socket;
      if (!roomId || !playerId) return;
      const room = engine.getRoom(roomId);
      if (!room) return;
      const player = room.players[playerId];
      if (!player) return;
      // Validate and sanitize
      const char = {
        gender: charData.gender === 'female' ? 'female' : 'male',
        skin: Math.min(5, Math.max(0, parseInt(charData.skin) || 0)),
        outfit: Math.min(5, Math.max(0, parseInt(charData.outfit) || 0)),
        accessory: Math.min(4, Math.max(0, parseInt(charData.accessory) || 0)),
      };
      player.character = char;
      io.to(roomId).emit('state:CHARACTER_UPDATED', { playerId, character: char });
    });

    // ─── DISCONNECT ─────────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      console.log(`[Socket] Disconnected: ${socket.id}`);
      if (socket.roomId && socket.playerId) {
        const room = engine.getRoom(socket.roomId);
        room.markPlayerOffline(socket.playerId);
        io.to(socket.roomId).emit('state:PLAYER_OFFLINE', { playerId: socket.playerId });
        // Notify peers for WebRTC cleanup
        socket.to(socket.roomId).emit('signal:PEER_LEFT', { socketId: socket.id });
      }
    });
  });
};
