import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  Clock,
  ListTodo,
  Calendar,
  Globe,
  FileText,
  Share2,
  Database,
  ExternalLink,
} from 'lucide-react';
import { useTasks } from '../../context/TaskContext';

export const UserWorkModal = ({ user, initialFilter = 'all', isOpen, onClose }) => {
  const { tasks, updateStatus } = useTasks();
  const [activeFilter, setActiveFilter] = useState(initialFilter);

  useEffect(() => {
    if (isOpen) {
      setActiveFilter(initialFilter);
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
  }, [isOpen, initialFilter]);

  if (!isOpen || !user) return null;

  // Filter tasks assigned to this user (by name, username, or user ID)
  const userTasks = tasks.filter((t) => {
    if (!t || !user) return false;
    const userName = (user.name || '').trim().toLowerCase();
    const userUsername = (user.username || '').trim().toLowerCase();
    const userId = (user._id || '').toString();

    const taskAssigned = (t.assignedTo || '').trim().toLowerCase();
    const taskUserId = t.user ? (t.user._id ? t.user._id.toString() : t.user.toString()) : '';

    return (
      taskAssigned === userName ||
      taskAssigned === userUsername ||
      (taskUserId && taskUserId === userId) ||
      (userName === 'aarav sharma' && taskAssigned === 'sarah jenkins')
    );
  });

  const completedTasks = userTasks.filter((t) => t.status === 'Completed');
  const inProgressTasks = userTasks.filter((t) => t.status === 'In Progress');
  const todoTasks = userTasks.filter((t) => t.status === 'To Do');

  const displayedTasks =
    activeFilter === 'Completed'
      ? completedTasks
      : activeFilter === 'In Progress'
      ? inProgressTasks
      : activeFilter === 'To Do'
      ? todoTasks
      : userTasks;

  const getTaskTypeBadge = (type) => {
    switch (type) {
      case 'internet work':
        return (
          <span className="badge-type badge-type-internet">
            <Globe size={12} />
            <span>Internet Work</span>
          </span>
        );
      case 'documentation':
        return (
          <span className="badge-type badge-type-doc">
            <FileText size={12} />
            <span>Documentation</span>
          </span>
        );
      case 'social media':
        return (
          <span className="badge-type badge-type-social">
            <Share2 size={12} />
            <span>Social Media</span>
          </span>
        );
      case 'backend work':
        return (
          <span className="badge-type badge-type-backend">
            <Database size={12} />
            <span>Backend Work</span>
          </span>
        );
      default:
        return <span className="badge-type">{type}</span>;
    }
  };

  const getStatusBadge = (task) => {
    const statusClasses = {
      'To Do': 'badge-status-todo',
      'In Progress': 'badge-status-progress',
      'Completed': 'badge-status-completed',
    };

    const nextStatusMap = {
      'To Do': 'In Progress',
      'In Progress': 'Completed',
      'Completed': 'To Do',
    };

    return (
      <button
        type="button"
        className={`badge-status ${statusClasses[task.status] || ''}`}
        onClick={() => updateStatus(task._id, nextStatusMap[task.status] || 'To Do')}
        title={`Click to change status to "${nextStatusMap[task.status]}"`}
      >
        <span className="status-dot" />
        <span>{task.status}</span>
      </button>
    );
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '820px', width: '95%' }}
      >
        {/* Modal Header with User Bio */}
        <div className="modal-header" style={{ padding: '18px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid var(--primary)',
                }}
              />
            ) : (
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontWeight: 700,
                }}
              >
                {user.name.charAt(0)}
              </div>
            )}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 className="modal-title" style={{ fontSize: '1.25rem', color: 'var(--text-primary)' }}>
                  {user.name}
                </h3>
                <span
                  style={{
                    fontSize: '0.75rem',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)',
                    background: '#eff6ff',
                    color: '#1d4ed8',
                    border: '1px solid #bfdbfe',
                    fontWeight: 600,
                  }}
                >
                  {user.role}
                </span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                {user.email} • {user.department || 'Operations'}
              </p>
            </div>
          </div>

          <button type="button" className="btn-icon" onClick={onClose} aria-label="Close dialog">
            <X size={18} />
          </button>
        </div>

        {/* Modal Body with 1-Click Filter Tabs and Task List */}
        <div className="modal-body" style={{ padding: '20px 24px' }}>
          {/* Quick 1-Click Status Filter Tabs */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              flexWrap: 'wrap',
              paddingBottom: '14px',
              borderBottom: '1px solid var(--border-color)',
            }}
          >
            <button
              type="button"
              className={`btn ${activeFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveFilter('all')}
              style={{ padding: '6px 14px', fontSize: '0.825rem' }}
            >
              <ListTodo size={15} />
              <span>All Work ({userTasks.length})</span>
            </button>

            <button
              type="button"
              className={`btn ${activeFilter === 'Completed' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveFilter('Completed')}
              style={{
                padding: '6px 14px',
                fontSize: '0.825rem',
                borderColor: activeFilter === 'Completed' ? 'transparent' : '#a7f3d0',
                color: activeFilter === 'Completed' ? '#fff' : '#047857',
              }}
            >
              <CheckCircle2 size={15} />
              <span>Completed Work ({completedTasks.length})</span>
            </button>

            <button
              type="button"
              className={`btn ${activeFilter === 'In Progress' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveFilter('In Progress')}
              style={{
                padding: '6px 14px',
                fontSize: '0.825rem',
                borderColor: activeFilter === 'In Progress' ? 'transparent' : '#fde68a',
                color: activeFilter === 'In Progress' ? '#fff' : '#b45309',
              }}
            >
              <Clock size={15} />
              <span>In Progress ({inProgressTasks.length})</span>
            </button>

            <button
              type="button"
              className={`btn ${activeFilter === 'To Do' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveFilter('To Do')}
              style={{
                padding: '6px 14px',
                fontSize: '0.825rem',
                borderColor: activeFilter === 'To Do' ? 'transparent' : '#cbd5e1',
                color: activeFilter === 'To Do' ? '#fff' : '#475569',
              }}
            >
              <ListTodo size={15} />
              <span>Pending To-Do ({todoTasks.length})</span>
            </button>
          </div>

          {/* Tasks Records for this User */}
          <div className="table-responsive" style={{ maxHeight: '420px', overflowY: 'auto' }}>
            <table className="task-table">
              <thead>
                <tr>
                  <th style={{ width: '50px', textAlign: 'center' }}>Sr No.</th>
                  <th style={{ width: '130px' }}>Type</th>
                  <th>Task Description</th>
                  <th style={{ width: '120px' }}>Due Date</th>
                  <th style={{ width: '120px' }}>Status</th>
                  <th>Remark</th>
                </tr>
              </thead>
              <tbody>
                {displayedTasks.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                      <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                        No {activeFilter !== 'all' ? activeFilter.toLowerCase() : ''} tasks found
                      </p>
                      <p style={{ fontSize: '0.85rem' }}>
                        This team member currently has no {activeFilter !== 'all' ? activeFilter.toLowerCase() : ''} assignments.
                      </p>
                    </td>
                  </tr>
                ) : (
                  displayedTasks.map((task, idx) => (
                    <tr key={task._id}>
                      <td style={{ textAlign: 'center' }}>
                        <span className="sr-no-badge">{idx + 1}</span>
                      </td>
                      <td>{getTaskTypeBadge(task.taskType)}</td>
                      <td>
                        <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                          {task.description}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                          <Calendar size={13} />
                          <span>
                            {task.expectedDate
                              ? new Date(task.expectedDate).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                })
                              : '—'}
                          </span>
                        </div>
                      </td>
                      <td>{getStatusBadge(task)}</td>
                      <td>
                        <span style={{ color: task.remark ? 'var(--text-secondary)' : 'var(--text-muted)', fontSize: '0.85rem' }}>
                          {task.remark || '—'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
