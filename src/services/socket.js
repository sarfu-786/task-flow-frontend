import { io } from 'socket.io-client';

export const getSocketServerUrl = () => {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0') {
      return 'http://localhost:5000';
    }
    if (/^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host)) {
      return `http://${host}:5000`;
    }
  }

  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (
    envUrl &&
    typeof envUrl === 'string' &&
    envUrl.startsWith('http') &&
    !envUrl.includes('localhost') &&
    !envUrl.includes('127.0.0.1')
  ) {
    return envUrl.replace(/\/api\/?$/, '').replace(/\/+$/, '');
  }

  return 'https://task-flow-backend-f0gp.onrender.com';
};

class SocketService {
  constructor() {
    this.socket = null;
    this.currentUser = null;
    this.isConnecting = false;
  }

  connect(user) {
    this.currentUser = user;
    const serverUrl = getSocketServerUrl();

    if (this.socket && this.socket.connected) {
      this.joinRooms(user);
      return this.socket;
    }

    if (this.socket) {
      this.socket.connect();
      return this.socket;
    }

    this.socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      autoConnect: true,
    });

    this.socket.on('connect', () => {
      console.log('[Real-Time WebSockets] Connected successfully. Socket ID:', this.socket.id);
      if (this.currentUser) {
        this.joinRooms(this.currentUser);
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[Real-Time WebSockets] Disconnected:', reason);
    });

    this.socket.on('connect_error', (err) => {
      console.warn('[Real-Time WebSockets] Connection note:', err.message);
    });

    return this.socket;
  }

  joinRooms(user) {
    if (!this.socket || !this.socket.connected || !user) return;

    const payload = {
      userId: user.id || user._id ? (user._id || user.id).toString() : '',
      username: (user.username || '').toLowerCase().trim(),
      name: (user.name || '').toLowerCase().trim(),
      role: user.role || 'User',
    };

    this.socket.emit('join', payload);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on(event, callback) {
    if (!this.socket) {
      this.connect(this.currentUser);
    }
    this.socket.on(event, callback);
    return () => {
      if (this.socket) {
        this.socket.off(event, callback);
      }
    };
  }

  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  emit(event, data) {
    if (this.socket && this.socket.connected) {
      this.socket.emit(event, data);
    }
  }
}

export const socketService = new SocketService();
