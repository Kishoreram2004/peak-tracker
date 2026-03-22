const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/sessions', require('./routes/sessions'));
app.use('/api/friends', require('./routes/friends'));

// Socket.IO for real-time updates
const connectedUsers = {};

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('register', (userId) => {
    connectedUsers[userId] = socket.id;
    socket.userId = userId;
    console.log(`User ${userId} registered with socket ${socket.id}`);
  });

  socket.on('session_updated', ({ userId, friendIds }) => {
    // Notify friends about the update
    if (friendIds && Array.isArray(friendIds)) {
      friendIds.forEach(friendId => {
        const friendSocketId = connectedUsers[friendId];
        if (friendSocketId) {
          io.to(friendSocketId).emit('friend_session_updated', { userId });
        }
      });
    }
  });

  socket.on('disconnect', () => {
    if (socket.userId) {
      delete connectedUsers[socket.userId];
    }
    console.log('User disconnected:', socket.id);
  });
});

// Make io accessible to routes
app.set('io', io);
app.set('connectedUsers', connectedUsers);

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/mountain-climber';

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
