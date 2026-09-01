import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTasks } from '../../context/TaskContext';
import {
  User,
  Mail,
  Building,
  Shield,
  Calendar,
  CheckCircle2,
  Clock,
  Briefcase,
  KeyRound,
  ShieldCheck,
  Award,
} from 'lucide-react';

export const UserProfile = () => {
  const { user } = useAuth();
  const { tasks } = useTasks();

  const userIdentifier = user?.name ? user.name.toLowerCase() : '';
  const userUsername = user?.username ? user.username.toLowerCase() : '';
  const userId = user?._id ? user._id.toString() : '';

  const myTasks = tasks.filter((t) => {
    const tAssigned = (t.assignedTo || '').toLowerCase();
    const tUser = t.user ? t.user.toString() : '';
    return (
      tAssigned === userIdentifier ||
      tAssigned === userUsername ||
      tUser === userId ||
      tAssigned === 'current user'
    );
  });

  const completedCount = myTasks.filter((t) => t.status === 'Completed').length;
  const inProgressCount = myTasks.filter((t) => t.status === 'In Progress').length;
  const todoCount = myTasks.filter((t) => t.status === 'To Do').length;

  const joinedDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Active Member';

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div className="section-header" style={{ marginBottom: '4px' }}>
        <div>
          <h2 className="section-title">My Profile Details</h2>
          <p className="section-subtitle">
            Personal credentials, department affiliation, and account security details.
          </p>
        </div>
      </div>

      {/* Main Profile Details Card */}
      <div
        className="card"
        style={{
          background: '#ffffff',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '32px',
          display: 'flex',
          flexDirection: 'column',
          gap: '28px',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        {/* Top Profile Banner Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '20px',
            paddingBottom: '24px',
            borderBottom: '1px solid var(--border-color)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '22px' }}>
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                style={{
                  width: '84px',
                  height: '84px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '3px solid #2563eb',
                  boxShadow: 'var(--shadow-md)',
                }}
              />
            ) : (
              <div
                style={{
                  width: '84px',
                  height: '84px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: '2rem',
                  fontWeight: 700,
                  border: '3px solid #e2e8f0',
                  boxShadow: 'var(--shadow-md)',
                }}
              >
                {user?.name ? user.name.charAt(0).toUpperCase() : <User size={36} />}
              </div>
            )}

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h3 style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  {user?.name || 'Employee'}
                </h3>
                <span
                  style={{
                    fontSize: '0.78rem',
                    padding: '3px 12px',
                    borderRadius: '9999px',
                    background: '#ecfdf5',
                    color: '#047857',
                    border: '1px solid #a7f3d0',
                    fontWeight: 600,
                  }}
                >
                  {user?.role || 'Team Member'}
                </span>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '6px 0 0 0' }}>
                @{user?.username} • {user?.email}
              </p>
            </div>
          </div>

          <div
            style={{
              padding: '10px 18px',
              borderRadius: '10px',
              background: '#f8fafc',
              border: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <ShieldCheck size={18} color="#059669" />
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Account Verified & Active
            </span>
          </div>
        </div>

        {/* Detailed Info Grid */}
        <div>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '14px' }}>
            Account & Organization Details
          </h4>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '16px',
            }}
          >
            <div style={{ background: '#f8fafc', padding: '14px 18px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <User size={13} />
                Full Name
              </span>
              <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px', display: 'block' }}>
                {user?.name}
              </span>
            </div>

            <div style={{ background: '#f8fafc', padding: '14px 18px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Mail size={13} />
                Email Address
              </span>
              <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px', display: 'block' }}>
                {user?.email}
              </span>
            </div>

            <div style={{ background: '#f8fafc', padding: '14px 18px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Building size={13} />
                Department
              </span>
              <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px', display: 'block' }}>
                {user?.department || 'Engineering'}
              </span>
            </div>

            <div style={{ background: '#f8fafc', padding: '14px 18px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={13} />
                Member Since
              </span>
              <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px', display: 'block' }}>
                {joinedDate}
              </span>
            </div>
          </div>
        </div>

        {/* Assigned Work Summary Card inside profile */}
        <div>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '14px' }}>
            Work Summary Overview
          </h4>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '14px',
            }}
          >
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '14px', borderRadius: '10px' }}>
              <span style={{ fontSize: '0.75rem', color: '#1d4ed8', fontWeight: 600 }}>Total Assigned</span>
              <span style={{ fontSize: '1.4rem', fontWeight: 700, color: '#1d4ed8', display: 'block', marginTop: '2px' }}>{myTasks.length}</span>
            </div>

            <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '14px', borderRadius: '10px' }}>
              <span style={{ fontSize: '0.75rem', color: '#047857', fontWeight: 600 }}>Tasks Completed</span>
              <span style={{ fontSize: '1.4rem', fontWeight: 700, color: '#059669', display: 'block', marginTop: '2px' }}>{completedCount}</span>
            </div>

            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', padding: '14px', borderRadius: '10px' }}>
              <span style={{ fontSize: '0.75rem', color: '#b45309', fontWeight: 600 }}>In Progress</span>
              <span style={{ fontSize: '1.4rem', fontWeight: 700, color: '#d97706', display: 'block', marginTop: '2px' }}>{inProgressCount}</span>
            </div>

            <div style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', padding: '14px', borderRadius: '10px' }}>
              <span style={{ fontSize: '0.75rem', color: '#6d28d9', fontWeight: 600 }}>To Do (Pending)</span>
              <span style={{ fontSize: '1.4rem', fontWeight: 700, color: '#7c3aed', display: 'block', marginTop: '2px' }}>{todoCount}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
