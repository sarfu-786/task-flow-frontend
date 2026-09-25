import React from 'react';
import {
  LayoutDashboard,
  Network,
  Users,
  CheckSquare,
  Crown,
  ShieldCheck,
  Briefcase,
  UserCheck,
  Target,
  TrendingUp,
  AlertCircle,
  FolderKanban,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useUserManagement } from '../context/UserContext';
import { useSubscription } from '../context/SubscriptionContext';

export const Sidebar = ({ activeSection, setActiveSection, isMobileMenuOpen, setIsMobileMenuOpen }) => {
  const { user, userRoles, isSuperAdmin, isManager } = useAuth();
  const { pendingApprovalsCount } = useUserManagement();
  const { isModuleActive } = useSubscription();

  const handleNavClick = (section) => {
    setActiveSection(section);
    if (setIsMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  };

  // Module accessibility checks
  const showTasks = isModuleActive('tasks');
  const showLeads = isModuleActive('leads');
  const showComplaints = isModuleActive('complaints');
  const showProjects = isModuleActive('projects');

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
          <div className="sidebar-header-inner">
            <div className="sidebar-brand-box">
              {isSuperAdmin ? (
                <div className="sidebar-role-icon icon-super-admin" title="Super Admin Workspace">
                  <Crown size={18} />
                </div>
              ) : isManager ? (
                <div className="sidebar-role-icon icon-manager" title="Manager Console">
                  <ShieldCheck size={18} />
                </div>
              ) : (
                <div className="sidebar-role-icon icon-user" title="User Workspace">
                  <Briefcase size={18} />
                </div>
              )}

              <div className="sidebar-brand-text">
                <span className="sidebar-role-title">
                  {isSuperAdmin ? 'Super Admin' : isManager ? 'Manager Console' : 'User Workspace'}
                </span>
                <span className="sidebar-app-name">TaskFlow Pro</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Navigation Items */}
        <nav className="sidebar-nav">
          {isSuperAdmin ? (
            /* ========================================================
               SUPER ADMIN NAVIGATION
               ======================================================== */
            <>
              <div className="sidebar-group-label">CORE WORKSPACE</div>

              <button
                type="button"
                className={`nav-item-btn ${activeSection === 'superadmin' ? 'active' : ''}`}
                onClick={() => handleNavClick('superadmin')}
                id="nav-superadmin-dashboard"
                title="Executive Dashboard"
              >
                <LayoutDashboard className="nav-icon" />
                <span className="nav-label">Dashboard</span>
              </button>

              <button
                type="button"
                className={`nav-item-btn ${activeSection === 'hierarchy' ? 'active' : ''}`}
                onClick={() => handleNavClick('hierarchy')}
                id="nav-org-hierarchy"
                title="Organizational Hierarchy"
              >
                <Network className="nav-icon" />
                <span className="nav-label">Organization Hierarchy</span>
              </button>

              <button
                type="button"
                className={`nav-item-btn ${activeSection === 'employees' || activeSection === 'user' || activeSection === 'users' ? 'active' : ''}`}
                onClick={() => handleNavClick('employees')}
                id="nav-users-mgmt"
                title="User Management"
              >
                <Users className="nav-icon" />
                <span className="nav-label">User Management</span>
              </button>

              {(showTasks || showLeads || showComplaints || showProjects) && (
                <div className="sidebar-group-label">ENTERPRISE MODULES</div>
              )}

              {/* Module 1: Task Management */}
              {showTasks && (
                <button
                  type="button"
                  className={`nav-item-btn ${activeSection === 'tasks' ? 'active' : ''}`}
                  onClick={() => handleNavClick('tasks')}
                  id="nav-task-management"
                  title="Task Management"
                >
                  <CheckSquare className="nav-icon" />
                  <span className="nav-label">Task Management</span>
                </button>
              )}

              {/* Module 2: Lead Management & Opportunities */}
              {showLeads && (
                <>
                  <button
                    type="button"
                    className={`nav-item-btn ${activeSection === 'leads' ? 'active' : ''}`}
                    onClick={() => handleNavClick('leads')}
                    id="nav-leads"
                    title="Leads Pipeline"
                  >
                    <Target className="nav-icon" />
                    <span className="nav-label">Leads</span>
                  </button>

                  <button
                    type="button"
                    className={`nav-item-btn ${activeSection === 'opportunities' ? 'active' : ''}`}
                    onClick={() => handleNavClick('opportunities')}
                    id="nav-opportunities"
                    title="Opportunities Pipeline"
                  >
                    <TrendingUp className="nav-icon" />
                    <span className="nav-label">Opportunities</span>
                  </button>
                </>
              )}

              {/* Module 3: Complaint Management */}
              {showComplaints && (
                <button
                  type="button"
                  className={`nav-item-btn ${activeSection === 'complaints' ? 'active' : ''}`}
                  onClick={() => handleNavClick('complaints')}
                  id="nav-complaints"
                  title="Customer Complaints"
                >
                  <AlertCircle className="nav-icon" />
                  <span className="nav-label">Complaints</span>
                </button>
              )}

              {/* Module 4: Project Management */}
              {showProjects && (
                <button
                  type="button"
                  className={`nav-item-btn ${activeSection === 'projects' ? 'active' : ''}`}
                  onClick={() => handleNavClick('projects')}
                  id="nav-projects"
                  title="Projects Management"
                >
                  <FolderKanban className="nav-icon" />
                  <span className="nav-label">Projects Management</span>
                </button>
              )}

              {/* Pending Approvals */}
              {pendingApprovalsCount > 0 && (
                <>
                  {!isCollapsed && <div className="sidebar-group-label">SYSTEM & ACCESS</div>}
                  <button
                    type="button"
                    className={`nav-item-btn ${activeSection === 'approvals' ? 'active' : ''}`}
                    onClick={() => handleNavClick('approvals')}
                    id="nav-super-approvals"
                    title={`User Approvals (${pendingApprovalsCount} pending)`}
                  >
                    <UserCheck className="nav-icon" />
                    <div className="nav-label-wrapper">
                      <span className="nav-label">Approvals</span>
                      <span className="nav-badge-count">{pendingApprovalsCount}</span>
                    </div>
                  </button>
                </>
              )}
            </>
          ) : isManager ? (
            /* ========================================================
               MANAGER NAVIGATION
               ======================================================== */
            <>
              <div className="sidebar-group-label">TEAM & OPERATIONS</div>

              <button
                type="button"
                className={`nav-item-btn ${activeSection === 'manager' ? 'active' : ''}`}
                onClick={() => handleNavClick('manager')}
                id="nav-manager-dashboard"
                title="Manager Dashboard"
              >
                <LayoutDashboard className="nav-icon" />
                <span className="nav-label">Dashboard</span>
              </button>

              <button
                type="button"
                className={`nav-item-btn ${activeSection === 'hierarchy' ? 'active' : ''}`}
                onClick={() => handleNavClick('hierarchy')}
                id="nav-my-team-hierarchy"
                title="My Team Hierarchy"
              >
                <Network className="nav-icon" />
                <span className="nav-label">My Team Hierarchy</span>
              </button>

              <button
                type="button"
                className={`nav-item-btn ${activeSection === 'employees' || activeSection === 'user' || activeSection === 'users' ? 'active' : ''}`}
                onClick={() => handleNavClick('employees')}
                id="nav-manager-users"
                title="User Management"
              >
                <Users className="nav-icon" />
                <span className="nav-label">User Management</span>
              </button>

              {(showTasks || showLeads || showComplaints || showProjects) && (
                <div className="sidebar-group-label">MODULES</div>
              )}

              {/* Module 1: Task Management */}
              {showTasks && (
                <button
                  type="button"
                  className={`nav-item-btn ${activeSection === 'tasks' ? 'active' : ''}`}
                  onClick={() => handleNavClick('tasks')}
                  id="nav-manager-tasks"
                  title="Task Management"
                >
                  <CheckSquare className="nav-icon" />
                  <span className="nav-label">Task Management</span>
                </button>
              )}

              {/* Module 2: Lead Management & Opportunities */}
              {showLeads && (
                <>
                  <button
                    type="button"
                    className={`nav-item-btn ${activeSection === 'leads' ? 'active' : ''}`}
                    onClick={() => handleNavClick('leads')}
                    id="nav-manager-leads"
                    title="Leads"
                  >
                    <Target className="nav-icon" />
                    <span className="nav-label">Leads</span>
                  </button>

                  <button
                    type="button"
                    className={`nav-item-btn ${activeSection === 'opportunities' ? 'active' : ''}`}
                    onClick={() => handleNavClick('opportunities')}
                    id="nav-manager-opportunities"
                    title="Opportunities"
                  >
                    <TrendingUp className="nav-icon" />
                    <span className="nav-label">Opportunities</span>
                  </button>
                </>
              )}

              {/* Module 3: Complaint Management */}
              {showComplaints && (
                <button
                  type="button"
                  className={`nav-item-btn ${activeSection === 'complaints' ? 'active' : ''}`}
                  onClick={() => handleNavClick('complaints')}
                  id="nav-manager-complaints"
                  title="Complaints"
                >
                  <AlertCircle className="nav-icon" />
                  <span className="nav-label">Complaints</span>
                </button>
              )}

              {/* Module 4: Project Management */}
              {showProjects && (
                <button
                  type="button"
                  className={`nav-item-btn ${activeSection === 'projects' ? 'active' : ''}`}
                  onClick={() => handleNavClick('projects')}
                  id="nav-manager-projects"
                  title="Projects Management"
                >
                  <FolderKanban className="nav-icon" />
                  <span className="nav-label">Projects Management</span>
                </button>
              )}

              {/* Pending Approvals */}
              {pendingApprovalsCount > 0 && (
                <>
                  <div className="sidebar-group-label">APPROVALS</div>
                  <button
                    type="button"
                    className={`nav-item-btn ${activeSection === 'approvals' ? 'active' : ''}`}
                    onClick={() => handleNavClick('approvals')}
                    id="nav-manager-approvals"
                    title={`Pending Registrations (${pendingApprovalsCount})`}
                  >
                    <UserCheck className="nav-icon" />
                    <div className="nav-label-wrapper">
                      <span className="nav-label">Approvals</span>
                      <span className="nav-badge-count">{pendingApprovalsCount}</span>
                    </div>
                  </button>
                </>
              )}
            </>
          ) : (
            /* ========================================================
               USER / EMPLOYEE / COORDINATOR NAVIGATION
               ======================================================== */
            <>
              <div className="sidebar-group-label">MY WORKSPACE</div>

              <button
                type="button"
                className={`nav-item-btn ${activeSection === 'user-workspace' ? 'active' : ''}`}
                onClick={() => handleNavClick('user-workspace')}
                id="nav-my-tasks"
                title="My Dashboard"
              >
                <Briefcase className="nav-icon" />
                <span className="nav-label">Dashboard</span>
              </button>

              <button
                type="button"
                className={`nav-item-btn ${activeSection === 'hierarchy' ? 'active' : ''}`}
                onClick={() => handleNavClick('hierarchy')}
                id="nav-user-hierarchy"
                title="My Team Hierarchy"
              >
                <Network className="nav-icon" />
                <span className="nav-label">My Team Hierarchy</span>
              </button>

              <button
                type="button"
                className={`nav-item-btn ${activeSection === 'employees' || activeSection === 'user' ? 'active' : ''}`}
                onClick={() => handleNavClick('employees')}
                id="nav-user-team"
                title="Directory & Colleagues"
              >
                <Users className="nav-icon" />
                <span className="nav-label">Users</span>
              </button>

              {(showTasks || showLeads || showComplaints || showProjects) && (
                <div className="sidebar-group-label">MODULES</div>
              )}

              {/* Module 1: Task Management */}
              {showTasks && (
                <button
                  type="button"
                  className={`nav-item-btn ${activeSection === 'tasks' ? 'active' : ''}`}
                  onClick={() => handleNavClick('tasks')}
                  id="nav-user-tasks"
                  title="Task Management"
                >
                  <CheckSquare className="nav-icon" />
                  <span className="nav-label">Task Management</span>
                </button>
              )}

              {/* Module 2: Lead Management & Opportunities */}
              {showLeads && (
                <>
                  <button
                    type="button"
                    className={`nav-item-btn ${activeSection === 'leads' ? 'active' : ''}`}
                    onClick={() => handleNavClick('leads')}
                    id="nav-user-leads"
                    title="Leads"
                  >
                    <Target className="nav-icon" />
                    <span className="nav-label">Leads</span>
                  </button>

                  <button
                    type="button"
                    className={`nav-item-btn ${activeSection === 'opportunities' ? 'active' : ''}`}
                    onClick={() => handleNavClick('opportunities')}
                    id="nav-user-opportunities"
                    title="Opportunities"
                  >
                    <TrendingUp className="nav-icon" />
                    <span className="nav-label">Opportunities</span>
                  </button>
                </>
              )}

              {/* Module 3: Complaint Management */}
              {showComplaints && (
                <button
                  type="button"
                  className={`nav-item-btn ${activeSection === 'complaints' ? 'active' : ''}`}
                  onClick={() => handleNavClick('complaints')}
                  id="nav-user-complaints"
                  title="Complaints"
                >
                  <AlertCircle className="nav-icon" />
                  <span className="nav-label">Complaints</span>
                </button>
              )}

              {/* Module 4: Project Management */}
              {showProjects && (
                <button
                  type="button"
                  className={`nav-item-btn ${activeSection === 'projects' ? 'active' : ''}`}
                  onClick={() => handleNavClick('projects')}
                  id="nav-user-projects"
                  title="Projects Management"
                >
                  <FolderKanban className="nav-icon" />
                  <span className="nav-label">Projects Management</span>
                </button>
              )}
            </>
          )}
        </nav>

        {/* Sidebar Footer: Current User Profile Card */}
        <div className="sidebar-footer">
          <div
            className="sidebar-profile-card"
            onClick={() => window.dispatchEvent(new CustomEvent('open-my-profile'))}
            title="Click to view & edit My Profile"
          >
            {user?.avatar && user.avatar.trim() ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="sidebar-avatar-img"
                style={{
                  borderColor: isSuperAdmin ? '#f59e0b' : isManager ? '#2563eb' : '#059669',
                }}
              />
            ) : (
              <div
                className="sidebar-avatar-fallback"
                style={{
                  background: isSuperAdmin
                    ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                    : isManager
                    ? 'linear-gradient(135deg, #2563eb, #1d4ed8)'
                    : 'linear-gradient(135deg, #059669, #10b981)',
                }}
              >
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
            )}

            <div className="sidebar-profile-info">
              <div className="sidebar-profile-name">
                <span>{user?.name || 'User'}</span>
                {isSuperAdmin && <Crown size={12} color="#d97706" />}
              </div>
              <div className="sidebar-profile-role">
                {userRoles && userRoles.length > 0 ? userRoles.join(' • ') : (user?.role || 'Team Member')}
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
