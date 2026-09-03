import React from 'react';
import { Bell, CheckCircle2, Shield, X, ArrowRight } from 'lucide-react';

export const RealtimeToast = ({ toast, onClose, onAction }) => {
  if (!toast) return null;

  const isAssignment = toast.type === 'task_assigned' || (toast.assignedBy && toast.forRole !== 'Manager');

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 9999,
        maxWidth: '420px',
        width: 'calc(100% - 40px)',
        background: 'rgba(255, 255, 255, 0.98)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: `1.5px solid ${isAssignment ? '#3b82f6' : '#10b981'}`,
        borderRadius: '14px',
        boxShadow: '0 20px 35px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
        padding: '16px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        animation: 'toastSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      role="alert"
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: isAssignment ? '#eff6ff' : '#ecfdf5',
              color: isAssignment ? '#2563eb' : '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {isAssignment ? <Shield size={20} /> : <CheckCircle2 size={20} />}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: isAssignment ? '#2563eb' : '#059669', letterSpacing: '0.04em' }}>
                {isAssignment ? '⚡ Instant Assignment Alert' : '⚡ Task Completed Alert'}
              </span>
            </div>
            <h4 style={{ margin: '2px 0 0', fontSize: '0.92rem', fontWeight: 700, color: '#0f172a' }}>
              {toast.title || (isAssignment ? 'New Task Assigned' : 'Task Completed')}
            </h4>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          aria-label="Close notification"
        >
          <X size={16} />
        </button>
      </div>

      <p style={{ margin: 0, fontSize: '0.84rem', color: '#334155', lineHeight: 1.45, wordBreak: 'break-word' }}>
        {toast.message || toast.taskDescription}
      </p>

      {toast.remark && (
        <div
          style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderLeft: `3px solid ${isAssignment ? '#2563eb' : '#059669'}`,
            padding: '6px 10px',
            borderRadius: '6px',
            fontSize: '0.78rem',
            color: '#475569',
            fontStyle: 'italic',
            wordBreak: 'break-word',
          }}
        >
          "{toast.remark}"
        </div>
      )}

      {onAction && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '2px' }}>
          <button
            type="button"
            onClick={onAction}
            style={{
              padding: '6px 12px',
              fontSize: '0.78rem',
              fontWeight: 600,
              background: isAssignment ? '#2563eb' : '#059669',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: isAssignment ? '0 4px 10px rgba(37, 99, 235, 0.25)' : '0 4px 10px rgba(5, 150, 105, 0.25)',
            }}
          >
            <span>View Details</span>
            <ArrowRight size={13} />
          </button>
        </div>
      )}
    </div>
  );
};
