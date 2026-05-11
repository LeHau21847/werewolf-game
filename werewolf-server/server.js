const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');

const RoleCacheManager = require('./gameEngine/RoleCacheManager');
const socketHandler = require('./sockets/socketHandler');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', 
    methods: ['GET', 'POST']
  }
});

// Connect to MongoDB and Hydrate RAM Cache
const MONGO_URI = 'mongodb://localhost:27017/werewolf_db';
mongoose.connect(MONGO_URI)
  .then(() => RoleCacheManager.init())
  .then(() => {
    console.log('[Server] MongoDB Connected & Role Cache Hydrated');
  })
  .catch(err => console.error('[Server] Init Error:', err));

app.get('/health', (req, res) => {
  res.send({ status: 'Zero-Trust Server Running' });
});

socketHandler(io);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`[Server] Authoritative Server ticking on port ${PORT}`);
});
