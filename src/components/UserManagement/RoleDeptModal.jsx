import React, { useEffect } from 'react';
import {
  X,
  Shield,
  Crown,
  Building,
  Users,
  CheckCircle2,
  Briefcase,
  Layers,
  Filter,
} from 'lucide-react';
import { useUserManagement } from '../../context/UserContext';

export const RoleDeptModal = ({
  role,
  department,
  isOpen,
  onClose,
  onFilterRole,
}) => {
  const { users } = useUserManagement();

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

  if (!isOpen) return null;

  const isSuper = role === 'Super Admin';
  const isManager = ['Manager', 'Executive', 'Administrator'].includes(role);

  // Users in same department
  const activeUsers = (users || []).filter((u) => u.status !== 'Rejected' && u.status !== 'Pending');
  const deptMembers = activeUsers.filter(
    (u) => (u.department || 'Operations').toLowerCase() === (department || 'Operations').toLowerCase()
  );
  const roleMembers = activeUsers.filter(
    (u) => (u.role || 'User').toLowerCase() === (role || 'User').toLowerCase()
  );

  const roleDescriptions = {
    'Super Admin': 'Chief executive leadership with full system permissions, user administration, organization hierarchy authority, and company-wide oversight.',
    'Manager': 'Operational supervisor with team management privileges, task assignment, progress tracking, and branch reporting responsibilities.',
    'Executive': 'Senior operational manager with workflow coordination, milestone monitoring, and departmental leadership.',
    'Administrator': 'System administrator overseeing team structures, task delegation, and operational performance.',
    'Sales Coordinator': 'CRM specialist handling lead generation, opportunity conversion, and sales pipeline metrics.',
    'Service Coordinator': 'Customer resolution specialist handling complaint tickets, SLA adherence, and client satisfaction.',
    'User': 'Individual contributor executing assigned tasks, reporting status progress, and delivering completed workflows.',
  };

  const roleDesc = roleDescriptions[role] || 'Organization contributor executing delegated workflows and department responsibilities.';

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
          maxWidth: '520px',
          border: '1px solid var(--border-color)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
          overflow: 'hidden',
          animation: 'scaleIn 0.2s ease-out',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: isSuper
              ? '#fffbeb'
              : isManager
              ? '#eff6ff'
              : '#f8fafc',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: isSuper ? '#fef3c7' : isManager ? '#dbeafe' : '#e2e8f0',
                color: isSuper ? '#b45309' : isManager ? '#1d4ed8' : '#334155',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {isSuper ? <Crown size={18} /> : isManager ? <Shield size={18} /> : <Layers size={18} />}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Role & Department Reference
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Organizational classification & department members
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

        {/* Body */}
        <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Role Card */}
          <div
            style={{
              padding: '16px',
              borderRadius: '12px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Role Classification
              </span>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '999px',
                  background: isSuper ? '#fef3c7' : isManager ? '#eff6ff' : '#ecfdf5',
                  color: isSuper ? '#b45309' : isManager ? '#1d4ed8' : '#047857',
                  border: `1px solid ${isSuper ? '#fde68a' : isManager ? '#bfdbfe' : '#a7f3d0'}`,
                }}
              >
                {role} ({roleMembers.length} {roleMembers.length === 1 ? 'member' : 'members'})
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '0.84rem', color: '#334155', lineHeight: 1.5 }}>
              {roleDesc}
            </p>
          </div>

          {/* Department Card */}
          <div
            style={{
              padding: '16px',
              borderRadius: '12px',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Building size={15} color="#2563eb" />
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
                  {department || 'Operations'} Department
                </span>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
                {deptMembers.length} Personnel
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
              {deptMembers.map((m) => (
                <div
                  key={m._id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    background: '#f8fafc',
                    border: '1px solid #f1f5f9',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: '#2563eb',
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {m.name ? m.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#0f172a' }}>{m.name}</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{m.email}</div>
                    </div>
                  </div>
                  <span style={{ fontSize: '0.72rem', padding: '2px 6px', background: '#eff6ff', color: '#1d4ed8', borderRadius: '4px', fontWeight: 600 }}>
                    {m.role}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
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
          {onFilterRole && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                onFilterRole(role);
                onClose();
              }}
              style={{ padding: '6px 14px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Filter size={13} />
              <span>Filter Table by {role}</span>
            </button>
          )}

          <button
            type="button"
            className="btn btn-primary"
            onClick={onClose}
            style={{ padding: '6px 18px', fontSize: '0.82rem', marginLeft: 'auto' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
