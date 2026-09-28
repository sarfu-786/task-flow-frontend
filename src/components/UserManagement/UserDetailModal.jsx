import React, { useEffect } from 'react';
import {
  X,
  Mail,
  Building,
  Briefcase,
  Shield,
  Crown,
  CheckCircle2,
  Clock,
  ListTodo,
  Calendar,
  Eye,
  Edit2,
  ExternalLink,
  Users,
  Target,
  AlertCircle,
} from 'lucide-react';
import { useTasks } from '../../context/TaskContext';

export const UserDetailModal = ({
  user,
  isOpen,
  onClose,
  onOpenWork,
  onOpenEdit,
  onViewManager,
}) => {
  const { tasks } = useTasks();

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

  if (!isOpen || !user) return null;

  const isSuperAdmin = user.role === 'Super Admin';
  const isManager = ['Manager', 'Executive', 'Administrator'].includes(user.role);

  // Filter tasks assigned to this user
  const uName = (user.name || '').toLowerCase().trim();
  const uUsername = (user.username || '').toLowerCase().trim();
  const uId = (user._id || user.id || '').toString();

  const userTasks = (tasks || []).filter((t) => {
    if (!t) return false;
    const assigned = (t.assignedTo || '').toLowerCase().trim();
    const taskUserId = t.user ? (t.user._id ? t.user._id.toString() : t.user.toString()) : '';
    return assigned === uName || assigned === uUsername || (taskUserId && taskUserId === uId);
  });

  const totalTasks = userTasks.length;
  const completedTasks = userTasks.filter((t) => t.status === 'Completed').length;
  const inProgressTasks = userTasks.filter((t) => t.status === 'In Progress').length;
  const todoTasks = userTasks.filter((t) => t.status === 'To Do' || !t.status).length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '18px',
          width: '100%',
          maxWidth: '560px',
          border: '1px solid var(--border-color)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
          overflow: 'hidden',
          animation: 'scaleIn 0.2s ease-out',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '92vh',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: isSuperAdmin
              ? 'linear-gradient(135deg, #fffbeb, #fef3c7)'
              : isManager
              ? 'linear-gradient(135deg, #eff6ff, #dbeafe)'
              : '#f8fafc',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: isSuperAdmin ? '#fde68a' : isManager ? '#bfdbfe' : '#e2e8f0',
                color: isSuperAdmin ? '#b45309' : isManager ? '#1d4ed8' : '#334155',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {isSuperAdmin ? <Crown size={18} /> : isManager ? <Shield size={18} /> : <Users size={18} />}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                User Profile Reference
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Complete organization member details & workload
              </span>
            </div>
          </div>

          <button
            type="button"
            className="btn-icon"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              padding: '6px',
              borderRadius: '8px',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* User Bio Card */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: '16px',
              borderRadius: '14px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
            }}
          >
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                style={{
                  width: '58px',
                  height: '58px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid var(--primary)',
                }}
              />
            ) : (
              <div
                style={{
                  width: '58px',
                  height: '58px',
                  borderRadius: '50%',
                  background: isSuperAdmin
                    ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                    : isManager
                    ? 'linear-gradient(135deg, #2563eb, #1d4ed8)'
                    : 'linear-gradient(135deg, #059669, #10b981)',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '1.4rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                }}
              >
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
            )}

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h4 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                  {user.name}
                </h4>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '3px 9px',
                    borderRadius: '999px',
                    background: isSuperAdmin ? '#fef3c7' : isManager ? '#eff6ff' : '#ecfdf5',
                    color: isSuperAdmin ? '#b45309' : isManager ? '#1d4ed8' : '#047857',
                    border: `1px solid ${isSuperAdmin ? '#fde68a' : isManager ? '#bfdbfe' : '#a7f3d0'}`,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  {isSuperAdmin && <Crown size={10} />}
                  {isManager && <Shield size={10} />}
                  {user.role || 'User'}
                </span>
              </div>
              <span style={{ fontSize: '0.82rem', color: '#64748b', display: 'block', marginTop: '3px' }}>
                {user.email} • {user.department || 'Operations'}
              </span>
            </div>
          </div>

          {/* Quick Info Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ padding: '12px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
              <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Mail size={12} /> Email Address
              </span>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#0f172a', display: 'block', marginTop: '4px', wordBreak: 'break-all' }}>
                {user.email}
              </span>
            </div>

            <div style={{ padding: '12px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
              <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Building size={12} /> Department
              </span>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#0f172a', display: 'block', marginTop: '4px' }}>
                {user.department || 'Operations'}
              </span>
            </div>

            <div style={{ padding: '12px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
              <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Shield size={12} /> Reports To (Manager)
              </span>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#0f172a' }}>
                  {user.reportsToName || (isSuperAdmin ? '— (Super Admin Root)' : 'Direct to Super Admin')}
                </span>
                {user.reportsToName && onViewManager && (
                  <button
                    type="button"
                    onClick={() => onViewManager(user.reportsToName)}
                    style={{
                      border: 'none',
                      background: '#eff6ff',
                      color: '#2563eb',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    View
                  </button>
                )}
              </div>
            </div>

            <div style={{ padding: '12px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
              <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={12} /> Account Status
              </span>
              <span
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: user.status === 'Approved' || !user.status ? '#059669' : '#d97706',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  marginTop: '4px',
                }}
              >
                <CheckCircle2 size={12} />
                {user.status || 'Active & Approved'}
              </span>
            </div>
          </div>

          {/* Workload Summary Breakdown */}
          <div
            style={{
              padding: '16px',
              borderRadius: '14px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Briefcase size={15} color="#2563eb" />
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
                  Workload Breakdown ({totalTasks} Tasks)
                </span>
              </div>
              <span style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 700 }}>
                {completionRate}% Completed
              </span>
            </div>

            {/* 3 Metric Pills */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
              <div
                style={{
                  padding: '10px',
                  background: '#ffffff',
                  borderRadius: '10px',
                  border: '1px solid #dcfce7',
                  textAlign: 'center',
                }}
              >
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#059669', display: 'block' }}>
                  {completedTasks}
                </span>
                <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Completed</span>
              </div>

              <div
                style={{
                  padding: '10px',
                  background: '#ffffff',
                  borderRadius: '10px',
                  border: '1px solid #fef3c7',
                  textAlign: 'center',
                }}
              >
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#d97706', display: 'block' }}>
                  {inProgressTasks}
                </span>
                <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>In Progress</span>
              </div>

              <div
                style={{
                  padding: '10px',
                  background: '#ffffff',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  textAlign: 'center',
                }}
              >
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#475569', display: 'block' }}>
                  {todoTasks}
                </span>
                <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Pending To Do</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div
          style={{
            padding: '14px 24px',
            borderTop: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#ffffff',
          }}
        >
          <div style={{ display: 'flex', gap: '8px' }}>
            {onOpenEdit && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  onClose();
                  onOpenEdit(user);
                }}
                style={{ padding: '6px 14px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Edit2 size={13} />
                <span>Edit User</span>
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {onOpenWork && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  onClose();
                  onOpenWork(user, 'all');
                }}
                style={{ padding: '6px 16px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Eye size={14} />
                <span>Inspect Workload ({totalTasks})</span>
              </button>
            )}

            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              style={{ padding: '6px 16px', fontSize: '0.82rem' }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
