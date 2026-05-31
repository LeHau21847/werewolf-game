const io = require('socket.io-client');
const SERVER_URL = 'http://localhost:3000';

const args = process.argv.slice(2);
const ROOM_ID = args[0];
const NUM_BOTS = parseInt(args[1], 10) || 7;

if (!ROOM_ID) {
  console.error('Cách dùng: node test-bots.js <RoomId> [SoLuongBot]');
  process.exit(1);
}

const botNames = ['Alice', 'Bob', 'Charlie', 'Dave', 'Eve', 'Frank', 'Grace', 'Heidi', 'Ivan', 'Judy'];
const bots = [];

function createBot(index) {
  const socket = io(SERVER_URL, { autoConnect: true, reconnectionAttempts: 5 });
  const name = `Bot_${botNames[index] || index}`;

  let myId = null;
  let myRole = null;
  let isAlive = true;
  let players = {};

  socket.on('connect', () => {
    myId = socket.id;
    console.log(`[+] ${name} connected (${myId})`);
    socket.emit('JOIN_ROOM', { roomId: ROOM_ID, playerId: myId, playerName: name });
  });

  socket.on('state:FULL_SYNC', (state) => {
    players = state.players || {};
    isAlive = players[myId]?.isAlive !== false;
  });

  socket.on('state:PLAYER_STATUS', (playerList) => {
    playerList.forEach(p => { players[p.id] = { ...players[p.id], ...p }; });
  });

  socket.on('state:GAME_STARTED', (data) => {
    isAlive = true;
    myRole = null;
    players = data.players || players;
  });

  socket.on('state:ROLE_ASSIGNED', ({ role }) => {
    myRole = role;
    console.log(`[ROLE] ${name} la ${myRole}`);
  });

  socket.on('state:PHASE_STARTED', ({ currentPhase }) => {
    console.log(`[PHASE] ${name} thay chuyen sang: ${currentPhase}`);
    if (!isAlive) return;

    if (currentPhase === 'NIGHT_PHASE') {
      setTimeout(() => performNightAction(socket, myRole, players, myId), Math.random() * 1200 + 600);
    } else if (currentPhase === 'VOTING_PHASE') {
      setTimeout(() => performVote(socket, players, myId), Math.random() * 1200 + 600);
    } else if (currentPhase === 'WAIT_HUNTER' && myRole === 'HUNTER') {
      setTimeout(() => performHunterShoot(socket, players, myId), 800);
    }
  });

  socket.on('state:NIGHT_RESOLVED', ({ players: updated }) => {
    if (Array.isArray(updated)) {
      updated.forEach(p => { players[p.id] = { ...players[p.id], ...p }; });
    }
    isAlive = players[myId]?.isAlive !== false;
  });

  socket.on('state:PLAYER_EXECUTED', (data) => {
    if (data.executedId === myId) isAlive = false;
  });

  socket.on('state:GAME_OVER', () => {
    console.log(`[END] ${name} thay GAME OVER.`);
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
    if (Math.random() > 0.5) {
      socket.emit('action:NIGHT_ACTION', { type: 'WITCH', targetId, skillType: 'POISON' });
    } else {
      const deadTarget = getRandomTarget(players, myId, true, false);
      if (deadTarget) socket.emit('action:NIGHT_ACTION', { type: 'WITCH', targetId: deadTarget, skillType: 'HEAL' });
    }
  }
}

function performVote(socket, players, myId) {
  const targetId = getRandomTarget(players, myId, true, true);
  if (targetId) {
    socket.emit('action:VOTE_PLAYER', { targetId });
  }
}

function performHunterShoot(socket, players, myId) {
  const targetId = getRandomTarget(players, myId, true, true);
  if (targetId) {
    socket.emit('action:HUNTER_SHOOT', { targetId });
  }
}

console.log(`Bat dau ket noi ${NUM_BOTS} bots vao phong ${ROOM_ID}...`);
for (let i = 0; i < NUM_BOTS; i++) {
  setTimeout(() => createBot(i), i * 300);
}
