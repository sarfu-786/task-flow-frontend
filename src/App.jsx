import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TaskProvider, useTasks } from './context/TaskContext';
import { UserProvider } from './context/UserContext';
import { Login } from './components/Login';
import { Register } from './components/Register';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { ManagerDashboard } from './components/ManagerDashboard/ManagerDashboard';
import { TaskList } from './components/TaskManagement/TaskList';
import { UserSection } from './components/UserSection';
import { UserWorkspace } from './components/UserWorkspace/UserWorkspace';
import { UserProfile } from './components/UserWorkspace/UserProfile';
import { ApprovalSection } from './components/ManagerDashboard/ApprovalSection';

import { RealtimeToast } from './components/RealtimeToast';

const AuthenticatedLayout = ({
  activeSection,
  handleSectionChange,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  isManager,
}) => {
  const { liveToast, dismissLiveToast } = useTasks();

  return (
    <>
      {/* Real-time floating instant toast alert */}
      <RealtimeToast
        toast={liveToast}
        onClose={dismissLiveToast}
        onAction={() => {
          dismissLiveToast();
          if (isManager) {
            handleSectionChange('manager');
          } else {
            handleSectionChange('user-workspace');
          }
        }}
      />

      <div className="app-container">
        {/* Dynamic Role-Based Sidebar with Mobile Drawer support */}
        <Sidebar
          activeSection={activeSection}
          setActiveSection={handleSectionChange}
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
        />

        <div className="main-content">
          {/* Top Navbar with Mobile Hamburger */}
          <Navbar
            activeSection={activeSection}
            setActiveSection={handleSectionChange}
            isMobileMenuOpen={isMobileMenuOpen}
            setIsMobileMenuOpen={setIsMobileMenuOpen}
          />

          {/* Dynamic Section Routing: */}
          <main className="page-body">
            {isManager ? (
              <>
                {activeSection === 'user' && <UserSection />}
                {activeSection === 'tasks' && <TaskList />}
                {activeSection === 'approvals' && <ApprovalSection />}
                {activeSection === 'user-profile' && <UserProfile />}
                {(activeSection === 'manager' || !['user', 'tasks', 'approvals', 'user-profile'].includes(activeSection)) && (
                  <ManagerDashboard setActiveSection={handleSectionChange} />
                )}
              </>
            ) : (
              <>
                {activeSection === 'user-profile' ? (
                  <UserProfile />
                ) : (
                  <UserWorkspace />
                )}
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
  const isManager = user && ['Manager', 'Executive', 'Administrator'].includes(user.role);

  // Unauthenticated view toggle: default to 'login' so visiting the website lands on direct login page
  const [authView, setAuthView] = useState('login');
  const [loginInitialEmail, setLoginInitialEmail] = useState('');
  const [loginInitialRole, setLoginInitialRole] = useState('manager');
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
        if (isManager && ['manager', 'user', 'tasks', 'approvals', 'user-profile'].includes(savedSection)) {
          return savedSection;
        }
        if (!isManager && ['user-workspace', 'user-profile'].includes(savedSection)) {
          return savedSection;
        }
      }
    } catch {
      // ignore storage access error
    }
    return isManager ? 'manager' : 'user-workspace';
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (user) {
      const managerRole = ['Manager', 'Executive', 'Administrator'].includes(user.role);
      setActiveSection((prev) => {
        let next = prev;
        if (managerRole) {
          if (!['manager', 'user', 'tasks', 'approvals', 'user-profile'].includes(prev)) {
            next = 'manager';
          }
        } else {
          if (!['user-workspace', 'user-profile'].includes(prev)) {
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
          background: '#f8fafc',
          color: '#475569',
          fontFamily: 'var(--font-main)',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              border: '3px solid rgba(37, 99, 235, 0.15)',
              borderTopColor: '#2563eb',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px',
            }}
          />
          <p style={{ fontWeight: 600, color: '#0f172a' }}>Initializing TaskFlow Pro...</p>
        </div>
      </div>
    );
  }

  // If unauthenticated, display the Register or Login screen
  if (!isAuthenticated) {
    if (authView === 'register') {
      return (
        <Register
          initialRole={loginInitialRole}
          onSwitchToLogin={(loginData) => {
            if (loginData) {
              setLoginInitialEmail(loginData.prefillEmail || '');
              setLoginInitialRole(loginData.initialRole || 'user');
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
        onSwitchToRegister={(role) => {
          setLoginSuccessMsg('');
          if (role) setLoginInitialRole(role);
          setAuthView('register');
        }}
        initialEmail={loginInitialEmail}
        initialRole={loginInitialRole}
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
