/**
 * Ma Sói Ultimate - Pure Logic Skills Handler
 * Principle: Pure Functions (Immutable transition of State)
 */

/**
 * @param {Object} player - The player object to mutate (or clone)
 * @returns {Object} - Updated status effects
 */
const wolfBiteSkill = (player) => {
  return { ...player.statusEffects, isTargetedByWolf: true };
};

const guardSkill = (player) => {
  return { ...player.statusEffects, isGuarded: true };
};

const witchHealSkill = (player) => {
  return { ...player.statusEffects, isHealed: true };
};

const witchPoisonSkill = (player) => {
  return { ...player.statusEffects, isPoisoned: true };
};

/**
 * Tech Lead's Rule: Priority Resolver (Batch Processing)
 * Order: Guard -> Wolf -> Witch
 */
const resolveNight = (room, actions) => {
  // 1. Reset transient effects for the new night evaluation
  room.resetStatusEffects();

  // 2. Sort actions by priority: BODYGUARD > WOLF > WITCH
  const priorityMap = { 'BODYGUARD': 1, 'WOLF': 2, 'WITCH': 3 };
  const sortedActions = [...actions].sort((a, b) => priorityMap[a.type] - priorityMap[b.type]);

  // 3. Execution Phase (Applying Pure Skills)
  sortedActions.forEach(action => {
    const target = room.players[action.targetId];
    if (!target) return;

    switch (action.type) {
      case 'BODYGUARD':
        target.statusEffects = guardSkill(target);
        break;
      case 'WOLF':
        target.statusEffects = wolfBiteSkill(target);
        break;
      case 'WITCH':
        if (action.skillType === 'HEAL') {
          target.statusEffects = witchHealSkill(target);
        } else if (action.skillType === 'POISON') {
          target.statusEffects = witchPoisonSkill(target);
        }
        break;
    }
  });

  // 4. Evaluation Phase (The Truth)
  Object.values(room.players).forEach(player => {
    const { isTargetedByWolf, isGuarded, isHealed, isPoisoned } = player.statusEffects;

    // RULE: SHOCK_OVERDOSE (Bảo vệ + Bình máu)
    if (isGuarded && isHealed) {
      player.isAlive = false;
      player.deathReason = 'SHOCK_OVERDOSE';
      return;
    }

    // RULE: HEAL overrides Wolf Bite
    if (isTargetedByWolf && isHealed) {
      player.isAlive = true; // Saved
      return;
    }

    // RULE: GUARD overrides Wolf Bite
    if (isTargetedByWolf && isGuarded) {
       // Still alive
       return;
    }

    // RULE: Poison kills
    if (isPoisoned) {
      player.isAlive = false;
      player.deathReason = 'POISONED';
      return;
    }

    // RULE: Wolf Bite kills
    if (isTargetedByWolf) {
      player.isAlive = false;
      player.deathReason = 'KILLED_BY_WEREWOLF';
    }
  });

  return room;
};

module.exports = {
  wolfBiteSkill,
  guardSkill,
  witchHealSkill,
  witchPoisonSkill,
  resolveNight
};
