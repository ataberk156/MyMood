import { io } from 'socket.io-client';

// In development Vite proxies /socket.io to the server.
// In production both are on the same origin.
const socket = io('/', {
  path: '/socket.io',
  autoConnect: false,
  reconnectionAttempts: 5,
  reconnectionDelay: 1500
});

export default socket;
