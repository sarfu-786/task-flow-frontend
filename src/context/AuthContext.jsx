import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // Always start unauthenticated on application link access so user lands on Register page first
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Clear any residual storage keys on fresh initialization
  useEffect(() => {
    try {
      localStorage.removeItem('taskflow_token');
      localStorage.removeItem('taskflow_user');
    } catch {
      // ignore storage access errors if in restricted environment
    }
  }, []);

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
