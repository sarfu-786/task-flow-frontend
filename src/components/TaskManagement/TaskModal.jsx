import React, { useState, useEffect } from 'react';
import { useTasks } from '../../context/TaskContext';
import { useUserManagement } from '../../context/UserContext';
import { useAuth } from '../../context/AuthContext';
import {
  X,
  Save,
  PlusCircle,
  AlertCircle,
  UserCheck,
  Crown,
  ShieldCheck,
  Info,
  Users,
  AlertTriangle,
  Filter,
} from 'lucide-react';

export const TaskModal = () => {
  const { isTaskModalOpen, modalMode, selectedTask, closeTaskModal, createTask, updateTask } = useTasks();
  const { users } = useUserManagement();
  const { user: currentUser } = useAuth();

  const isSuperAdmin = currentUser && currentUser.role === 'Super Admin';
  const isManager = currentUser && ['Manager', 'Executive', 'Administrator'].includes(currentUser.role);
  const currentUserId = (currentUser?._id || currentUser?.id || '').toString();
  const currentUserName = (currentUser?.name || '').toLowerCase().trim();

  // Active Approved Users
  const activeUsers = (users || []).filter((u) => u.status !== 'Rejected' && u.status !== 'Pending');

  // Filter for Super Admin to optionally filter users by reporting manager
  const [reportingManagerFilter, setReportingManagerFilter] = useState('all');

  // Hierarchy filter:
  // 1. Super Admin: can assign to everybody in the organization EXCEPT himself
  // 2. Manager: can ONLY assign to junior team members reporting to them (NOT seniors like Super Admin, NOT himself)
  // 3. User: cannot assign tasks to others
  let assignableUsers = [];
  if (isSuperAdmin) {
    assignableUsers = activeUsers.filter((u) => {
      const uId = (u._id || u.id || '').toString();
      return uId !== currentUserId;
    });
  } else if (isManager) {
    assignableUsers = activeUsers.filter((u) => {
      const uId = (u._id || u.id || '').toString();
      if (uId === currentUserId) return false; // not himself
      if (u.role === 'Super Admin') return false; // not senior
      const repId = u.reportsTo ? (u.reportsTo._id || u.reportsTo).toString() : '';
      const repName = (u.reportsToName || '').toLowerCase().trim();
      return (repId && repId === currentUserId) || (repName && (repName.includes(currentUserName) || currentUserName.includes(repName)));
    });
  } else {
    assignableUsers = [];
  }

  // List of distinct reporting managers for Super Admin filter
  const managerList = activeUsers.filter(
    (u) => u.role === 'Manager' || u.role === 'Executive' || u.role === 'Administrator' || u.role === 'Super Admin'
  );

  // Filtered assignees for Super Admin based on reportingManagerFilter
  const displayedAssignableUsers = isSuperAdmin && reportingManagerFilter !== 'all'
    ? assignableUsers.filter((u) => {
        const repId = u.reportsTo ? (u.reportsTo._id || u.reportsTo).toString() : '';
        const repName = (u.reportsToName || '').toLowerCase().trim();
        const targetMgr = managerList.find((m) => (m._id || m.id || '').toString() === reportingManagerFilter);
        const targetMgrName = (targetMgr?.name || '').toLowerCase().trim();
        return (repId && repId === reportingManagerFilter) || (repName && targetMgrName && repName.includes(targetMgrName));
      })
    : assignableUsers;

  const [taskType, setTaskType] = useState('internet work');
  const [description, setDescription] = useState('');
  const [expectedDate, setExpectedDate] = useState('');
  const [remark, setRemark] = useState('');
  const [status, setStatus] = useState('To Do');
  const [assignedTo, setAssignedTo] = useState('');

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  useEffect(() => {
    if (modalMode === 'edit' && selectedTask) {
      setTaskType(selectedTask.taskType || 'internet work');
      setDescription(selectedTask.description || '');

      // Format date for HTML date input (YYYY-MM-DD)
      if (selectedTask.expectedDate) {
        const d = new Date(selectedTask.expectedDate);
        const formatted = d.toISOString().split('T')[0];
        setExpectedDate(formatted);
      } else {
        setExpectedDate('');
      }

      setRemark(selectedTask.remark || '');
      setStatus(selectedTask.status || 'To Do');
      setAssignedTo(selectedTask.assignedTo || (assignableUsers[0]?.name || ''));
    } else {
      // Default initial state for Create mode
      setTaskType('internet work');
      setDescription('');
      // Default to 7 days from now
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 7);
      setExpectedDate(defaultDate.toISOString().split('T')[0]);
      setRemark('');
      setStatus('To Do');
      setReportingManagerFilter('all');

      // Set initial assignee to first junior in the list
      setAssignedTo(assignableUsers[0]?.name || '');
    }
    setErrors({});
    setServerError('');
  }, [modalMode, selectedTask, isTaskModalOpen, currentUser]);

  // Prevent background scrolling when modal is active
  useEffect(() => {
    if (isTaskModalOpen) {
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
  }, [isTaskModalOpen]);

  if (!isTaskModalOpen) return null;

  const validate = () => {
    const errs = {};
    if (!taskType) errs.taskType = 'Task type is required';
    if (!description.trim()) errs.description = 'Task description is required';
    if (!expectedDate) errs.expectedDate = 'Expected completion date is required';
    if (!assignedTo.trim()) {
      errs.assignedTo = isSuperAdmin ? 'Please select a user to assign this task' : 'Please select a junior team member to assign this task';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    if (!validate()) return;

    setIsSubmitting(true);
    const selectedUserObj = users.find(
      (u) => u.name === assignedTo.trim() || u._id === assignedTo.trim() || u.username === assignedTo.trim()
    );

    const taskPayload = {
      taskType,
      description: description.trim(),
      expectedDate,
      remark: remark.trim(),
      status,
      assignedTo: assignedTo.trim(),
      userId: selectedUserObj?._id || undefined,
      assignedBy: currentUser ? `${currentUser.name} (${currentUser.role || 'Manager'})` : 'Manager',
    };

    let result;
    if (modalMode === 'edit' && selectedTask) {
      result = await updateTask(selectedTask._id, taskPayload);
    } else {
      result = await createTask(taskPayload);
    }

    setIsSubmitting(false);

    if (!result.success) {
      setServerError(result.message || 'An error occurred while saving task.');
    }
  };

  return (
    <div className="modal-backdrop" onClick={closeTaskModal}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px' }}>
        <div className="modal-header">
          <div>
            <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {isSuperAdmin ? <Crown size={18} color="#b45309" /> : <ShieldCheck size={18} color="#2563eb" />}
              <span>
                {modalMode === 'edit'
                  ? 'Update Task Details'
                  : isSuperAdmin
                  ? 'Assign Task to User'
                  : 'Assign Task to Junior User'}
              </span>
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {isSuperAdmin
                ? 'Super Admin can assign tasks to all users across the organization'
                : 'Managers assign tasks to junior team members reporting directly under them'}
            </p>
          </div>
          <button
            type="button"
            className="btn-icon"
            onClick={closeTaskModal}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {serverError && (
              <div className="alert alert-danger" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={18} />
                <span>{serverError}</span>
              </div>
            )}

            {/* Hierarchy Notice Banner */}
            <div
              style={{
                background: isSuperAdmin ? '#fffbeb' : '#f0f9ff',
                border: `1px solid ${isSuperAdmin ? '#fde68a' : '#bae6fd'}`,
                borderRadius: '8px',
                padding: '10px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.78rem',
                color: isSuperAdmin ? '#92400e' : '#0369a1',
                marginBottom: '12px',
              }}
            >
              <Info size={16} style={{ flexShrink: 0 }} />
              <span>
                {isSuperAdmin
                  ? 'Hierarchy Rule: As Super Admin, you can assign tasks to all managers and team users across the organization.'
                  : 'Hierarchy Rule: As a Manager, you assign tasks to junior team members reporting directly under your team.'}
              </span>
            </div>

            {/* Warning if Manager has no juniors yet */}
            {isManager && assignableUsers.length === 0 && (
              <div
                style={{
                  background: '#fef3c7',
                  border: '1px solid #fde68a',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.78rem',
                  color: '#92400e',
                  marginBottom: '12px',
                }}
              >
                <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                <span>
                  No junior team members currently report to you. Tasks can only be assigned to your junior subordinates.
                </span>
              </div>
            )}

            {/* Super Admin Reporting Line Filter */}
            {isSuperAdmin && managerList.length > 0 && (
              <div className="form-group" style={{ marginBottom: '10px' }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem' }}>
                  <Filter size={13} color="var(--text-muted)" />
                  <span>Filter by Reporting Manager (Optional):</span>
                </label>
                <select
                  className="form-control select-filter"
                  value={reportingManagerFilter}
                  onChange={(e) => {
                    setReportingManagerFilter(e.target.value);
                  }}
                  style={{ fontSize: '0.82rem', padding: '6px 10px' }}
                >
                  <option value="all">All Users ({assignableUsers.length} total across organization)</option>
                  {managerList.map((m) => {
                    const mId = (m._id || m.id || '').toString();
                    const directCount = assignableUsers.filter((u) => {
                      const repId = u.reportsTo ? (u.reportsTo._id || u.reportsTo).toString() : '';
                      const repName = (u.reportsToName || '').toLowerCase().trim();
                      const mName = (m.name || '').toLowerCase().trim();
                      return repId === mId || (repName && mName && repName.includes(mName));
                    }).length;
                    return (
                      <option key={mId} value={mId}>
                        Team under: {m.name} ({m.role || 'Manager'}) — {directCount} users
                      </option>
                    );
                  })}
                </select>
              </div>
            )}

            {/* Assign To Member Dropdown (Role-Enforced) */}
            <div className="form-group">
              <label className="form-label" htmlFor="assignedTo">
                {isSuperAdmin ? 'Assign To User' : isManager ? 'Assign To Junior Team Member' : 'Assignee'}{' '}
                <span className="required">*</span>
              </label>
              <select
                id="assignedTo"
                className="form-control select-filter"
                value={assignedTo}
                onChange={(e) => {
                  setAssignedTo(e.target.value);
                  if (errors.assignedTo) setErrors((prev) => ({ ...prev, assignedTo: '' }));
                }}
              >
                <option value="">
                  {isSuperAdmin ? '— Select User —' : isManager ? '— Select Junior User —' : '— Select Assignee —'}
                </option>
                {displayedAssignableUsers.map((u) => {
                  const reportsInfo = u.reportsToName ? ` • Reports to: ${u.reportsToName}` : '';
                  return (
                    <option key={u._id || u.name} value={u.name}>
                      {u.name} ({u.role || 'User'} • {u.department || 'Operations'}{reportsInfo})
                    </option>
                  );
                })}
              </select>
              {errors.assignedTo && <span className="form-error-msg">{errors.assignedTo}</span>}
            </div>

            {/* Task Type Dropdown */}
            <div className="form-group">
              <label className="form-label" htmlFor="taskType">
                Task Type <span className="required">*</span>
              </label>
              <select
                id="taskType"
                className="form-control select-filter"
                value={taskType}
                onChange={(e) => {
                  setTaskType(e.target.value);
                  if (errors.taskType) setErrors((prev) => ({ ...prev, taskType: '' }));
                }}
              >
                <option value="internet work">(i) Internet Work</option>
                <option value="documentation">(ii) Documentation</option>
                <option value="social media">(iii) Social Media</option>
                <option value="backend work">(iv) Backend Work</option>
              </select>
              {errors.taskType && <span className="form-error-msg">{errors.taskType}</span>}
            </div>

            {/* Description */}
            <div className="form-group">
              <label className="form-label" htmlFor="description">
                Task Description <span className="required">*</span>
              </label>
              <textarea
                id="description"
                className="form-control"
                placeholder="Describe what work needs to be completed..."
                rows="3"
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (errors.description) setErrors((prev) => ({ ...prev, description: '' }));
                }}
              />
              {errors.description && <span className="form-error-msg">{errors.description}</span>}
            </div>

            {/* Row: Expected Date & Status */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              {/* Expected Completion Date */}
              <div className="form-group">
                <label className="form-label" htmlFor="expectedDate">
                  Expected Completion Date <span className="required">*</span>
                </label>
                <input
                  id="expectedDate"
                  type="date"
                  className="form-control"
                  value={expectedDate}
                  onChange={(e) => {
                    setExpectedDate(e.target.value);
                    if (errors.expectedDate) setErrors((prev) => ({ ...prev, expectedDate: '' }));
                  }}
                />
                {errors.expectedDate && <span className="form-error-msg">{errors.expectedDate}</span>}
              </div>

              {/* Status */}
              <div className="form-group">
                <label className="form-label" htmlFor="status">
                  Task Status
                </label>
                <select
                  id="status"
                  className="form-control select-filter"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="To Do">To Do</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>

            {/* Remark */}
            <div className="form-group">
              <label className="form-label" htmlFor="remark">
                Remark / Additional Notes
              </label>
              <textarea
                id="remark"
                className="form-control"
                placeholder="Add any extra notes, instructions, or reference links..."
                rows="2"
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={closeTaskModal}
              disabled={isSubmitting}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span>Saving...</span>
              ) : modalMode === 'edit' ? (
                <>
                  <Save size={16} />
                  <span>Update Task</span>
                </>
              ) : (
                <>
                  <PlusCircle size={16} />
                  <span>{isSuperAdmin ? 'Assign Task to User' : 'Assign Task to Junior'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
