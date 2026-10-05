import React, { useState, useEffect, useMemo } from 'react';
import { useTasks } from '../../context/TaskContext';
import { useUserManagement } from '../../context/UserContext';
import { useAuth } from '../../context/AuthContext';
import { MetricCard } from '../ManagerDashboard/MetricCard';
import { ManagerTasksDrilldownModal } from '../ManagerDashboard/ManagerTasksDrilldownModal';
import { TaskModal } from './TaskModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { TaskDetailModal } from './TaskDetailModal';
import {
  Plus,
  CheckCircle2,
  Clock,
  ListTodo,
  FolderKanban,
  Search,
  Filter,
  X,
  Eye,
  Edit2,
  Trash2,
  Calendar,
  User,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  AlertCircle,
  Globe,
  FileText,
  Share2,
  Database,
  MessageSquare,
  FileSpreadsheet,
  CheckSquare,
  Briefcase,
  Headphones,
  TrendingUp,
  Tag,
  Layers,
  AlertTriangle,
  RefreshCw,
  PhoneCall,
} from 'lucide-react';

// Helper to get all user IDs that are subordinate to (under) the current user in hierarchy
const getSubordinateUserIds = (user, allUsers) => {
  if (!user || !allUsers || !Array.isArray(allUsers)) return new Set();
  const userIdStr = (user._id ? user._id.toString() : (user.id ? user.id.toString() : '')).trim();
  const userNameStr = (user.name || '').toLowerCase().trim();

  const subordinateIds = new Set();
  if (!userIdStr && !userNameStr) return subordinateIds;

  const queue = [userIdStr];
  const processed = new Set([userIdStr]);

  while (queue.length > 0) {
    const currentParentId = queue.shift();
    const parentUser = allUsers.find((u) => u && (u._id || u.id) && (u._id || u.id).toString() === currentParentId);
    const parentName = (parentUser?.name || (currentParentId === userIdStr ? userNameStr : '')).toLowerCase().trim();

    for (const u of allUsers) {
      if (!u) continue;
      const uIdStr = (u._id || u.id || '').toString();
      if (!uIdStr || uIdStr === userIdStr || processed.has(uIdStr)) continue;

      const repIdStr = u.reportsTo ? (u.reportsTo._id ? u.reportsTo._id.toString() : u.reportsTo.toString()) : '';
      const repNameStr = (u.reportsToName || '').toLowerCase().trim();
      const createdByStr = u.createdBy ? (u.createdBy._id ? u.createdBy._id.toString() : u.createdBy.toString()) : '';

      const isDirectReport =
        (currentParentId && repIdStr === currentParentId) ||
        (parentName && repNameStr && (repNameStr.includes(parentName) || parentName.includes(repNameStr)));

      const isCreatedByParent = currentParentId && createdByStr === currentParentId;

      if (isDirectReport || isCreatedByParent) {
        subordinateIds.add(uIdStr);
        processed.add(uIdStr);
        queue.push(uIdStr);
      }
    }
  }

  return subordinateIds;
};

