import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  
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

  // Fetch users
  const fetchUsers = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.getUsers({
        search,
        role: roleFilter,
      });
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
  }, [isAuthenticated, search, roleFilter]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUsers();
    }
  }, [isAuthenticated, fetchUsers]);

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

  // Pagination calculation
  const totalUsers = users.length;
  const totalPages = Math.ceil(totalUsers / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = users.slice(startIndex, startIndex + itemsPerPage);

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
