import React, { useState, useEffect } from 'react';
import { useTasks } from '../../context/TaskContext';
import { AlertTriangle, Trash2, X } from 'lucide-react';

export const DeleteConfirmModal = () => {
  const { isDeleteModalOpen, taskToDelete, closeDeleteModal, deleteTask } = useTasks();
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (isDeleteModalOpen) {
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
    setIsDeleting(true);
    await deleteTask(taskToDelete._id);
    setIsDeleting(false);
  };

  return (
    <div className="modal-backdrop" onClick={closeDeleteModal}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
        <div className="modal-header" style={{ borderBottomColor: '#fee2e2' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: '#fef2f2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#dc2626',
              }}
            >
              <AlertTriangle size={18} />
            </div>
            <h3 className="modal-title" style={{ color: '#dc2626' }}>
              Confirm Deletion
            </h3>
          </div>
          <button
            type="button"
            className="btn-icon"
            onClick={closeDeleteModal}
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', lineHeight: 1.6 }}>
            Are you sure you want to permanently delete this task?
          </p>
          <div
            style={{
              padding: '12px 16px',
              background: '#f8fafc',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              fontSize: '0.85rem',
              color: 'var(--text-muted)',
            }}
          >
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
              {taskToDelete.description}
            </div>
            <div>Type: {taskToDelete.taskType}</div>
          </div>
          <p style={{ fontSize: '0.8rem', color: '#dc2626', marginTop: '12px' }}>
            This action cannot be undone.
          </p>
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={closeDeleteModal}
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={handleConfirmDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <span>Deleting...</span>
            ) : (
              <>
                <Trash2 size={16} />
                <span>Delete Task</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
