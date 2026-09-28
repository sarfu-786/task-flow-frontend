import React, { useEffect } from 'react';
import {
  X,
  Crown,
  ShieldCheck,
  Mail,
  Building,
  Network,
  Users,
  Briefcase,
  CheckCircle2,
  Calendar,
  Eye,
} from 'lucide-react';
import { useUserManagement } from '../../context/UserContext';
import { useTasks } from '../../context/TaskContext';

export const SuperiorDetailModal = ({
  isOpen,
  onClose,
  superiorName,
  superiorUser: directUserObj,
  currentUser,
  onOpenWork,
}) => {
  const { users } = useUserManagement();
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

  if (!isOpen) return null;

  const rawName = superiorName ? superiorName.replace(/\s*\(.*?\)\s*/g, '').trim() : '';

  // Look up manager from users list
  const matchedUser = directUserObj || (users || []).find((u) => {
    if (!u) return false;
    const nameMatch = u.name && rawName && u.name.toLowerCase().trim() === rawName.toLowerCase().trim();
    const emailMatch = u.email && rawName && u.email.toLowerCase().trim() === rawName.toLowerCase().trim();
    return nameMatch || emailMatch;
  });

  const isSuperAdmin = matchedUser
    ? matchedUser.role === 'Super Admin'
    : !rawName || rawName.includes('Super Admin') || rawName.includes('Sarfaraj');

  const name = matchedUser?.name || (rawName || 'Sarfaraj Ahmad');
  const role = matchedUser?.role || (isSuperAdmin ? 'Super Admin' : 'Senior Manager');
  const department = matchedUser?.department || (isSuperAdmin ? 'Executive Leadership' : 'Operations Management');
  const email = matchedUser?.email || (isSuperAdmin ? 'sarfrajahamad068@gmail.com' : 'manager@organization.com');
  const avatar = matchedUser?.avatar || '';

  // Calculate direct subordinates under this superior
  const supIdStr = (matchedUser?._id || matchedUser?.id || '').toString();
  const supNameLower = name.toLowerCase().trim();

  const directSubordinates = (users || []).filter((u) => {
    if (!u || (matchedUser && u._id === matchedUser._id)) return false;
    const rId = u.reportsTo ? (u.reportsTo._id ? u.reportsTo._id.toString() : u.reportsTo.toString()) : '';
    const rName = (u.reportsToName || '').toLowerCase().trim();
    return (supIdStr && rId === supIdStr) || (supNameLower && rName.includes(supNameLower));
  });

  // Calculate tasks assigned by or to this manager
  const managerTasks = (tasks || []).filter((t) => {
    if (!t) return false;
    const assigned = (t.assignedTo || '').toLowerCase().trim();
    return assigned === supNameLower;
  });

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
          maxWidth: '540px',
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
            background: isSuperAdmin ? '#fffbeb' : '#eff6ff',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: isSuperAdmin ? '#fef3c7' : '#dbeafe',
                color: isSuperAdmin ? '#b45309' : '#1d4ed8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {isSuperAdmin ? <Crown size={18} /> : <ShieldCheck size={18} />}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Reporting Superior Profile
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Organizational Hierarchy Direct Senior
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

        {/* Content Body */}
        <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Superior Info Card */}
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
            {avatar ? (
              <img
                src={avatar}
                alt={name}
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid var(--primary)',
                }}
              />
            ) : (
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: isSuperAdmin
                    ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                    : 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '1.3rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                }}
              >
                {name.charAt(0).toUpperCase()}
              </div>
            )}

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                  {name}
                </h4>
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '999px',
                    background: isSuperAdmin ? '#fef3c7' : '#eff6ff',
                    color: isSuperAdmin ? '#b45309' : '#1d4ed8',
                    border: `1px solid ${isSuperAdmin ? '#fde68a' : '#bfdbfe'}`,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  {isSuperAdmin && <Crown size={10} />}
                  {!isSuperAdmin && <ShieldCheck size={10} />}
                  {role}
                </span>
              </div>
              <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginTop: '2px' }}>
                {department}
              </span>
            </div>
          </div>

          {/* Details Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ padding: '12px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
              <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Mail size={12} /> Contact Email
              </span>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#0f172a', display: 'block', marginTop: '4px', wordBreak: 'break-all' }}>
                {email}
              </span>
            </div>

            <div style={{ padding: '12px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
              <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Building size={12} /> Department
              </span>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#0f172a', display: 'block', marginTop: '4px' }}>
                {department}
              </span>
            </div>
          </div>

          {/* Direct Reports / Team Members Section */}
          <div
            style={{
              padding: '14px 16px',
              borderRadius: '12px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Users size={14} color="#2563eb" />
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a' }}>
                  Direct Reporting Team ({directSubordinates.length} Members)
                </span>
              </div>
            </div>

            {directSubordinates.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '130px', overflowY: 'auto' }}>
                {directSubordinates.map((sub) => (
                  <div
                    key={sub._id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      background: '#ffffff',
                      border: '1px solid #f1f5f9',
                      fontSize: '0.78rem',
                    }}
                  >
                    <span style={{ fontWeight: 600, color: '#1e293b' }}>{sub.name}</span>
                    <span style={{ color: '#64748b', fontSize: '0.72rem' }}>{sub.role} • {sub.department || 'Operations'}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b' }}>
                No direct junior staff currently assigned to this reporting senior.
              </p>
            )}
          </div>

          {/* Hierarchy Relationship Box */}
          <div
            style={{
              padding: '14px 16px',
              borderRadius: '10px',
              background: '#f0fdf4',
              border: '1px solid #dcfce7',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <Network size={14} color="#166534" />
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#166534' }}>
                Reporting Relationship Structure
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '0.78rem', color: '#15803d', lineHeight: 1.4 }}>
              Employees reporting to <strong>{name}</strong> have task assignments, workloads, and operational workflows connected directly through this branch in the organizational hierarchy.
            </p>
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
          {matchedUser && onOpenWork && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                onClose();
                onOpenWork(matchedUser, 'all');
              }}
              style={{ padding: '6px 14px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Eye size={13} />
              <span>Inspect Superior's Workload</span>
            </button>
          )}

          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            style={{ padding: '6px 18px', fontSize: '0.85rem', marginLeft: 'auto' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
