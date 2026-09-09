import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../context/TaskContext';
import { ManagerInboxModal } from './ManagerDashboard/ManagerInboxModal';
import { MyProfileModal } from './MyProfileModal';
import {
  CheckSquare,
  LogOut,
  User as UserIcon,
  Bell,
  Menu,
  X,
  ChevronDown,
  Shield,
  Crown,
  Settings,
} from 'lucide-react';

export const Navbar = ({ activeSection, setActiveSection, isMobileMenuOpen, setIsMobileMenuOpen }) => {
  const { user, logout } = useAuth();
  const { unreadCount } = useTasks();
  const [isInboxModalOpen, setIsInboxModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const dropdownRef = useRef(null);

  const isSuperAdmin = user && user.role === 'Super Admin';
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

  // Listen for global profile open requests (e.g. from sidebar footer)
  useEffect(() => {
    const handleOpenProfileEvent = () => {
      setIsDropdownOpen(false);
      setIsProfileModalOpen(true);
    };
    window.addEventListener('open-my-profile', handleOpenProfileEvent);
    return () => {
      window.removeEventListener('open-my-profile', handleOpenProfileEvent);
    };
  }, []);

  const handleOpenProfileModal = () => {
    setIsDropdownOpen(false);
    setIsProfileModalOpen(true);
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
          {isSuperAdmin && (
            <span
              className="navbar-role-pill"
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '999px',
                marginLeft: '4px',
                background: '#fef3c7',
                color: '#b45309',
                border: '1px solid #fde68a',
              }}
            >
              Super Admin
            </span>
          )}
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

          {/* Account Menu Button & Dropdown (First Letter Badge Only) */}
          <div style={{ position: 'relative' }} ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: isSuperAdmin ? '#fef3c7' : isManager ? '#eff6ff' : '#ecfdf5',
                color: isSuperAdmin ? '#b45309' : isManager ? '#1d4ed8' : '#047857',
                border: `1.5px solid ${isSuperAdmin ? '#fde68a' : isManager ? '#bfdbfe' : '#a7f3d0'}`,
                fontSize: '0.95rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: isDropdownOpen ? '0 0 0 3px rgba(37, 99, 235, 0.2)' : '0 1px 3px rgba(0,0,0,0.06)',
                transition: 'all 0.15s ease',
              }}
              title="Account Menu"
              aria-label="Account Options Menu"
            >
              {user?.avatar && user.avatar.trim() ? (
                <img
                  src={user.avatar}
                  alt={user?.name || 'Account'}
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    objectFit: 'cover',
                  }}
                />
              ) : (
                user?.name ? user.name.charAt(0).toUpperCase() : 'U'
              )}
            </button>

            {/* Dropdown Menu (Strictly 2 options: Edit Profile & Log Out) */}
            {isDropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
                  minWidth: '180px',
                  padding: '6px',
                  zIndex: 1000,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                  animation: 'fadeIn 0.15s ease',
                }}
              >
                {/* 1. Edit Your Profile Option */}
                <button
                  type="button"
                  onClick={handleOpenProfileModal}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'transparent',
                    color: '#1e293b',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#f1f5f9')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <UserIcon size={16} color="#2563eb" />
                  <span>Edit your profile</span>
                </button>

                {/* Divider */}
                <div style={{ height: '1px', background: '#f1f5f9', margin: '2px 0' }} />

                {/* 2. Log Out Option */}
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
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#fff1f2')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <LogOut size={16} color="#e11d48" />
                  <span>Log out</span>
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

      {/* My Profile & Account Settings Modal */}
      <MyProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </>
  );
};

