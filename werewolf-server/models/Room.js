const Player = require('./Player');

class Room {
  constructor(roomId) {
    this.roomId = roomId;
    this.players = {};
    this.phase = 'LOBBY';
    this.nightActionsQueue = [];
    this.dayVotes = {};
    this.hostId = null;
  }

  setPhase(phase) {
    this.phase = phase;
  }

  resetStatusEffects() {
    Object.values(this.players).forEach(p => {
      p.statusEffects = {
        isTargetedByWolf: false,
        isGuarded: false,
        isHealed: false,
        isPoisoned: false
      };
    });
  }

  addPlayer(playerId, name, socketId) {
    if (this.players[playerId]) {
      this.players[playerId].isOffline = false;
      this.players[playerId].socketId = socketId;
    } else {
      const player = new Player(playerId, name, 'VILLAGER');
      player.socketId = socketId;
      this.players[playerId] = player;
      if (!this.hostId) this.hostId = playerId;
    }
  }

  markPlayerOffline(playerId) {
    if (this.players[playerId]) {
      this.players[playerId].isOffline = true;
    }
  }

  getSyncState() {
    return {
      roomId: this.roomId,
      phase: this.phase,
      hostId: this.hostId,
      players: Object.keys(this.players).reduce((acc, id) => {
        acc[id] = this.players[id].getPublicState();
        return acc;
      }, {})
    };
  }
}

module.exports = Room;
