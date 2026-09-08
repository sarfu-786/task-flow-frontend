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
} from 'lucide-react';

export const SuperiorDetailModal = ({ isOpen, onClose, superiorName, currentUser }) => {
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

  const isSuperAdmin = !superiorName || superiorName.includes('Super Admin') || superiorName.includes('Sarfaraj');
  const name = superiorName ? superiorName.replace(/\s*\(.*?\)\s*/g, '').trim() : 'Sarfaraj Ahmad';
  const role = isSuperAdmin ? 'Super Admin' : 'Senior Manager';
  const department = isSuperAdmin ? 'Executive Leadership' : 'Operations Management';
  const email = isSuperAdmin ? 'sarfrajahamad068@gmail.com' : 'manager@organization.com';

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
          borderRadius: '16px',
          width: '100%',
          maxWidth: '520px',
          border: '1px solid var(--border-color)',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          overflow: 'hidden',
          animation: 'scaleIn 0.2s ease-out',
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
            background: isSuperAdmin ? '#fffbeb' : '#f8fafc',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: isSuperAdmin ? '#fef3c7' : '#eff6ff',
                color: isSuperAdmin ? '#b45309' : '#2563eb',
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
        <div style={{ padding: '24px' }}>
          {/* Superior Info Card */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: '16px',
              borderRadius: '12px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              marginBottom: '20px',
            }}
          >
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
                  }}
                >
                  {role}
                </span>
              </div>
              <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginTop: '2px' }}>
                {department}
              </span>
            </div>
          </div>

          {/* Details Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
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
              You (<strong>{currentUser?.name || 'Manager'}</strong>) report directly to <strong>{name}</strong>.
              All task assignments, team workloads, and operational updates in your branch connect directly through this line.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '14px 24px',
            borderTop: '1px solid #f1f5f9',
            display: 'flex',
            justifyContent: 'flex-end',
            background: '#ffffff',
          }}
        >
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            style={{ padding: '6px 16px', fontSize: '0.85rem' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
