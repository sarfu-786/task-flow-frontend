import React, { useState, useEffect } from 'react';
import { useProjects } from '../../context/ProjectContext';
import { Trash2, AlertTriangle, X } from 'lucide-react';

export const DeleteProjectModal = ({ isOpen, onClose, project }) => {
  const { deleteProject } = useProjects();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
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
  }, [isOpen]);

  if (!isOpen || !project) return null;

  const handleDelete = async () => {
    try {
      setSubmitting(true);
      setError('');
      await deleteProject(project._id);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to delete project');
    } finally {
      setSubmitting(false);
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
      onClick={onClose}
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
                Delete Project
              </h2>
              <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '2px 0 0 0' }}>
                Permanently delete project record
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
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

          {/* Project Details Card */}
          <div
            style={{
              padding: '14px 16px',
              backgroundColor: '#f8fafc',
              borderRadius: '14px',
              border: '1px solid #e2e8f0',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
              <span
                style={{
                  display: 'inline-block',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  backgroundColor: '#f0fdf4',
                  color: '#059669',
                  border: '1px solid #bbf7d0',
                  fontWeight: 700,
                  fontSize: '0.76rem',
                }}
              >
                {project.projectCode || 'PRJ-000'}
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
                {project.status || 'Active'}
              </span>
            </div>

            <div style={{ fontSize: '0.94rem', fontWeight: 700, color: '#0f172a' }}>
              {project.name}
            </div>

            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Client: <strong style={{ color: '#334155' }}>{project.clientName || 'N/A'}</strong>
              {project.budget ? ` • Budget: $${project.budget.toLocaleString()}` : ''}
            </div>
          </div>

          <p style={{ margin: 0, fontSize: '0.86rem', color: '#475569', lineHeight: 1.5 }}>
            Are you sure you want to delete project{' '}
            <strong style={{ color: '#0f172a' }}>{project.name}</strong>?
            This action <strong style={{ color: '#dc2626' }}>cannot be undone</strong>. All linked milestones, deliverables, and progress tracking records will be permanently removed.
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
            onClick={onClose}
            disabled={submitting}
            style={{
              padding: '9px 18px',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              color: '#475569',
              fontWeight: 600,
              fontSize: '0.86rem',
              cursor: submitting ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              if (!submitting) {
                e.currentTarget.style.borderColor = '#94a3b8';
                e.currentTarget.style.backgroundColor = '#f1f5f9';
              }
            }}
            onMouseLeave={(e) => {
              if (!submitting) {
                e.currentTarget.style.borderColor = '#cbd5e1';
                e.currentTarget.style.backgroundColor = '#ffffff';
              }
            }}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleDelete}
            disabled={submitting}
            style={{
              padding: '9px 20px',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: '#dc2626',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.86rem',
              cursor: submitting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              if (!submitting) e.currentTarget.style.backgroundColor = '#b91c1c';
            }}
            onMouseLeave={(e) => {
              if (!submitting) e.currentTarget.style.backgroundColor = '#dc2626';
            }}
          >
            <Trash2 size={16} />
            <span>{submitting ? 'Deleting...' : 'Delete Project'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteProjectModal;
