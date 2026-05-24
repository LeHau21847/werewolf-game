'use strict';

// ── CONFIG ──────────────────────────────────────
const SERVER_URL = window.location.origin;

// ── STATE ────────────────────────────────────────
const S = {
  socket: null,
  playerId: null,
  playerName: null,
  roomId: null,
  isHost: false,
  myRole: null,
  myRoleData: null,
  players: {},
  phase: 'LOGIN',
  endTime: null,
  votes: {},
  nightActionDone: false,
  witchUsedHeal: false,
  witchUsedPoison: false,
  witchMode: null,
  wolfTargetId: null,
  seerChecked: false,
  timerInterval: null,
  cardFlipped: false,
};

const ROLE_CLASSES = { WOLF:'wolf', VILLAGER:'villager', SEER:'seer', WITCH:'witch', BODYGUARD:'bodyguard', HUNTER:'hunter' };
const AVATARS = ['🧑','👩','👨','🧔','👱','🧓','👴','👵','🧕'];

function getAvatar(id) { return AVATARS[Math.abs(hashStr(id)) % AVATARS.length]; }
function hashStr(s) { let h=0; for(let i=0;i<s.length;i++) h=Math.imul(31,h)+s.charCodeAt(i)|0; return h; }
function genId() { return Math.random().toString(36).slice(2,10).toUpperCase(); }

// ── VIEWS ────────────────────────────────────────
function showView(id) {
  document.querySelectorAll('.view').forEach(v => { v.classList.remove('active'); });
  const el = document.getElementById('view-' + id);
  if (el) { el.classList.add('active'); el.querySelector('.view-enter')?.classList.remove('view-enter'); void el.offsetWidth; el.querySelector('[class*="view-enter"]'); el.classList.add('active'); }
}

function updateBackground(phase) {
  document.body.className = '';
  if (['DAY_DISCUSSION', 'VOTING_PHASE', 'EXECUTION_PHASE'].includes(phase)) {
    document.body.classList.add('bg-day');
  } else if (phase === 'NIGHT_PHASE') {
    document.body.classList.add('bg-night');
  } else {
    document.body.classList.add('bg-lobby');
  }
}

// ── TOAST ────────────────────────────────────────
function toast(msg, type = 'info') {
  const c = document.getElementById('toast-container');
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(() => t.remove(), 4200);
}

// ── TIMER ────────────────────────────────────────
const PHASE_LABELS = {
  NIGHT_PHASE: '🌙 Màn Đêm',
  DAY_DISCUSSION: '☀️ Thảo Luận',
  VOTING_PHASE: '⚔️ Bầu Chọn',
  EXECUTION_PHASE: '⚰️ Hành Quyết',
  WAIT_HUNTER: '🏹 Thợ Săn',
  LOBBY: '🏡 Sảnh Chờ',
};

function startTimer(endTime, phase) {
  S.endTime = endTime;
  clearInterval(S.timerInterval);
  const banner = document.getElementById('phase-banner');
  const nameEl = document.getElementById('phase-name');
  const timerEl = document.getElementById('phase-timer');
  
  if (phase === 'LOBBY') {
    banner.classList.remove('show');
    banner.style.display = 'none';
    if (S.timerInterval) clearInterval(S.timerInterval);
    return;
  }
  
  banner.style.display = 'flex';
  banner.classList.add('show');
  nameEl.textContent = PHASE_LABELS[phase] || phase;

  S.timerInterval = setInterval(() => {
    const rem = Math.max(0, Math.ceil((S.endTime - Date.now()) / 1000));
    timerEl.textContent = rem + 's';
    timerEl.classList.toggle('urgent', rem <= 10);
    if (rem <= 0) clearInterval(S.timerInterval);
  }, 500);
}

// ── BACKGROUND STARS ─────────────────────────────
function initStars() {
  const bg = document.getElementById('bg-canvas');
  for (let i = 0; i < 80; i++) {
    const s = document.createElement('div');
    s.className = 'star';
    const size = Math.random() * 2 + 1;
    s.style.cssText = `width:${size}px;height:${size}px;top:${Math.random()*100}%;left:${Math.random()*100}%;animation-delay:${Math.random()*4}s;animation-duration:${2+Math.random()*3}s`;
    bg.appendChild(s);
  }
}

