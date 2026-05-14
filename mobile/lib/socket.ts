import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL || 'http://localhost:5000';

let socket: Socket | null = null;

export const getSocket = (): Socket | null => socket;

export const connectSocket = (token: string): Socket => {
  if (socket?.connected) return socket;

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    console.log('🔌 Socket connected:', socket?.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('🔌 Socket disconnected:', reason);
  });

  socket.on('connect_error', (err) => {
    console.error('Socket connection error:', err.message);
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const joinOrderRoom = (orderId: string) => {
  socket?.emit('join_order', { orderId });
};

export const leaveOrderRoom = (orderId: string) => {
  socket?.emit('leave_order', { orderId });
};

export const emitTypingStart = (orderId: string) => {
  socket?.emit('typing_start', { orderId });
};

export const emitTypingStop = (orderId: string) => {
  socket?.emit('typing_stop', { orderId });
};

export const emitLocationUpdate = (orderId: string, coordinates: [number, number]) => {
  socket?.emit('update_location', { orderId, coordinates });
};
