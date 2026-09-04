import React from 'react';
import {
  LayoutDashboard,
  CheckSquare,
  Users,
  User,
  Briefcase,
  UserCheck,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useUserManagement } from '../context/UserContext';

export const Sidebar = ({ activeSection, setActiveSection, isMobileMenuOpen, setIsMobileMenuOpen }) => {
  const { user } = useAuth();
  const { pendingApprovalsCount } = useUserManagement();
  const isManager = user && ['Manager', 'Executive', 'Administrator'].includes(user.role);

  const handleNavClick = (section) => {
    setActiveSection(section);
    if (setIsMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileMenuOpen && (
        <div
          className="sidebar-backdrop active"
          onClick={() => setIsMobileMenuOpen && setIsMobileMenuOpen(false)}
          aria-label="Close navigation overlay"
        />
      )}

      <aside className={`sidebar ${isMobileMenuOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {isManager ? 'Manager Workspace' : 'Employee Workspace'}
              </span>
            </div>

            {/* Mobile Close Button */}
            <button
              type="button"
              className="btn-icon mobile-sidebar-close"
              onClick={() => setIsMobileMenuOpen && setIsMobileMenuOpen(false)}
              aria-label="Close navigation menu"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <nav className="sidebar-nav">
          {isManager ? (
            <>
              <button
                type="button"
                className={`nav-item-btn ${activeSection === 'manager' ? 'active' : ''}`}
                onClick={() => handleNavClick('manager')}
              >
                <LayoutDashboard className="nav-icon" />
                <span>Manager Dashboard</span>
              </button>

              <button
                type="button"
                className={`nav-item-btn ${activeSection === 'user' ? 'active' : ''}`}
                onClick={() => handleNavClick('user')}
              >
                <Users className="nav-icon" />
                <span>Team Management</span>
              </button>

              <button
                type="button"
                className={`nav-item-btn ${activeSection === 'tasks' ? 'active' : ''}`}
                onClick={() => handleNavClick('tasks')}
              >
                <CheckSquare className="nav-icon" />
                <span>All Tasks Management</span>
              </button>

              <button
                type="button"
                className={`nav-item-btn ${activeSection === 'approvals' ? 'active' : ''}`}
                onClick={() => handleNavClick('approvals')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  position: 'relative',
                }}
                id="sidebar-nav-approvals"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <UserCheck className="nav-icon" />
                  <span>Registration Approvals</span>
                </div>
                {pendingApprovalsCount > 0 && (
                  <span
                    style={{
                      background: '#ef4444',
                      color: '#ffffff',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      minWidth: '20px',
                      height: '20px',
                      borderRadius: '999px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0 6px',
                      boxShadow: '0 2px 6px rgba(239, 68, 68, 0.4)',
                      lineHeight: 1,
                      flexShrink: 0,
                    }}
                    title={`${pendingApprovalsCount} pending registration approval${pendingApprovalsCount === 1 ? '' : 's'}`}
                  >
                    {pendingApprovalsCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                className={`nav-item-btn ${activeSection === 'user-profile' ? 'active' : ''}`}
                onClick={() => handleNavClick('user-profile')}
              >
                <User className="nav-icon" />
                <span>My Profile Details</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className={`nav-item-btn ${activeSection === 'user-workspace' ? 'active' : ''}`}
                onClick={() => handleNavClick('user-workspace')}
              >
                <Briefcase className="nav-icon" />
                <span>My Assigned Work</span>
              </button>

              <button
                type="button"
                className={`nav-item-btn ${activeSection === 'user-profile' ? 'active' : ''}`}
                onClick={() => handleNavClick('user-profile')}
              >
                <User className="nav-icon" />
                <span>My Profile Details</span>
              </button>
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <button
            type="button"
            onClick={() => handleNavClick('user-profile')}
            style={{
              width: '100%',
              padding: '12px 14px',
              background: activeSection === 'user-profile' ? '#eff6ff' : '#f8fafc',
              borderRadius: '12px',
              border: activeSection === 'user-profile' ? '1px solid #93c5fd' : '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              boxShadow: activeSection === 'user-profile' ? '0 2px 8px rgba(37, 99, 235, 0.15)' : '0 1px 2px rgba(0,0,0,0.03)',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.15s ease',
            }}
            title="View My Profile Details"
          >
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: `2px solid ${isManager ? '#2563eb' : '#059669'}`,
                  flexShrink: 0,
                }}
              />
            ) : (
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: isManager
                    ? 'linear-gradient(135deg, #2563eb, #3b82f6)'
                    : 'linear-gradient(135deg, #059669, #10b981)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  flexShrink: 0,
                  boxShadow: isManager
                    ? '0 2px 6px rgba(37,99,235,0.25)'
                    : '0 2px 6px rgba(5,150,105,0.25)',
                }}
              >
                {user?.name ? user.name.charAt(0).toUpperCase() : <User size={18} />}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    color: activeSection === 'user-profile' ? '#1d4ed8' : 'var(--text-primary)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: 'block',
                  }}
                  title={user?.name}
                >
                  {user?.name || (isManager ? 'Manager' : 'Employee')}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 600,
                    padding: '1px 6px',
                    borderRadius: '999px',
                    background: isManager ? '#eff6ff' : '#ecfdf5',
                    color: isManager ? '#1d4ed8' : '#047857',
                    border: `1px solid ${isManager ? '#bfdbfe' : '#a7f3d0'}`,
                  }}
                >
                  {user?.role || (isManager ? 'Manager' : 'User')}
                </span>
                <span
                  style={{
                    fontSize: '0.7rem',
                    color: 'var(--text-muted)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {user?.department || 'Internet Work'}
                </span>
              </div>
            </div>
          </button>
        </div>
      </aside>
    </>
  );
};
