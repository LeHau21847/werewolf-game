/**
 * Ma Sói Ultimate - Tech Lead's Mock Emitter
 * Stress tests the Frontend SVG Vote Lines by emitting random data every 1.5s.
 */
const http = require('http');
const { Server } = require('socket.io');

const server = http.createServer();
const io = new Server(server, {
  cors: { origin: '*' }
});

const PLAYER_COUNT = 20;

console.log('--- MOCK VOTE EMITTER STARTING (Tech Lead approved) ---');

io.on('connection', (socket) => {
  console.log('[Mock] Client connected to Stress Test:', socket.id);
  
  // Continuous Loop
  const interval = setInterval(() => {
    const mockVotes = {};
    
    // Pick 10 random voters and 10 random targets
    for (let i = 1; i <= 10; i++) {
        const voterIdx = Math.floor(Math.random() * PLAYER_COUNT) + 1;
        const targetIdx = Math.floor(Math.random() * PLAYER_COUNT) + 1;
        
        if (voterIdx !== targetIdx) {
            mockVotes[`player_${voterIdx}`] = `player_${targetIdx}`;
        }
    }

    console.log(`[Mock] Emitting ${Object.keys(mockVotes).length} random votes...`);
    
    // STEP 3: Emit event exactly as the real Server would
    io.emit('state:VOTE_UPDATED', { votes: mockVotes });
  }, 1500);

  socket.on('disconnect', () => {
    clearInterval(interval);
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`[Mock] Stress Test Server running on port ${PORT}`);
  console.log(`[Logic] Simulating 20 players dancing with SVG lines...`);
});
