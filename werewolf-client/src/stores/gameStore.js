import { create } from 'zustand';

const useGameStore = create((set, get) => ({
  // ─── Connection ───
  isConnected: true,
  setIsConnected: (status) => set({ isConnected: status }),

  // ─── Room ─────────
  phase: 'LOBBY',
  roomId: '',
  hostId: null,
  localPlayerId: '',
  localPlayerName: '',

  // ─── Players ──────
  players: {},

  // ─── My Role ──────
  localRole: null,
  localRoleData: null,

  // ─── Night state ──
  nightActionDone: false,
  wolfTargetId: null,
  wolfTargetName: null,
  seerChecked: false,
  witchUsedHeal: false,
  witchUsedPoison: false,

  // ─── Pending deaths (to show at day start) ──
  pendingDeaths: [],

  // ─── Votes ────────
  votes: {},

  // ─── Phase timer ──
  phaseEndTime: null,

  // ─── Appearance ───
  localPlayerAppearance: {
    gender: 'MALE',
    bodyColor: '#ffdbac',
    outfitColor: '#3c5e8b',
    headgearColor: '#8b4513',
    outfitType: 'TSHIRT',
    headgearType: 'HAIR',
  },
  setLocalAppearance: (appearance) => set({ localPlayerAppearance: appearance }),

  // ─── Setters ──────
  setLocalPlayer: (id, name, role, roleData) => set({
    localPlayerId: id,
    localPlayerName: name,
    localRole: role || get().localRole,
    localRoleData: roleData || get().localRoleData,
  }),

  syncState: (data) => set(state => ({
    phase: data.phase || state.phase,
    roomId: data.roomId || state.roomId,
    hostId: data.hostId !== undefined ? data.hostId : state.hostId,
    phaseEndTime: data.endTime || null,
  })),

  syncPlayers: (serverPlayers) => {
    if (Array.isArray(serverPlayers)) {
      const map = {};
      serverPlayers.forEach(p => { map[p.id] = p; });
      set({ players: map });
    } else {
      set({ players: serverPlayers });
    }
  },

  mergePlayer: (p) => set(state => ({
    players: { ...state.players, [p.id]: { ...(state.players[p.id] || {}), ...p } }
  })),

  updateVotes: (newVotes) => set(state => {
    const newPlayers = {};
    Object.keys(state.players).forEach(id => {
      newPlayers[id] = { ...state.players[id], votes: 0 };
    });
    Object.values(newVotes).forEach(targetId => {
      if (newPlayers[targetId]) newPlayers[targetId].votes += 1;
    });
    return { votes: { ...newVotes }, players: newPlayers };
  }),

  setNightActionDone: () => set({ nightActionDone: true }),
  setSeerChecked: () => set({ seerChecked: true }),
  setWolfTarget: (id, name) => set({ wolfTargetId: id, wolfTargetName: name }),
  setWitchUsedHeal: () => set({ witchUsedHeal: true }),
  setWitchUsedPoison: () => set({ witchUsedPoison: true }),
  setPendingDeaths: (deaths) => set({ pendingDeaths: deaths }),

  resetNightState: () => set({
    nightActionDone: false,
    wolfTargetId: null,
    wolfTargetName: null,
    seerChecked: false,
  }),

  resetAll: () => set({
    phase: 'LOBBY',
    roomId: '',
    hostId: null,
    players: {},
    localRole: null,
    localRoleData: null,
    nightActionDone: false,
    wolfTargetId: null,
    wolfTargetName: null,
    seerChecked: false,
    witchUsedHeal: false,
    witchUsedPoison: false,
    pendingDeaths: [],
    votes: {},
  }),
}));

export default useGameStore;
