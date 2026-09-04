import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';
import { socketService } from '../services/socket';

const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  
  const [users, setUsers] = useState(() => {
    try {
      const cached = localStorage.getItem('taskflow_cached_users');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(0);
  
  // Filtering & Pagination State
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modal State for User Management
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [selectedUser, setSelectedUser] = useState(null);
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  // Fetch pending registration approvals count (for Manager sidebar badge indicator)
  const fetchPendingApprovalsCount = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const isManager = user && ['Manager', 'Executive', 'Administrator'].includes(user.role);
      if (!isManager) {
        setPendingApprovalsCount(0);
        return;
      }
      const res = await api.getUserApprovals({ status: 'Pending' });
      if (res.success) {
        if (res.counts && typeof res.counts.pending === 'number') {
          setPendingApprovalsCount(res.counts.pending);
        } else if (Array.isArray(res.users)) {
          setPendingApprovalsCount(res.users.filter((u) => u.status === 'Pending').length);
        }
      }
    } catch (err) {
      console.error('Fetch pending approvals count error:', err);
    }
  }, [isAuthenticated, user]);

  // Fetch users (Complete directory for system consistency)
  const fetchUsers = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.getUsers({});
      if (res.success) {
        setUsers(res.users);
        localStorage.setItem('taskflow_cached_users', JSON.stringify(res.users));
      }
    } catch (err) {
      console.error('Fetch users error:', err);
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUsers();
      fetchPendingApprovalsCount();
    }
  }, [isAuthenticated, fetchUsers, fetchPendingApprovalsCount]);

  // Real-time socket events for approvals and user updates
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    const isManager = ['Manager', 'Executive', 'Administrator'].includes(user.role);
    if (!isManager) return;

    const handleApprovalsUpdated = () => {
      fetchPendingApprovalsCount();
      fetchUsers();
    };

    const handleNewNotification = (data) => {
      const notif = data?.notification || data;
      if (notif?.type === 'user_registered') {
        fetchPendingApprovalsCount();
        fetchUsers();
      }
    };

    const cleanupApprovals = socketService.on('approvals:updated', handleApprovalsUpdated);
    const cleanupUsers = socketService.on('users:updated', handleApprovalsUpdated);
    const cleanupNotif = socketService.on('notification:new', handleNewNotification);

    return () => {
      cleanupApprovals();
      cleanupUsers();
      cleanupNotif();
    };
  }, [isAuthenticated, user, fetchPendingApprovalsCount, fetchUsers]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, roleFilter]);

  // Create User
  const createUser = async (userData) => {
    try {
      const res = await api.createUser(userData);
      if (res.success) {
        setUsers((prev) => {
          const next = [res.user, ...prev.filter(u => u._id !== res.user._id)];
          localStorage.setItem('taskflow_cached_users', JSON.stringify(next));
          return next;
        });
        await fetchUsers();
        closeUserModal();
        return { success: true, user: res.user };
      }
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  // Update User
  const updateUser = async (id, userData) => {
    try {
      const res = await api.updateUser(id, userData);
      if (res.success) {
        setUsers((prev) => {
          const next = prev.map(u => (u._id === id ? res.user : u));
          localStorage.setItem('taskflow_cached_users', JSON.stringify(next));
          return next;
        });
        await fetchUsers();
        closeUserModal();
        return { success: true, user: res.user };
      }
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  // Remove / Delete User
  const deleteUser = async (id) => {
    try {
      const res = await api.deleteUser(id);
      if (res.success) {
        setUsers((prev) => {
          const next = prev.filter(u => u._id !== id);
          localStorage.setItem('taskflow_cached_users', JSON.stringify(next));
          return next;
        });
        await fetchUsers();
        closeDeleteModal();
        return { success: true };
      }
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  // Modal Handlers
  const openCreateModal = () => {
    setModalMode('create');
    setSelectedUser(null);
    setIsUserModalOpen(true);
  };

  const openEditModal = (user) => {
    setModalMode('edit');
    setSelectedUser(user);
    setIsUserModalOpen(true);
  };

  const closeUserModal = () => {
    setIsUserModalOpen(false);
    setSelectedUser(null);
  };

  const openDeleteModal = (user) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setUserToDelete(null);
  };

  // Pagination and filtering calculation for UserSection view
  const filteredUsers = users.filter((u) => {
    if (!u) return false;
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const matchName = (u.name || '').toLowerCase().includes(q);
      const matchUsername = (u.username || '').toLowerCase().includes(q);
      const matchEmail = (u.email || '').toLowerCase().includes(q);
      const matchDept = (u.department || '').toLowerCase().includes(q);
      if (!matchName && !matchUsername && !matchEmail && !matchDept) return false;
    }
    return true;
  });

  const totalUsers = filteredUsers.length;
  const totalPages = Math.ceil(totalUsers / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

  return (
    <UserContext.Provider
      value={{
        users,
        paginatedUsers,
        totalUsers,
        totalPages,
        currentPage,
        setCurrentPage,
        itemsPerPage,
        loading,
        error,
        search,
        setSearch,
        roleFilter,
        setRoleFilter,
        fetchUsers,
        createUser,
        updateUser,
        deleteUser,
        isUserModalOpen,
        modalMode,
        selectedUser,
        openCreateModal,
        openEditModal,
        closeUserModal,
        isDeleteModalOpen,
        userToDelete,
        openDeleteModal,
        closeDeleteModal,
        pendingApprovalsCount,
        fetchPendingApprovalsCount,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUserManagement = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUserManagement must be used within a UserProvider');
  }
  return context;
};
