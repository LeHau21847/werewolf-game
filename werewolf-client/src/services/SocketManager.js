import { io } from 'socket.io-client';
import useGameStore from '../stores/gameStore';

class SocketManager {
  constructor() {
    this.socket = null;
    this.lastJoinPayload = null;
  }

  connect(url = 'http://localhost:3000') {
    if (this.socket && this.socket.connected) return;
    if (this.socket) { this.socket.disconnect(); this.socket = null; }

    console.log('[SocketManager] Connecting to:', url);
    this.socket = io(url, { reconnectionAttempts: 10, autoConnect: true });
    this._setupListeners();
  }

  _setupListeners() {
    const sk = this.socket;
    const store = () => useGameStore.getState();

    sk.on('connect', () => {
      store().setIsConnected(true);
      console.log('[SocketManager] Connected:', sk.id);
      if (this.lastJoinPayload) {
        sk.emit('JOIN_ROOM', this.lastJoinPayload);
      }
    });

    sk.on('disconnect', () => {
      store().setIsConnected(false);
      console.log('[SocketManager] Disconnected');
    });

    // ── state:FULL_SYNC ─────────────────────────────────────────
    sk.on('state:FULL_SYNC', (data) => {
      console.log('[Socket] FULL_SYNC phase:', data.phase);
      store().syncState(data);
      if (data.players) store().syncPlayers(Object.values(data.players));
    });

    // ── state:PLAYER_STATUS ──────────────────────────────────────
    sk.on('state:PLAYER_STATUS', (players) => {
      const arr = Array.isArray(players) ? players : Object.values(players);
      arr.forEach(p => store().mergePlayer(p));
    });

    // ── state:ROLE_ASSIGNED ──────────────────────────────────────
    sk.on('state:ROLE_ASSIGNED', ({ role, roleData }) => {
      const s = store();
      s.setLocalPlayer(s.localPlayerId, s.localPlayerName, role, roleData);
      console.log('[Socket] Role:', role);
    });

    // ── state:GAME_STARTED ───────────────────────────────────────
    sk.on('state:GAME_STARTED', (data) => {
      console.log('[Socket] GAME STARTED');
      store().syncState({ ...data, phase: 'ROLE_REVEAL' });
      if (data.players) store().syncPlayers(Object.values(data.players));
      store().resetNightState();
    });

    // ── state:PHASE_STARTED ─────────────────────────────────────
    sk.on('state:PHASE_STARTED', ({ currentPhase, endTime }) => {
      console.log('[Socket] PHASE:', currentPhase);
      store().syncState({ phase: currentPhase, endTime });
      store().resetNightState();
    });

    // ── state:NIGHT_RESOLVED ────────────────────────────────────
    sk.on('state:NIGHT_RESOLVED', ({ deaths, players }) => {
      const arr = Array.isArray(players) ? players : Object.values(players);
      arr.forEach(p => store().mergePlayer(p));
      store().setPendingDeaths(deaths || []);
    });

    // ── state:VOTE_UPDATED ───────────────────────────────────────
    sk.on('state:VOTE_UPDATED', ({ votes }) => {
      store().updateVotes(votes);
    });

    // ── state:PLAYER_EXECUTED ────────────────────────────────────
    sk.on('state:PLAYER_EXECUTED', (result) => {
      store().syncState({ phase: 'EXECUTION_PHASE', executionResult: result });
      // store the result for ExecutionScreen
      useGameStore.setState({ executionResult: result });
    });

    // ── state:SEER_RESULT ────────────────────────────────────────
    sk.on('state:SEER_RESULT', (result) => {
      store().setSeerChecked();
      useGameStore.setState({ seerResult: result });
    });

    // ── state:WOLF_TARGET ────────────────────────────────────────
    sk.on('state:WOLF_TARGET', ({ targetId, targetName }) => {
      store().setWolfTarget(targetId, targetName);
    });

    // ── state:GAME_OVER ──────────────────────────────────────────
    sk.on('state:GAME_OVER', (result) => {
      store().syncState({ phase: 'GAME_OVER' });
      useGameStore.setState({ gameOverResult: result });
    });

    // ── state:ACTION_CONFIRMED ───────────────────────────────────
    sk.on('state:ACTION_CONFIRMED', () => {
      store().setNightActionDone();
    });

    // ── state:CHAT_MSG ───────────────────────────────────────────
    sk.on('state:CHAT_MSG', (msg) => {
      useGameStore.setState(state => ({
        chatMessages: [...(state.chatMessages || []), msg],
      }));
    });

    // ── state:PLAYER_OFFLINE ─────────────────────────────────────
    sk.on('state:PLAYER_OFFLINE', ({ playerId }) => {
      store().mergePlayer({ id: playerId, isOffline: true });
    });

    // ── state:VOTE_TIED ──────────────────────────────────────────
    sk.on('state:VOTE_TIED', ({ message }) => {
      useGameStore.setState({ toastMessage: { text: message, type: 'info' } });
    });

    // ── state:ERROR ──────────────────────────────────────────────
    sk.on('state:ERROR', ({ message }) => {
      useGameStore.setState({ toastMessage: { text: message, type: 'error' } });
    });
  }

  emit(event, payload) {
    if (event === 'JOIN_ROOM') this.lastJoinPayload = payload;
    if (this.socket) this.socket.emit(event, payload);
  }

  disconnect() {
    if (this.socket) { this.socket.disconnect(); this.socket = null; }
  }
}

export default new SocketManager();
