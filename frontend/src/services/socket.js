import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
  }

  connect() {
    if (this.socket) return this.socket;

    this.socket = io(SOCKET_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      withCredentials: true,
    });

    this.socket.on('connect', () => {
      this.connected = true;
      console.log(`[Socket] Connected to server: ${this.socket.id}`);
    });

    this.socket.on('disconnect', (reason) => {
      this.connected = false;
      console.log(`[Socket] Disconnected: ${reason}`);
    });

    this.socket.on('connect_error', (error) => {
      console.warn(`[Socket] Connection error: ${error.message}`);
    });

    return this.socket;
  }

  joinShow(showId) {
    if (this.socket && showId) {
      this.socket.emit('join_show', showId);
    }
  }

  leaveShow(showId) {
    if (this.socket && showId) {
      this.socket.emit('leave_show', showId);
    }
  }

  joinUser(userId) {
    if (this.socket && userId) {
      this.socket.emit('join_user', userId);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  getSocket() {
    if (!this.socket) {
      return this.connect();
    }
    return this.socket;
  }
}

export const socketService = new SocketService();
export default socketService;
