const io = require('socket.io-client');
const SERVER_URL = 'http://localhost:3000';

const args = process.argv.slice(2);
const ROOM_CODE = args[0];
const NUM_BOTS = parseInt(args[1]) || 7;

if (!ROOM_CODE) {
  console.error('Cách dùng: node test-bots.js <MãPhòng> [SốLượngBot]');
  process.exit(1);
}

const botNames = ['Alice', 'Bob', 'Charlie', 'Dave', 'Eve', 'Frank', 'Grace', 'Heidi', 'Ivan', 'Judy'];
const bots = [];

function createBot(index) {
  const socket = io(SERVER_URL);
  const name = `Bot_${botNames[index] || index}`;
  
  let myId = null;
  let myRole = null;
  let isAlive = true;

  socket.on('connect', () => {
    console.log(`[+] ${name} connected (${socket.id})`);
    myId = socket.id;
    socket.emit('action:JOIN_ROOM', { roomCode: ROOM_CODE, name: name });
  });

  let players = {};
  
  socket.on('state:ROOM_STATE', (state) => {
    if (state.players) players = state.players;
  });

  socket.on('state:GAME_STARTED', (data) => {
    isAlive = true;
    myRole = null;
    if (data.players) players = data.players;
  });

  socket.on('state:ROLE_REVEAL', ({ role }) => {
    myRole = role;
    console.log(`[ROLE] ${name} là ${myRole}`);
  });

  socket.on('state:PHASE_CHANGE', ({ phase, timer }) => {
    console.log(`[PHASE] ${name} thấy chuyển sang: ${phase}`);
    if (!isAlive) return;

    if (phase === 'NIGHT_PHASE') {
      setTimeout(() => performNightAction(socket, myRole, players, myId), Math.random() * 2000 + 1000);
    } else if (phase === 'VOTING_PHASE') {
      setTimeout(() => performVote(socket, players, myId), Math.random() * 2000 + 1000);
    }
  });

  socket.on('state:PLAYER_EXECUTED', (data) => {
    if (data.executedId === myId) isAlive = false;
    if (data.type === 'HUNTER_EXECUTED' && myRole === 'HUNTER') {
       setTimeout(() => performHunterShoot(socket, players, myId), 1500);
    }
  });

  socket.on('state:DAY_SUMMARY', ({ deaths }) => {
    if (deaths && deaths.find(d => d.id === myId)) isAlive = false;
  });
  
  socket.on('state:GAME_OVER', () => {
    console.log(`[END] ${name} thấy GAME OVER.`);
  });
  
  socket.on('disconnect', () => {
    console.log(`[-] ${name} disconnected.`);
  });

  bots.push({ socket, name });
}

function getRandomTarget(players, myId, excludeSelf = true, onlyAlive = true) {
  const candidates = Object.values(players).filter(p => {
    if (onlyAlive && p.isAlive === false) return false;
    if (excludeSelf && p.id === myId) return false;
    return true;
  });
  if (candidates.length === 0) return null;
  return candidates[Math.floor(Math.random() * candidates.length)].id;
}

function performNightAction(socket, role, players, myId) {
  if (!role) return;
  const targetId = getRandomTarget(players, myId, true, true);
  if (!targetId) return;

  if (role === 'WOLF') {
    socket.emit('action:NIGHT_ACTION', { type: 'WOLF', targetId });
  } else if (role === 'SEER') {
    socket.emit('action:SEER_CHECK', { targetId });
  } else if (role === 'BODYGUARD') {
    socket.emit('action:NIGHT_ACTION', { type: 'BODYGUARD', targetId });
  } else if (role === 'WITCH') {
    // 50% chance to heal or poison if we could. Let's just randomly poison.
    if (Math.random() > 0.5) {
      socket.emit('action:NIGHT_ACTION', { type: 'WITCH', targetId, skillType: 'POISON' });
    } else {
      const deadTarget = getRandomTarget(players, myId, true, false); // find dead
      if (deadTarget) socket.emit('action:NIGHT_ACTION', { type: 'WITCH', targetId: deadTarget, skillType: 'HEAL' });
    }
  }
}

function performVote(socket, players, myId) {
  const targetId = getRandomTarget(players, myId, true, true);
  if (targetId) {
    socket.emit('action:VOTE', { targetId });
  }
}

function performHunterShoot(socket, players, myId) {
  const targetId = getRandomTarget(players, myId, true, true);
  if (targetId) {
    socket.emit('action:HUNTER_SHOOT', { targetId });
  }
}

// Bắt đầu tạo bots
console.log(`Bắt đầu kết nối ${NUM_BOTS} bots vào phòng ${ROOM_CODE}...`);
for (let i = 0; i < NUM_BOTS; i++) {
  setTimeout(() => createBot(i), i * 300);
}
