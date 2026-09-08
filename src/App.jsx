import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TaskProvider, useTasks } from './context/TaskContext';
import { UserProvider } from './context/UserContext';
import { Login } from './components/Login';
import { Register } from './components/Register';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { SuperAdminDashboard } from './components/SuperAdmin/SuperAdminDashboard';
import { ManagerDashboard } from './components/ManagerDashboard/ManagerDashboard';
import { OrganizationHierarchy } from './components/TeamHierarchy/OrganizationHierarchy';
import { TaskList } from './components/TaskManagement/TaskList';
import { UserSection } from './components/UserSection';
import { UserWorkspace } from './components/UserWorkspace/UserWorkspace';
import { ApprovalSection } from './components/ManagerDashboard/ApprovalSection';
import { RealtimeToast } from './components/RealtimeToast';

const AuthenticatedLayout = ({
  activeSection,
  handleSectionChange,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  isSuperAdmin,
  isManager,
}) => {
  const { liveToast, dismissLiveToast } = useTasks();

  return (
    <>
      {/* Real-time floating toast alert */}
      <RealtimeToast
        toast={liveToast}
        onClose={dismissLiveToast}
        onAction={() => {
          const toastType = liveToast?.type;
          dismissLiveToast();
          if (toastType === 'user_registered' && (isSuperAdmin || isManager)) {
            handleSectionChange('approvals');
          } else if (isSuperAdmin) {
            handleSectionChange('superadmin');
          } else if (isManager) {
            handleSectionChange('manager');
          } else {
            handleSectionChange('user-workspace');
          }
        }}
      />

      <div className="app-container">
        {/* Dynamic Role-Based Sidebar */}
        <Sidebar
          activeSection={activeSection}
          setActiveSection={handleSectionChange}
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
        />

        <div className="main-content">
          {/* Top Navbar */}
          <Navbar
            activeSection={activeSection}
            setActiveSection={handleSectionChange}
            isMobileMenuOpen={isMobileMenuOpen}
            setIsMobileMenuOpen={setIsMobileMenuOpen}
          />

          {/* Dynamic Section Routing - Strictly render ONLY the active section */}
          <main className="page-body">
            {isSuperAdmin ? (
              /* Super Admin Sections */
              <>
                {activeSection === 'superadmin' && <SuperAdminDashboard setActiveSection={handleSectionChange} />}
                {activeSection === 'hierarchy' && <OrganizationHierarchy setActiveSection={handleSectionChange} />}
                {(activeSection === 'employees' || activeSection === 'user') && <UserSection />}
                {activeSection === 'tasks' && <TaskList />}
                {activeSection === 'approvals' && <ApprovalSection />}
              </>
            ) : isManager ? (
              /* Manager Sections */
              <>
                {activeSection === 'manager' && <ManagerDashboard setActiveSection={handleSectionChange} />}
                {activeSection === 'hierarchy' && <OrganizationHierarchy setActiveSection={handleSectionChange} />}
                {(activeSection === 'employees' || activeSection === 'user') && <UserSection />}
                {activeSection === 'tasks' && <TaskList />}
                {activeSection === 'approvals' && <ApprovalSection />}
              </>
            ) : (
              /* Employee Sections */
              <>
                {activeSection === 'user-workspace' && <UserWorkspace />}
              </>
            )}
          </main>
        </div>
      </div>
    </>
  );
};

const MainApplication = () => {
  const { isAuthenticated, loading, user } = useAuth();
  const isSuperAdmin = user && user.role === 'Super Admin';
  const isManager = user && ['Manager', 'Executive', 'Administrator'].includes(user.role);

  // Unauthenticated view toggle: default to 'login'
  const [authView, setAuthView] = useState('login');
  const [loginInitialEmail, setLoginInitialEmail] = useState('');
  const [loginSuccessMsg, setLoginSuccessMsg] = useState('');

  // Reset to login view if user logs out
  useEffect(() => {
    if (!isAuthenticated) {
      setAuthView('login');
    }
  }, [isAuthenticated]);

  // Set active section depending on role and persisted preference
  const [activeSection, setActiveSection] = useState(() => {
    try {
      const savedSection = localStorage.getItem('taskflow_active_section');
      if (savedSection) {
        if (isSuperAdmin && ['superadmin', 'hierarchy', 'employees', 'user', 'tasks', 'approvals'].includes(savedSection)) {
          return savedSection;
        }
        if (isManager && ['manager', 'hierarchy', 'employees', 'user', 'tasks', 'approvals'].includes(savedSection)) {
          return savedSection;
        }
        if (!isSuperAdmin && !isManager && ['user-workspace'].includes(savedSection)) {
          return savedSection;
        }
      }
    } catch {
      // ignore storage access error
    }
    if (isSuperAdmin) return 'superadmin';
    if (isManager) return 'manager';
    return 'user-workspace';
  });

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (user) {
      const superRole = user.role === 'Super Admin';
      const managerRole = ['Manager', 'Executive', 'Administrator'].includes(user.role);

      setActiveSection((prev) => {
        let next = prev;
        if (superRole) {
          if (!['superadmin', 'hierarchy', 'employees', 'user', 'tasks', 'approvals'].includes(prev)) {
            next = 'superadmin';
          }
        } else if (managerRole) {
          if (!['manager', 'hierarchy', 'employees', 'user', 'tasks', 'approvals'].includes(prev)) {
            next = 'manager';
          }
        } else {
          if (!['user-workspace'].includes(prev)) {
            next = 'user-workspace';
          }
        }
        try {
          localStorage.setItem('taskflow_active_section', next);
        } catch {}
        return next;
      });
    }
  }, [user]);

  // Close mobile sidebar on section change & persist selection
  const handleSectionChange = (section) => {
    setActiveSection(section);
    try {
      localStorage.setItem('taskflow_active_section', section);
    } catch {}
    setIsMobileMenuOpen(false);
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#ffffff',
          color: '#475569',
          fontFamily: 'var(--font-main)',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              border: '3px solid rgba(37, 99, 235, 0.15)',
              borderTopColor: '#2563eb',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 14px',
            }}
          />
          <p style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.9rem' }}>Loading Workspace...</p>
        </div>
      </div>
    );
  }

  // If unauthenticated, display Register or Login screen
  if (!isAuthenticated) {
    if (authView === 'register') {
      return (
        <Register
          initialRole="user"
          onSwitchToLogin={(loginData) => {
            if (loginData) {
              setLoginInitialEmail(loginData.prefillEmail || '');
              setLoginSuccessMsg(loginData.successMessage || '');
            } else {
              setLoginSuccessMsg('');
            }
            setAuthView('login');
          }}
        />
      );
    }

    return (
      <Login
        onSwitchToRegister={() => {
          setLoginSuccessMsg('');
          setAuthView('register');
        }}
        initialEmail={loginInitialEmail}
        initialSuccessMsg={loginSuccessMsg}
      />
    );
  }

  // Authenticated Layout
  return (
    <UserProvider>
      <TaskProvider>
        <AuthenticatedLayout
          activeSection={activeSection}
          handleSectionChange={handleSectionChange}
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
          isSuperAdmin={isSuperAdmin}
          isManager={isManager}
        />
      </TaskProvider>
    </UserProvider>
  );
};

export function App() {
  return (
    <AuthProvider>
      <MainApplication />
    </AuthProvider>
  );
}

export default App;
