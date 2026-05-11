import { create } from 'zustand';

// Granular Render Principle: Flat State Object
const useGameStore = create((set) => ({
  roomId: null,
  phase: 'LOBBY',
  players: {}, // RECORD<playerId, PublicPlayer>
  votes: {},   // RECORD<voterId, targetId>

  // The dumb view hydration - completely override from Server True State
  hydrateFullState: (serverState) => set(() => ({
    roomId: serverState.roomId,
    phase: serverState.phase,
    players: serverState.players,
    votes: serverState.votes,
  })),

  // Apply delta updates blindly
  updateVotes: (newVotes) => set(() => ({ votes: newVotes })),
  
  updatePhase: (newPhase) => set(() => ({ phase: newPhase })),
  
  updatePlayers: (newPlayersList) => set((state) => {
    // Normalizing array to object, or updating delta if server sends list
    const newMap = { ...state.players };
    newPlayersList.forEach(p => {
       newMap[p.id] = { ...newMap[p.id], ...p };
    });
    return { players: newMap };
  }),
}));

export default useGameStore;
