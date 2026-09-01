import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../context/TaskContext';
import { ManagerInboxModal } from './ManagerDashboard/ManagerInboxModal';
import {
  CheckSquare,
  LogOut,
  User as UserIcon,
  Bell,
  Shield,
  Briefcase,
} from 'lucide-react';

export const Navbar = ({ activeSection, setActiveSection }) => {
  const { user, logout } = useAuth();
  const { unreadCount } = useTasks();
  const [isInboxModalOpen, setIsInboxModalOpen] = useState(false);

  const isManager = user && ['Manager', 'Executive', 'Administrator'].includes(user.role);

  return (
    <>
      <header className="navbar">
        <div className="navbar-brand">
          <div className="navbar-logo">
            <CheckSquare size={22} />
          </div>
          <span className="navbar-title">TaskFlow Pro</span>
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '999px',
              marginLeft: '8px',
              background: isManager ? '#eff6ff' : '#ecfdf5',
              color: isManager ? '#1d4ed8' : '#047857',
              border: `1px solid ${isManager ? '#bfdbfe' : '#a7f3d0'}`,
            }}
          >
            {isManager ? 'Manager Portal' : 'Employee Workspace'}
          </span>
        </div>

        <div className="navbar-actions">
          {/* Notification Inbox Bell (for both Manager & User) */}
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setIsInboxModalOpen(true)}
            style={{
              position: 'relative',
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: unreadCount > 0 ? (isManager ? '#eff6ff' : '#ecfdf5') : '#ffffff',
              borderColor: unreadCount > 0 ? (isManager ? '#93c5fd' : '#86efac') : '#cbd5e1',
            }}
            title={isManager ? "Manager Inbox & Task Alerts" : "My Task Inbox & Manager Assignment Alerts"}
          >
            <Bell size={17} color={unreadCount > 0 ? (isManager ? '#2563eb' : '#059669') : '#64748b'} />
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#0f172a' }}>Inbox</span>
            {unreadCount > 0 && (
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: '999px',
                  background: '#ef4444',
                  color: '#ffffff',
                  marginLeft: '2px',
                  boxShadow: '0 0 8px rgba(239, 68, 68, 0.6)',
                }}
              >
                {unreadCount}
              </span>
            )}
          </button>

          {/* User Profile Badge */}
          {user && (
            <div
              className="user-profile-badge"
              onClick={() => setActiveSection(isManager ? 'user' : 'user-workspace')}
              title="View Profile Details"
            >
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="user-avatar-sm" />
              ) : (
                <div
                  className="user-avatar-sm"
                  style={{
                    background: isManager ? '#3b82f6' : '#10b981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                  }}
                >
                  <UserIcon size={16} />
                </div>
              )}
              <div className="user-meta-header">
                <span className="user-name-header">{user.name}</span>
                <span className="user-role-header">{user.role}</span>
              </div>
            </div>
          )}

          {/* Logout Button */}
          <button
            className="btn btn-secondary"
            onClick={logout}
            style={{ padding: '8px 14px', fontSize: '0.85rem' }}
            title="Sign Out"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Inbox & Notifications Modal */}
      <ManagerInboxModal
        isOpen={isInboxModalOpen}
        onClose={() => setIsInboxModalOpen(false)}
      />
    </>
  );
};