// ── SOCKET SETUP ─────────────────────────────────
function connectSocket() {
  S.socket = io(SERVER_URL, { autoConnect: false });
  const sk = S.socket;

  sk.on('connect', () => {
    toast('Đã kết nối máy chủ!', 'success');
    sk.emit('JOIN_ROOM', { roomId: S.roomId, playerId: S.playerId, playerName: S.playerName });
    // Init WebRTC signaling on this socket
    VoiceChat.init(sk);
    // Send saved character if any
    const char = CharSystem.getCurrent();
    sk.emit('action:UPDATE_CHARACTER', char);
  });

  sk.on('disconnect', () => toast('Mất kết nối, đang thử lại...', 'error'));
  sk.on('connect_error', () => toast('Không thể kết nối server!', 'error'));

  sk.on('state:FULL_SYNC', data => {
    S.players = data.players || {};
    S.phase = data.phase;
    S.isHost = data.hostId === S.playerId;
    if (data.endTime) startTimer(data.endTime, data.phase);
    updateBackground(S.phase);

    if (data.phase === 'LOBBY') { showView('lobby'); renderLobby(); SFX.bgm('lobby'); }
    else if (data.phase === 'NIGHT_PHASE') { showView('night'); renderNight(); }
    else if (data.phase === 'DAY_DISCUSSION') { showView('day'); renderDay([]); }
    else if (data.phase === 'VOTING_PHASE') { showView('voting'); renderVoting(); }
  });

  sk.on('state:PLAYER_STATUS', players => {
    players.forEach(p => { S.players[p.id] = { ...S.players[p.id], ...p }; });
    if (S.phase === 'LOBBY') renderLobby();
  });

  sk.on('state:CHARACTER_UPDATED', ({ playerId, character }) => {
    if (S.players[playerId]) S.players[playerId].character = character;
    if (S.phase === 'LOBBY') renderLobby();
  });

  sk.on('state:ROLE_ASSIGNED', ({ role, roleData }) => {
    S.myRole = role;
    S.myRoleData = roleData;
  });

  sk.on('state:GAME_STARTED', data => {
    S.players = data.players || {};
    S.phase = 'NIGHT_PHASE';
    S.nightActionDone = false;
    updateBackground(S.phase);
    SFX.play('action_confirm');
    showView('role-reveal');
    renderRoleReveal();
  });

  sk.on('state:PHASE_STARTED', ({ currentPhase, endTime }) => {
    S.phase = currentPhase;
    S.nightActionDone = false;
    S.seerChecked = false;
    S.witchMode = null;
    S.wolfTargetId = null;
    startTimer(endTime, currentPhase);
    updateBackground(currentPhase);
    // Show mic button during day phases
    const micBtn = document.getElementById('mic-btn');
    const me = S.players[S.playerId];
    const alive = !me || me.isAlive !== false;
    if (micBtn) micBtn.style.display = alive && ['DAY_DISCUSSION','VOTING_PHASE'].includes(currentPhase) ? 'block' : 'none';

    if (currentPhase === 'NIGHT_PHASE') {
      SFX.play('night_start'); SFX.bgm('night');
      showView('night'); renderNight();
      setChatVisible(false);
    } else if (currentPhase === 'DAY_DISCUSSION') {
      SFX.play('day_start'); SFX.bgm('day');
      showView('day'); renderDay(S._pendingDeaths || []);
      setChatVisible(alive);
    } else if (currentPhase === 'VOTING_PHASE') {
      SFX.bgm('voting');
      showView('voting'); renderVoting();
      setChatVisible(alive);
    } else if (currentPhase === 'EXECUTION_PHASE') {
      SFX.play('execution');
      setChatVisible(false);
      if (micBtn) micBtn.style.display = 'none';
    }
  });

  sk.on('state:NIGHT_RESOLVED', ({ deaths, players }) => {
    players.forEach(p => { S.players[p.id] = { ...S.players[p.id], ...p }; });
    // Lock mic/chat for dead players
    const me = S.players[S.playerId];
    if (me && !me.isAlive) {
      VoiceChat.disable();
      setChatVisible(false);
    }
    S._pendingDeaths = deaths;
    showDeathOverlay(deaths);
  });

  sk.on('state:VOTE_UPDATED', ({ votes }) => {
    S.votes = votes;
    if (S.phase === 'VOTING_PHASE') updateVoteCounts();
  });

  sk.on('state:VOTE_TIED', ({ message }) => toast('⚖️ ' + message, 'info'));

  sk.on('state:PLAYER_EXECUTED', result => {
    SFX.play('execution');
    showView('execution');
    renderExecution(result);
    setChatVisible(false);
    // If I was executed, lock mic
    if (result.executedId === S.playerId) VoiceChat.disable();
    document.getElementById('mic-btn').style.display = 'none';
  });

  sk.on('state:ACTION_CONFIRMED', () => {
    S.nightActionDone = true;
    renderNight();
  });

  sk.on('state:SEER_RESULT', result => {
    S.seerChecked = true;
    playRoleEffect('SEER', result.targetId);
    showSeerResult(result);
  });

  sk.on('state:WOLF_TARGET', ({ targetId, targetName }) => {
    S.wolfTargetId = targetId;
    playRoleEffect('WOLF', targetId);
    const el = document.getElementById('witch-wolf-info');
    if (el) el.textContent = `🐺 Sói Ma đang tấn công: ${targetName || targetId}`;
  });

  sk.on('state:PLAYER_OFFLINE', ({ playerId }) => {
    if (S.players[playerId]) S.players[playerId].isOffline = true;
    if (S.phase === 'LOBBY') renderLobby();
  });

  sk.on('state:GAME_OVER', result => {
    clearInterval(S.timerInterval);
    SFX.stopAll();
    document.getElementById('phase-banner').classList.remove('show');
    setChatVisible(false);
    setTimeout(() => {
      SFX.play(result.winner === 'WEREWOLVES' ? 'lose' : 'win');
    }, 400);
    showView('gameover');
    renderGameOver(result);
  });

  // ── CHAT ───────────────────────────────────────────────────────────────────
  sk.on('state:CHAT_MSG', ({ playerId, playerName, message, isAlive }) => {
    SFX.play('chat_receive');
    appendChatMsg(playerName, message, isAlive, playerId === S.playerId);
  });

  sk.on('state:ERROR', ({ message }) => toast('❌ ' + message, 'error'));

  sk.connect();
}

