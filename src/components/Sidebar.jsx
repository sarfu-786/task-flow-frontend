import React from 'react';
import {
  LayoutDashboard,
  CheckSquare,
  Users,
  User,
  Briefcase,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Sidebar = ({ activeSection, setActiveSection }) => {
  const { user } = useAuth();
  const isManager = user && ['Manager', 'Executive', 'Administrator'].includes(user.role);

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {isManager ? 'Manager Workspace' : 'Employee Workspace'}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {isManager ? 'Executive Team Hub' : 'Personal Task Workspace'}
          </span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {isManager ? (
          <>
            <button
              className={`nav-item-btn ${activeSection === 'manager' ? 'active' : ''}`}
              onClick={() => setActiveSection('manager')}
            >
              <LayoutDashboard className="nav-icon" />
              <span>Manager Dashboard</span>
            </button>

            <button
              className={`nav-item-btn ${activeSection === 'user' ? 'active' : ''}`}
              onClick={() => setActiveSection('user')}
            >
              <Users className="nav-icon" />
              <span>Team Management</span>
            </button>

            <button
              className={`nav-item-btn ${activeSection === 'tasks' ? 'active' : ''}`}
              onClick={() => setActiveSection('tasks')}
            >
              <CheckSquare className="nav-icon" />
              <span>All Tasks Management</span>
            </button>
          </>
        ) : (
          <>
            <button
              className={`nav-item-btn ${activeSection === 'user-workspace' ? 'active' : ''}`}
              onClick={() => setActiveSection('user-workspace')}
            >
              <Briefcase className="nav-icon" />
              <span>My Assigned Work</span>
            </button>

            <button
              className={`nav-item-btn ${activeSection === 'user-profile' ? 'active' : ''}`}
              onClick={() => setActiveSection('user-profile')}
            >
              <User className="nav-icon" />
              <span>My Profile Details</span>
            </button>
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        <div
          style={{
            padding: '12px 14px',
            background: '#f8fafc',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
          }}
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
                  color: 'var(--text-primary)',
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
                {user?.department || 'Operations'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
