import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTasks } from '../../context/TaskContext';
import { ManagerInboxModal } from '../ManagerDashboard/ManagerInboxModal';
import {
  CheckCircle2,
  Clock,
  ListTodo,
  Briefcase,
  Calendar,
  Search,
  Send,
  X,
  Shield,
  PlayCircle,
  ExternalLink,
  ArrowRight,
  TrendingUp,
  Bell,
  Sparkles,
  Inbox,
} from 'lucide-react';

export const UserWorkspace = () => {
  const { user } = useAuth();
  const { tasks, loading, completeTask, updateStatus, notifications, unreadCount } = useTasks();

  // Active section popup modal state: null | 'all' | 'To Do' | 'In Progress' | 'Completed'
  const [activeModalSection, setActiveModalSection] = useState(null);
  const [modalSearch, setModalSearch] = useState('');
  const [modalTypeFilter, setModalTypeFilter] = useState('all');

  // User Inbox Modal State
  const [isInboxModalOpen, setIsInboxModalOpen] = useState(false);

  // Task Completion Modal State
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
  const [taskToComplete, setTaskToComplete] = useState(null);
  const [completionRemark, setCompletionRemark] = useState('');
  const [isSubmittingCompletion, setIsSubmittingCompletion] = useState(false);
  const [successToast, setSuccessToast] = useState('');

  // Strictly filter tasks assigned to this user
  const userIdentifier = (user?.name || '').toLowerCase().trim();
  const userUsername = (user?.username || '').toLowerCase().trim();
  const userId = (user?._id || user?.id || '').toString();

  const safeTasks = Array.isArray(tasks) ? tasks : [];
  const safeNotifications = Array.isArray(notifications) ? notifications : [];

  const myTasks = safeTasks.filter((t) => {
    if (!t) return false;
    const tAssigned = (t.assignedTo || '').toLowerCase().trim();
    const tUser = t.user ? t.user.toString() : '';
    return (
      (userIdentifier && tAssigned === userIdentifier) ||
      (userUsername && tAssigned === userUsername) ||
      (userId && tUser === userId) ||
      tAssigned === 'current user'
    );
  });

  // Self Metrics
  const totalMyTasks = myTasks.length;
  const completedTasks = myTasks.filter((t) => t && t.status === 'Completed');
  const inProgressTasks = myTasks.filter((t) => t && t.status === 'In Progress');
  const todoTasks = myTasks.filter((t) => t && t.status === 'To Do');

  const completionPercentage =
    totalMyTasks > 0 ? Math.round((completedTasks.length / totalMyTasks) * 100) : 0;

  // Check for latest task assignment notification for this user
  const latestAssignmentNotif = safeNotifications.find(
    (n) => n && (n.type === 'task_assigned' || (n.assignedBy && n.forRole !== 'Manager') || n.forRole === 'User')
  );

  // Open specific detail section popup
  const openSectionModal = (sectionKey) => {
    setActiveModalSection(sectionKey);
    setModalSearch('');
    setModalTypeFilter('all');
  };

  const closeSectionModal = () => {
    setActiveModalSection(null);
    setModalSearch('');
    setModalTypeFilter('all');
  };

  // Filter tasks inside the active modal popup
  const getModalTasks = () => {
    if (!activeModalSection) return [];

    let list = myTasks;
    if (activeModalSection !== 'all') {
      list = list.filter((t) => t.status === activeModalSection);
    }

    return list.filter((t) => {
      const matchesSearch =
        modalSearch.trim() === '' ||
        t.description.toLowerCase().includes(modalSearch.toLowerCase()) ||
        (t.remark && t.remark.toLowerCase().includes(modalSearch.toLowerCase())) ||
        (t.assignedBy && t.assignedBy.toLowerCase().includes(modalSearch.toLowerCase()));
      const matchesType = modalTypeFilter === 'all' || t.taskType === modalTypeFilter;

      return matchesSearch && matchesType;
    });
  };

  // Open Completion Modal
  const openCompletionModal = (task) => {
    setTaskToComplete(task);
    setCompletionRemark('');
    setIsCompletionModalOpen(true);
  };

  const closeCompletionModal = () => {
    setIsCompletionModalOpen(false);
    setTaskToComplete(null);
    setCompletionRemark('');
  };

  // Submit Task Completion & Send Message to Manager
  const handleSubmitCompletion = async (e) => {
    e.preventDefault();
    if (!taskToComplete) return;

    setIsSubmittingCompletion(true);
    const remarkToSend =
      completionRemark.trim() || 'Work completed successfully and ready for manager review.';
    const res = await completeTask(taskToComplete._id, remarkToSend);
    setIsSubmittingCompletion(false);

    if (res.success) {
      closeCompletionModal();
      setSuccessToast(
        `Great job! Task marked as completed and notification sent to Manager's inbox.`
      );
      setTimeout(() => setSuccessToast(''), 5000);
    }
  };

  // Quick Start Task
  const handleStartTask = async (task) => {
    await updateStatus(task._id, 'In Progress');
    setSuccessToast(`Task status updated to In Progress.`);
    setTimeout(() => setSuccessToast(''), 4000);
  };

  const getTaskTypeBadgeColor = (type) => {
    switch (type) {
      case 'internet work':
        return { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' };
      case 'documentation':
        return { bg: '#ecfdf5', color: '#047857', border: '#a7f3d0' };
      case 'social media':
        return { bg: '#fdf2f8', color: '#be185d', border: '#fbcfe8' };
      case 'backend work':
        return { bg: '#f5f3ff', color: '#6d28d9', border: '#ddd6fe' };
      default:
        return { bg: '#f1f5f9', color: '#475569', border: '#cbd5e1' };
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'High':
        return (
          <span
            style={{
              fontSize: '0.72rem',
              padding: '2px 8px',
              borderRadius: '9999px',
              background: '#fef2f2',
              color: '#dc2626',
              border: '1px solid #fecaca',
              fontWeight: 600,
            }}
          >
            High Priority
          </span>
        );
      case 'Medium':
        return (
          <span
            style={{
              fontSize: '0.72rem',
              padding: '2px 8px',
              borderRadius: '9999px',
              background: '#fffbeb',
              color: '#b45309',
              border: '1px solid #fde68a',
              fontWeight: 600,
            }}
          >
            Medium Priority
          </span>
        );
      default:
        return (
          <span
            style={{
              fontSize: '0.72rem',
              padding: '2px 8px',
              borderRadius: '9999px',
              background: '#f1f5f9',
              color: '#475569',
              border: '1px solid #cbd5e1',
              fontWeight: 600,
            }}
          >
            Low Priority
          </span>
        );
    }
  };

  const modalTasksList = getModalTasks();

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Toast Notification */}
      {successToast && (
        <div
          style={{
            padding: '12px 18px',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.3))',
            border: '1px solid #10b981',
            borderRadius: '10px',
            color: '#a7f3d0',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)',
            animation: 'fadeIn 0.3s ease',
          }}
        >
          <CheckCircle2 size={18} color="#10b981" />
          <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{successToast}</span>
        </div>
      )}

      {/* Header with Title and Open Inbox Quick Button */}
      <div
        className="section-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '4px',
        }}
      >
        <div>
          <h2 className="section-title">My Assigned Work</h2>
        </div>

        {/* Dedicated My Inbox Button for User */}
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => setIsInboxModalOpen(true)}
          style={{
            position: 'relative',
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: unreadCount > 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.05)',
            borderColor: unreadCount > 0 ? '#10b981' : 'var(--border-color)',
          }}
          title="Open My Task Assignment Inbox"
        >
          <Inbox size={18} color={unreadCount > 0 ? '#34d399' : '#94a3b8'} />
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>My Task Inbox</span>
          {unreadCount > 0 && (
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '999px',
                background: '#ef4444',
                color: '#ffffff',
                boxShadow: '0 0 8px rgba(239, 68, 68, 0.6)',
              }}
            >
              {unreadCount} new
            </span>
          )}
        </button>
      </div>

      {/* HORIZONTAL TASK ASSIGNMENT ALERT BANNER */}
      {latestAssignmentNotif && (
        <div
          style={{
            background: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: '12px',
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: '#dbeafe',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Bell size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.92rem' }}>
                  {latestAssignmentNotif.assignedBy || 'Manager'} assigned you a task
                </span>
                <span
                  style={{
                    fontSize: '0.7rem',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: '#dbeafe',
                    color: '#1d4ed8',
                    fontWeight: 600,
                  }}
                >
                  INBOX MESSAGE
                </span>
              </div>
              <p style={{ margin: '2px 0 0 0', color: 'var(--text-secondary)', fontSize: '0.84rem' }}>
                {latestAssignmentNotif.taskDescription || latestAssignmentNotif.message} •{' '}
                <span style={{ color: 'var(--text-muted)' }}>{latestAssignmentNotif.remark}</span>
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsInboxModalOpen(true)}
              style={{
                padding: '6px 12px',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Inbox size={14} />
              <span>View in Inbox</span>
            </button>

            <button
              type="button"
              className="btn btn-primary"
              onClick={() => openSectionModal('To Do')}
              style={{
                padding: '6px 14px',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>View in To Do</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* STRICTLY HORIZONTAL ASSIGNMENTS ROW BAR */}
      <div
        className="card"
        style={{
          background: '#ffffff',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '20px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Work Breakdown & Task Categories:
          </span>

          {/* Completion Progress Metric */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Overall Progress: <strong style={{ color: '#059669' }}>{completionPercentage}%</strong> ({completedTasks.length}/{totalMyTasks} completed)
            </span>
          </div>
        </div>

        {/* 4 HORIZONTAL ASSIGNMENT TILES IN ONE ROW */}
        <div className="user-workspace-tiles-grid">
          {/* Tile 1: Total Assigned Work */}
          <div
            onClick={() => openSectionModal('all')}
            className="user-workspace-metric-tile tile-total"
            title="Click to view all assigned work"
          >
            <div>
              <span className="tile-label">
                Total Assigned Work
              </span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '3px' }}>
                <span className="tile-value">{totalMyTasks}</span>
                <span className="tile-cta cta-blue">Click to View ↗</span>
              </div>
            </div>
            <div className="tile-icon-box icon-blue">
              <Briefcase size={20} />
            </div>
          </div>

          {/* Tile 2: What Done (Completed) */}
          <div
            onClick={() => openSectionModal('Completed')}
            className="user-workspace-metric-tile tile-completed"
            title="Click to view completed tasks"
          >
            <div>
              <span className="tile-label">
                What Done (Completed)
              </span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '3px' }}>
                <span className="tile-value val-green">{completedTasks.length}</span>
                <span className="tile-cta cta-green">Click to View ↗</span>
              </div>
            </div>
            <div className="tile-icon-box icon-green">
              <CheckCircle2 size={20} />
            </div>
          </div>

          {/* Tile 3: What Incomplete (Ongoing) */}
          <div
            onClick={() => openSectionModal('In Progress')}
            className="user-workspace-metric-tile tile-progress"
            title="Click to view in-progress work"
          >
            <div>
              <span className="tile-label">
                What Incomplete (Ongoing)
              </span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '3px' }}>
                <span className="tile-value val-amber">{inProgressTasks.length}</span>
                <span className="tile-cta cta-amber">Click to View ↗</span>
              </div>
            </div>
            <div className="tile-icon-box icon-amber">
              <Clock size={20} />
            </div>
          </div>

          {/* Tile 4: What To Do (Pending) */}
          <div
            onClick={() => openSectionModal('To Do')}
            className="user-workspace-metric-tile tile-todo"
            title="Click to view to-do tasks"
          >
            <div>
              <span className="tile-label">
                What To Do (Pending)
              </span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '3px' }}>
                <span className="tile-value val-purple">{todoTasks.length}</span>
                <span className="tile-cta cta-purple">Click to View ↗</span>
              </div>
            </div>
            <div className="tile-icon-box icon-purple">
              <ListTodo size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* DEDICATED SECTION POP-UP MODAL (Opens only when user clicks a specific detail) */}
      {activeModalSection !== null && (
        <div className="modal-backdrop" onClick={closeSectionModal}>
          <div
            className="modal-content user-section-modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '850px',
              width: '100%',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              animation: 'modalSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            {/* Modal Header */}
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    padding: '8px',
                    borderRadius: '10px',
                    background:
                      activeModalSection === 'Completed'
                        ? '#ecfdf5'
                        : activeModalSection === 'In Progress'
                        ? '#fffbeb'
                        : activeModalSection === 'To Do'
                        ? '#f5f3ff'
                        : '#eff6ff',
                    color:
                      activeModalSection === 'Completed'
                        ? '#059669'
                        : activeModalSection === 'In Progress'
                        ? '#d97706'
                        : activeModalSection === 'To Do'
                        ? '#7c3aed'
                        : '#2563eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {activeModalSection === 'Completed' && <CheckCircle2 size={22} />}
                  {activeModalSection === 'In Progress' && <Clock size={22} />}
                  {activeModalSection === 'To Do' && <ListTodo size={22} />}
                  {activeModalSection === 'all' && <Briefcase size={22} />}
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <h3 className="modal-title" style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.15rem' }}>
                      {activeModalSection === 'Completed' && 'What Done (Completed Tasks)'}
                      {activeModalSection === 'In Progress' && 'What Incomplete (In Progress Work)'}
                      {activeModalSection === 'To Do' && 'What To Do (Pending Tasks)'}
                      {activeModalSection === 'all' && 'All Assigned Tasks Workspace'}
                    </h3>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '999px',
                        background: '#f1f5f9',
                        color: 'var(--text-primary)',
                        border: '1px solid #e2e8f0',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {modalTasksList.length} task(s)
                    </span>
                  </div>
                </div>
              </div>

              <button type="button" className="btn-icon" onClick={closeSectionModal} title="Close">
                <X size={20} />
              </button>
            </div>

            {/* Modal Filter Toolbar - Responsive Stack on Mobile */}
            <div className="user-modal-filter-toolbar">
              <div className="user-modal-search-box">
                <Search
                  size={15}
                  style={{
                    position: 'absolute',
                    left: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#64748b',
                    pointerEvents: 'none',
                  }}
                />
                <input
                  type="text"
                  className="form-control"
                  placeholder="Filter tasks in this section..."
                  value={modalSearch}
                  onChange={(e) => setModalSearch(e.target.value)}
                  style={{ paddingLeft: '32px', fontSize: '0.85rem', height: '38px', width: '100%' }}
                />
              </div>

              <div className="user-modal-select-box">
                <select
                  className="form-control select-filter"
                  value={modalTypeFilter}
                  onChange={(e) => setModalTypeFilter(e.target.value)}
                  style={{ fontSize: '0.85rem', width: '100%', height: '38px' }}
                  aria-label="Filter by task type"
                >
                  <option value="all">All Task Types</option>
                  <option value="internet work">Internet Work</option>
                  <option value="documentation">Documentation</option>
                  <option value="social media">Social Media</option>
                  <option value="backend work">Backend Work</option>
                </select>
              </div>
            </div>

            {/* Modal Task List Body */}
            <div
              className="modal-body user-modal-task-body"
              style={{
                padding: '16px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                overflowY: 'auto',
              }}
            >
              {modalTasksList.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '48px 16px',
                    color: 'var(--text-muted)',
                  }}
                >
                  <Briefcase size={38} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
                  <h4 style={{ color: 'var(--text-primary)', fontSize: '0.95rem', marginBottom: '4px' }}>
                    No Tasks in this section
                  </h4>
                  <p style={{ fontSize: '0.82rem', margin: 0 }}>
                    {modalSearch || modalTypeFilter !== 'all'
                      ? 'No tasks match your filter criteria.'
                      : `You currently have 0 tasks in "${activeModalSection}".`}
                  </p>
                </div>
              ) : (
                modalTasksList.map((task) => {
                  const typeStyle = getTaskTypeBadgeColor(task.taskType);
                  const isTaskCompleted = task.status === 'Completed';

                  let formattedDate = 'No date';
                  if (task.expectedDate) {
                    const d = new Date(task.expectedDate);
                    formattedDate = d.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    });
                  }

                  return (
                    <div
                      key={task._id}
                      className="user-task-modal-card"
                      style={{
                        background: isTaskCompleted
                          ? '#f0fdf4'
                          : '#ffffff',
                        border: isTaskCompleted
                          ? '1px solid #bbf7d0'
                          : '1px solid #e2e8f0',
                        borderRadius: '12px',
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                        boxShadow: 'var(--shadow-sm)',
                        boxSizing: 'border-box',
                        width: '100%',
                        overflow: 'hidden',
                      }}
                    >
                      {/* Top Badges & Status Row */}
                      <div className="user-task-badges-row">
                        <div className="user-task-badges-left">
                          <span
                            style={{
                              fontSize: '0.72rem',
                              textTransform: 'uppercase',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '4px',
                              background: typeStyle.bg,
                              color: typeStyle.color,
                              border: `1px solid ${typeStyle.border}`,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {task.taskType}
                          </span>

                          {getPriorityBadge(task.priority)}

                          <span
                            style={{
                              fontSize: '0.72rem',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              background: '#eff6ff',
                              color: '#1d4ed8',
                              border: '1px solid #bfdbfe',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            <Shield size={11} />
                            <span>Assigned by: {task.assignedBy || 'Manager'}</span>
                          </span>
                        </div>

                        <div className="user-task-badges-right">
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
                            <Calendar size={13} />
                            <span>Due: {formattedDate}</span>
                          </span>

                          <span
                            className="user-task-status-badge"
                            style={{
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              padding: '2px 10px',
                              borderRadius: '999px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              whiteSpace: 'nowrap',
                              flexShrink: 0,
                              background:
                                task.status === 'Completed'
                                  ? '#ecfdf5'
                                  : task.status === 'In Progress'
                                  ? '#fffbeb'
                                  : '#f5f3ff',
                              color:
                                task.status === 'Completed'
                                  ? '#047857'
                                  : task.status === 'In Progress'
                                  ? '#b45309'
                                  : '#6d28d9',
                              border: `1px solid ${
                                task.status === 'Completed'
                                  ? '#a7f3d0'
                                  : task.status === 'In Progress'
                                  ? '#fde68a'
                                  : '#ddd6fe'
                              }`,
                            }}
                          >
                            <span
                              style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                background:
                                  task.status === 'Completed'
                                    ? '#059669'
                                    : task.status === 'In Progress'
                                    ? '#d97706'
                                    : '#7c3aed',
                                display: 'inline-block',
                              }}
                            />
                            <span>{task.status}</span>
                          </span>
                        </div>
                      </div>

                      {/* Description */}
                      <p
                        style={{
                          color: 'var(--text-primary)',
                          fontSize: '0.92rem',
                          fontWeight: 600,
                          margin: '2px 0',
                          lineHeight: 1.45,
                          wordBreak: 'break-word',
                          overflowWrap: 'break-word',
                        }}
                      >
                        {task.description}
                      </p>

                      {/* Manager Instructions */}
                      {task.remark && (
                        <div
                          style={{
                            background: '#f8fafc',
                            padding: '8px 12px',
                            borderRadius: '6px',
                            border: '1px solid #e2e8f0',
                            borderLeft: '3px solid #2563eb',
                            fontSize: '0.8rem',
                            color: 'var(--text-secondary)',
                            wordBreak: 'break-word',
                            overflowWrap: 'break-word',
                          }}
                        >
                          <span style={{ fontWeight: 600, color: '#1d4ed8', display: 'block', fontSize: '0.72rem' }}>
                            Manager Instructions (What To Do):
                          </span>
                          {task.remark}
                        </div>
                      )}

                      {/* User Completion Note */}
                      {task.completionRemark && (
                        <div
                          style={{
                            background: '#f0fdf4',
                            padding: '8px 12px',
                            borderRadius: '6px',
                            border: '1px solid #bbf7d0',
                            borderLeft: '3px solid #059669',
                            fontSize: '0.8rem',
                            color: 'var(--text-secondary)',
                            wordBreak: 'break-word',
                            overflowWrap: 'break-word',
                          }}
                        >
                          <span style={{ fontWeight: 600, color: '#047857', display: 'block', fontSize: '0.72rem' }}>
                            Your Completion Note (Sent to Manager):
                          </span>
                          "{task.completionRemark}"
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="user-task-actions-row">
                        {task.status === 'To Do' && (
                          <button
                            className="btn btn-secondary user-task-action-btn"
                            onClick={() => handleStartTask(task)}
                            style={{
                              fontSize: '0.8rem',
                              padding: '7px 12px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              background: '#fffbeb',
                              borderColor: '#fde68a',
                              color: '#b45309',
                            }}
                          >
                            <PlayCircle size={15} />
                            <span>Start Task (In Progress)</span>
                          </button>
                        )}

                        {task.status !== 'Completed' && (
                          <button
                            className="btn btn-primary user-task-action-btn"
                            onClick={() => openCompletionModal(task)}
                            style={{
                              fontSize: '0.8rem',
                              padding: '7px 14px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              background: 'linear-gradient(135deg, #10b981, #059669)',
                              borderColor: '#059669',
                            }}
                          >
                            <CheckCircle2 size={15} />
                            <span>Complete & Add Remark</span>
                          </button>
                        )}

                        {isTaskCompleted && (
                          <span style={{ color: '#059669', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 0' }}>
                            <CheckCircle2 size={15} />
                            <span>Completed & Notified</span>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Task Completion Modal */}
      {isCompletionModalOpen && taskToComplete && (
        <div className="modal-backdrop" style={{ zIndex: 1300 }}>
          <div
            className="modal-content"
            style={{ maxWidth: '520px', width: '100%', animation: 'modalSlideUp 0.25s ease' }}
          >
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    padding: '8px',
                    borderRadius: '8px',
                    background: '#ecfdf5',
                    color: '#059669',
                  }}
                >
                  <CheckCircle2 size={22} />
                </div>
                <div>
                  <h3 className="modal-title" style={{ color: 'var(--text-primary)', margin: 0 }}>Complete Task & Notify Manager</h3>
                </div>
              </div>

              <button
                type="button"
                className="btn-icon"
                onClick={closeCompletionModal}
                disabled={isSubmittingCompletion}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitCompletion}>
              <div className="modal-body">
                {/* Task Preview Card */}
                <div
                  style={{
                    background: '#f8fafc',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    marginBottom: '16px',
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.72rem',
                      textTransform: 'uppercase',
                      color: '#2563eb',
                      fontWeight: 700,
                    }}
                  >
                    {taskToComplete.taskType}
                  </span>
                  <p
                    style={{
                      color: 'var(--text-primary)',
                      fontSize: '0.88rem',
                      fontWeight: 600,
                      margin: '4px 0',
                    }}
                  >
                    {taskToComplete.description}
                  </p>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Assigned by: {taskToComplete.assignedBy || 'Manager'}
                  </span>
                </div>

                {/* Completion Remark Input */}
                <div className="form-group">
                  <label className="form-label" htmlFor="completionRemark">
                    Completion Remark / Note for Manager <span className="required">*</span>
                  </label>
                  <textarea
                    id="completionRemark"
                    className="form-control"
                    rows="4"
                    placeholder="e.g. Work is done, tests are passing, and files have been verified."
                    value={completionRemark}
                    onChange={(e) => setCompletionRemark(e.target.value)}
                    disabled={isSubmittingCompletion}
                    autoFocus
                  />
                  <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                    This message will be dispatched to the Manager's Inbox.
                  </span>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeCompletionModal}
                  disabled={isSubmittingCompletion}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    borderColor: '#059669',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                  disabled={isSubmittingCompletion}
                >
                  {isSubmittingCompletion ? (
                    <span>Submitting...</span>
                  ) : (
                    <>
                      <Send size={16} />
                      <span>Submit & Notify Manager</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Task Inbox Modal */}
      <ManagerInboxModal
        isOpen={isInboxModalOpen}
        onClose={() => setIsInboxModalOpen(false)}
      />
    </div>
  );
};
