import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const cached = localStorage.getItem('taskflow_user');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('taskflow_token') || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      if (token) {
        try {
          const res = await api.getProfile();
          if (res.success && res.user && isMounted) {
            setUser(res.user);
            localStorage.setItem('taskflow_user', JSON.stringify(res.user));
          }
        } catch (err) {
          const msg = (err.message || '').toLowerCase();
          // Only invalidate and logout if the token is explicitly rejected as invalid/expired
          if (err.status === 401 || msg.includes('token failed') || msg.includes('token expired') || msg.includes('not authorized')) {
            console.warn('Session expired or unauthorized token:', err.message);
            if (isMounted) logout();
          } else {
            // Server waking up or network hiccup: preserve cached user so session is not lost
            console.warn('[Auth] Keeping active cached user session:', err.message);
          }
        }
      }
      if (isMounted) {
        setLoading(false);
      }
    };

    initAuth();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const register = async (userData) => {
    setError('');
    try {
      const res = await api.register(userData);
      return { success: true, message: res.message, user: res.user };
    } catch (err) {
      setError(err.message || 'Registration failed.');
      return { success: false, message: err.message };
    }
  };

  const login = async (usernameOrEmail, password) => {
    setError('');
    try {
      const res = await api.login(usernameOrEmail, password);
      if (res.success) {
        localStorage.setItem('taskflow_token', res.token);
        localStorage.setItem('taskflow_user', JSON.stringify(res.user));
        setToken(res.token);
        setUser(res.user);
        return { success: true, user: res.user };
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
      return {
        success: false,
        message: err.message,
        status: err.status,
        approvalStatus: err.approvalStatus,
      };
    }
  };

  const updateUserProfile = (updatedUserData) => {
    setUser((prev) => {
      const next = { ...prev, ...updatedUserData };
      localStorage.setItem('taskflow_user', JSON.stringify(next));
      return next;
    });
  };

  const logout = () => {
    localStorage.removeItem('taskflow_token');
    localStorage.removeItem('taskflow_user');
    setToken(null);
    setUser(null);
    setError('');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        loading,
        error,
        setError,
        register,
        login,
        logout,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
