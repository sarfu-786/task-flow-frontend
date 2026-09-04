import React, { useState, useEffect } from 'react';
import { useTasks } from '../../context/TaskContext';
import { useUserManagement } from '../../context/UserContext';
import { useAuth } from '../../context/AuthContext';
import { X, Save, PlusCircle, AlertCircle, UserCheck } from 'lucide-react';

export const TaskModal = () => {
  const { isTaskModalOpen, modalMode, selectedTask, closeTaskModal, createTask, updateTask } = useTasks();
  const { users } = useUserManagement();
  const { user: currentUser } = useAuth();

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
      setAssignedTo(selectedTask.assignedTo || (currentUser ? currentUser.name : ''));
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
      setAssignedTo(currentUser ? currentUser.name : (users[0]?.name || ''));
    }
    setErrors({});
    setServerError('');
  }, [modalMode, selectedTask, isTaskModalOpen, currentUser, users]);

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
    if (!assignedTo.trim()) errs.assignedTo = 'Please assign this task to a team member';
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
          <h3 className="modal-title">
            {modalMode === 'edit' ? 'Update Task Details' : 'Create New Task'}
          </h3>
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
              <div className="alert alert-danger">
                <AlertCircle size={18} />
                <span>{serverError}</span>
              </div>
            )}

            {/* Assign To Member Dropdown (Manager / Authority) */}
            <div className="form-group">
              <label className="form-label" htmlFor="assignedTo">
                Assign To Team Member <span className="required">*</span>
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
                <option value="">Select Assignee</option>
                {users
                  .filter((u) => u.status !== 'Rejected' && u.status !== 'Pending')
                  .map((u) => (
                    <option key={u._id} value={u.name}>
                      {u.name} ({u.role} — {u.department || 'Operations'})
                    </option>
                  ))}
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
                placeholder="Add any extra notes or reference links..."
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
                  <span>Create Task</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
