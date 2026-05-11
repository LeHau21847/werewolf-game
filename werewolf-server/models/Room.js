const Player = require('./Player');

class Room {
  constructor(roomId) {
    this.roomId = roomId;
    this.players = {}; 
    this.phase = 'LOBBY';
    this.nightActionsQueue = []; // Actions stored as: { actorId, targetId, type }
  }

  // Pure Logic: Hand over a deep clone of the state for manipulation if needed
  // However, for this project, we'll keep the objects in memory as truth.
  
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

  addPlayer(playerId, name, role = 'VILLAGER') {
    if (this.players[playerId]) {
      this.players[playerId].isOffline = false;
    } else {
      this.players[playerId] = new Player(playerId, name, role);
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
        players: Object.keys(this.players).reduce((acc, id) => {
           acc[id] = this.players[id].getPublicState();
           return acc;
        }, {})
     };
  }
}

module.exports = Room;
