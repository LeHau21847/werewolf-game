class Player {
  constructor(id, name, role = 'VILLAGER') {
    this.id = id;
    this.name = name;
    this.isAlive = true;
    this.role = role;
    this.isOffline = false;
    this.socketId = null;

    // Tech Lead's Rule: statusEffects for transient night states
    this.statusEffects = {
      isTargetedByWolf: false,
      isGuarded: false,
      isHealed: false,
      isPoisoned: false
    };

    this.deathReason = null;
  }

  // Pure data sync methods
  getPublicState() {
    return {
      id: this.id,
      name: this.name,
      isAlive: this.isAlive,
      isOffline: this.isOffline,
      deathReason: this.deathReason,
      // Status effects are usually hidden from public during night, but revealed if dead
    };
  }

  getPrivateState() {
    return {
      ...this.getPublicState(),
      role: this.role,
      statusEffects: this.statusEffects
    };
  }
}

module.exports = Player;
