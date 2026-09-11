import React from 'react';
import {
  LayoutDashboard,
  Network,
  Users,
  CheckSquare,
  User,
  Crown,
  ShieldCheck,
  Briefcase,
  X,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useUserManagement } from '../context/UserContext';

export const Sidebar = ({ activeSection, setActiveSection, isMobileMenuOpen, setIsMobileMenuOpen }) => {
  const { user } = useAuth();
  const { pendingApprovalsCount } = useUserManagement();

  const isSuperAdmin = user && user.role === 'Super Admin';
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
        {/* Sidebar Brand Header */}
        <div className="sidebar-header">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {isSuperAdmin ? (
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    boxShadow: '0 2px 6px rgba(245, 158, 11, 0.3)',
                  }}
                >
                  <Crown size={16} />
                </div>
              ) : isManager ? (
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    boxShadow: '0 2px 6px rgba(37, 99, 235, 0.3)',
                  }}
                >
                  <ShieldCheck size={16} />
                </div>
              ) : (
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #059669, #10b981)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    boxShadow: '0 2px 6px rgba(5, 150, 105, 0.3)',
                  }}
                >
                  <Briefcase size={16} />
                </div>
              )}
              <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {isSuperAdmin ? 'Super Admin' : isManager ? 'Manager Console' : 'User Workspace'}
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

        {/* Sidebar Nav Items */}
        <nav className="sidebar-nav">
          {isSuperAdmin ? (
            /* Super Admin Navigation Options */
            <>
              <button
                type="button"
                className={`nav-item-btn ${activeSection === 'superadmin' ? 'active' : ''}`}
                onClick={() => handleNavClick('superadmin')}
                id="nav-superadmin-dashboard"
              >
                <LayoutDashboard className="nav-icon" />
                <span>Dashboard</span>
              </button>

              <button
                type="button"
                className={`nav-item-btn ${activeSection === 'hierarchy' ? 'active' : ''}`}
                onClick={() => handleNavClick('hierarchy')}
                id="nav-org-hierarchy"
              >
                <Network className="nav-icon" />
                <span>Organization Hierarchy</span>
              </button>

              <button
                type="button"
                className={`nav-item-btn ${activeSection === 'employees' || activeSection === 'user' ? 'active' : ''}`}
                onClick={() => handleNavClick('employees')}
                id="nav-employees-mgmt"
              >
                <Users className="nav-icon" />
                <span>Users</span>
              </button>

              <button
                type="button"
                className={`nav-item-btn ${activeSection === 'tasks' ? 'active' : ''}`}
                onClick={() => handleNavClick('tasks')}
                id="nav-task-management"
              >
                <CheckSquare className="nav-icon" />
                <span>Task Management</span>
              </button>

              {pendingApprovalsCount > 0 && (
                <button
                  type="button"
                  className={`nav-item-btn ${activeSection === 'approvals' ? 'active' : ''}`}
                  onClick={() => handleNavClick('approvals')}
                  id="nav-super-approvals"
                >
                  <UserCheck className="nav-icon" />
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <span>Approvals</span>
                    <span
                      style={{
                        background: '#ef4444',
                        color: '#ffffff',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: '999px',
                      }}
                    >
                      {pendingApprovalsCount}
                    </span>
                  </div>
                </button>
              )}
            </>
          ) : isManager ? (
            /* Manager Navigation Options */
            <>
              <button
                type="button"
                className={`nav-item-btn ${activeSection === 'manager' ? 'active' : ''}`}
                onClick={() => handleNavClick('manager')}
                id="nav-manager-dashboard"
              >
                <LayoutDashboard className="nav-icon" />
                <span>Dashboard</span>
              </button>

              <button
                type="button"
                className={`nav-item-btn ${activeSection === 'hierarchy' ? 'active' : ''}`}
                onClick={() => handleNavClick('hierarchy')}
                id="nav-my-team-hierarchy"
              >
                <Network className="nav-icon" />
                <span>My Team</span>
              </button>

              <button
                type="button"
                className={`nav-item-btn ${activeSection === 'employees' || activeSection === 'user' ? 'active' : ''}`}
                onClick={() => handleNavClick('employees')}
                id="nav-manager-employees"
              >
                <Users className="nav-icon" />
                <span>Users</span>
              </button>

              <button
                type="button"
                className={`nav-item-btn ${activeSection === 'tasks' ? 'active' : ''}`}
                onClick={() => handleNavClick('tasks')}
                id="nav-manager-tasks"
              >
                <CheckSquare className="nav-icon" />
                <span>Task Management</span>
              </button>

              {pendingApprovalsCount > 0 && (
                <button
                  type="button"
                  className={`nav-item-btn ${activeSection === 'approvals' ? 'active' : ''}`}
                  onClick={() => handleNavClick('approvals')}
                  id="nav-manager-approvals"
                >
                  <UserCheck className="nav-icon" />
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <span>Approvals</span>
                    <span
                      style={{
                        background: '#ef4444',
                        color: '#ffffff',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: '999px',
                      }}
                    >
                      {pendingApprovalsCount}
                    </span>
                  </div>
                </button>
              )}
            </>
          ) : (
            /* User Navigation Options */
            <>
              <button
                type="button"
                className={`nav-item-btn ${activeSection === 'user-workspace' ? 'active' : ''}`}
                onClick={() => handleNavClick('user-workspace')}
                id="nav-my-tasks"
              >
                <Briefcase className="nav-icon" />
                <span>Dashboard</span>
              </button>

              <button
                type="button"
                className={`nav-item-btn ${activeSection === 'hierarchy' ? 'active' : ''}`}
                onClick={() => handleNavClick('hierarchy')}
                id="nav-user-hierarchy"
              >
                <Network className="nav-icon" />
                <span>My Team Hierarchy</span>
              </button>

              <button
                type="button"
                className={`nav-item-btn ${activeSection === 'employees' || activeSection === 'user' ? 'active' : ''}`}
                onClick={() => handleNavClick('employees')}
                id="nav-user-team"
              >
                <Users className="nav-icon" />
                <span>Users</span>
              </button>
            </>
          )}
        </nav>

        {/* Sidebar Footer: Current Logged In Profile Card */}
        <div className="sidebar-footer">
          <div
            onClick={() => window.dispatchEvent(new CustomEvent('open-my-profile'))}
            style={{
              width: '100%',
              padding: '10px 12px',
              background: '#ffffff',
              borderRadius: '10px',
              border: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'background 0.15s, border-color 0.15s, box-shadow 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f8fafc';
              e.currentTarget.style.borderColor = '#cbd5e1';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#ffffff';
              e.currentTarget.style.borderColor = 'var(--border-color)';
              e.currentTarget.style.boxShadow = 'none';
            }}
            title="Click to view & edit My Profile"
          >
            {user?.avatar && user.avatar.trim() ? (
              <img
                src={user.avatar}
                alt={user.name}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: `1.5px solid ${isSuperAdmin ? '#f59e0b' : isManager ? '#2563eb' : '#059669'}`,
                  flexShrink: 0,
                }}
              />
            ) : (
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: isSuperAdmin
                    ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                    : isManager
                      ? 'linear-gradient(135deg, #2563eb, #1d4ed8)'
                      : 'linear-gradient(135deg, #059669, #10b981)',
                  color: '#ffffff',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.85rem',
                  flexShrink: 0,
                }}
              >
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
            )}

            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span>{user?.name || 'User'}</span>
                {isSuperAdmin && <Crown size={12} color="#d97706" />}
              </div>
              <div
                style={{
                  fontSize: '0.72rem',
                  color: 'var(--text-muted)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {user?.role || 'Team Member'}
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
