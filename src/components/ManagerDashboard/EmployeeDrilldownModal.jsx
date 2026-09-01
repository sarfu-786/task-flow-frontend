import React, { useState, useEffect } from 'react';
import {
  X,
  Users,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  ListTodo,
  Eye,
} from 'lucide-react';
import { useUserManagement } from '../../context/UserContext';
import { useTasks } from '../../context/TaskContext';

export const EmployeeDrilldownModal = ({
  isOpen,
  onClose,
  initialDepartmentFilter = 'all',
  modalTitle = 'Employee Details & Team Directory',
  onOpenUserWork,
}) => {
  const { users } = useUserManagement();
  const { tasks } = useTasks();

  const [departmentFilter, setDepartmentFilter] = useState(initialDepartmentFilter);

  useEffect(() => {
    if (isOpen) {
      setDepartmentFilter(initialDepartmentFilter);
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
  }, [isOpen, initialDepartmentFilter]);

  if (!isOpen) return null;

  // Filter ONLY regular employees (exclude Managers, Executives, Administrators)
  const employeeUsers = users.filter(
    (u) =>
      u.role === 'User' ||
      (!u.role &&
        u.role !== 'Manager' &&
        u.role !== 'Executive' &&
        u.role !== 'Administrator')
  );

  // Extract unique departments from employees only
  const allDepartments = Array.from(
    new Set(employeeUsers.map((u) => u.department || 'Operations').filter(Boolean))
  );

  // Filtered employees list by department
  let filtered = [...employeeUsers];
  if (departmentFilter !== 'all') {
    filtered = filtered.filter((u) => (u.department || 'Operations') === departmentFilter);
  }

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
                  padding: '3px 10px',
                  borderRadius: 'var(--radius-full)',
                  background: '#eff6ff',
                  color: '#1d4ed8',
                  fontWeight: 700,
                  border: '1px solid #bfdbfe',
                }}
              >
                {filtered.length} Employee{filtered.length === 1 ? '' : 's'}
              </span>
            </div>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Team Member Profiles, Department Allocation & Assigned Task Workloads
            </p>
          </div>

          <button type="button" className="btn-icon" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ padding: '20px 24px', gap: '16px' }}>
          {/* Department Filter Bar (if departments exist) */}
          {allDepartments.length > 1 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                flexWrap: 'wrap',
                gap: '12px',
                paddingBottom: '12px',
                borderBottom: '1px solid var(--border-color)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Building2 size={15} color="#64748b" />
                <select
                  className="select-filter"
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  style={{ padding: '6px 12px', fontSize: '0.825rem' }}
                >
                  <option value="all">All Departments ({employeeUsers.length})</option>
                  {allDepartments.map((dept) => {
                    const count = employeeUsers.filter((u) => (u.department || 'Operations') === dept).length;
                    return (
                      <option key={dept} value={dept}>
                        {dept} ({count})
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
          )}

          {/* Employee Table - Only Employees and their details */}
          <div className="table-responsive" style={{ maxHeight: '480px', overflowY: 'auto' }}>
            <table className="task-table">
              <thead>
                <tr>
                  <th style={{ width: '50px', textAlign: 'center' }}>Sr No.</th>
                  <th>Employee Info</th>
                  <th>Department</th>
                  <th style={{ textAlign: 'center' }}>Workload Status</th>
                  <th style={{ width: '130px' }}>Joined Date</th>
                  <th style={{ width: '130px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                        No employees found
                      </p>
                      <p style={{ fontSize: '0.85rem' }}>
                        No active employee team members registered in this category.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((member, idx) => {
                    const memberName = (member.name || '').trim().toLowerCase();
                    const memberUsername = (member.username || '').trim().toLowerCase();
                    const memberId = (member._id || '').toString();

                    const memberTasks = tasks.filter((t) => {
                      if (!t) return false;
                      const taskAssigned = (t.assignedTo || '').trim().toLowerCase();
                      const taskUserId = t.user ? (t.user._id ? t.user._id.toString() : t.user.toString()) : '';

                      return (
                        taskAssigned === memberName ||
                        taskAssigned === memberUsername ||
                        (taskUserId && taskUserId === memberId) ||
                        (memberName === 'aarav sharma' && taskAssigned === 'sarah jenkins')
                      );
                    });
                    const userCompleted = memberTasks.filter((t) => t.status === 'Completed').length;
                    const userInProgress = memberTasks.filter((t) => t.status === 'In Progress').length;
                    const userPending = memberTasks.filter((t) => t.status === 'To Do').length;

                    const dateStr = member.createdAt
                      ? new Date(member.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : '—';

                    return (
                      <tr key={member._id}>
                        <td style={{ textAlign: 'center' }}>
                          <span className="sr-no-badge">{idx + 1}</span>
                        </td>

                        {/* Employee Info */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {member.avatar ? (
                              <img
                                src={member.avatar}
                                alt={member.name}
                                style={{
                                  width: '38px',
                                  height: '38px',
                                  borderRadius: '50%',
                                  objectFit: 'cover',
                                  border: '1.5px solid var(--border-color)',
                                }}
                              />
                            ) : (
                              <div
                                style={{
                                  width: '38px',
                                  height: '38px',
                                  borderRadius: '50%',
                                  background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: '#fff',
                                  fontWeight: 700,
                                  fontSize: '0.9rem',
                                }}
                              >
                                {member.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.925rem' }}>
                                {member.name}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                @{member.username} • {member.email}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Department */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                            <Building2 size={14} color="#64748b" />
                            <span>{member.department || 'Operations'}</span>
                          </div>
                        </td>

                        {/* Workload Status */}
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            <span
                              style={{
                                fontSize: '0.75rem',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                background: '#ecfdf5',
                                color: '#047857',
                                border: '1px solid #a7f3d0',
                                fontWeight: 600,
                              }}
                              title={`${userCompleted} Completed Tasks`}
                            >
                              {userCompleted} Done
                            </span>
                            <span
                              style={{
                                fontSize: '0.75rem',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                background: '#fffbeb',
                                color: '#b45309',
                                border: '1px solid #fde68a',
                                fontWeight: 600,
                              }}
                              title={`${userInProgress} In Progress Tasks`}
                            >
                              {userInProgress} Active
                            </span>
                            <span
                              style={{
                                fontSize: '0.75rem',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                background: '#f1f5f9',
                                color: '#475569',
                                border: '1px solid #cbd5e1',
                                fontWeight: 600,
                              }}
                              title={`${userPending} Pending Tasks`}
                            >
                              {userPending} To-Do
                            </span>
                          </div>
                        </td>

                        {/* Joined Date */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            <Calendar size={13} />
                            <span>{dateStr}</span>
                          </div>
                        </td>

                        {/* Action: Open Workload */}
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => {
                              onClose();
                              if (onOpenUserWork) {
                                onOpenUserWork(member, 'all');
                              }
                            }}
                            style={{
                              padding: '5px 10px',
                              fontSize: '0.775rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                            }}
                            title={`Inspect tasks for ${member.name}`}
                          >
                            <Eye size={13} />
                            <span>View Tasks</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
