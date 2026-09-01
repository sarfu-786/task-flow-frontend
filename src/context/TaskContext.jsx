import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

const TaskContext = createContext(null);

export const TaskProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();

  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Notifications State for Inbox (Both Manager & User)
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isInboxOpen, setIsInboxOpen] = useState(false);

  // Filtering & Pagination State
  const [search, setSearch] = useState('');
  const [taskTypeFilter, setTaskTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modal State
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [selectedTask, setSelectedTask] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);

  // Fetch tasks
  const fetchTasks = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError('');
    try {
      const isManager = user && ['Manager', 'Executive', 'Administrator'].includes(user.role);
      const res = await api.getTasks({
        search,
        taskType: taskTypeFilter,
        status: statusFilter,
        myTasksOnly: !isManager,
      });
      if (res.success) {
        setTasks(res.tasks);
      }
    } catch (err) {
      console.error('Fetch tasks error:', err);
      setError(err.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user, search, taskTypeFilter, statusFilter]);

  // Fetch Manager / User Stats
  const fetchStats = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const isManager = user && ['Manager', 'Executive', 'Administrator'].includes(user.role);
      const res = await api.getStats({ myTasksOnly: !isManager });
      if (res.success) {
        setStats(res.stats);
      }
    } catch (err) {
      console.error('Fetch stats error:', err);
    }
  }, [isAuthenticated, user]);

  // Fetch Notifications (Runs for ALL authenticated users)
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const res = await api.getNotifications();
      if (res.success) {
        setNotifications(res.notifications || []);
        setUnreadCount(res.unreadCount || 0);
      }
    } catch (err) {
      console.error('Fetch notifications error:', err);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchTasks();
      fetchStats();
      fetchNotifications();

      // Poll notifications every 5 seconds for real-time inbox alerts
      const interval = setInterval(() => {
        fetchNotifications();
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [isAuthenticated, fetchTasks, fetchStats, fetchNotifications]);

  // Reset to page 1 when search or filter criteria changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, taskTypeFilter, statusFilter]);

  // Create Task
  const createTask = async (taskData) => {
    try {
      const res = await api.createTask(taskData);
      if (res.success) {
        await fetchTasks();
        await fetchStats();
        await fetchNotifications();
        closeTaskModal();
        return { success: true, task: res.task };
      }
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  // Update Task
  const updateTask = async (id, taskData) => {
    try {
      const res = await api.updateTask(id, taskData);
      if (res.success) {
        await fetchTasks();
        await fetchStats();
        await fetchNotifications();
        closeTaskModal();
        return { success: true, task: res.task };
      }
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  // Quick Update Status
  const updateStatus = async (id, status, completionRemark = '') => {
    try {
      const res = await api.updateTaskStatus(id, status, completionRemark);
      if (res.success) {
        await fetchTasks();
        await fetchStats();
        await fetchNotifications();
        return { success: true };
      }
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  // Complete Task with Remark
  const completeTask = async (id, completionRemark) => {
    return updateStatus(id, 'Completed', completionRemark);
  };

  // Delete Task
  const deleteTask = async (id) => {
    try {
      const res = await api.deleteTask(id);
      if (res.success) {
        await fetchTasks();
        await fetchStats();
        await fetchNotifications();
        closeDeleteModal();
        return { success: true };
      }
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  // Notification Actions
  const markNotificationAsRead = async (id) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Mark notification read error:', err);
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Mark all read error:', err);
    }
  };

  const deleteNotificationItem = async (id) => {
    try {
      await api.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      const removed = notifications.find((n) => n._id === id);
      if (removed && !removed.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Delete notification error:', err);
    }
  };

  const clearAllNotifications = async () => {
    try {
      await api.clearAllNotifications();
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error('Clear all notifications error:', err);
      // Optimistically clear notifications in UI
      setNotifications([]);
      setUnreadCount(0);
    }
  };

  // Modal Open / Close Handlers
  const openCreateModal = () => {
    setModalMode('create');
    setSelectedTask(null);
    setIsTaskModalOpen(true);
  };

  const openEditModal = (task) => {
    setModalMode('edit');
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  };

  const closeTaskModal = () => {
    setIsTaskModalOpen(false);
    setSelectedTask(null);
  };

  const openDeleteModal = (task) => {
    setTaskToDelete(task);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setTaskToDelete(null);
  };

  // Total and paginated calculations
  const totalTasks = tasks.length;
  const totalPages = Math.ceil(totalTasks / itemsPerPage) || 1;
  const paginatedTasks = tasks.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <TaskContext.Provider
      value={{
        tasks,
        stats,
        loading,
        error,
        search,
        setSearch,
        taskTypeFilter,
        setTaskTypeFilter,
        statusFilter,
        setStatusFilter,
        currentPage,
        setCurrentPage,
        itemsPerPage,
        totalTasks,
        totalPages,
        paginatedTasks,
        isTaskModalOpen,
        modalMode,
        selectedTask,
        isDeleteModalOpen,
        taskToDelete,
        notifications,
        unreadCount,
        isInboxOpen,
        setIsInboxOpen,
        fetchTasks,
        fetchStats,
        fetchNotifications,
        createTask,
        updateTask,
        updateStatus,
        completeTask,
        deleteTask,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        deleteNotificationItem,
        clearAllNotifications,
        openCreateModal,
        openEditModal,
        closeTaskModal,
        openDeleteModal,
        closeDeleteModal,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
};
