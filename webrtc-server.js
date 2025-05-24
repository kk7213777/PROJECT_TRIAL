//This is server/WebRTCTest.js



const http = require('http');
const { Server } = require('socket.io');

const server = http.createServer();
const io = new Server(server, {
  cors: {
    origin: '*', // Use your frontend origin in production
    methods: ['GET', 'POST']
  }
});

const rooms = {}; // { roomId: [socketId1, socketId2] }

io.on('connection', (socket) => {
  console.log('New connection:', socket.id);

  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    if (!rooms[roomId]) rooms[roomId] = [];

    rooms[roomId].push(socket.id);

    const otherUser = rooms[roomId].find(id => id !== socket.id);
    if (otherUser) {
      socket.emit('user-joined', otherUser);
    }

    console.log(`Socket ${socket.id} joined room: ${roomId}`);
  });

  socket.on('webrtc-offer', ({ offer, target }) => {
    io.to(target).emit('webrtc-offer', { offer, from: socket.id });
  });

  socket.on('webrtc-answer', ({ answer, target }) => {
    io.to(target).emit('webrtc-answer', { answer });
  });

  socket.on('webrtc-ice', ({ ice, target }) => {
    io.to(target).emit('webrtc-ice', { ice });
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
    for (const roomId in rooms) {
      rooms[roomId] = rooms[roomId].filter(id => id !== socket.id);
      if (rooms[roomId].length === 0) {
        delete rooms[roomId];
      }
    }
  });
});

server.listen(8081, () => {
  console.log('WebRTC signaling server running on http://localhost:8081');
});
