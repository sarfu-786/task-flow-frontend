import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('taskflow_token') || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const res = await api.getProfile();
          if (res.success && res.user) {
            setUser(res.user);
          } else {
            logout();
          }
        } catch (err) {
          console.warn('Session expired or invalid:', err.message);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
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
        setToken(res.token);
        setUser(res.user);
        return { success: true };
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
      return { success: false, message: err.message };
    }
  };

  const logout = () => {
    localStorage.removeItem('taskflow_token');
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
