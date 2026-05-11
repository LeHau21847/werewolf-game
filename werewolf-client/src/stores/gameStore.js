import { create } from 'zustand';

// Zero-Trust & Performance First: Flat Object
const useGameStore = create((set) => ({
  players: {}, // RECORD<playerId, PlayerData>
  votes: {},   // Bắt buộc phải có giá trị khởi tạo trống để tránh crash Object.entries
  
  // Dữ liệu trang phục/nhân dạng cá nhân (Lưu tạm trên Local)
  localPlayerAppearance: {
    gender: 'MALE', 
    bodyColor: '#ffdbac',
    outfitColor: '#3c5e8b',
    headgearColor: '#8b4513'
  },
  
  isConnected: true, // Auto assumes true unless disconnected triggers
  setIsConnected: (status) => set({ isConnected: status }),

  setLocalAppearance: (appearance) => set({ localPlayerAppearance: appearance }),
  
  // Method to hydrate mock data for UI testing (20 players)
  seedMockPlayers: () => {
    const mockData = {};
    for (let i = 1; i <= 20; i++) {
      const id = `player_${i}`;
      mockData[id] = {
        id,
        name: `Người Chơi ${i}`,
        isAlive: true,
        isOffline: false,
        role: 'VILLAGER', 
        votes: 0,
        deathReason: null,
        appearance: {
          gender: i % 2 === 0 ? 'FEMALE' : 'MALE',
          bodyColor: '#ffdbac',
          outfitColor: i % 3 === 0 ? '#8b0000' : '#3c5e8b',
          headgearColor: i % 4 === 0 ? '#000' : '#8b4513'
        }
      };
    }
    set({ players: mockData });
  },

  // Authoritative update from Server - Ensure it's treated as a map
  syncPlayers: (serverPlayers) => {
    if (Array.isArray(serverPlayers)) {
      const playerMap = {};
      serverPlayers.forEach(p => { playerMap[p.id] = p; });
      set({ players: playerMap });
    } else {
      set({ players: serverPlayers });
    }
  },

  updateVotes: (newVotes) => set((state) => {
    // Immutable update: Map over existing players and create new objects
    const newPlayers = {};
    Object.keys(state.players).forEach(id => {
      newPlayers[id] = { ...state.players[id], votes: 0 };
    });

    // Tally up using the new objects
    Object.values(newVotes).forEach(targetId => {
      if (newPlayers[targetId]) {
        newPlayers[targetId].votes += 1;
      }
    });

    return { 
      votes: { ...newVotes },
      players: newPlayers
    };
  })
}));

export default useGameStore;