// ── RENDER: LOBBY ────────────────────────────────
function renderLobby() {
  document.getElementById('room-code-val').textContent = S.roomId;
  const grid = document.getElementById('player-grid-lobby');
  const list = Object.values(S.players);
  document.getElementById('player-count').textContent = list.length;

  grid.innerHTML = list.map((p, idx) => {
    const char = p.character || null;
    const avatar = char ? CharSystem.renderAvatar(char, 'md') : `<span style="font-size:36px">${getAvatar(p.id)}</span>`;
    const isHost = idx === 0;
    return `<div class="lobby-player-card ${isHost ? 'host' : ''}" data-player-id="${p.id}">
      <div class="lobby-player-avatar">${avatar}</div>
      <div class="lobby-player-name">${esc(p.name)}</div>
      <div class="lobby-player-status">${p.isOffline ? '🔴 Offline' : '🟢 Online'}${isHost ? ' ★ Chủ phòng' : ''}</div>
    </div>`;
  }).join('');

  const startBtn = document.getElementById('btn-start');
  const waitMsg = document.getElementById('lobby-wait-msg');
  if (S.isHost) {
    startBtn.style.display = 'block';
    waitMsg.style.display = 'none';
    startBtn.disabled = list.length < 4;
    startBtn.textContent = list.length < 4 ? `⚔️ Cần thêm ${4 - list.length} người...` : '⚔️ Bắt Đầu Trận Đấu';
  } else {
    startBtn.style.display = 'none';
    waitMsg.style.display = 'block';
  }
}

// ── RENDER: ROLE REVEAL ──────────────────────────
function renderRoleReveal() {
  const role = S.myRole || 'VILLAGER';
  const rd = S.myRoleData || { name: role, icon: '❓', description: '', side: 'VILLAGER' };
  const cls = ROLE_CLASSES[role] || 'villager';
  const front = document.getElementById('role-card-front');
  front.className = `role-card-face role-card-front ${cls}`;
  front.innerHTML = `
    <div class="role-card-icon">${rd.icon || '❓'}</div>
    <div class="role-card-name" style="color:${roleColor(role)}">${rd.name}</div>
    <div class="role-card-side">${rd.side === 'WEREWOLF' ? '🩸 Phe Sói Ma' : '🌿 Phe Dân Làng'}</div>
    <div class="role-card-desc">${rd.description || ''}</div>`;

  S.cardFlipped = false;
  document.getElementById('role-card').classList.remove('flipped');

  let sec = 10;
  const cd = document.getElementById('reveal-countdown');
  const iv = setInterval(() => {
    sec--;
    cd.textContent = `Game bắt đầu sau: ${sec}s`;
    if (sec <= 0) { clearInterval(iv); }
  }, 1000);
}

function flipCard() {
  if (S.cardFlipped) return;
  S.cardFlipped = true;
  document.getElementById('role-card').classList.add('flipped');
  document.getElementById('reveal-hint').textContent = '✨ Ghi nhớ vai của bạn!';
}

