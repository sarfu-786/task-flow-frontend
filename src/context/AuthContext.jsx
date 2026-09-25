import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem('taskflow_token') || sessionStorage.getItem('taskflow_token') || null;
    } catch {
      return null;
    }
  });

  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('taskflow_user') || sessionStorage.getItem('taskflow_user');
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
        if (
          err.status === 401 &&
          err.message &&
          (err.message.includes('expired') || err.message.includes('revoked') || err.message.includes('invalid') || err.message.includes('not found'))
        ) {
          try {
            localStorage.removeItem('taskflow_token');
            localStorage.removeItem('taskflow_user');
            sessionStorage.removeItem('taskflow_token');
            sessionStorage.removeItem('taskflow_user');
          } catch {}
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
