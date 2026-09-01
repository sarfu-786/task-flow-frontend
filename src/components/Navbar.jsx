import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../context/TaskContext';
import { ManagerInboxModal } from './ManagerDashboard/ManagerInboxModal';
import {
  CheckSquare,
  LogOut,
  User as UserIcon,
  Bell,
  Menu,
  X,
} from 'lucide-react';

export const Navbar = ({ activeSection, setActiveSection, isMobileMenuOpen, setIsMobileMenuOpen }) => {
  const { user, logout } = useAuth();
  const { unreadCount } = useTasks();
  const [isInboxModalOpen, setIsInboxModalOpen] = useState(false);

  const isManager = user && ['Manager', 'Executive', 'Administrator'].includes(user.role);

  return (
    <>
      <header className="navbar">
        <div className="navbar-brand">
          {/* Mobile Hamburger Drawer Toggle Button */}
          <button
            type="button"
            className="mobile-menu-toggle"
            onClick={() => setIsMobileMenuOpen && setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle navigation menu"
            title={isMobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div className="navbar-logo">
            <CheckSquare size={20} />
          </div>
          <span className="navbar-title">TaskFlow Pro</span>
          <span
            className="navbar-role-pill"
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '999px',
              marginLeft: '4px',
              background: isManager ? '#eff6ff' : '#ecfdf5',
              color: isManager ? '#1d4ed8' : '#047857',
              border: `1px solid ${isManager ? '#bfdbfe' : '#a7f3d0'}`,
            }}
          >
            {isManager ? 'Manager' : 'Employee'}
          </span>
        </div>

        <div className="navbar-actions">
          {/* Notification Inbox Bell */}
          <button
            type="button"
            className="btn btn-secondary navbar-inbox-btn"
            onClick={() => setIsInboxModalOpen(true)}
            style={{
              position: 'relative',
              padding: '7px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: unreadCount > 0 ? (isManager ? '#eff6ff' : '#ecfdf5') : '#ffffff',
              borderColor: unreadCount > 0 ? (isManager ? '#93c5fd' : '#86efac') : '#cbd5e1',
            }}
            title={isManager ? "Manager Inbox & Task Alerts" : "My Task Inbox & Alerts"}
          >
            <Bell size={17} color={unreadCount > 0 ? (isManager ? '#2563eb' : '#059669') : '#64748b'} />
            <span className="hide-on-mobile" style={{ fontSize: '0.82rem', fontWeight: 600, color: '#0f172a' }}>Inbox</span>
            {unreadCount > 0 && (
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  padding: '1px 5px',
                  borderRadius: '999px',
                  background: '#ef4444',
                  color: '#ffffff',
                  boxShadow: '0 0 6px rgba(239, 68, 68, 0.5)',
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
                    fontWeight: 700,
                    fontSize: '0.75rem',
                  }}
                >
                  {user.name ? user.name.charAt(0).toUpperCase() : <UserIcon size={14} />}
                </div>
              )}
              <div className="user-meta-header hide-on-tablet">
                <span className="user-name-header">{user.name}</span>
                <span className="user-role-header">{user.role}</span>
              </div>
            </div>
          )}

          {/* Logout Button */}
          <button
            className="btn btn-secondary navbar-logout-btn"
            onClick={logout}
            style={{ padding: '7px 10px', fontSize: '0.825rem' }}
            title="Sign Out"
          >
            <LogOut size={16} />
            <span className="hide-on-mobile">Sign Out</span>
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