function roleColor(role) {
  const map = { WOLF:'#e53935', VILLAGER:'#43a047', SEER:'#ab47bc', WITCH:'#7e57c2', BODYGUARD:'#42a5f5', HUNTER:'#ff7043' };
  return map[role] || '#e8dfc8';
}

// ── RENDER: NIGHT ────────────────────────────────
function renderNight() {
  const role = S.myRole || 'VILLAGER';
  const alive = alivePlayers().filter(p => p.id !== S.playerId);

  document.getElementById('night-wolf').style.display = 'none';
  document.getElementById('night-seer').style.display = 'none';
  document.getElementById('night-witch').style.display = 'none';
  document.getElementById('night-bodyguard').style.display = 'none';
  document.getElementById('night-sleep').style.display = 'none';

  const subtitle = document.getElementById('night-subtitle');

  if (role === 'WOLF') {
    subtitle.textContent = 'Chọn người để tấn công đêm nay...';
    document.getElementById('night-wolf').style.display = 'block';
    const doneEl = document.getElementById('night-wolf-done');
    const gridEl = document.getElementById('night-wolf-players');
    if (S.nightActionDone) { doneEl.style.display = 'block'; gridEl.style.display = 'none'; }
    else { doneEl.style.display = 'none'; gridEl.style.display = 'grid'; gridEl.innerHTML = alive.map(p => playerNightBtn(p, 'wolf-bite')).join(''); }
  } else if (role === 'SEER') {
    subtitle.textContent = 'Chọn người để điều tra...';
    document.getElementById('night-seer').style.display = 'block';
    const doneEl = document.getElementById('night-seer-done');
    const gridEl = document.getElementById('night-seer-players');
    if (S.seerChecked) { doneEl.style.display = 'block'; gridEl.style.display = 'none'; }
    else { doneEl.style.display = 'none'; gridEl.style.display = 'grid'; gridEl.innerHTML = alive.map(p => playerNightBtn(p, 'seer-check')).join(''); }
  } else if (role === 'WITCH') {
    subtitle.textContent = 'Sử dụng phép thuật của bạn...';
    document.getElementById('night-witch').style.display = 'block';
    renderWitch();
  } else if (role === 'BODYGUARD') {
    subtitle.textContent = 'Chọn người để bảo vệ đêm nay...';
    document.getElementById('night-bodyguard').style.display = 'block';
    const doneEl = document.getElementById('night-bodyguard-done');
    const gridEl = document.getElementById('night-bodyguard-players');
    if (S.nightActionDone) { doneEl.style.display = 'block'; gridEl.style.display = 'none'; }
    else { doneEl.style.display = 'none'; gridEl.style.display = 'grid'; gridEl.innerHTML = alivePlayers().map(p => playerNightBtn(p, 'guard')).join(''); }
  } else {
    subtitle.textContent = 'Hãy ngủ ngon và tin tưởng vào dân làng...';
    document.getElementById('night-sleep').style.display = 'block';
  }
}

function renderWitch() {
  const doneEl = document.getElementById('night-witch-done');
  if (S.nightActionDone) { doneEl.style.display = 'block'; return; }
  doneEl.style.display = 'none';

  const healBtn = document.getElementById('btn-witch-heal');
  const poisonBtn = document.getElementById('btn-witch-poison');
  healBtn.disabled = S.witchUsedHeal;
  poisonBtn.disabled = S.witchUsedPoison;
  healBtn.onclick = () => { S.witchMode = 'HEAL'; showWitchTargets(); };
  poisonBtn.onclick = () => { S.witchMode = 'POISON'; showWitchTargets(); };

  const targetLabel = document.getElementById('night-witch-target-label');
  if (S.witchMode) {
    targetLabel.style.display = 'block';
    document.getElementById('witch-target-action-label').textContent =
      S.witchMode === 'HEAL' ? '💚 Chọn người để cứu sống' : '☠️ Chọn người để hạ độc';
    const grid = document.getElementById('night-witch-players');
    const targets = S.witchMode === 'HEAL'
      ? Object.values(S.players).filter(p => !p.isAlive) // heal dead
      : alivePlayers().filter(p => p.id !== S.playerId); // poison alive
    if (targets.length === 0) {
      grid.innerHTML = '<p style="color:var(--text-muted);font-size:13px;text-align:center;padding:16px">Không có mục tiêu phù hợp</p>';
    } else {
      grid.innerHTML = targets.map(p => playerNightBtn(p, 'witch-action')).join('');
    }
  } else {
    targetLabel.style.display = 'none';
  }
}

