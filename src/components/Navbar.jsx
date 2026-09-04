import React, { useState, useRef, useEffect } from 'react';
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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const isManager = user && ['Manager', 'Executive', 'Administrator'].includes(user.role);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isDropdownOpen]);

  const handleProfileClick = () => {
    setIsDropdownOpen(false);
    setActiveSection('user-profile');
  };

  const handleLogoutClick = () => {
    setIsDropdownOpen(false);
    logout();
  };

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
            title={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
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
          {/* Notification Inbox Icon-Only Bell */}
          <button
            type="button"
            className="btn btn-secondary navbar-inbox-btn"
            onClick={() => setIsInboxModalOpen(true)}
            style={{
              position: 'relative',
              padding: '8px 10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: unreadCount > 0 ? (isManager ? '#eff6ff' : '#ecfdf5') : '#ffffff',
              borderColor: unreadCount > 0 ? (isManager ? '#93c5fd' : '#86efac') : '#cbd5e1',
              borderRadius: '10px',
            }}
            title={isManager ? 'Manager Inbox & Task Alerts' : 'My Task Inbox & Alerts'}
            aria-label="Notifications"
          >
            <Bell size={18} color={unreadCount > 0 ? (isManager ? '#2563eb' : '#059669') : '#64748b'} />
            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  minWidth: '17px',
                  height: '17px',
                  padding: '0 4px',
                  borderRadius: '999px',
                  background: '#ef4444',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 6px rgba(239, 68, 68, 0.5)',
                }}
              >
                {unreadCount}
              </span>
            )}
          </button>

          {/* 3-Lines Corner Menu Button & Dropdown */}
          <div style={{ position: 'relative' }} ref={dropdownRef}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              style={{
                padding: '8px 10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '10px',
                background: isDropdownOpen ? '#f1f5f9' : '#ffffff',
                borderColor: '#cbd5e1',
                cursor: 'pointer',
              }}
              title="Account Menu"
              aria-label="Account Options Menu"
            >
              <Menu size={19} color="#334155" />
            </button>

            {/* Dropdown Menu (My Profile & Log Out) */}
            {isDropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '14px',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
                  minWidth: '200px',
                  padding: '6px',
                  zIndex: 1000,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                  animation: 'fadeIn 0.15s ease',
                }}
              >
                {/* User Info Header Preview in Dropdown */}
                {user && (
                  <div
                    style={{
                      padding: '10px 12px 8px',
                      borderBottom: '1px solid #f1f5f9',
                      marginBottom: '4px',
                    }}
                  >
                    <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {user.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {user.email}
                    </div>
                  </div>
                )}

                {/* Option 1: My Profile */}
                <button
                  type="button"
                  onClick={handleProfileClick}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    background: activeSection === 'user-profile' ? '#eff6ff' : 'transparent',
                    color: activeSection === 'user-profile' ? '#1d4ed8' : '#334155',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = activeSection === 'user-profile' ? '#eff6ff' : 'transparent')}
                >
                  <UserIcon size={16} color={activeSection === 'user-profile' ? '#2563eb' : '#64748b'} />
                  <span>My Profile</span>
                </button>

                {/* Option 2: Log Out */}
                <button
                  type="button"
                  onClick={handleLogoutClick}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'transparent',
                    color: '#e11d48',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#fff1f2')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <LogOut size={16} color="#e11d48" />
                  <span>Log Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Inbox & Notifications Modal */}
      <ManagerInboxModal
        isOpen={isInboxModalOpen}
        onClose={() => setIsInboxModalOpen(false)}
        onNavigateSection={(section) => {
          setIsInboxModalOpen(false);
          if (setActiveSection) {
            setActiveSection(section);
          }
        }}
      />
    </>
  );
};
