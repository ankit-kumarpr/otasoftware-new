// === socket.js (Frontend) ===
import { io } from 'socket.io-client';

const SERVER_URL = 'https://lawyerbackend-qrqa.onrender.com';

let socket = null;

export const initSocket = (token, userId, userType) => {
  if (!token || !userId || !userType) {
    console.error('❌ Missing socket init params');
    return null;
  }

  if (socket && socket.connected) return socket;

  socket = io(SERVER_URL, {
    auth: { token },
    query: { userId, userType },
    path: '/socket.io',
    transports: ['websocket'],
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    console.log('✅ Socket connected:', socket.id);
  });

  socket.on('disconnect', (reason) => {
    console.warn('⚠️ Socket disconnected:', reason);
  });

  socket.on('connect_error', (err) => {
    console.error('❌ Socket connection error:', err.message);
  });

  return socket;
};

export const getSocket = () => {
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    console.log('🔌 Disconnecting socket...');
    socket.disconnect();
    socket = null;
  }
};