function showWitchTargets() { renderWitch(); }

function playerNightBtn(p, action) {
  return `<button class="night-player-btn" onclick="nightAction('${action}','${p.id}')" ${p.isAlive === false ? 'disabled' : ''}>
    <span class="p-avatar">${getAvatar(p.id)}</span>
    <span class="p-name">${esc(p.name)}</span>
  </button>`;
}

function nightAction(action, targetId) {
  const sk = S.socket;
  if (action === 'wolf-bite') {
    SFX.play('role_wolf');
    sk.emit('action:NIGHT_ACTION', { type: 'WOLF', targetId });
    S.nightActionDone = true; renderNight();
  } else if (action === 'seer-check') {
    SFX.play('role_seer');
    sk.emit('action:SEER_CHECK', { targetId });
    S.seerChecked = true; renderNight();
  } else if (action === 'guard') {
    SFX.play('role_bodyguard');
    sk.emit('action:NIGHT_ACTION', { type: 'BODYGUARD', targetId });
    S.nightActionDone = true; renderNight();
  } else if (action === 'witch-action') {
    if (S.witchMode === 'HEAL') { SFX.play('role_witch_heal'); S.witchUsedHeal = true; }
    if (S.witchMode === 'POISON') { SFX.play('role_witch_poison'); S.witchUsedPoison = true; }
    sk.emit('action:NIGHT_ACTION', { type: 'WITCH', targetId, skillType: S.witchMode });
    S.nightActionDone = true; S.witchMode = null; renderNight();
  }
}

function showSeerResult(result) {
  const box = document.getElementById('seer-result-display');
  if (!box) return;
  const isWolf = result.side === 'WEREWOLF';
  box.style.display = 'block';
  box.innerHTML = `
    <div class="sr-name">${esc(result.targetName)}</div>
    <div class="sr-side ${isWolf ? 'wolf' : 'villager'}">${isWolf ? '🐺 SÓI MA' : '🌿 DÂN LÀNG'}</div>`;
}

// ── RENDER: DAY ──────────────────────────────────
function renderDay(deaths) {
  const grid = document.getElementById('day-players-grid');
  grid.innerHTML = Object.values(S.players).map(p => {
    const char = p.character || null;
    const avatar = char ? CharSystem.renderAvatar(char, 'md') : `<span style="font-size:26px">${getAvatar(p.id)}</span>`;
    return `<div class="day-player-card ${p.isAlive ? '' : 'dead'}" data-player-id="${p.id}">
      <div class="p-avatar">${avatar}</div>
      <div class="p-name">${esc(p.name)}</div>
      <div class="p-status">${p.isAlive ? '💚 Sống' : '💀 Đã chết'}</div>
    </div>`;
  }).join('');

  const log = document.getElementById('day-log-list');
  if (deaths && deaths.length > 0) {
    log.innerHTML = deaths.map(d => {
      const reasons = { KILLED_BY_WEREWOLF: 'bị Sói Ma cắn', POISONED: 'bị Phù Thủy đầu độc', SHOCK_OVERDOSE: 'sốc thuốc (bảo vệ + bình cứu)' };
      return `<div class="log-entry death">💀 <b>${esc(d.name)}</b> ${reasons[d.deathReason] || 'đã chết'}</div>`;
    }).join('');
  } else {
    log.innerHTML = '<div class="log-entry saved">🌅 Đêm qua yên bình — không ai bị hại!</div>';
  }

  const sumEl = document.getElementById('day-night-summary');
  sumEl.textContent = deaths?.length > 0
    ? `${deaths.length} người đã bị hại đêm qua. Hãy thảo luận!`
    : 'Đêm qua bình yên. Hãy thảo luận tìm ra Sói Ma!';
}

// ── RENDER: VOTING ───────────────────────────────
function renderVoting() {
  S.votes = {};
  const grid = document.getElementById('voting-grid');
  grid.innerHTML = Object.values(S.players).map(p => {
    const dead = !p.isAlive;
    const self = p.id === S.playerId;
    const char = p.character || null;
    const avatar = char ? CharSystem.renderAvatar(char, 'md') : `<span class="vote-avatar">${getAvatar(p.id)}</span>`;
    return `<div class="vote-card ${dead ? 'dead' : ''} ${self ? 'self' : ''}" id="vote-${p.id}" data-player-id="${p.id}" onclick="${(!dead && !self) ? `castVote('${p.id}')` : ''}">
      <span class="vote-count" id="vc-${p.id}"></span>
      ${avatar}
      <span class="vote-name">${esc(p.name)}</span>
      ${dead ? '<span style="font-size:11px;color:var(--text-muted)">💀 Đã chết</span>' : ''}
    </div>`;
  }).join('');
}

