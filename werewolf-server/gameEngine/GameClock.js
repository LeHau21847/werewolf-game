class GameClock {
  constructor(io, engine) {
    this.io = io;
    this.engine = engine;
    this.roomTimers = {}; // { timeout, endTime, currentPhase }
    
    // Default Phase Durations (in ms)
    this.DURATIONS = {
      LOBBY: 0,
      NIGHT_PHASE: 30000,     // 30s xử lý các kĩ năng
      DAY_DISCUSSION: 120000, // 2 phút bàn luận
      VOTING_PHASE: 30000,    // 30s để chốt phiếu
      EXECUTION_PHASE: 7000,  // BUFFER TIME 7s: Dành cho phim Cinematic (6s) + 1s xả hơi
      WAIT_HUNTER: 15000,     // 15s chờ phán quyết của hunter
    };
  }

  startPhase(roomId, phase) {
    if (this.roomTimers[roomId]) {
      clearTimeout(this.roomTimers[roomId].timeout);
    }
    
    const duration = this.DURATIONS[phase] || 10000;
    const endTime = Date.now() + duration;

    // Phát sự kiện tập trung về Client (Tất cả client sẽ lấy endTime này để đếm ngược)
    this.io.to(roomId).emit('state:PHASE_STARTED', {
      currentPhase: phase,
      endTime: endTime
    });

    console.log(`[GameClock] Room ${roomId} started phase ${phase}. Duration: ${duration}ms`);

    // Auto Advance khi Timer kết thúc
    const timeout = setTimeout(() => {
      this.autoAdvance(roomId);
    }, duration);

    this.roomTimers[roomId] = { timeout, endTime, currentPhase: phase };
  }

  autoAdvance(roomId) {
    const room = this.engine.getRoom(roomId);
    if (!room) return;
    
    // Giao phó Logic chuyển đổi cho Engine
    if (room.phase === 'NIGHT_PHASE') {
      this.engine.resolveNight(roomId);
    } else if (room.phase === 'VOTING_PHASE') {
      const result = this.engine.resolveVoting(roomId);
      // Kết quả tính vote có the trả về TIE (tiến thẳng đếm), hoặc EXECUTED/HUNTER_EXECUTED
      if (result.type === 'EXECUTED' || result.type === 'HUNTER_EXECUTED') {
         // Thông báo có án tử -> chạy Cinematic 6s ở Client
         this.io.to(roomId).emit('state:PLAYER_EXECUTED', result);
      }
    } else {
      this.engine.handlePhaseTransition(roomId);
    }

    // Sau khi Engine xử lý, State Phase mới đã đưuọc thiết lập, ta lấy room.phase mới
    // Bắt đầu nhịp tim mới của hệ thống
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