export const TaskList = () => {
  const {
    tasks,
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
    openCreateModal,
    openEditModal,
    openViewModal,
    openDeleteModal,
    updateStatus,
    fetchTasks,
  } = useTasks();

  const { users } = useUserManagement();
  const { user: currentUser } = useAuth();

  const [isTasksModalOpen, setIsTasksModalOpen] = useState(false);
  const [tasksFilterParam, setTasksFilterParam] = useState('all');
  const [tasksModalTitle, setTasksModalTitle] = useState('Tasks Overview');

  const openTasksDrilldown = (status = 'all', title = 'Tasks Overview') => {
    setTasksFilterParam(status);
    setTasksModalTitle(title);
    setIsTasksModalOpen(true);
  };

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isTasksModalOpen) {
      document.body.style.overflow = 'hidden';
      document.body.classList.add('modal-open');
    } else {
      document.body.style.overflow = 'unset';
      document.body.classList.remove('modal-open');
    }
    return () => {
      document.body.style.overflow = 'unset';
      document.body.classList.remove('modal-open');
    };
  }, [isTasksModalOpen]);

  // Permitted users for Assigned To filter dropdown (Strictly hierarchy-enforced)
  const isSuperAdmin = currentUser && currentUser.role === 'Super Admin';
  const isManager = currentUser && ['Manager', 'Executive', 'Administrator'].includes(currentUser.role);
  const currentUserId = (currentUser?._id || currentUser?.id || '').toString();
  const currentUserName = (currentUser?.name || '').toLowerCase().trim();

  const permittedUsers = useMemo(() => {
    const activeUsers = (users || []).filter((u) => u && u.status !== 'Rejected' && u.status !== 'Pending');
    if (isSuperAdmin) {
      return activeUsers;
    }
    const subordinateIds = getSubordinateUserIds(currentUser, activeUsers);
    const filtered = activeUsers.filter((u) => {
      const uId = (u._id || u.id || '').toString();
      const isSelf =
        (currentUserId && uId === currentUserId) ||
        (currentUser?.email && u.email && u.email.toLowerCase() === currentUser.email.toLowerCase()) ||
        (currentUserName && (u.name || '').toLowerCase().trim() === currentUserName);
      return isSelf || subordinateIds.has(uId);
    });

    if (
      currentUser &&
      !filtered.some(
        (u) =>
          (u._id || u.id || '').toString() === currentUserId ||
          (u.name && u.name.toLowerCase().trim() === currentUserName)
      )
    ) {
      return [currentUser, ...filtered];
    }
    return filtered;
  }, [users, currentUser, isSuperAdmin, currentUserId, currentUserName]);

  // Summary Metrics calculation (Strictly from the user's permitted tasks)
  const totalCount = tasks.length;
  const completedCount = tasks.filter((t) => t.status === 'Completed').length;
  const inProgressCount = tasks.filter((t) => t.status === 'In Progress').length;
  const todoCount = tasks.filter((t) => t.status === 'To Do' || !t.status).length;

  const isFilterActive = search.trim() !== '' || taskTypeFilter !== 'all' || statusFilter !== 'all' || assignedToFilter !== 'all';

  // Task Type Badge helper
  const renderTaskTypeBadge = (type) => {
    const norm = (type || '').toLowerCase().trim();
    switch (norm) {
      case 'internet work':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '3px 9px', borderRadius: '999px', fontSize: '0.74rem', fontWeight: 600 }}>
            <Globe size={12} />
            <span>Internet Work</span>
          </span>
        );
      case 'documentation':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#f5f3ff', color: '#6d28d9', border: '1px solid #ddd6fe', padding: '3px 9px', borderRadius: '999px', fontSize: '0.74rem', fontWeight: 600 }}>
            <FileText size={12} />
            <span>Documentation</span>
          </span>
        );
      case 'social media':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#fdf2f8', color: '#be185d', border: '1px solid #fbcfe8', padding: '3px 9px', borderRadius: '999px', fontSize: '0.74rem', fontWeight: 600 }}>
            <Share2 size={12} />
            <span>Social Media</span>
          </span>
        );
      case 'backend work':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#f0fdfa', color: '#0f766e', border: '1px solid #99f6e4', padding: '3px 9px', borderRadius: '999px', fontSize: '0.74rem', fontWeight: 600 }}>
            <Database size={12} />
            <span>Backend Work</span>
          </span>
        );
      case 'client communication':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', padding: '3px 9px', borderRadius: '999px', fontSize: '0.74rem', fontWeight: 600 }}>
            <MessageSquare size={12} />
            <span>Client Communication</span>
          </span>
        );
      case 'data entry':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', padding: '3px 9px', borderRadius: '999px', fontSize: '0.74rem', fontWeight: 600 }}>
            <FileSpreadsheet size={12} />
            <span>Data Entry</span>
          </span>
        );
      case 'research & analysis':
      case 'research and analysis':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#f3e8ff', color: '#7e22ce', border: '1px solid #e9d5ff', padding: '3px 9px', borderRadius: '999px', fontSize: '0.74rem', fontWeight: 600 }}>
            <Search size={12} />
            <span>Research & Analysis</span>
          </span>
        );
      case 'follow-up':
      case 'follow up':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#ecfeff', color: '#0e7490', border: '1px solid #a5f3fc', padding: '3px 9px', borderRadius: '999px', fontSize: '0.74rem', fontWeight: 600 }}>
            <PhoneCall size={12} />
            <span>Follow-up</span>
          </span>
        );
      case 'testing & quality check':
      case 'testing and quality check':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#fff1f2', color: '#be123c', border: '1px solid #fecdd3', padding: '3px 9px', borderRadius: '999px', fontSize: '0.74rem', fontWeight: 600 }}>
            <CheckSquare size={12} />
            <span>Testing & QC</span>
          </span>
        );
      case 'administrative work':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', padding: '3px 9px', borderRadius: '999px', fontSize: '0.74rem', fontWeight: 600 }}>
            <Briefcase size={12} />
            <span>Admin Work</span>
          </span>
        );
      case 'technical support':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', padding: '3px 9px', borderRadius: '999px', fontSize: '0.74rem', fontWeight: 600 }}>
            <Headphones size={12} />
            <span>Tech Support</span>
          </span>
        );
      case 'sells':
      case 'sales':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '3px 9px', borderRadius: '999px', fontSize: '0.74rem', fontWeight: 600 }}>
            <TrendingUp size={12} />
            <span>Sales & Deals</span>
          </span>
        );
      default:
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', padding: '3px 9px', borderRadius: '999px', fontSize: '0.74rem', fontWeight: 600, textTransform: 'capitalize' }}>
            <Tag size={12} />
            <span>{type || 'General'}</span>
          </span>
        );
    }
  };

  // Status Badge helper
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'Completed':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', padding: '3px 10px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700 }}>
            <CheckCircle2 size={13} />
            <span>Completed</span>
          </span>
        );
      case 'In Progress':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a', padding: '3px 10px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700 }}>
            <Clock size={13} />
            <span>In Progress</span>
          </span>
        );
      default:
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', padding: '3px 10px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700 }}>
            <ListTodo size={13} />
            <span>To Do</span>
          </span>
        );
    }
  };

  return (
    <div className="task-management-page fade-in" style={{ padding: '6px 0 32px 0' }}>
      {/* 1. Curved Header Banner */}
      <div
        style={{
          marginBottom: '20px',
          padding: '16px 20px',
          background: '#ffffff',
          borderRadius: '20px',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-card)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span
              className="badge-official badge-blue"
              style={{ borderRadius: '999px', padding: '3px 10px', fontSize: '0.74rem', fontWeight: 700 }}
            >
              Task Operations
            </span>
            <span
              className="badge-official"
              style={{
                background: '#ecfdf5',
                color: '#059669',
                borderColor: '#a7f3d0',
                borderRadius: '999px',
                padding: '3px 10px',
                fontSize: '0.74rem',
                fontWeight: 700,
              }}
            >
              {completedCount}/{totalCount} Completed
            </span>
          </div>
          <h1 style={{ fontSize: '1.38rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Task Management
          </h1>
        </div>

        {/* Header Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Add Task Button */}
          <button
            type="button"
            className="btn btn-primary"
            onClick={openCreateModal}
            id="btn-add-new-task"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: '#2563eb',
              color: '#ffffff',
              padding: '10px 18px',
              borderRadius: '999px',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
              transition: 'all 0.2s',
            }}
          >
            <Plus size={16} />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* 2. Four Summary Cards */}
      <div
        className="stats-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
          gap: '16px',
          marginBottom: '22px',
        }}
      >
        <MetricCard
          title="Total Assigned Tasks"
          value={totalCount}
          subtitle="All active organizational tasks"
          icon={ListTodo}
          color="#2563eb"
          bgLight="#eff6ff"
          isClickable={true}
          onClick={() => openTasksDrilldown('all', 'All Assigned Tasks')}
        />

        <MetricCard
          title="In Progress Work"
          value={inProgressCount}
          subtitle="Currently in execution"
          icon={Clock}
          color="#d97706"
          bgLight="#fffbeb"
          isClickable={true}
          onClick={() => openTasksDrilldown('In Progress', 'In Progress Tasks')}
        />

        <MetricCard
          title="Completed Workflows"
          value={completedCount}
          subtitle="Successfully finalized & delivered"
          icon={CheckCircle2}
          color="#059669"
          bgLight="#ecfdf5"
          isClickable={true}
          onClick={() => openTasksDrilldown('Completed', 'Completed Tasks')}
        />

        <MetricCard
          title="Pending Queue"
          value={todoCount}
          subtitle="Awaiting task execution"
          icon={FolderKanban}
          color="#6366f1"
          bgLight="#eef2ff"
          isClickable={true}
          onClick={() => openTasksDrilldown('To Do', 'Pending Tasks Queue')}
        />
      </div>

      {/* 3. Task Directory Section */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '20px',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-card)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Directory Header Bar & Controls */}
        <div
          style={{
            padding: '18px 20px',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            background: 'linear-gradient(to right, #fafafa, #ffffff)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '1.12rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Task Directory
                </h2>
                <span
                  style={{
                    background: '#eff6ff',
                    color: '#2563eb',
                    border: '1px solid #dbeafe',
                    padding: '2px 8px',
                    borderRadius: '999px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                  }}
                >
                  {totalTasks} {totalTasks === 1 ? 'task' : 'tasks'}
                </span>
              </div>
              <p style={{ margin: '2px 0 0', fontSize: '0.76rem', color: '#64748b' }}>
                Hierarchy-authorized task queue and execution tracking
              </p>
            </div>

            {/* Quick Actions (Reset filters if active) */}
            {isFilterActive && (
              <button
                type="button"
                onClick={resetFilters}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '5px 11px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  background: '#ffffff',
                  color: '#dc2626',
                  fontSize: '0.76rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <RotateCcw size={12} />
                <span>Reset Filters</span>
              </button>
            )}
          </div>

          {/* Search and Filters Row */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
              gap: '10px',
              alignItems: 'center',
            }}
          >
            {/* Search Input */}
            <div style={{ position: 'relative' }}>
              <Search
                size={15}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#94a3b8',
                  pointerEvents: 'none',
                }}
              />
              <input
                type="text"
                placeholder="Search tasks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 32px 8px 34px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.84rem',
                  background: '#ffffff',
                  color: '#0f172a',
                  outline: 'none',
                  transition: 'border-color 0.15s ease',
                }}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  title="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Status Filter */}
            <div>
              <select
                className="select-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.82rem',
                  fontWeight: 500,
                  background: '#ffffff',
                  color: '#334155',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                <option value="all">Status: All Statuses</option>
                <option value="To Do">Status: To Do</option>
                <option value="In Progress">Status: In Progress</option>
                <option value="Completed">Status: Completed</option>
              </select>
            </div>

            {/* Task Type Filter */}
            <div>
              <select
                className="select-filter"
                value={taskTypeFilter}
                onChange={(e) => setTaskTypeFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.82rem',
                  fontWeight: 500,
                  background: '#ffffff',
                  color: '#334155',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                <option value="all">Type: All Types</option>
                <option value="internet work">Internet Work</option>
                <option value="documentation">Documentation</option>
                <option value="social media">Social Media</option>
                <option value="backend work">Backend Work</option>
                <option value="client communication">Client Communication</option>
                <option value="data entry">Data Entry</option>
                <option value="research & analysis">Research & Analysis</option>
                <option value="follow-up">Follow-up</option>
                <option value="testing & quality check">Testing & Quality Check</option>
                <option value="administrative work">Administrative Work</option>
                <option value="technical support">Technical Support</option>
                <option value="sells">Sales / Sells</option>
              </select>
            </div>

            {/* Assigned To Filter (Hierarchy-Restricted) */}
            <div>
              <select
                className="select-filter"
                value={assignedToFilter}
                onChange={(e) => setAssignedToFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.82rem',
                  fontWeight: 500,
                  background: '#ffffff',
                  color: '#334155',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                <option value="all">Assignee: All Permitted</option>
                {permittedUsers.map((u) => {
                  const isSelf =
                    (currentUserId && (u._id || u.id) === currentUserId) ||
                    (currentUserName && (u.name || '').toLowerCase().trim() === currentUserName);
                  const label = `${u.name || 'User'}${isSelf ? ' (Myself)' : ''}`;
                  return (
                    <option key={u._id || u.name} value={u.name}>
                      {label}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        </div>

        {/* Directory Body: Loading / Error / Empty / Table */}
        {loading ? (
          <div style={{ padding: '48px 20px', textAlign: 'center', color: '#64748b' }}>
            <div
              style={{
                display: 'inline-block',
                width: '32px',
                height: '32px',
                border: '3px solid #e2e8f0',
                borderTopColor: '#2563eb',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
                marginBottom: '12px',
              }}
            />
            <p style={{ margin: 0, fontSize: '0.88rem', fontWeight: 600, color: '#334155' }}>
              Loading task records...
            </p>
          </div>
        ) : error ? (
          <div style={{ padding: '40px 20px', textAlign: 'center' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                backgroundColor: '#fef2f2',
                color: '#dc2626',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '12px',
              }}
            >
              <AlertCircle size={24} />
            </div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#991b1b', margin: '0 0 6px 0' }}>
              Unable to load tasks. Please try again.
            </h3>
            <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 16px 0' }}>{error}</p>
            <button
              type="button"
              onClick={() => fetchTasks()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 18px',
                borderRadius: '8px',
                background: '#2563eb',
                color: '#ffffff',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.84rem',
                cursor: 'pointer',
              }}
            >
              <RefreshCw size={14} />
              <span>Retry</span>
            </button>
          </div>
        ) : paginatedTasks.length === 0 ? (
          <div style={{ padding: '48px 20px', textAlign: 'center' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '14px',
                backgroundColor: '#f1f5f9',
                color: '#94a3b8',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '12px',
              }}
            >
              <ListTodo size={24} />
            </div>
            <h3 style={{ fontSize: '1.02rem', fontWeight: 700, color: '#1e293b', margin: '0 0 6px 0' }}>
              No tasks found
            </h3>
            <p style={{ fontSize: '0.84rem', color: '#64748b', margin: '0 0 16px 0', maxWidth: '400px', marginLeft: 'auto', marginRight: 'auto' }}>
              {isFilterActive
                ? 'No task records match your active search and filter criteria.'
                : 'There are currently no tasks assigned within your authorized organizational hierarchy.'}
            </p>
            {isFilterActive ? (
              <button
                type="button"
                onClick={resetFilters}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 18px',
                  borderRadius: '8px',
                  background: '#f1f5f9',
                  color: '#334155',
                  border: '1px solid #cbd5e1',
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                }}
              >
                <RotateCcw size={13} />
                <span>Clear All Filters</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={openCreateModal}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 18px',
                  borderRadius: '999px',
                  background: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 10px rgba(37, 99, 235, 0.2)',
                }}
              >
                <Plus size={14} />
                <span>Assign New Task</span>
              </button>
            )}
          </div>
        ) : (
          <div style={{ width: '100%', overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                textAlign: 'left',
                fontSize: '0.86rem',
              }}
            >
              <thead>
                <tr
                  style={{
                    background: '#f8fafc',
                    borderBottom: '1px solid #e2e8f0',
                    color: '#64748b',
                    fontWeight: 700,
                    fontSize: '0.74rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  <th style={{ padding: '12px 16px', width: '56px', textAlign: 'center' }}>S.No.</th>
                  <th style={{ padding: '12px 16px', minWidth: '240px' }}>Task</th>
                  <th style={{ padding: '12px 16px', minWidth: '160px' }}>Task Type</th>
                  <th style={{ padding: '12px 16px', minWidth: '160px' }}>Assigned To</th>
                  <th style={{ padding: '12px 16px', minWidth: '150px' }}>Expected Completion</th>
                  <th style={{ padding: '12px 16px', minWidth: '130px' }}>Status</th>
                  <th style={{ padding: '12px 16px', width: '110px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTasks.map((task, index) => {
                  const serialNo = (currentPage - 1) * itemsPerPage + index + 1;
                  const isAssignedToMe =
                    (currentUser && task.assignedTo && task.assignedTo.toLowerCase().trim() === (currentUser.name || '').toLowerCase().trim()) ||
                    (currentUser && task.assignedTo && task.assignedTo.toLowerCase().trim() === (currentUser.username || '').toLowerCase().trim()) ||
                    (task.user && currentUserId && (task.user === currentUserId || task.user._id === currentUserId));

                  const isOverdue =
                    task.status !== 'Completed' &&
                    task.expectedDate &&
                    new Date(task.expectedDate) < new Date(new Date().setHours(0, 0, 0, 0));

                  return (
                    <tr
                      key={task._id || index}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'background-color 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f8fafc';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      {/* S.No. */}
                      <td style={{ padding: '14px 16px', textAlign: 'center', color: '#94a3b8', fontWeight: 600, fontSize: '0.78rem' }}>
                        {serialNo}
                      </td>

                      {/* Task Description */}
                      <td style={{ padding: '14px 16px' }}>
                        <div
                          onClick={() => openViewModal(task)}
                          style={{
                            fontWeight: 600,
                            color: '#0f172a',
                            cursor: 'pointer',
                            lineHeight: 1.4,
                            maxWidth: '340px',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                          title={task.description}
                        >
                          {task.description}
                        </div>
                        {task.remark && (
                          <div
                            style={{
                              fontSize: '0.74rem',
                              color: '#64748b',
                              marginTop: '3px',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              maxWidth: '320px',
                            }}
                          >
                            Note: {task.remark}
                          </div>
                        )}
                      </td>

                      {/* Task Type */}
                      <td style={{ padding: '14px 16px' }}>{renderTaskTypeBadge(task.taskType)}</td>

                      {/* Assigned To */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '50%',
                              backgroundColor: isAssignedToMe ? '#dbeafe' : '#f1f5f9',
                              color: isAssignedToMe ? '#1d4ed8' : '#475569',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              flexShrink: 0,
                            }}
                          >
                            {(task.assignedTo || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.84rem' }}>
                              {task.assignedTo || 'Unassigned'}
                            </div>
                            {isAssignedToMe && (
                              <span style={{ fontSize: '0.68rem', color: '#2563eb', fontWeight: 600 }}>
                                (Assigned to You)
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Expected Completion */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: isOverdue ? '#dc2626' : '#334155' }}>
                          <Calendar size={13} style={{ color: isOverdue ? '#dc2626' : '#94a3b8' }} />
                          <span style={{ fontWeight: isOverdue ? 700 : 500, fontSize: '0.82rem' }}>
                            {task.expectedDate
                              ? new Date(task.expectedDate).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })
                              : '—'}
                          </span>
                        </div>
                        {isOverdue && (
                          <span
                            style={{
                              display: 'inline-block',
                              marginTop: '2px',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              backgroundColor: '#fef2f2',
                              color: '#dc2626',
                              fontSize: '0.68rem',
                              fontWeight: 700,
                            }}
                          >
                            Overdue
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '14px 16px' }}>{renderStatusBadge(task.status)}</td>

                      {/* Actions */}
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                          {/* View */}
                          <button
                            type="button"
                            onClick={() => openViewModal(task)}
                            title="View Task Details"
                            style={{
                              width: '30px',
                              height: '30px',
                              borderRadius: '7px',
                              border: '1px solid #e2e8f0',
                              backgroundColor: '#ffffff',
                              color: '#475569',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.15s ease',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#eff6ff';
                              e.currentTarget.style.color = '#2563eb';
                              e.currentTarget.style.borderColor = '#bfdbfe';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = '#ffffff';
                              e.currentTarget.style.color = '#475569';
                              e.currentTarget.style.borderColor = '#e2e8f0';
                            }}
                          >
                            <Eye size={14} />
                          </button>

                          {/* Edit */}
                          <button
                            type="button"
                            onClick={() => openEditModal(task)}
                            title="Edit Task"
                            style={{
                              width: '30px',
                              height: '30px',
                              borderRadius: '7px',
                              border: '1px solid #e2e8f0',
                              backgroundColor: '#ffffff',
                              color: '#475569',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.15s ease',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#eff6ff';
                              e.currentTarget.style.color = '#2563eb';
                              e.currentTarget.style.borderColor = '#bfdbfe';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = '#ffffff';
                              e.currentTarget.style.color = '#475569';
                              e.currentTarget.style.borderColor = '#e2e8f0';
                            }}
                          >
                            <Edit2 size={14} />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => openDeleteModal(task)}
                            title="Delete Task"
                            style={{
                              width: '30px',
                              height: '30px',
                              borderRadius: '7px',
                              border: '1px solid #e2e8f0',
                              backgroundColor: '#ffffff',
                              color: '#dc2626',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.15s ease',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#fef2f2';
                              e.currentTarget.style.borderColor = '#fecaca';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = '#ffffff';
                              e.currentTarget.style.borderColor = '#e2e8f0';
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Directory Footer: Pagination */}
        {!loading && !error && totalTasks > 0 && (
          <div
            style={{
              padding: '14px 20px',
              borderTop: '1px solid #f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
              background: '#ffffff',
            }}
          >
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Showing <strong style={{ color: '#0f172a' }}>{(currentPage - 1) * itemsPerPage + 1}</strong> to{' '}
              <strong style={{ color: '#0f172a' }}>{Math.min(currentPage * itemsPerPage, totalTasks)}</strong> of{' '}
              <strong style={{ color: '#0f172a' }}>{totalTasks}</strong> tasks
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  backgroundColor: '#ffffff',
                  color: currentPage === 1 ? '#cbd5e1' : '#334155',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s ease',
                }}
                aria-label="Previous Page"
              >
                <ChevronLeft size={16} />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                const isActive = page === currentPage;
                return (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    style={{
                      minWidth: '32px',
                      height: '32px',
                      padding: '0 6px',
                      borderRadius: '8px',
                      border: isActive ? '1px solid #2563eb' : '1px solid #e2e8f0',
                      backgroundColor: isActive ? '#2563eb' : '#ffffff',
                      color: isActive ? '#ffffff' : '#334155',
                      fontWeight: isActive ? 700 : 500,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {page}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  backgroundColor: '#ffffff',
                  color: currentPage === totalPages ? '#cbd5e1' : '#334155',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s ease',
                }}
                aria-label="Next Page"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Drilldown Modal (Opened on clicking any card) */}
      <ManagerTasksDrilldownModal
        isOpen={isTasksModalOpen}
        onClose={() => setIsTasksModalOpen(false)}
        initialFilter={tasksFilterParam}
        modalTitle={tasksModalTitle}
      />

      {/* Task Detail View Modal */}
      <TaskDetailModal />

      {/* Task Creation & Edit Modal */}
      <TaskModal />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal />
    </div>
  );
};

export default TaskList;
