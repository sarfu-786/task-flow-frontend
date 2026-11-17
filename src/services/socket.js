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

/**
 * Resolves active JWT auth token across all valid storage keys and user payload
 */
export const getAuthToken = (user = null) => {
  if (typeof window === 'undefined') return '';
  try {
    return (
      sessionStorage.getItem('taskflow_token') ||
      localStorage.getItem('taskflow_token') ||
      localStorage.getItem('token') ||
      sessionStorage.getItem('token') ||
      (user && (user.token || user.accessToken)) ||
      ''
    );
  } catch {
    return (user && (user.token || user.accessToken)) || '';
  }
};

class SocketService {
  constructor() {
    this.socket = null;
    this.currentUser = null;
    this.isConnecting = false;
  }

  connect(user) {
    if (user) {
      this.currentUser = user;
    }
    const token = getAuthToken(this.currentUser || user);

    // If there is no token (e.g. user is on login screen or logged out), do not initiate unauthenticated connection
    if (!token) {
      if (this.socket) {
        this.socket.disconnect();
        this.socket = null;
      }
      return null;
    }

    const serverUrl = getSocketServerUrl();

    // If socket is already connected and token matches, simply ensure rooms are joined
    if (this.socket && this.socket.connected) {
      if (this.socket.auth?.token !== token) {
        this.socket.auth = { token };
        this.socket.disconnect().connect();
      } else if (this.currentUser) {
        this.joinRooms(this.currentUser);
      }
      return this.socket;
    }

    // If socket exists but disconnected, update token and reconnect
    if (this.socket) {
      this.socket.auth = { token };
      if (!this.socket.connected) {
        this.socket.connect();
      }
      return this.socket;
    }

    // Initialize new socket with validated token
    this.socket = io(serverUrl, {
      auth: { token },
      query: { token },
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionAttempts: 15,
      reconnectionDelay: 1500,
      reconnectionDelayMax: 6000,
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
      // If server rejects with token error, halt reconnect loop cleanly
      if (err.message && err.message.toLowerCase().includes('token')) {
        console.warn('[Real-Time WebSockets] Authentication note:', err.message);
        if (this.socket) {
          this.socket.disconnect();
        }
      } else {
        console.warn('[Real-Time WebSockets] Connection note:', err.message);
      }
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
    const token = getAuthToken(this.currentUser);
    if (!this.socket && token) {
      this.connect(this.currentUser);
    }
    if (this.socket) {
      this.socket.on(event, callback);
    }
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
