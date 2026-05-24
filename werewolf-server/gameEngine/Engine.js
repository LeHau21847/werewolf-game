/**
 * GameEngine — Zero-Trust Authoritative Server
 * Principles: RAM Caching · Pure Logic · Batch Processing
 */

const TimerManager = require('./TimerManager');
const Room = require('../models/Room');
const { resolveNight } = require('./NightResolver');

// Hardcoded role data — no DB dependency for core game logic
const ROLE_DATA_MAP = {
  WOLF:      { logicKey: 'WOLF',      name: 'Sói Ma',    side: 'WEREWOLF',    description: 'Mỗi đêm chọn cắn một người dân.',           icon: '🐺' },
  VILLAGER:  { logicKey: 'VILLAGER',  name: 'Dân Làng',  side: 'VILLAGER',    description: 'Tìm và trục xuất Sói Ma khỏi làng.',        icon: '👨‍🌾' },
  SEER:      { logicKey: 'SEER',      name: 'Tiên Tri',  side: 'VILLAGER',    description: 'Mỗi đêm điều tra một người để biết đội.',  icon: '🔮' },
  WITCH:     { logicKey: 'WITCH',     name: 'Phù Thủy',  side: 'VILLAGER',    description: '1 bình cứu, 1 bình độc. Dùng mỗi đêm.',    icon: '🧙' },
  BODYGUARD: { logicKey: 'BODYGUARD', name: 'Bảo Vệ',   side: 'VILLAGER',    description: 'Mỗi đêm bảo vệ một người khỏi Sói cắn.',  icon: '🛡️' },
  HUNTER:    { logicKey: 'HUNTER',    name: 'Thợ Săn',  side: 'VILLAGER',    description: 'Khi bị trục xuất, bắn hạ một người.',        icon: '🏹' },
};

// Role pool by player count
function getRolePool(count) {
  if (count <= 5)  return ['WOLF', 'SEER', ...Array(count - 2).fill('VILLAGER')];
  if (count <= 7)  return ['WOLF', 'SEER', 'WITCH', ...Array(count - 3).fill('VILLAGER')];
  if (count <= 9)  return ['WOLF', 'WOLF', 'SEER', 'WITCH', 'BODYGUARD', ...Array(count - 5).fill('VILLAGER')];
  return ['WOLF', 'WOLF', 'SEER', 'WITCH', 'BODYGUARD', 'HUNTER', ...Array(count - 6).fill('VILLAGER')];
}

class GameEngine {
  constructor() {
    this.rooms = {};
    this.nightActionsQueue = {};
  }

  getRoom(roomId) {
    if (!this.rooms[roomId]) {
      this.rooms[roomId] = new Room(roomId);
    }
    return this.rooms[roomId];
  }

  getRoleData(logicKey) {
    return ROLE_DATA_MAP[logicKey] || { logicKey, name: logicKey, side: 'VILLAGER', description: '', icon: '❓' };
  }

  // --- Role Assignment ---
  assignRoles(roomId) {
    const room = this.rooms[roomId];
    if (!room) return;

    const playerIds = Object.keys(room.players);
    const roles = getRolePool(playerIds.length);

    // Fisher-Yates shuffle
    for (let i = roles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [roles[i], roles[j]] = [roles[j], roles[i]];
    }

    playerIds.forEach((id, idx) => {
      room.players[id].role = roles[idx];
    });

    console.log('[Engine] Roles assigned:', playerIds.map(id => `${room.players[id].name}=${room.players[id].role}`).join(', '));
  }

  // --- Night Queue ---
  queueNightAction(roomId, action) {
    if (!this.nightActionsQueue[roomId]) this.nightActionsQueue[roomId] = [];
    // Each role can only act once per night — overwrite if re-submitted
    const existing = this.nightActionsQueue[roomId].findIndex(a => a.actorId === action.actorId);
    if (existing >= 0) {
      this.nightActionsQueue[roomId][existing] = action;
    } else {
      this.nightActionsQueue[roomId].push(action);
    }
  }