function updateVoteCounts() {
  const counts = {};
  Object.values(S.votes).forEach(t => { counts[t] = (counts[t] || 0) + 1; });
  Object.values(S.players).forEach(p => {
    const el = document.getElementById(`vc-${p.id}`);
    if (el) el.textContent = counts[p.id] || '';
  });
  // Highlight my vote
  if (S.votes[S.playerId]) {
    document.querySelectorAll('.vote-card').forEach(c => c.classList.remove('voted'));
    const myTarget = document.getElementById(`vote-${S.votes[S.playerId]}`);
    if (myTarget) myTarget.classList.add('voted');
    document.getElementById('my-vote-display').textContent = '✅ Bạn đã bầu chọn!';
  }
}

function castVote(targetId) {
  SFX.play('vote_cast');
  S.socket.emit('action:VOTE_PLAYER', { targetId });
  S.votes[S.playerId] = targetId;
  updateVoteCounts();
}

// ── RENDER: EXECUTION ────────────────────────────
function renderExecution(result) {
  const isHunter = result.type === 'HUNTER_EXECUTED' || result.type === 'HUNTER_SHOT';
  const isTie = result.type === 'TIE';

  const animContainer = document.getElementById('hanging-anim-container');
  if (result.type === 'EXECUTED' && result.executedId) {
    const player = S.players[result.executedId];
    if (player && animContainer) {
      const avatarContainer = document.getElementById('hung-avatar');
      avatarContainer.innerHTML = player.character 
        ? CharSystem.renderAvatar(player.character, 'lg') 
        : `<span style="font-size:70px">${getAvatar(player.id)}</span>`;
      
      animContainer.style.display = 'flex';
      animContainer.classList.remove('drop');
      void animContainer.offsetWidth; // trigger reflow
      animContainer.classList.add('drop');

      if (player.role === 'TANNER') {
        avatarContainer.classList.add('tanner-smile');
      } else {
        avatarContainer.classList.remove('tanner-smile');
      }
      
      document.body.classList.add('shake-screen');
      setTimeout(() => document.body.classList.remove('shake-screen'), 500);
      
      const mainWrap = document.getElementById('exec-wrap-main');
      if (mainWrap) mainWrap.style.transform = 'translateY(100px)';
    }
  } else {
    if (animContainer) animContainer.style.display = 'none';
    const mainWrap = document.getElementById('exec-wrap-main');
    if (mainWrap) mainWrap.style.transform = 'translateY(0)';
  }

  document.getElementById('exec-icon').textContent = isTie ? '⚖️' : '☠️';
  document.getElementById('exec-headline').textContent = isTie ? 'Hoà Phiếu!' : isHunter ? 'Thợ Săn Bị Xử Tử!' : 'Tử Hình!';
  document.getElementById('exec-name').textContent = result.executedName || '';
  document.getElementById('exec-msg').textContent = result.message || '';

  if (result.executedRole) {
    const roleNames = { WOLF:'Sói Ma', VILLAGER:'Dân Làng', SEER:'Tiên Tri', WITCH:'Phù Thủy', BODYGUARD:'Bảo Vệ', HUNTER:'Thợ Săn' };
    document.getElementById('exec-role').textContent = `Vai: ${roleNames[result.executedRole] || result.executedRole}`;
  }

  // Hunter shoot UI
  const hunterWrap = document.getElementById('hunter-shoot-wrap');
  if (result.type === 'HUNTER_EXECUTED' && S.myRole === 'HUNTER') {
    hunterWrap.style.display = 'block';
    const grid = document.getElementById('hunter-shoot-grid');
    grid.innerHTML = alivePlayers()
      .filter(p => p.id !== S.playerId)
      .map(p => `<button class="night-player-btn" onclick="hunterShoot('${p.id}')">
        <span class="p-avatar">${getAvatar(p.id)}</span>
        <span class="p-name">${esc(p.name)}</span>
      </button>`).join('');
  } else {
    hunterWrap.style.display = 'none';
  }
}

function submitNightAction(targetId) {
  if (S.nightActionDone) return;
  playRoleEffect(S.myRole, targetId);
  S.socket.emit('action:NIGHT_ACTION', { targetId, actionType: S.witchMode });
}

