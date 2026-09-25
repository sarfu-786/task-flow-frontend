import React, { useEffect } from 'react';
import { useProjects } from '../../context/ProjectContext';
import {
  X,
  CheckCircle2,
  Circle,
  FolderKanban,
  Check,
} from 'lucide-react';

export const MilestonesModal = ({ isOpen, onClose, project }) => {
  const { toggleMilestone } = useProjects();

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

  const milestones = Array.isArray(project.milestones) ? project.milestones : [];
  const completedCount = milestones.filter((m) => m.isCompleted).length;
  const progressPercent =
    milestones.length > 0 ? Math.round((completedCount / milestones.length) * 100) : project.progress || 0;

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
          maxWidth: '560px',
          maxHeight: '92vh',
          boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.35)',
          border: '1px solid #d1fae5',
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
            borderBottom: '1px solid #d1fae5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(to right, #f0fdf4, #ffffff)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                backgroundColor: '#ecfdf5',
                color: '#059669',
                border: '1.5px solid #a7f3d0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(5, 150, 105, 0.15)',
                flexShrink: 0,
              }}
            >
              <FolderKanban size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.18rem', fontWeight: 800, color: '#065f46', margin: 0 }}>
                Milestones: {project.name}
              </h2>
              <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '2px 0 0 0' }}>
                {project.projectCode} • Client: {project.clientName}
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
        <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Progress Bar Card */}
          <div
            style={{
              padding: '16px',
              backgroundColor: '#f8fafc',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
                Overall Project Progress
              </span>
              <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#059669' }}>
                {progressPercent}% Complete ({completedCount}/{milestones.length})
              </span>
            </div>
            <div
              style={{
                width: '100%',
                height: '10px',
                borderRadius: '999px',
                backgroundColor: '#e2e8f0',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${progressPercent}%`,
                  height: '100%',
                  background: progressPercent === 100 ? '#16a34a' : 'linear-gradient(90deg, #059669, #10b981)',
                  borderRadius: '999px',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          </div>

          {/* Milestones Interactive Checklist */}
          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: '10px', display: 'block' }}>
              Click any milestone to toggle Completed / In Progress status:
            </label>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {milestones.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '0.86rem' }}>
                  No milestones configured for this project.
                </div>
              ) : (
                milestones.map((m, idx) => (
                  <div
                    key={idx}
                    onClick={() => toggleMilestone(project._id, idx)}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '12px',
                      border: `1.5px solid ${m.isCompleted ? '#a7f3d0' : '#e2e8f0'}`,
                      backgroundColor: m.isCompleted ? '#f0fdf4' : '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      gap: '12px',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#059669';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = m.isCompleted ? '#a7f3d0' : '#e2e8f0';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '6px',
                          border: `2px solid ${m.isCompleted ? '#16a34a' : '#cbd5e1'}`,
                          backgroundColor: m.isCompleted ? '#16a34a' : '#ffffff',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {m.isCompleted && <Check size={16} strokeWidth={3} />}
                      </div>
                      <div>
                        <div
                          style={{
                            fontSize: '0.88rem',
                            fontWeight: 600,
                            color: m.isCompleted ? '#059669' : '#0f172a',
                            textDecoration: m.isCompleted ? 'line-through' : 'none',
                          }}
                        >
                          {m.title}
                        </div>
                        {m.completedAt && (
                          <div style={{ fontSize: '0.72rem', color: '#16a34a', marginTop: '2px' }}>
                            Completed on {new Date(m.completedAt).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>

                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '999px',
                        backgroundColor: m.isCompleted ? '#dcfce7' : '#f1f5f9',
                        color: m.isCompleted ? '#15803d' : '#64748b',
                      }}
                    >
                      {m.isCompleted ? 'Completed' : 'Pending'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
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
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '9px 24px',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: '#059669',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.86rem',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#047857')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#059669')}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default MilestonesModal;