  // --- Night Resolution ---
  resolveNight(roomId) {
    const room = this.rooms[roomId];
    const actions = this.nightActionsQueue[roomId] || [];
    console.log(`[BatchProcessing] Resolving Night for Room ${roomId}. Actions: ${actions.length}`);

    resolveNight(room, actions);

    delete this.nightActionsQueue[roomId];
    room.setPhase('DAY_DISCUSSION');

    // Collect deaths
    const deaths = Object.values(room.players)
      .filter(p => !p.isAlive && p.deathReason)
      .map(p => ({ id: p.id, name: p.name, deathReason: p.deathReason, role: p.role }));

    return { room, deaths };
  }

  // --- Day Voting ---
  handleVote(roomId, actorId, targetId) {
    const room = this.rooms[roomId];
    if (!room) return false;
    const actor = room.players[actorId];
    if (!actor || !actor.isAlive) return false;
    room.dayVotes[actorId] = targetId;
    return true;
  }

  resolveVoting(roomId) {
    const room = this.rooms[roomId];
    if (!room) return { type: 'ERROR' };

    const votes = room.dayVotes || {};
    const voteCounts = {};
    Object.values(votes).forEach(targetId => {
      voteCounts[targetId] = (voteCounts[targetId] || 0) + 1;
    });

    let maxVotes = 0;
    let candidates = [];
    Object.entries(voteCounts).forEach(([targetId, count]) => {
      if (count > maxVotes) { maxVotes = count; candidates = [targetId]; }
      else if (count === maxVotes) { candidates.push(targetId); }
    });

    room.dayVotes = {};

    if (candidates.length !== 1) {
      room.phase = 'NIGHT_PHASE';
      return { type: 'TIE', executedId: null, message: 'Hoà phiếu. Không ai bị loại.' };
    }

    const executedId = candidates[0];
    const player = room.players[executedId];
    if (!player) return { type: 'ERROR' };

    player.isAlive = false;
    player.deathReason = 'EXECUTED_BY_VOTE';
    const roleData = this.getRoleData(player.role);

    if (roleData.logicKey === 'HUNTER') {
      room.phase = 'WAIT_HUNTER';
      return { type: 'HUNTER_EXECUTED', executedId, executedName: player.name, executedRole: player.role, message: `${player.name} bị xử tử! Thợ Săn đang nhắm bắn...` };
    }

    room.phase = 'NIGHT_PHASE';
    return { type: 'EXECUTED', executedId, executedName: player.name, executedRole: player.role, message: `${player.name} đã bị xử tử!` };
  }

  // --- Phase Transitions ---
  handlePhaseTransition(roomId) {
    const room = this.rooms[roomId];
    if (!room) return null;

    switch (room.phase) {
      case 'NIGHT_PHASE':      room.phase = 'DAY_DISCUSSION'; room.resetStatusEffects(); room.dayVotes = {}; break;
      case 'DAY_DISCUSSION':   room.phase = 'VOTING_PHASE'; break;
      case 'VOTING_PHASE':     room.phase = 'EXECUTION_PHASE'; break;
      case 'EXECUTION_PHASE':
      case 'WAIT_HUNTER':      room.phase = 'NIGHT_PHASE'; room.dayVotes = {}; break;
      default:                  room.phase = 'LOBBY';
    }
    return room.phase;
  }

  // --- Win Condition ---
  checkWinCondition(roomId) {
    const room = this.rooms[roomId];
    if (!room) return null;

    const alive = Object.values(room.players).filter(p => p.isAlive);
    const aliveWolves = alive.filter(p => p.role === 'WOLF');
    const aliveVillagers = alive.filter(p => p.role !== 'WOLF');

    if (aliveWolves.length === 0) {
      return {
        winner: 'VILLAGERS',
        message: '🎉 Dân Làng Chiến Thắng! Tất cả Sói Ma đã bị tiêu diệt!',
        allPlayers: this.getAllPlayersWithRoles(roomId)
      };
    }
    if (aliveWolves.length >= aliveVillagers.length) {
      return {
        winner: 'WEREWOLVES',
        message: '🐺 Sói Ma Chiến Thắng! Chúng đã chiếm lĩnh làng!',
        allPlayers: this.getAllPlayersWithRoles(roomId)
      };
    }
    return null;
  }

  getAllPlayersWithRoles(roomId) {
    const room = this.rooms[roomId];
    if (!room) return [];
    return Object.values(room.players).map(p => ({
      id: p.id,
      name: p.name,
      role: p.role,
      roleData: this.getRoleData(p.role),
      isAlive: p.isAlive
    }));
  }
}

module.exports = new GameEngine();
