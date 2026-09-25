import React, { useEffect } from 'react';
import { useTasks } from '../../context/TaskContext';
import {
  X,
  ListTodo,
  Calendar,
  User,
  Clock,
  CheckCircle2,
  AlertCircle,
  Globe,
  FileText,
  Share2,
  Database,
  TrendingUp,
  Edit2,
  Trash2,
  Tag,
} from 'lucide-react';

export const TaskDetailModal = () => {
  const { isViewModalOpen, taskToView, closeViewModal, openEditModal, openDeleteModal } = useTasks();

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isViewModalOpen) {
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
  }, [isViewModalOpen]);

  if (!isViewModalOpen || !taskToView) return null;

  const getTaskTypeBadge = (type) => {
    switch (type?.toLowerCase()) {
      case 'internet work':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '3px 10px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700 }}>
            <Globe size={13} />
            <span>Internet Work</span>
          </span>
        );
      case 'documentation':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#f5f3ff', color: '#6d28d9', border: '1px solid #ddd6fe', padding: '3px 10px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700 }}>
            <FileText size={13} />
            <span>Documentation</span>
          </span>
        );
      case 'social media':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#fdf2f8', color: '#be185d', border: '1px solid #fbcfe8', padding: '3px 10px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700 }}>
            <Share2 size={13} />
            <span>Social Media</span>
          </span>
        );
      case 'backend work':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#f0fdfa', color: '#0f766e', border: '1px solid #99f6e4', padding: '3px 10px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700 }}>
            <Database size={13} />
            <span>Backend Work</span>
          </span>
        );
      case 'sells':
      case 'sales':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '3px 10px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700 }}>
            <TrendingUp size={13} />
            <span>Sales & Deals</span>
          </span>
        );
      default:
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', padding: '3px 10px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700 }}>
            <Tag size={13} />
            <span>{type || 'General'}</span>
          </span>
        );
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Completed':
        return {
          text: 'Completed',
          bg: '#ecfdf5',
          color: '#059669',
          border: '#a7f3d0',
          icon: <CheckCircle2 size={14} />,
        };
      case 'In Progress':
        return {
          text: 'In Progress',
          bg: '#fffbeb',
          color: '#d97706',
          border: '#fde68a',
          icon: <Clock size={14} />,
        };
      default:
        return {
          text: 'To Do',
          bg: '#eff6ff',
          color: '#2563eb',
          border: '#bfdbfe',
          icon: <ListTodo size={14} />,
        };
    }
  };

  const statusInfo = getStatusBadge(taskToView.status);

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
      onClick={closeViewModal}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '560px',
          maxHeight: '90vh',
          boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.35)',
          border: '1px solid #e2e8f0',
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
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(to right, #f8fafc, #ffffff)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                backgroundColor: '#eff6ff',
                color: '#2563eb',
                border: '1.5px solid #bfdbfe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.15)',
                flexShrink: 0,
              }}
            >
              <ListTodo size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Task Details
              </h2>
              <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '2px 0 0 0' }}>
                Full assignment specifications and status record
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeViewModal}
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
              e.currentTarget.style.backgroundColor = '#e2e8f0';
              e.currentTarget.style.color = '#0f172a';
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
        <div
          style={{
            padding: '24px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
          }}
        >
          {/* Status and Type Badges */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {getTaskTypeBadge(taskToView.taskType)}
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  backgroundColor: statusInfo.bg,
                  color: statusInfo.color,
                  border: `1px solid ${statusInfo.border}`,
                  padding: '3px 10px',
                  borderRadius: '999px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                }}
              >
                {statusInfo.icon}
                <span>{statusInfo.text}</span>
              </span>
            </div>

            {taskToView.priority && (
              <span
                style={{
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  color: taskToView.priority === 'High' ? '#dc2626' : taskToView.priority === 'Medium' ? '#d97706' : '#64748b',
                  backgroundColor: taskToView.priority === 'High' ? '#fef2f2' : taskToView.priority === 'Medium' ? '#fffbeb' : '#f1f5f9',
                  border: `1px solid ${taskToView.priority === 'High' ? '#fee2e2' : taskToView.priority === 'Medium' ? '#fde68a' : '#e2e8f0'}`,
                  padding: '2px 8px',
                  borderRadius: '6px',
                }}
              >
                Priority: {taskToView.priority}
              </span>
            )}
          </div>

          {/* Task Description */}
          <div
            style={{
              padding: '16px',
              backgroundColor: '#f8fafc',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
            }}
          >
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>
              Task Description
            </div>
            <p style={{ margin: 0, fontSize: '0.96rem', fontWeight: 600, color: '#0f172a', lineHeight: 1.5, wordBreak: 'break-word' }}>
              {taskToView.description}
            </p>
          </div>

          {/* Details Grid: Assignee & Due Date */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            <div
              style={{
                padding: '12px 14px',
                borderRadius: '12px',
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  backgroundColor: '#eff6ff',
                  color: '#2563eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {(taskToView.assignedTo || 'U').charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>Assigned Member</div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>
                  {taskToView.assignedTo || 'Unassigned'}
                </div>
              </div>
            </div>

            <div
              style={{
                padding: '12px 14px',
                borderRadius: '12px',
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '10px',
                  backgroundColor: '#fef3c7',
                  color: '#d97706',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Calendar size={18} />
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>Due Date</div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>
                  {taskToView.expectedDate
                    ? new Date(taskToView.expectedDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : 'No due date'}
                </div>
              </div>
            </div>
          </div>

          {/* Assigned By */}
          {taskToView.assignedBy && (
            <div style={{ fontSize: '0.8rem', color: '#64748b', padding: '0 4px' }}>
              Assigned by: <strong style={{ color: '#334155' }}>{taskToView.assignedBy}</strong>
            </div>
          )}

          {/* Instructions / Initial Remark */}
          {taskToView.remark && (
            <div
              style={{
                padding: '12px 14px',
                borderRadius: '12px',
                backgroundColor: '#f8fafc',
                borderLeft: '3px solid #6366f1',
              }}
            >
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', marginBottom: '4px' }}>
                Instructions / Remarks
              </div>
              <p style={{ margin: 0, fontSize: '0.86rem', color: '#334155', lineHeight: 1.45 }}>
                {taskToView.remark}
              </p>
            </div>
          )}

          {/* Completion Remark if completed */}
          {taskToView.status === 'Completed' && taskToView.completionRemark && (
            <div
              style={{
                padding: '12px 14px',
                borderRadius: '12px',
                backgroundColor: '#ecfdf5',
                border: '1px solid #a7f3d0',
                borderLeft: '3px solid #10b981',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', fontWeight: 700, color: '#047857', textTransform: 'uppercase', marginBottom: '4px' }}>
                <CheckCircle2 size={13} />
                <span>Completion Report</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.86rem', color: '#065f46', lineHeight: 1.45 }}>
                {taskToView.completionRemark}
              </p>
              {taskToView.completedAt && (
                <div style={{ fontSize: '0.72rem', color: '#059669', marginTop: '4px' }}>
                  Completed on {new Date(taskToView.completedAt).toLocaleString()}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions with only icons for Edit and Delete, plus Close */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid #f1f5f9',
            backgroundColor: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Quick Action Signs (Edit, Delete) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={() => {
                const target = taskToView;
                closeViewModal();
                openEditModal(target);
              }}
              title="Edit Task"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                color: '#2563eb',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#eff6ff';
                e.currentTarget.style.borderColor = '#93c5fd';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#ffffff';
                e.currentTarget.style.borderColor = '#cbd5e1';
              }}
            >
              <Edit2 size={15} />
            </button>

            <button
              type="button"
              onClick={() => {
                const target = taskToView;
                closeViewModal();
                openDeleteModal(target);
              }}
              title="Delete Task"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                border: '1px solid #fecaca',
                backgroundColor: '#ffffff',
                color: '#dc2626',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#fef2f2';
                e.currentTarget.style.borderColor = '#fca5a5';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#ffffff';
                e.currentTarget.style.borderColor = '#fecaca';
              }}
            >
              <Trash2 size={15} />
            </button>
          </div>

          <button
            type="button"
            onClick={closeViewModal}
            style={{
              padding: '9px 22px',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              color: '#475569',
              fontWeight: 600,
              fontSize: '0.86rem',
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailModal;
