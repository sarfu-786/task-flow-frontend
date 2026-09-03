import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  Clock,
  AlertCircle,
  ListTodo,
  Calendar,
  Globe,
  FileText,
  Share2,
  Database,
  Search,
  Users,
  Filter,
} from 'lucide-react';
import { useTasks } from '../../context/TaskContext';
import { useUserManagement } from '../../context/UserContext';

export const ManagerTasksDrilldownModal = ({
  isOpen,
  onClose,
  initialFilter = 'all', // 'all' | 'Completed' | 'In Progress' | 'To Do'
  modalTitle = 'Tasks Overview',
}) => {
  const { tasks, updateStatus } = useTasks();
  const { users } = useUserManagement();

  const [statusFilter, setStatusFilter] = useState(initialFilter);
  const [memberFilter, setMemberFilter] = useState('all');
  const [modalSearch, setModalSearch] = useState('');

  useEffect(() => {
    if (isOpen) {
      setStatusFilter(initialFilter);
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

  // Filter tasks dynamically
  let filtered = [...tasks];

  // Status Filter
  if (statusFilter !== 'all') {
    filtered = filtered.filter((t) => t.status === statusFilter);
  }

  // Member Filter
  if (memberFilter !== 'all') {
    filtered = filtered.filter(
      (t) =>
        t.assignedTo === memberFilter ||
        (t.user && t.user === memberFilter)
    );
  }

  // Search Filter
  if (modalSearch.trim() !== '') {
    const q = modalSearch.trim().toLowerCase();
    filtered = filtered.filter(
      (t) =>
        t.description.toLowerCase().includes(q) ||
        (t.remark && t.remark.toLowerCase().includes(q)) ||
        t.taskType.toLowerCase().includes(q) ||
        (t.assignedTo && t.assignedTo.toLowerCase().includes(q))
    );
  }

  const totalAll = tasks.length;
  const totalCompleted = tasks.filter((t) => t.status === 'Completed').length;
  const totalInProgress = tasks.filter((t) => t.status === 'In Progress').length;
  const totalToDo = tasks.filter((t) => t.status === 'To Do').length;

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
        style={{ maxWidth: '960px', width: '95%' }}
      >
        {/* Header */}
        <div className="modal-header" style={{ padding: '18px 24px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h3 className="modal-title" style={{ fontSize: '1.3rem', color: 'var(--text-primary)' }}>
                {modalTitle}
              </h3>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  border: '1px solid #bfdbfe',
                }}
              >
                {filtered.length} Records
              </span>
            </div>
          </div>

          <button type="button" className="btn-icon" onClick={onClose} aria-label="Close dialog">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ padding: '20px 24px', gap: '16px' }}>
          {/* Quick 1-Click Status Filter Tabs */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
              paddingBottom: '14px',
              borderBottom: '1px solid var(--border-color)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className={`btn ${statusFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setStatusFilter('all')}
                style={{ padding: '6px 14px', fontSize: '0.825rem' }}
              >
                <ListTodo size={15} />
                <span>All Tasks ({totalAll})</span>
              </button>

              <button
                type="button"
                className={`btn ${statusFilter === 'Completed' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setStatusFilter('Completed')}
                style={{
                  padding: '6px 14px',
                  fontSize: '0.825rem',
                  borderColor: statusFilter === 'Completed' ? 'transparent' : '#a7f3d0',
                  color: statusFilter === 'Completed' ? '#fff' : '#047857',
                }}
              >
                <CheckCircle2 size={15} />
                <span>Completed ({totalCompleted})</span>
              </button>

              <button
                type="button"
                className={`btn ${statusFilter === 'In Progress' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setStatusFilter('In Progress')}
                style={{
                  padding: '6px 14px',
                  fontSize: '0.825rem',
                  borderColor: statusFilter === 'In Progress' ? 'transparent' : '#fde68a',
                  color: statusFilter === 'In Progress' ? '#fff' : '#b45309',
                }}
              >
                <Clock size={15} />
                <span>In Progress ({totalInProgress})</span>
              </button>

              <button
                type="button"
                className={`btn ${statusFilter === 'To Do' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setStatusFilter('To Do')}
                style={{
                  padding: '6px 14px',
                  fontSize: '0.825rem',
                  borderColor: statusFilter === 'To Do' ? 'transparent' : '#cbd5e1',
                  color: statusFilter === 'To Do' ? '#fff' : '#475569',
                }}
              >
                <AlertCircle size={15} />
                <span>To Do ({totalToDo})</span>
              </button>
            </div>

            {/* Filter by Member Select */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={15} color="#64748b" />
              <select
                className="select-filter"
                value={memberFilter}
                onChange={(e) => setMemberFilter(e.target.value)}
                style={{ padding: '6px 12px', fontSize: '0.825rem' }}
              >
                <option value="all">All Team Members</option>
                {users.map((u) => (
                  <option key={u._id} value={u.name}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Search bar inside modal */}
          <div className="search-wrapper-top" style={{ position: 'relative' }}>
            <Search className="search-icon-inside" />
            <input
              type="text"
              className="search-input-top"
              placeholder="Filter tasks by keyword, description, remark, or assignee..."
              value={modalSearch}
              onChange={(e) => setModalSearch(e.target.value)}
              style={{ padding: '9px 14px 9px 40px', fontSize: '0.875rem' }}
            />
          </div>

          {/* Table */}
          <div className="table-responsive" style={{ maxHeight: '440px', overflowY: 'auto' }}>
            <table className="task-table">
              <thead>
                <tr>
                  <th style={{ width: '50px', textAlign: 'center' }}>Sr No.</th>
                  <th style={{ width: '160px' }}>Assigned Member</th>
                  <th style={{ width: '130px' }}>Type of Work</th>
                  <th>Task Description</th>
                  <th style={{ width: '120px' }}>Due Date</th>
                  <th style={{ width: '120px' }}>Status</th>
                  <th>Remark</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                        No matching tasks found
                      </p>
                      <p style={{ fontSize: '0.85rem' }}>
                        Try switching the status filter or clearing your search input.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((task, idx) => {
                    const assignedUserObj = users.find(
                      (u) => u.name === task.assignedTo || u.username === task.assignedTo
                    );

                    return (
                      <tr key={task._id}>
                        <td style={{ textAlign: 'center' }}>
                          <span className="sr-no-badge">{idx + 1}</span>
                        </td>

                        {/* Assigned Member with Avatar */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {assignedUserObj?.avatar ? (
                              <img
                                src={assignedUserObj.avatar}
                                alt={task.assignedTo}
                                style={{
                                  width: '28px',
                                  height: '28px',
                                  borderRadius: '50%',
                                  objectFit: 'cover',
                                  border: '1px solid var(--border-color)',
                                }}
                              />
                            ) : (
                              <div
                                style={{
                                  width: '28px',
                                  height: '28px',
                                  borderRadius: '50%',
                                  background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: '#fff',
                                  fontWeight: 700,
                                  fontSize: '0.75rem',
                                }}
                              >
                                {(task.assignedTo || 'U').charAt(0)}
                              </div>
                            )}
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                              {task.assignedTo || 'Unassigned'}
                            </span>
                          </div>
                        </td>

                        {/* Type of Work */}
                        <td>{getTaskTypeBadge(task.taskType)}</td>

                        {/* Description */}
                        <td>
                          <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                            {task.description}
                          </span>
                        </td>

                        {/* Due Date */}
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

                        {/* Status */}
                        <td>{getStatusBadge(task)}</td>

                        {/* Remark */}
                        <td>
                          <span style={{ color: task.remark ? 'var(--text-secondary)' : 'var(--text-muted)', fontSize: '0.85rem' }}>
                            {task.remark || '—'}
                          </span>
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
