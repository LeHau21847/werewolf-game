class TimerManager {
  constructor() {
    this.timers = {}; // Record<roomId, NodeJS.Timeout>
  }

  // Start global timer for a room phase
  startTimer(roomId, durationSec, onTimeoutCallback) {
    if (this.timers[roomId]) {
       clearTimeout(this.timers[roomId]);
    }

    this.timers[roomId] = setTimeout(() => {
      console.log(`[TimerManager] Timeout triggered for room: ${roomId}`);
      onTimeoutCallback();
      delete this.timers[roomId];
    }, durationSec * 1000);
  }

  // Stop timer if an action finishes early
  clearTimer(roomId) {
    if (this.timers[roomId]) {
      clearTimeout(this.timers[roomId]);
      delete this.timers[roomId];
      console.log(`[TimerManager] Timer cleared for room: ${roomId}`);
    }
  }
}

module.exports = new TimerManager(); // Singleton instance
