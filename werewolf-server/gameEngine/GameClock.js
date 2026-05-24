class GameClock {
  constructor(io, engine) {
    this.io = io;
    this.engine = engine;
    this.roomTimers = {};

    this.DURATIONS = {
      LOBBY:            0,
      NIGHT_PHASE:      45000,   // 45s
      DAY_DISCUSSION:   90000,   // 90s
      VOTING_PHASE:     30000,   // 30s
      EXECUTION_PHASE:  8000,    // 8s cinematic buffer
      WAIT_HUNTER:      20000,   // 20s
    };
  }

  startPhase(roomId, phase) {
    if (this.roomTimers[roomId]) {
      clearTimeout(this.roomTimers[roomId].timeout);
    }

    const duration = this.DURATIONS[phase] || 10000;
    const endTime = Date.now() + duration;

    this.io.to(roomId).emit('state:PHASE_STARTED', { currentPhase: phase, endTime });
    console.log(`[GameClock] Room ${roomId} → ${phase} (${duration}ms)`);

    const timeout = setTimeout(() => this.autoAdvance(roomId), duration);
    this.roomTimers[roomId] = { timeout, endTime, currentPhase: phase };
  }

  autoAdvance(roomId) {
    const room = this.engine.getRoom(roomId);
    if (!room) return;

    if (room.phase === 'NIGHT_PHASE') {
      const { deaths } = this.engine.resolveNight(roomId);

      // Emit night results to everyone
      this.io.to(roomId).emit('state:NIGHT_RESOLVED', {
        deaths,
        players: Object.values(room.players).map(p => p.getPublicState())
      });

      // Check win after night
      const win = this.engine.checkWinCondition(roomId);
      if (win) {
        this.io.to(roomId).emit('state:GAME_OVER', win);
        this.clearTimer(roomId);
        return;
      }

    } else if (room.phase === 'VOTING_PHASE') {
      const result = this.engine.resolveVoting(roomId);

      if (result.type === 'EXECUTED' || result.type === 'HUNTER_EXECUTED') {
        this.io.to(roomId).emit('state:PLAYER_EXECUTED', result);

        // Check win after execution (skip for HUNTER — hunter will shoot first)
        if (result.type === 'EXECUTED') {
          const win = this.engine.checkWinCondition(roomId);
          if (win) {
            // Delay to let execution animation play
            setTimeout(() => {
              this.io.to(roomId).emit('state:GAME_OVER', win);
              this.clearTimer(roomId);
            }, 5000);
            return;
          }
        }

      } else if (result.type === 'TIE') {
        this.io.to(roomId).emit('state:VOTE_TIED', result);
      }

    } else if (room.phase === 'EXECUTION_PHASE') {
      this.engine.handlePhaseTransition(roomId);

    } else {
      this.engine.handlePhaseTransition(roomId);
    }

    // Start next phase
    this.startPhase(roomId, room.phase);
  }

  clearTimer(roomId) {
    if (this.roomTimers[roomId]) {
      clearTimeout(this.roomTimers[roomId].timeout);
      delete this.roomTimers[roomId];
    }
  }
}

module.exports = GameClock;
