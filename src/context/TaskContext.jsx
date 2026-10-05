import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';
import { socketService } from '../services/socket';

const TaskContext = createContext(null);

export const TaskProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();

  const [tasks, setTasks] = useState(() => {
    try {
      const cached = localStorage.getItem('taskflow_cached_tasks');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [stats, setStats] = useState(() => {
    try {
      const cached = localStorage.getItem('taskflow_cached_stats');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Notifications State for Inbox (Both Manager & User)
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isInboxOpen, setIsInboxOpen] = useState(false);

  // Live Instant Toast Alert State
  const [liveToast, setLiveToast] = useState(null);
  const toastTimeoutRef = useRef(null);

  // Filtering & Pagination State
  const [search, setSearch] = useState('');
  const [taskTypeFilter, setTaskTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [assignedToFilter, setAssignedToFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modal State
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [selectedTask, setSelectedTask] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [taskToView, setTaskToView] = useState(null);

  // Trigger live toast with auto-dismiss
  const showLiveToast = useCallback((toastData) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setLiveToast(toastData);
    toastTimeoutRef.current = setTimeout(() => {
      setLiveToast(null);
    }, 6500);
  }, []);

  const dismissLiveToast = useCallback(() => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setLiveToast(null);
  }, []);

  // Fetch tasks (Backend automatically scopes tasks to user's permitted hierarchy)
  const fetchTasks = useCallback(async (silent = false) => {
    if (!isAuthenticated) return;
    if (!silent) setLoading(true);
    setError('');
    try {
      const res = await api.getTasks({});
      if (res.success) {
        setTasks(res.tasks || []);
        localStorage.setItem('taskflow_cached_tasks', JSON.stringify(res.tasks || []));
      }
    } catch (err) {
      console.error('Fetch tasks error:', err);
      if (!silent) setError(err.message || 'Unable to load tasks. Please try again.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [isAuthenticated]);

  // Fetch Manager / User Stats (Backend automatically scopes to user's permitted hierarchy)
  const fetchStats = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.getStats({});
      if (res.success) {
        setStats(res.stats);
        localStorage.setItem('taskflow_cached_stats', JSON.stringify(res.stats));
      }
    } catch (err) {
      console.error('Fetch stats error:', err);
    }
  }, [isAuthenticated]);

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

  // Real-Time Socket Connection & Event Handlers
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    // Connect socket and join user/role rooms
    socketService.connect(user);

    const isManager = ['Manager', 'Executive', 'Administrator'].includes(user.role);
    const myName = (user.name || '').toLowerCase().trim();
    const myUsername = (user.username || '').toLowerCase().trim();
    const myId = user._id ? user._id.toString() : (user.id ? user.id.toString() : '');

    // 1. Listen for new real-time notifications
    const handleNewNotification = (data) => {
      console.log('[Real-Time] Received new notification:', data);
      const notif = data.notification || data;

      // Filter relevance for this client
      let isRelevant = false;
      const rName = (notif.recipientName || '').toLowerCase().trim();
      const rUser = notif.recipientUser ? notif.recipientUser.toString() : '';

      const isDirectRecipient =
        (rUser && rUser === myId) ||
        (rName && (rName === myName || rName === myUsername || myName.includes(rName) || rName.includes(myName)));

      if (isDirectRecipient) {
        isRelevant = true;
      } else if (notif.forRole === 'All') {
        isRelevant = true;
      } else if (isManager && (notif.forRole === 'Manager' || !notif.forRole)) {
        isRelevant = true;
      } else if (!isManager && (notif.forRole === 'User' || !notif.forRole)) {
        isRelevant = true;
      }

      if (isRelevant) {
        setNotifications((prev) => {
          const exists = prev.some((n) => n._id === notif._id);
          if (exists) return prev;
          return [notif, ...prev];
        });
        setUnreadCount((prev) => prev + 1);

        const isLeadNotif =
          notif.type === 'lead_assigned' ||
          notif.type === 'new_lead' ||
          notif.type === 'lead_created' ||
          notif.taskType === 'lead' ||
          data.type === 'lead_assigned';

        // Trigger Instant Live Toast Banner
        showLiveToast({
          title:
            data.title ||
            notif.title ||
            (isLeadNotif ? '🎯 New Lead Received' : isManager ? 'Task Completed Alert' : 'New Task Assigned'),
          message: data.message || notif.message || notif.taskDescription,
          remark: data.remark || notif.remark || notif.completionRemark,
          type: data.type || notif.type,
          forRole: notif.forRole,
          assignedBy: notif.assignedBy,
          leadId: notif.leadId || data.leadId,
          leadReadableId: notif.leadReadableId || data.leadReadableId,
        });

        // Instant silent background data update
        fetchTasks(true);
        fetchStats();
      }
    };

    // 2. Listen for real-time task changes
    const handleTasksUpdated = (payload) => {
      console.log('[Real-Time] Tasks updated event received');
      fetchTasks(true);
      fetchStats();
    };

    // 3. Listen for notification read/clear updates from other tabs/devices
    const handleNotificationUpdated = () => {
      fetchNotifications();
    };

    const cleanupNotif = socketService.on('notification:new', handleNewNotification);
    const cleanupLeadAssigned = socketService.on('lead:assigned', handleNewNotification);
    const cleanupTasks = socketService.on('tasks:updated', handleTasksUpdated);
    const cleanupStats = socketService.on('stats:updated', () => fetchStats());
    const cleanupNotifUpdate = socketService.on('notification:updated', handleNotificationUpdated);

    return () => {
      cleanupNotif();
      cleanupLeadAssigned();
      cleanupTasks();
      cleanupStats();
      cleanupNotifUpdate();
    };
  }, [isAuthenticated, user, showLiveToast, fetchTasks, fetchStats, fetchNotifications]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchTasks();
      fetchStats();
      fetchNotifications();

      // Refresh data when user switches back to tab/app
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          fetchNotifications();
          fetchStats();
          fetchTasks(true);
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, [isAuthenticated, fetchTasks, fetchStats, fetchNotifications]);

  // Reset to page 1 when search or filter criteria changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, taskTypeFilter, statusFilter, assignedToFilter]);

  const resetFilters = useCallback(() => {
    setSearch('');
    setTaskTypeFilter('all');
    setStatusFilter('all');
    setAssignedToFilter('all');
    setCurrentPage(1);
  }, []);

  // Create Task
  const createTask = async (taskData) => {
    try {
      const res = await api.createTask(taskData);
      if (res.success) {
        setTasks((prev) => {
          const next = [res.task, ...prev.filter(t => t._id !== res.task._id)];
          localStorage.setItem('taskflow_cached_tasks', JSON.stringify(next));
          return next;
        });
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
        setTasks((prev) => {
          const next = prev.map(t => (t._id === id ? res.task : t));
          localStorage.setItem('taskflow_cached_tasks', JSON.stringify(next));
          return next;
        });
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
        setTasks((prev) => {
          const next = prev.map(t => (t._id === id ? { ...t, status, completionRemark } : t));
          localStorage.setItem('taskflow_cached_tasks', JSON.stringify(next));
          return next;
        });
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
        setTasks((prev) => {
          const next = prev.filter(t => t._id !== id);
          localStorage.setItem('taskflow_cached_tasks', JSON.stringify(next));
          return next;
        });
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

  const openViewModal = (task) => {
    setTaskToView(task);
    setIsViewModalOpen(true);
  };

  const closeViewModal = () => {
    setIsViewModalOpen(false);
    setTaskToView(null);
  };

  const openDeleteModal = (task) => {
    setTaskToDelete(task);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setTaskToDelete(null);
  };

  // Total and paginated calculations for TaskList view
  const filteredTasks = tasks.filter((t) => {
    if (!t) return false;
    
    // Task Type Filter
    if (taskTypeFilter !== 'all') {
      const type = (t.taskType || '').toLowerCase().trim();
      const filter = taskTypeFilter.toLowerCase().trim();
      const isMatch =
        type === filter ||
        (filter === 'sells' && (type === 'sales' || type === 'sells')) ||
        (filter === 'research & analysis' && (type === 'research and analysis' || type === 'research & analysis')) ||
        (filter === 'follow-up' && (type === 'follow up' || type === 'follow-up')) ||
        (filter === 'testing & quality check' && (type === 'testing and quality check' || type === 'testing & quality check'));
      if (!isMatch) return false;
    }

    // Status Filter
    if (statusFilter !== 'all' && t.status !== statusFilter) {
      return false;
    }

    // Assigned To Filter
    if (assignedToFilter !== 'all') {
      const assigned = (t.assignedTo || '').toLowerCase().trim();
      const filterAssigned = assignedToFilter.toLowerCase().trim();
      if (assigned !== filterAssigned) return false;
    }

    // Search Query
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const matchDesc = (t.description || '').toLowerCase().includes(q);
      const matchRemark =
        (t.remark || '').toLowerCase().includes(q) ||
        (t.completionRemark || '').toLowerCase().includes(q);
      const matchAssigned = (t.assignedTo || '').toLowerCase().includes(q);
      const matchType = (t.taskType || '').toLowerCase().includes(q);
      const matchAssignedBy = (t.assignedBy || '').toLowerCase().includes(q);
      if (!matchDesc && !matchRemark && !matchAssigned && !matchType && !matchAssignedBy) return false;
    }
    return true;
  });

  const totalTasks = filteredTasks.length;
  const totalPages = Math.ceil(totalTasks / itemsPerPage) || 1;
  const paginatedTasks = filteredTasks.slice(
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
        assignedToFilter,
        setAssignedToFilter,
        resetFilters,
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
        isViewModalOpen,
        taskToView,
        notifications,
        unreadCount,
        liveToast,
        showLiveToast,
        dismissLiveToast,
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
        openViewModal,
        closeViewModal,
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
