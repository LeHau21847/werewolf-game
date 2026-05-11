const Role = require('../models/Role');

class RoleCacheManager {
  constructor() {
    this.roleMap = new Map(); // Global RAM Cache: logicKey -> RoleData
    this.isLoaded = false;
  }

  /**
   * RAM Caching Principle: Query MongoDB once at startup.
   */
  async init() {
    try {
      console.log('[RoleCacheManager] Hydrating RAM Cache from MongoDB...');
      const roles = await Role.find({});
      
      roles.forEach(role => {
        this.roleMap.set(role.logicKey, role.toObject());
      });

      this.isLoaded = true;
      console.log(`[RoleCacheManager] Successfully cached ${this.roleMap.size} roles.`);
    } catch (error) {
      console.error('[RoleCacheManager] Error hydrating cache:', error);
      throw error;
    }
  }

  /**
   * Zero-DB Principle: Direct lookup from memory.
   */
  getRole(logicKey) {
    if (!this.isLoaded) {
      throw new Error('RoleCacheManager not initialized. Call init() first.');
    }
    return this.roleMap.get(logicKey);
  }

  getAllRoles() {
    return Array.from(this.roleMap.values());
  }
}

module.exports = new RoleCacheManager();
