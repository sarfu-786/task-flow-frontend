import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  Globe,
  FileText,
  Share2,
  Database,
  Search,
  Users,
  Eye,
  Edit2,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTasks } from '../../context/TaskContext';
import { useUserManagement } from '../../context/UserContext';

// Helper to get all subordinate user IDs for a given user in the organizational hierarchy
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

export const ManagerTasksDrilldownModal = ({
  isOpen,
  onClose,
  initialFilter = 'Completed', // 'Completed' | 'In Progress' | 'To Do' | 'all'
  modalTitle = 'Tasks Overview',
}) => {
  const { user: currentUser, isSuperAdmin, isManager } = useAuth();
  const { tasks, updateStatus, openEditModal, openDeleteModal, openViewModal } = useTasks();
  const { users } = useUserManagement();

  const [statusFilter, setStatusFilter] = useState(initialFilter || 'Completed');
  const [memberFilter, setMemberFilter] = useState('all');
  const [modalSearch, setModalSearch] = useState('');

  useEffect(() => {
    if (isOpen) {
      setStatusFilter(initialFilter || 'Completed');
      setMemberFilter('all');
      setModalSearch('');
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

  if (!isOpen) return null;

  // Active Approved Users
  const activeUsers = users.filter((u) => u && u.status !== 'Rejected' && u.status !== 'Pending');

  // Role-Based Task Scoping:
  // 1. Super Admin: sees all tasks organization-wide.
  // 2. Manager: sees tasks for themselves and their subordinate team.
  // 3. User: sees tasks for themselves (and their direct subordinates if any).
  let scopedTasks = tasks;
  let scopedUsers = activeUsers;

  if (!isSuperAdmin && currentUser) {
    const currentUserId = (currentUser._id || currentUser.id || '').toString();
    const currentUserName = (currentUser.name || '').toLowerCase().trim();
    const currentUserUsername = (currentUser.username || '').toLowerCase().trim();
    const subordinateIds = getSubordinateUserIds(currentUser, activeUsers);

    scopedUsers = activeUsers.filter((u) => {
      const uId = (u._id || u.id || '').toString();
      const repId = (u.reportsTo ? (u.reportsTo._id ? u.reportsTo._id.toString() : u.reportsTo.toString()) : '').trim();
      const repName = (u.reportsToName || '').toLowerCase().trim();
      return uId === currentUserId || subordinateIds.has(uId) || repId === currentUserId || (currentUserName && repName.includes(currentUserName));
    });

    const scopedNames = new Set(scopedUsers.map((u) => (u.name || '').toLowerCase().trim()));
    const scopedUsernames = new Set(scopedUsers.map((u) => (u.username || '').toLowerCase().trim()));
    if (currentUserName) scopedNames.add(currentUserName);
    if (currentUserUsername) scopedUsernames.add(currentUserUsername);

    scopedTasks = tasks.filter((t) => {
      if (!t) return false;
      const assigned = (t.assignedTo || '').toLowerCase().trim();
      const taskUserId = t.user ? (t.user._id ? t.user._id.toString() : t.user.toString()) : '';
      const assignedBy = (t.assignedBy || '').toLowerCase().trim();

      const isSelf = assigned === currentUserName || assigned === currentUserUsername || taskUserId === currentUserId || assigned === 'current user';
      const isSub = scopedNames.has(assigned) || scopedUsernames.has(assigned) || subordinateIds.has(taskUserId);
      const isBySelf = currentUserName && assignedBy.includes(currentUserName);

      return isSelf || isSub || isBySelf;
    });
  }

  // Filter tasks dynamically
  let filtered = [...scopedTasks];

  // Status Filter (Completed, In Progress, To Do)
  if (statusFilter && statusFilter !== 'all') {
    filtered = filtered.filter((t) => t.status === statusFilter);
  }

  // Member Filter
  if (memberFilter !== 'all') {
    filtered = filtered.filter(
      (t) =>
        (t.assignedTo && t.assignedTo.toLowerCase() === memberFilter.toLowerCase()) ||
        (t.user && (t.user.name === memberFilter || t.user === memberFilter))
    );
  }

  // Search Filter
  if (modalSearch.trim() !== '') {
    const q = modalSearch.trim().toLowerCase();
    filtered = filtered.filter(
      (t) =>
        (t.description && t.description.toLowerCase().includes(q)) ||
        (t.remark && t.remark.toLowerCase().includes(q)) ||
        (t.taskType && t.taskType.toLowerCase().includes(q)) ||
        (t.assignedTo && t.assignedTo.toLowerCase().includes(q)) ||
        (t.assignedBy && t.assignedBy.toLowerCase().includes(q))
    );
  }

  const totalCompleted = scopedTasks.filter((t) => t.status === 'Completed').length;
  const totalInProgress = scopedTasks.filter((t) => t.status === 'In Progress').length;
  const totalToDo = scopedTasks.filter((t) => t.status === 'To Do' || !t.status).length;

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
        style={{ maxWidth: '960px', width: '95%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
      >
        {/* Header */}
        <div className="modal-header" style={{ padding: '18px 24px', flexShrink: 0 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h3 className="modal-title" style={{ fontSize: '1.3rem', color: 'var(--text-primary)' }}>
                {modalTitle}
              </h3>
              <span
                style={{
                  fontSize: '0.75rem',
                  padding: '3px 10px',
                  borderRadius: 'var(--radius-full)',
                  background: '#eff6ff',
                  color: '#1d4ed8',
                  fontWeight: 700,
                  border: '1px solid #bfdbfe',
                }}
              >
                {filtered.length} Task{filtered.length === 1 ? '' : 's'}
              </span>
            </div>
          </div>

          <button type="button" className="btn-icon" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ padding: '20px 24px', gap: '16px', flex: '1 1 auto', minHeight: 0, overflowY: 'auto' }}>
          {/* Controls Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
              paddingBottom: '12px',
              borderBottom: '1px solid var(--border-color)',
            }}
          >
            {/* Status Tabs */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className={`btn ${statusFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setStatusFilter('all')}
                style={{ fontSize: '0.8rem', padding: '6px 14px' }}
              >
                All ({scopedTasks.length})
              </button>
              <button
                type="button"
                className={`btn ${statusFilter === 'Completed' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setStatusFilter('Completed')}
                style={{ fontSize: '0.8rem', padding: '6px 14px' }}
              >
                Completed ({totalCompleted})
              </button>
              <button
                type="button"
                className={`btn ${statusFilter === 'In Progress' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setStatusFilter('In Progress')}
                style={{ fontSize: '0.8rem', padding: '6px 14px' }}
              >
                In Progress ({totalInProgress})
              </button>
              <button
                type="button"
                className={`btn ${statusFilter === 'To Do' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setStatusFilter('To Do')}
                style={{ fontSize: '0.8rem', padding: '6px 14px' }}
              >
                To Do ({totalToDo})
              </button>
            </div>

            {/* Filters on Right */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              {/* Search */}
              <div style={{ position: 'relative', width: '200px' }}>
                <Search
                  size={14}
                  style={{
                    position: 'absolute',
                    left: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#94a3b8',
                  }}
                />
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search tasks..."
                  value={modalSearch}
                  onChange={(e) => setModalSearch(e.target.value)}
                  style={{ paddingLeft: '30px', fontSize: '0.8rem', height: '34px' }}
                />
              </div>

              {/* Member Filter Dropdown */}
              {scopedUsers.length > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Users size={14} color="#64748b" />
                  <select
                    className="select-filter"
                    value={memberFilter}
                    onChange={(e) => setMemberFilter(e.target.value)}
                    style={{ fontSize: '0.8rem', height: '34px', padding: '4px 10px' }}
                  >
                    <option value="all">All Members ({scopedUsers.length})</option>
                    {scopedUsers.map((u) => (
                      <option key={u._id} value={u.name}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="table-responsive" style={{ maxHeight: '480px', overflowY: 'auto' }}>
            <table className="task-table">
              <thead>
                <tr>
                  <th style={{ width: '50px', textAlign: 'center' }}>Sr No.</th>
                  <th>Task Details</th>
                  <th>Assigned To</th>
                  <th>Task Type</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                  <th>Due Date</th>
                  <th style={{ width: '110px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                        No tasks found
                      </p>
                      <p style={{ fontSize: '0.85rem' }}>
                        No records match the current filter or search criteria.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((task, idx) => {
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
                      <tr key={task._id}>
                        <td style={{ textAlign: 'center' }}>
                          <span className="sr-no-badge">{idx + 1}</span>
                        </td>

                        {/* Task Details */}
                        <td>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                              {task.description}
                            </div>
                            {task.remark && (
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                Remark: {task.remark}
                              </div>
                            )}
                            {task.completionRemark && (
                              <div style={{ fontSize: '0.75rem', color: '#059669', marginTop: '2px' }}>
                                Completion: {task.completionRemark}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Assigned To */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div
                              style={{
                                width: '26px',
                                height: '26px',
                                borderRadius: '50%',
                                background: '#e0e7ff',
                                color: '#4338ca',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                              }}
                            >
                              {task.assignedTo ? task.assignedTo.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div>
                              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                {task.assignedTo || 'Unassigned'}
                              </div>
                              {task.assignedBy && (
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                  By: {task.assignedBy}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Type */}
                        <td>{getTaskTypeBadge(task.taskType)}</td>

                        {/* Status */}
                        <td style={{ textAlign: 'center' }}>{getStatusBadge(task)}</td>

                        {/* Due Date */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                            <Calendar size={13} />
                            <span>{formattedDate}</span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                            <button
                              type="button"
                              className="btn-icon"
                              onClick={() => {
                                onClose();
                                openViewModal(task);
                              }}
                              title="View Task Details"
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              type="button"
                              className="btn-action-update"
                              onClick={() => {
                                onClose();
                                openEditModal(task);
                              }}
                              title="Edit Task"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              type="button"
                              className="btn-action-delete"
                              onClick={() => {
                                onClose();
                                openDeleteModal(task);
                              }}
                              title="Delete Task"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerTasksDrilldownModal;