function hunterShoot(targetId) {
  SFX.play('role_hunter');
  S.socket.emit('action:HUNTER_SHOOT', { targetId });
  document.getElementById('hunter-shoot-wrap').style.display = 'none';
  toast('🏹 Đã bắn!', 'info');
}

// ── RENDER: GAME OVER ────────────────────────────
function renderGameOver(result) {
  const isWolf = result.winner === 'WEREWOLVES';
  document.getElementById('gameover-banner').textContent = isWolf ? '🐺' : '🎉';
  const title = document.getElementById('gameover-title');
  title.textContent = isWolf ? 'Sói Ma Chiến Thắng!' : 'Dân Làng Chiến Thắng!';
  title.className = `gameover-title ${isWolf ? 'wolves' : 'villagers'}`;
  document.getElementById('gameover-msg').textContent = result.message;

  const grid = document.getElementById('gameover-grid');
  if (result.allPlayers) {
    grid.innerHTML = result.allPlayers.map(p => `
      <div class="gameover-player ${p.roleData?.side === 'WEREWOLF' ? 'wolf-side' : 'villager-side'} ${p.isAlive ? '' : 'dead'}">
        <div class="p-icon">${p.roleData?.icon || '❓'}</div>
        <div class="p-name">${esc(p.name)}</div>
        <div class="p-role">${p.roleData?.name || p.role}</div>
        <div class="p-alive">${p.isAlive ? '💚 Sống' : '💀 Chết'}</div>
      </div>`).join('');
  }
}

// ── HELPERS ──────────────────────────────────────
function alivePlayers() { return Object.values(S.players).filter(p => p.isAlive !== false); }
function esc(s) { const d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; }
function copyRoomCode() { navigator.clipboard.writeText(S.roomId).then(() => toast('📋 Đã copy mã phòng!', 'success')); }
function restartGame() { location.reload(); }
function toggleSound() { SFX.toggle(); }

// ── CHARACTER SAVE CALLBACK ───────────────────
function onCharacterSaved(char) {
  CharSystem.setCurrent(char);
  if (S.socket?.connected) {
    S.socket.emit('action:UPDATE_CHARACTER', char);
  }
  // Update own player display immediately
  if (S.players[S.playerId]) S.players[S.playerId].character = char;
  if (S.phase === 'LOBBY') renderLobby();
  toast('✨ Đã lưu nhân vật!', 'success');
}

// ── DEATH OVERLAY ────────────────────────────────
function showDeathOverlay(deaths) {
  const overlay = document.getElementById('death-overlay');
  const list = document.getElementById('death-overlay-list');
  const icon = document.getElementById('death-overlay-icon');
  const autoEl = document.getElementById('death-overlay-auto');

  if (!deaths || deaths.length === 0) {
    icon.textContent = '🌅';
    list.innerHTML = '<div style="font-size:16px;color:var(--text-muted);padding:20px">🕊️ Đêm qua bình yên — không ai bị hại!</div>';
  } else {
    icon.textContent = '🌒';
    SFX.play('death');
    const REASONS = { KILLED_BY_WEREWOLF:'bị Sói Ma cắn', POISONED:'bị Phù Thủy đầu độc', SHOCK_OVERDOSE:'sốc thuốc (bảo vệ + bình cứu)' };
    list.innerHTML = deaths.map(d => `
      <div style="background:rgba(192,57,43,0.15);border:1px solid rgba(192,57,43,0.4);border-radius:12px;padding:16px;display:flex;align-items:center;gap:16px">
        <div style="font-size:36px">${getAvatar(d.id)}</div>
        <div style="text-align:left">
          <div style="font-family:'Cinzel',serif;font-size:18px;font-weight:700;color:#fff">${esc(d.name)}</div>
          <div style="font-size:13px;color:#ff8a80;margin-top:4px">💀 ${REASONS[d.deathReason] || 'đã ra đi'}</div>
        </div>
      </div>`).join('');
  }

  overlay.style.display = 'flex';

  // Auto close after 8 seconds
  let sec = 8;
  const iv = setInterval(() => {
    sec--;
    autoEl.textContent = `Tự động tiếp tục sau ${sec}s...`;
    if (sec <= 0) { clearInterval(iv); closDeathOverlay(); }
  }, 1000);
  overlay._interval = iv;
}

function closDeathOverlay() {
  const overlay = document.getElementById('death-overlay');
  if (overlay._interval) clearInterval(overlay._interval);
  overlay.style.display = 'none';
  if (S.phase === 'DAY_DISCUSSION') {
    showView('day');
    renderDay(S._pendingDeaths || []);
  } else if (S.phase === 'VOTING_PHASE') {
    showView('voting');
    renderVoting();
  } else if (S.phase === 'EXECUTION_PHASE') {
    showView('execution');
  }
  setChatVisible(true);
}

