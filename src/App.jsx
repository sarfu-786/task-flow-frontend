import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TaskProvider } from './context/TaskContext';
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

const MainApplication = () => {
  const { isAuthenticated, loading, user } = useAuth();
  const isManager = user && ['Manager', 'Executive', 'Administrator'].includes(user.role);

  // Unauthenticated view toggle: 'login' | 'register'
  const [authView, setAuthView] = useState('login');
  const [loginInitialEmail, setLoginInitialEmail] = useState('');
  const [loginInitialRole, setLoginInitialRole] = useState('manager');
  const [loginSuccessMsg, setLoginSuccessMsg] = useState('');

  // Set default active section depending on role
  const [activeSection, setActiveSection] = useState(isManager ? 'manager' : 'user-workspace');

  useEffect(() => {
    if (user) {
      const managerRole = ['Manager', 'Executive', 'Administrator'].includes(user.role);
      if (managerRole) {
        setActiveSection((prev) => (prev === 'user-workspace' || prev === 'user-profile' ? 'manager' : prev));
      } else {
        setActiveSection((prev) => (prev === 'manager' || prev === 'user' || prev === 'tasks' ? 'user-workspace' : prev));
      }
    }
  }, [user]);

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
        <div className="app-container">
          {/* Dynamic Role-Based Sidebar */}
          <Sidebar activeSection={activeSection} setActiveSection={setActiveSection} />

          <div className="main-content">
            {/* Top Navbar */}
            <Navbar activeSection={activeSection} setActiveSection={setActiveSection} />

            {/* Dynamic Section Routing:
                - Manager Portal:
                  - 'manager' -> Manager Dashboard
                  - 'user' -> Team Directory & Management
                  - 'tasks' -> All Tasks Hub
                - Employee Portal:
                  - 'user-workspace' -> My Assigned Work (assignment statistics, alert banner, horizontal drilldown tiles)
                  - 'user-profile' -> My Profile Details (credentials, department, security & account info)
            */}
            <main className="page-body">
              {/* Manager Sections */}
              {isManager && activeSection === 'manager' && (
                <ManagerDashboard setActiveSection={setActiveSection} />
              )}

              {isManager && activeSection === 'user' && (
                <UserSection />
              )}

              {isManager && activeSection === 'tasks' && (
                <TaskList />
              )}

              {/* User Sections */}
              {!isManager && activeSection === 'user-workspace' && (
                <UserWorkspace />
              )}

              {!isManager && activeSection === 'user-profile' && (
                <UserProfile />
              )}
            </main>
          </div>
        </div>
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
