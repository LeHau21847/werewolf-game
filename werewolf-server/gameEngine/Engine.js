/**
 * GameEngine - Tech Lead Approved Architecture
 * 1. RAM Caching
 * 2. Pure Logic (Skills)
 * 3. Batch Processing (Night Queue)
 */

const TimerManager = require('./TimerManager');
const RoleCacheManager = require('./RoleCacheManager');
const Room = require('../models/Room');

class GameEngine {
  constructor() {
    this.rooms = {}; 
    this.nightActionsQueue = {}; // Record<roomId, Action[]>
  }

  getRoom(roomId) {
    if (!this.rooms[roomId]) {
      this.rooms[roomId] = new Room(roomId);
    }
    return this.rooms[roomId];
  }

  // Pure Logic: No Side Effects (Socket/DB)
  // Input: RoomState, Action -> Output: New RoomState
  applySkill(room, action) {
    const { type, actorId, targetId } = action;
    const actor = room.players[actorId];
    
    // Tra cứu Role từ RAM Cache (RoleCacheManager)
    const roleData = RoleCacheManager.getRole(actor.role);

    console.log(`[PureLogic] Applying ${type} from ${actor.name} to ${targetId}`);
    
    // Bản sao của Room State để đảm bảo tính immutability (hoặc cập nhật trực tiếp tùy thiết kế)
    // Ở đây ta xử lý logic thô dựa trên logicKey
    switch (roleData.logicKey) {
      case 'BODYGUARD':
        room.players[targetId].isGuarded = true;
        break;
      case 'WOLF':
        // Lưu trữ phiếu cắn, chưa giết ngay
        room.votes[actorId] = targetId; 
        break;
      // ... thêm 18+ roles khác
    }
    return room;
  }

  /**
   * Batch Processing: Resolve all night actions based on Priority
   */
  resolveNight(roomId) {
    const room = this.rooms[roomId];
    const actions = this.nightActionsQueue[roomId] || [];

    console.log(`[BatchProcessing] Resolving Night for Room ${roomId}. Actions: ${actions.length}`);

    // Thứ tự ưu tiên: 1. Bảo vệ -> 2. Sói -> 3. Phù thủy
    const priority = ['BODYGUARD', 'WOLF', 'WITCH', 'SERIAL_KILLER'];
    
    const sortedActions = actions.sort((a, b) => {
       const roleA = room.players[a.actorId].role;
       const roleB = room.players[b.actorId].role;
       return priority.indexOf(roleA) - priority.indexOf(roleB);
    });

    // Thực thi Pure Logical Skills
    sortedActions.forEach(action => {
       this.applySkill(room, action);
    });

    // Sau khi chạy xong Queue -> Xác định kết quả cuối cùng (Ai chết?)
    this.calculateNightDeaths(room);

    // Dọn dẹp Queue
    delete this.nightActionsQueue[roomId];
    
    room.setPhase('DAY_DISCUSSION');
    return room;
  }

  calculateNightDeaths(room) {
    // Logic: Nếu bị Sói cắn và không được Bảo vệ/Cứu -> isAlive = false
    // Tôn chỉ Zero-Trust: Server quyết định tất cả.
  }

  queueNightAction(roomId, action) {
    if (!this.nightActionsQueue[roomId]) this.nightActionsQueue[roomId] = [];
    this.nightActionsQueue[roomId].push(action);
  }

  handleVote(roomId, actorId, targetId) {
    const room = this.rooms[roomId];
    if (!room) return false;
    if (!room.dayVotes) room.dayVotes = {};
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
      if (count > maxVotes) {
        maxVotes = count;
        candidates = [targetId];
      } else if (count === maxVotes) {
         candidates.push(targetId);
      }
    });

    // Xóa phiếu bầu sau khi tính
    room.dayVotes = {};

    // Trường hợp hòa (Tie) hoặc không ai vote
    if (candidates.length !== 1) {
      room.phase = 'NIGHT_PHASE';
      return { type: 'TIE', executedId: null, message: 'Hoà phiếu. Không ai bị loại.' };
    }

    const executedId = candidates[0];
    const player = room.players[executedId];
    
    if (player) {
      player.isAlive = false;
      const roleData = RoleCacheManager.getRole(player.role);
      
      // Xử lý Hunter (Thợ Săn)
      if (roleData && roleData.logicKey === 'HUNTER') {
        room.phase = 'WAIT_HUNTER';
        return { type: 'HUNTER_EXECUTED', executedId, message: 'Thợ săn bị xử tử! Đợi thợ săn nhắm bắn...' };
      }
      
      room.phase = 'NIGHT_PHASE';
      return { type: 'EXECUTED', executedId, message: 'Người chơi đã bị xử tử!' };
    }

    return { type: 'ERROR' };
  }

  // Phase Transition Control & State Cleanup
  handlePhaseTransition(roomId) {
    const room = this.rooms[roomId];
    if (!room) return null;

    switch (room.phase) {
      case 'NIGHT_PHASE':
        room.phase = 'DAY_DISCUSSION';
        room.resetStatusEffects(); // Xóa sạch buff/debuff đêm
        room.dayVotes = {}; // Dọn sạch vote cũ
        break;
      case 'DAY_DISCUSSION':
        room.phase = 'VOTING_PHASE';
        break;
      case 'VOTING_PHASE':
        room.phase = 'EXECUTION_PHASE';
        break;
      case 'EXECUTION_PHASE':
      case 'WAIT_HUNTER':
        room.phase = 'NIGHT_PHASE';
        room.dayVotes = {};
        break;
      default:
        room.phase = 'LOBBY';
    }

    return room.phase;
  }
}

module.exports = new GameEngine();
