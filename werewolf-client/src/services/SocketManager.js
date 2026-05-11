import { io } from 'socket.io-client';
import useGameStore from '../stores/gameStore';

/**
 * SocketManager - Tech Lead approved Singleton Pattern
 * Connects the real-time Socket.io layer to the Zustand state.
 */
class SocketManager {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.lastJoinPayload = null; // Save cache to auto hydrate
  }

  connect(url = 'http://localhost:3000') {
    if (this.socket) return;

    console.log('[SocketManager] Connecting to:', url);
    this.socket = io(url, {
      reconnectionAttempts: 10,
      autoConnect: true,
    });

    this.setupListeners();
  }

  setupListeners() {
    this.socket.on('connect', () => {
      this.isConnected = true;
      useGameStore.getState().setIsConnected(true);
      console.log('[SocketManager] Connected:', this.socket.id);

      // Auto Hydration on Reconnect
      if (this.lastJoinPayload) {
         console.log('[SocketManager] Re-hydrating Connection...');
         this.socket.emit('JOIN_ROOM', this.lastJoinPayload);
      }
    });

    // STEP 2: Connecting Socket events to Zustand Store
    this.socket.on('state:VOTE_UPDATED', (data) => {
      console.log('[SocketManager] Received VOTE_UPDATED');
      // Update Zustand state directly via getState()
      useGameStore.getState().updateVotes(data.votes);
    });

    this.socket.on('state:PLAYER_STATUS', (players) => {
       useGameStore.getState().syncPlayers(players);
    });

    this.socket.on('disconnect', () => {
      this.isConnected = false;
      useGameStore.getState().setIsConnected(false);
      console.log('[SocketManager] Disconnected');
    });
  }

  emit(event, payload) {
    if (event === 'JOIN_ROOM') {
      this.lastJoinPayload = payload;
    }
    if (this.socket) {
      this.socket.emit(event, payload);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export default new SocketManager(); // Export as Singleton
