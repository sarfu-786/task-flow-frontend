import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

// Safely decode JWT and check if it has expired
const isTokenExpired = (rawToken) => {
  if (!rawToken || typeof rawToken !== 'string') return true;
  try {
    const parts = rawToken.split('.');
    if (parts.length !== 3) return true;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const decoded = JSON.parse(jsonPayload);
    if (!decoded || !decoded.exp) return false;
    // Current time in seconds vs exp in seconds (with 2-second clock skew buffer)
    return Date.now() >= decoded.exp * 1000 - 2000;
  } catch {
    return true;
  }
};

// Calculate remaining milliseconds until token expiration
const getTokenRemainingMs = (rawToken) => {
  if (!rawToken || typeof rawToken !== 'string') return 0;
  try {
    const parts = rawToken.split('.');
    if (parts.length !== 3) return 0;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const decoded = JSON.parse(jsonPayload);
    if (!decoded || !decoded.exp) return Infinity;
    const remaining = decoded.exp * 1000 - Date.now();
    return remaining > 0 ? remaining : 0;
  } catch {
    return 0;
  }
};

const clearAuthStorage = () => {
  try {
    localStorage.removeItem('taskflow_token');
    localStorage.removeItem('taskflow_user');
    localStorage.removeItem('taskflow_active_section');
    sessionStorage.removeItem('taskflow_token');
    sessionStorage.removeItem('taskflow_user');
    sessionStorage.removeItem('taskflow_active_section');
  } catch {}
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => {
    try {
      const storedToken =
        localStorage.getItem('taskflow_token') || sessionStorage.getItem('taskflow_token');
      if (!storedToken || isTokenExpired(storedToken)) {
        clearAuthStorage();
        return null;
      }
      return storedToken;
    } catch {
      return null;
    }
  });

  const [user, setUser] = useState(() => {
    try {
      const storedToken =
        localStorage.getItem('taskflow_token') || sessionStorage.getItem('taskflow_token');
      if (!storedToken || isTokenExpired(storedToken)) {
        clearAuthStorage();
        return null;
      }
      const savedUser =
        localStorage.getItem('taskflow_user') || sessionStorage.getItem('taskflow_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Validate existing session in background on application refresh
  useEffect(() => {
    let isMounted = true;

    const validateSession = async () => {
      const savedToken =
        localStorage.getItem('taskflow_token') || sessionStorage.getItem('taskflow_token');
      if (!savedToken) {
        return;
      }

      if (isTokenExpired(savedToken)) {
        clearAuthStorage();
        if (isMounted) {
          setToken(null);
          setUser(null);
        }
        return;
      }

      try {
        const res = await api.getProfile();
        if (isMounted && res.success && res.user) {
          setUser(res.user);
          try {
            localStorage.setItem('taskflow_user', JSON.stringify(res.user));
            sessionStorage.setItem('taskflow_user', JSON.stringify(res.user));
          } catch {}
        }
      } catch (err) {
        console.warn('Session background sync notice:', err.message);
        if (err.status === 401) {
          clearAuthStorage();
          if (isMounted) {
            setToken(null);
            setUser(null);
          }
        }
      }
    };

    validateSession();

    return () => {
      isMounted = false;
    };
  }, []);

  // Monitor token expiration, handle auto-logout timer and visibility/focus checks
  useEffect(() => {
    if (!token) return;

    if (isTokenExpired(token)) {
      logout();
      return;
    }

    const remainingMs = getTokenRemainingMs(token);
    let timerId = null;

    if (remainingMs > 0 && remainingMs < 2147483647) {
      timerId = setTimeout(() => {
        logout();
      }, remainingMs);
    }

    const checkExpirationOnActive = () => {
      if (isTokenExpired(token)) {
        logout();
      }
    };

    window.addEventListener('focus', checkExpirationOnActive);
    document.addEventListener('visibilitychange', checkExpirationOnActive);

    return () => {
      if (timerId) clearTimeout(timerId);
      window.removeEventListener('focus', checkExpirationOnActive);
      document.removeEventListener('visibilitychange', checkExpirationOnActive);
    };
  }, [token]);

  // Global unauthorized event listener (triggered on any 401 API response)
  useEffect(() => {
    const handleUnauthorizedEvent = () => {
      logout();
    };

    window.addEventListener('taskflow:unauthorized', handleUnauthorizedEvent);
    return () => {
      window.removeEventListener('taskflow:unauthorized', handleUnauthorizedEvent);
    };
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
        try {
          localStorage.setItem('taskflow_token', res.token);
          localStorage.setItem('taskflow_user', JSON.stringify(res.user));
          sessionStorage.setItem('taskflow_token', res.token);
          sessionStorage.setItem('taskflow_user', JSON.stringify(res.user));
        } catch {}
        const role = res.user?.role || 'User';
        const defaultSection =
          role === 'Super Admin'
            ? 'superadmin'
            : ['Manager', 'Executive', 'Administrator'].includes(role)
            ? 'manager'
            : 'user-workspace';
        try {
          localStorage.setItem('taskflow_active_section', defaultSection);
          sessionStorage.setItem('taskflow_active_section', defaultSection);
        } catch {}
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
      try {
        localStorage.setItem('taskflow_user', JSON.stringify(next));
        sessionStorage.setItem('taskflow_user', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const updateProfile = async (profileData) => {
    setError('');
    try {
      const res = await api.updateProfile(profileData);
      if (res.success && res.user) {
        setUser(res.user);
        try {
          localStorage.setItem('taskflow_user', JSON.stringify(res.user));
          sessionStorage.setItem('taskflow_user', JSON.stringify(res.user));
          if (res.token) {
            setToken(res.token);
            localStorage.setItem('taskflow_token', res.token);
            sessionStorage.setItem('taskflow_token', res.token);
          }
        } catch {}
        return { success: true, message: res.message || 'Profile updated successfully!', user: res.user };
      }
      return { success: true, message: 'Profile updated successfully!' };
    } catch (err) {
      setError(err.message || 'Failed to update profile details');
      return { success: false, message: err.message || 'Failed to update profile details' };
    }
  };

  const logout = () => {
    try {
      localStorage.removeItem('taskflow_token');
      localStorage.removeItem('taskflow_user');
      localStorage.removeItem('taskflow_active_section');
      sessionStorage.removeItem('taskflow_token');
      sessionStorage.removeItem('taskflow_user');
      sessionStorage.removeItem('taskflow_active_section');
    } catch {
      // ignore storage errors
    }
    setToken(null);
    setUser(null);
    setError('');
  };

  // Multi-Role & Permission Helpers
  const userRoles = useMemo(() => {
    if (!user) return [];
    if (Array.isArray(user.roles) && user.roles.length > 0) return user.roles;
    return user.role ? [user.role] : ['User'];
  }, [user]);

  const isSuperAdmin = user?.role === 'Super Admin' || userRoles.includes('Super Admin');
  const isManager =
    isSuperAdmin || userRoles.some((r) => ['Manager', 'Executive', 'Administrator'].includes(r));
  const isSalesCoordinator = isSuperAdmin || userRoles.includes('Sales Coordinator');
  const isServiceCoordinator = isSuperAdmin || userRoles.includes('Service Coordinator');

  const hasRole = (roleName) => {
    if (isSuperAdmin) return true;
    return userRoles.includes(roleName);
  };

  const hasAnyRole = (rolesList) => {
    if (isSuperAdmin) return true;
    if (!Array.isArray(rolesList)) return false;
    return rolesList.some((r) => userRoles.includes(r));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        loading,
        error,
        userRoles,
        isSuperAdmin,
        isManager,
        isSalesCoordinator,
        isServiceCoordinator,
        hasRole,
        hasAnyRole,
        setError,
        register,
        login,
        logout,
        updateUserProfile,
        updateProfile,
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
