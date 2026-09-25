import React, { useState, useEffect } from 'react';
import { useTasks } from '../../context/TaskContext';
import { AlertTriangle, Trash2, X, ListTodo } from 'lucide-react';

export const DeleteConfirmModal = () => {
  const { isDeleteModalOpen, taskToDelete, closeDeleteModal, deleteTask } = useTasks();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isDeleteModalOpen) {
      setError('');
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
  }, [isDeleteModalOpen]);

  if (!isDeleteModalOpen || !taskToDelete) return null;

  const handleConfirmDelete = async () => {
    try {
      setIsDeleting(true);
      setError('');
      const res = await deleteTask(taskToDelete._id);
      if (res && res.success === false) {
        setError(res.message || 'Failed to delete task');
      }
    } catch (err) {
      setError(err.message || 'Failed to delete task');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.7)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '16px',
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={closeDeleteModal}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '480px',
          boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.35)',
          border: '1px solid #fee2e2',
          overflow: 'hidden',
          animation: 'slideUp 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #fee2e2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(to right, #fff5f5, #ffffff)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                backgroundColor: '#fef2f2',
                color: '#dc2626',
                border: '1.5px solid #fecaca',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(220, 38, 38, 0.15)',
                flexShrink: 0,
              }}
            >
              <Trash2 size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.18rem', fontWeight: 800, color: '#991b1b', margin: 0 }}>
                Delete Task
              </h2>
              <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '2px 0 0 0' }}>
                Permanently remove task assignment
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeDeleteModal}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              border: 'none',
              backgroundColor: '#f1f5f9',
              color: '#64748b',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#fee2e2';
              e.currentTarget.style.color = '#dc2626';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#f1f5f9';
              e.currentTarget.style.color = '#64748b';
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {error && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: '10px',
                backgroundColor: '#fef2f2',
                border: '1px solid #fee2e2',
                color: '#dc2626',
                fontSize: '0.84rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <AlertTriangle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Task Summary Card */}
          <div
            style={{
              padding: '14px 16px',
              backgroundColor: '#f8fafc',
              borderRadius: '14px',
              border: '1px solid #e2e8f0',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
              <span
                style={{
                  display: 'inline-block',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  backgroundColor: '#eff6ff',
                  color: '#2563eb',
                  border: '1px solid #bfdbfe',
                  fontWeight: 700,
                  fontSize: '0.74rem',
                  textTransform: 'capitalize',
                }}
              >
                {taskToDelete.taskType || 'Task'}
              </span>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: '#475569',
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  padding: '2px 8px',
                  borderRadius: '999px',
                }}
              >
                {taskToDelete.status || 'To Do'}
              </span>
            </div>

            <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f172a' }}>
              {taskToDelete.description}
            </div>

            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Assigned to: <strong style={{ color: '#334155' }}>{taskToDelete.assignedTo || 'Unassigned'}</strong>
            </div>
          </div>

          <p style={{ margin: 0, fontSize: '0.86rem', color: '#475569', lineHeight: 1.5 }}>
            Are you sure you want to delete this task?
            This action <strong style={{ color: '#dc2626' }}>cannot be undone</strong> and will permanently remove this task from workflows and statistics.
          </p>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid #f1f5f9',
            backgroundColor: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '10px',
          }}
        >
          <button
            type="button"
            onClick={closeDeleteModal}
            disabled={isDeleting}
            style={{
              padding: '9px 18px',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              color: '#475569',
              fontWeight: 600,
              fontSize: '0.86rem',
              cursor: isDeleting ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              if (!isDeleting) {
                e.currentTarget.style.borderColor = '#94a3b8';
                e.currentTarget.style.backgroundColor = '#f1f5f9';
              }
            }}
            onMouseLeave={(e) => {
              if (!isDeleting) {
                e.currentTarget.style.borderColor = '#cbd5e1';
                e.currentTarget.style.backgroundColor = '#ffffff';
              }
            }}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirmDelete}
            disabled={isDeleting}
            style={{
              padding: '9px 20px',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: '#dc2626',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.86rem',
              cursor: isDeleting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              if (!isDeleting) e.currentTarget.style.backgroundColor = '#b91c1c';
            }}
            onMouseLeave={(e) => {
              if (!isDeleting) e.currentTarget.style.backgroundColor = '#dc2626';
            }}
          >
            <Trash2 size={16} />
            <span>{isDeleting ? 'Deleting...' : 'Delete Task'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
