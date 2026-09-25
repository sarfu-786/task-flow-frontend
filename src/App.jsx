import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TaskProvider, useTasks } from './context/TaskContext';
import { UserProvider } from './context/UserContext';
import { LeadProvider } from './context/LeadContext';
import { OpportunityProvider } from './context/OpportunityContext';
import { SubscriptionProvider } from './context/SubscriptionContext';
import { ComplaintProvider } from './context/ComplaintContext';
import { ProjectProvider } from './context/ProjectContext';
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
import { LeadSection } from './components/Leads/LeadSection';
import { OpportunitySection } from './components/Opportunities/OpportunitySection';
import { ComplaintSection } from './components/Complaints/ComplaintSection';
import { ComplaintModal } from './components/Complaints/ComplaintModal';
import { ResolveComplaintModal } from './components/Complaints/ResolveComplaintModal';
import { DeleteComplaintModal } from './components/Complaints/DeleteComplaintModal';
import { ProjectSection } from './components/Projects/ProjectSection';
import { ProjectModal } from './components/Projects/ProjectModal';
import { MilestonesModal } from './components/Projects/MilestonesModal';
import { DeleteProjectModal } from './components/Projects/DeleteProjectModal';
import { SubscriptionManagement } from './components/Subscription/SubscriptionManagement';
import { RealtimeToast } from './components/RealtimeToast';
import { TaskModal } from './components/TaskManagement/TaskModal';
import { DeleteConfirmModal } from './components/TaskManagement/DeleteConfirmModal';
import { TaskDetailModal } from './components/TaskManagement/TaskDetailModal';
import { CommandPalette } from './components/CommandPalette';

const AuthenticatedLayout = ({
  activeSection,
  handleSectionChange,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  isSuperAdmin,
  isManager,
}) => {
  const { liveToast, dismissLiveToast } = useTasks();
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Global Ctrl+K / Cmd+K and custom event listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };

    const handleCustomOpen = () => {
      setIsCommandPaletteOpen(true);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('open-command-palette', handleCustomOpen);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('open-command-palette', handleCustomOpen);
    };
  }, []);

  return (
    <>
      {/* Global Spotlight Command Palette (Ctrl+K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        setActiveSection={handleSectionChange}
      />

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

      {/* Global Modals for Tasks, Complaints, Projects */}
      <TaskModal />
      <DeleteConfirmModal />
      <TaskDetailModal />
      <ComplaintModal />
      <ResolveComplaintModal />
      <DeleteComplaintModal />
      <ProjectModal />
      <MilestonesModal />
      <DeleteProjectModal />

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
                {activeSection === 'leads' && <LeadSection />}
                {activeSection === 'opportunities' && <OpportunitySection />}
                {activeSection === 'complaints' && <ComplaintSection />}
                {activeSection === 'projects' && <ProjectSection />}
                {activeSection === 'subscription' && <SubscriptionManagement />}
                {activeSection === 'approvals' && <ApprovalSection />}
              </>
            ) : isManager ? (
              /* Manager Sections */
              <>
                {activeSection === 'manager' && <ManagerDashboard setActiveSection={handleSectionChange} />}
                {activeSection === 'hierarchy' && <OrganizationHierarchy setActiveSection={handleSectionChange} />}
                {(activeSection === 'employees' || activeSection === 'user') && <UserSection />}
                {activeSection === 'tasks' && <TaskList />}
                {activeSection === 'leads' && <LeadSection />}
                {activeSection === 'opportunities' && <OpportunitySection />}
                {activeSection === 'complaints' && <ComplaintSection />}
                {activeSection === 'projects' && <ProjectSection />}
                {activeSection === 'subscription' && <SubscriptionManagement />}
                {activeSection === 'approvals' && <ApprovalSection />}
              </>
            ) : (
              /* User / Coordinator Sections */
              <>
                {activeSection === 'user-workspace' && <UserWorkspace setActiveSection={handleSectionChange} />}
                {activeSection === 'hierarchy' && <OrganizationHierarchy setActiveSection={handleSectionChange} />}
                {(activeSection === 'employees' || activeSection === 'user') && <UserSection />}
                {activeSection === 'tasks' && <TaskList />}
                {activeSection === 'leads' && <LeadSection />}
                {activeSection === 'opportunities' && <OpportunitySection />}
                {activeSection === 'complaints' && <ComplaintSection />}
                {activeSection === 'projects' && <ProjectSection />}
                {activeSection === 'subscription' && <SubscriptionManagement />}
              </>
            )}
          </main>
        </div>
      </div>
    </>
  );
};

const MainApplication = () => {
  const { isAuthenticated, loading, user, isSuperAdmin, isManager } = useAuth();

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

  const validSections = [
    'superadmin',
    'manager',
    'user-workspace',
    'hierarchy',
    'employees',
    'user',
    'tasks',
    'leads',
    'opportunities',
    'complaints',
    'projects',
    'subscription',
    'approvals',
  ];

  // Set active section depending on role and persisted preference
  const [activeSection, setActiveSection] = useState(() => {
    try {
      const savedSection = localStorage.getItem('taskflow_active_section');
      if (savedSection && validSections.includes(savedSection)) {
        return savedSection;
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
      setActiveSection((prev) => {
        let next = prev;
        if (!validSections.includes(prev)) {
          if (isSuperAdmin) next = 'superadmin';
          else if (isManager) next = 'manager';
          else next = 'user-workspace';
        }
        try {
          localStorage.setItem('taskflow_active_section', next);
        } catch {}
        return next;
      });
    }
  }, [user, isSuperAdmin, isManager]);

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
      <SubscriptionProvider>
        <TaskProvider>
          <LeadProvider>
            <OpportunityProvider>
              <ComplaintProvider>
                <ProjectProvider>
                  <AuthenticatedLayout
                    activeSection={activeSection}
                    handleSectionChange={handleSectionChange}
                    isMobileMenuOpen={isMobileMenuOpen}
                    setIsMobileMenuOpen={setIsMobileMenuOpen}
                    isSuperAdmin={isSuperAdmin}
                    isManager={isManager}
                  />
                </ProjectProvider>
              </ComplaintProvider>
            </OpportunityProvider>
          </LeadProvider>
        </TaskProvider>
      </SubscriptionProvider>
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


