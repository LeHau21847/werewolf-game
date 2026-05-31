const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const socketHandler = require('./sockets/socketHandler');

const phaseScaleArg = process.argv.find(arg => arg.startsWith('--phase-scale='));
const phaseScaleValue = phaseScaleArg
  ? Number(phaseScaleArg.split('=')[1])
  : Number(process.argv[2]);
if (Number.isFinite(phaseScaleValue) && phaseScaleValue > 0) {
  process.env.PHASE_SCALE = String(phaseScaleValue);
}

const app = express();
app.use(cors());
app.use(express.json());

// Serve the web client statically
app.use(express.static(path.join(__dirname, '../werewolf-web')));

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

app.get('/health', (req, res) => {
  res.json({ status: 'Ma Sói Server Running 🐺', time: new Date().toISOString() });
});

// Optional MongoDB — graceful degradation
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/werewolf_db';
try {
  const mongoose = require('mongoose');
  const RoleCacheManager = require('./gameEngine/RoleCacheManager');
  mongoose.connect(MONGO_URI)
    .then(() => RoleCacheManager.init())
    .then(() => console.log('[Server] MongoDB Connected & Role Cache Hydrated'))
    .catch(err => console.warn('[Server] MongoDB unavailable — using hardcoded role data:', err.message));
} catch (e) {
  console.warn('[Server] MongoDB module not used — game runs with hardcoded data.');
}

socketHandler(io);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`\n🐺 Ma Sói Server running on http://localhost:${PORT}`);
  console.log(`   Open the game at: http://localhost:${PORT}\n`);
});
