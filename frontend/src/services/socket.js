import { io } from 'socket.io-client';

export function createSocket(token) {
  return io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:8080', {
    auth: { token },
    transports: ['websocket', 'polling'],
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 700,
    reconnectionDelayMax: 4000
  });
}
