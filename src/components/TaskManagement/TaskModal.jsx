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

  // Hierarchy filter:
  // 1. Super Admin: can assign to everybody in the organization including themselves
  // 2. Manager: can assign to ALL users who are under them in hierarchy AND themselves
  // 3. User: can assign to ALL users who are under them in hierarchy AND themselves
  const subordinateIds = getSubordinateUserIds(currentUser, activeUsers);

  let assignableUsers = [];
  if (isSuperAdmin) {
    assignableUsers = activeUsers;
  } else {
    assignableUsers = activeUsers.filter((u) => {
      const uId = (u._id || u.id || '').toString();
      const isSelf = (currentUserId && uId === currentUserId) || 
                     (currentUser?.email && u.email && u.email.toLowerCase() === currentUser.email.toLowerCase()) ||
                     (currentUserName && (u.name || '').toLowerCase().trim() === currentUserName);
      return isSelf || subordinateIds.has(uId);
    });
  }

  // Ensure current user is present in assignable list if activeUsers hasn't populated them
  if (currentUser && !assignableUsers.some(u => (u._id || u.id || '').toString() === currentUserId || (u.email && u.email === currentUser.email))) {
    assignableUsers = [currentUser, ...assignableUsers];
  }

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

      // Set initial assignee to prefilled task assignee or first junior in the list
      const prefill = selectedTask?.assignedTo || '';
      setAssignedTo(prefill || (assignableUsers[0]?.name || ''));
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
      errs.assignedTo = isSuperAdmin
        ? 'Please select a user to assign this task'
        : 'Please select a junior team member who reports to you to assign this task';
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
      assignedBy: currentUser ? `${currentUser.name} (${currentUser.role || 'User'})` : 'Manager',
    };

    let result;
    if (modalMode === 'edit' && selectedTask && selectedTask._id) {
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
              {isSuperAdmin ? (
                <Crown size={18} color="#b45309" />
              ) : isManager ? (
                <ShieldCheck size={18} color="#2563eb" />
              ) : (
                <Users size={18} color="#059669" />
              )}
              <span>
                {modalMode === 'edit'
                  ? 'Update Task Details'
                  : 'Assign Task'}
              </span>
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Assign tasks to yourself or to any team member below you in the hierarchy
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
                background: isSuperAdmin ? '#fffbeb' : isManager ? '#f0f9ff' : '#ecfdf5',
                border: `1px solid ${isSuperAdmin ? '#fde68a' : isManager ? '#bae6fd' : '#a7f3d0'}`,
                borderRadius: '8px',
                padding: '10px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.78rem',
                color: isSuperAdmin ? '#92400e' : isManager ? '#0369a1' : '#065f46',
                marginBottom: '12px',
              }}
            >
              <Info size={16} style={{ flexShrink: 0 }} />
              <span>
                {isSuperAdmin
                  ? 'Hierarchy Rule: As Super Admin, you can assign tasks to yourself or anyone across the organization.'
                  : 'Hierarchy Rule: You can assign tasks to yourself or any team member reporting below you.'}
              </span>
            </div>

            {/* Assign To Member Dropdown (Role-Enforced) */}
            <div className="form-group">
              <label className="form-label" htmlFor="assignedTo">
                Assignee <span className="required">*</span>
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
                <option value="">— Select Assignee —</option>
                {assignableUsers.map((u) => {
                  const uId = (u._id || u.id || '').toString();
                  const isSelf = (currentUserId && uId === currentUserId) || 
                                 (currentUser?.email && u.email && u.email.toLowerCase() === currentUser.email.toLowerCase()) ||
                                 (currentUserName && (u.name || '').toLowerCase().trim() === currentUserName);
                  const selfBadge = isSelf ? ' (You)' : '';
                  const reportsInfo = !isSelf && u.reportsToName ? ` • Reports to: ${u.reportsToName}` : '';
                  return (
                    <option key={u._id || u.name} value={u.name}>
                      {u.name}{selfBadge} ({u.role || 'User'} • {u.department || 'Operations'}{reportsInfo})
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
                <option value="sells">(v) Sells</option>
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
                  <span>Assign Task</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