// ── CHAT ─────────────────────────────────────────
let chatOpen = false;

function setChatVisible(show) {
  chatOpen = show;
  document.getElementById('chat-panel').style.display = show ? 'flex' : 'none';
  const btn = document.getElementById('chat-toggle-btn');
  if (btn) btn.style.display = show ? 'flex' : 'none';
}

function playRoleEffect(role, targetId) {
  const targetEl = document.querySelector(`.night-player-card[data-player-id="${targetId}"], .day-player-card[data-player-id="${targetId}"], .vote-card[data-player-id="${targetId}"]`);
  if (!targetEl) return;
  const classes = {
    WOLF: 'fx-wolf-eyes',
    SEER: 'fx-seer-scan',
    WITCH: 'fx-witch-potion',
    BODYGUARD: 'fx-shield',
    HUNTER: 'fx-hunter-crosshair'
  };
  // Play role-specific sound alongside visual effect
  const roleSounds = {
    WOLF: 'role_wolf',
    SEER: 'role_seer',
    WITCH: S.witchMode === 'POISON' ? 'role_witch_poison' : 'role_witch_heal',
    BODYGUARD: 'role_bodyguard',
    HUNTER: 'role_hunter'
  };
  if (roleSounds[role]) SFX.play(roleSounds[role]);
  const fxClass = classes[role];
  if (fxClass) {
    targetEl.classList.add(fxClass);
    setTimeout(() => targetEl.classList.remove(fxClass), 1000);
  }
}

function toggleChat() {
  chatOpen = !chatOpen;
  const panel = document.getElementById('chat-panel');
  const btn = document.getElementById('chat-toggle-btn');
  panel.style.display = chatOpen ? 'flex' : 'none';
  btn.style.display = chatOpen ? 'none' : 'flex';
  if (chatOpen) {
    setTimeout(() => document.getElementById('chat-input')?.focus(), 100);
  }
}

function sendChat() {
  const input = document.getElementById('chat-input');
  const msg = input?.value.trim();
  if (!msg || !S.socket) return;
  S.socket.emit('action:CHAT_MSG', { message: msg });
  input.value = '';
}

function chatKeydown(e) {
  if (e.key === 'Enter') sendChat();
}

function appendChatMsg(name, message, isAlive, isSelf) {
  const container = document.getElementById('chat-messages');
  if (!container) return;
  const div = document.createElement('div');
  div.style.cssText = `font-size:13px;padding:6px 10px;border-radius:8px;background:${isSelf ? 'rgba(192,57,43,0.2)' : 'rgba(255,255,255,0.05)'};border-left:3px solid ${isSelf ? 'var(--primary)' : 'var(--border)'}`;
  div.innerHTML = `<span style="font-weight:600;color:${isAlive ? 'var(--gold)' : 'var(--text-muted)'}">${esc(name)}${!isAlive ? ' 💀' : ''}</span><br><span style="color:var(--text)">${esc(message)}</span>`;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

// ── LOGIN HANDLERS ───────────────────────────────
function joinRoom(roomId) {
  const name = document.getElementById('input-name').value.trim();
  if (!name) { toast('Vui lòng nhập tên!', 'error'); return; }
  if (name.length > 20) { toast('Tên quá dài (tối đa 20 ký tự)!', 'error'); return; }
  S.playerId = sessionStorage.getItem('masoi_playerId') || ('P_' + genId());
  sessionStorage.setItem('masoi_playerId', S.playerId);
  S.playerName = name;
  S.roomId = (roomId || document.getElementById('input-room').value.trim() || genId()).toUpperCase().slice(0, 8);
  showView('lobby');
  connectSocket();
}

document.getElementById('btn-join').addEventListener('click', () => { SFX.play('click'); joinRoom(null); });
document.getElementById('btn-create').addEventListener('click', () => { SFX.play('click'); joinRoom(genId()); });
document.getElementById('input-name').addEventListener('keydown', e => { if (e.key === 'Enter') document.getElementById('input-room').focus(); });
document.getElementById('input-room').addEventListener('keydown', e => { if (e.key === 'Enter') joinRoom(null); });
document.getElementById('btn-start').addEventListener('click', () => { SFX.play('click'); S.socket?.emit('action:START_GAME'); });

// ── INIT ─────────────────────────────────────────
initStars();
