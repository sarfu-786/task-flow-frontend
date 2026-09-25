import React, { useState, useEffect, lazy, Suspense } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TaskProvider, useTasks } from './context/TaskContext';
import { UserProvider } from './context/UserContext';
import { LeadProvider } from './context/LeadContext';
import { OpportunityProvider } from './context/OpportunityContext';
import { SubscriptionProvider } from './context/SubscriptionContext';
import { ComplaintProvider } from './context/ComplaintContext';
import { ProjectProvider } from './context/ProjectContext';
import { Login } from './components/Login';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { RealtimeToast } from './components/RealtimeToast';

// Code-split & Lazy-loaded Dashboard and Workspace Views
const SuperAdminDashboard = lazy(() =>
  import('./components/SuperAdmin/SuperAdminDashboard').then((m) => ({ default: m.SuperAdminDashboard }))
);
const ManagerDashboard = lazy(() =>
  import('./components/ManagerDashboard/ManagerDashboard').then((m) => ({ default: m.ManagerDashboard }))
);
const OrganizationHierarchy = lazy(() =>
  import('./components/TeamHierarchy/OrganizationHierarchy').then((m) => ({ default: m.OrganizationHierarchy }))
);
const TaskList = lazy(() =>
  import('./components/TaskManagement/TaskList').then((m) => ({ default: m.TaskList }))
);
const UserSection = lazy(() =>
  import('./components/UserSection').then((m) => ({ default: m.UserSection }))
);
const UserWorkspace = lazy(() =>
  import('./components/UserWorkspace/UserWorkspace').then((m) => ({ default: m.UserWorkspace }))
);
const ApprovalSection = lazy(() =>
  import('./components/ManagerDashboard/ApprovalSection').then((m) => ({ default: m.ApprovalSection }))
);
const LeadSection = lazy(() =>
  import('./components/Leads/LeadSection').then((m) => ({ default: m.LeadSection }))
);
const OpportunitySection = lazy(() =>
  import('./components/Opportunities/OpportunitySection').then((m) => ({ default: m.OpportunitySection }))
);
const ComplaintSection = lazy(() =>
  import('./components/Complaints/ComplaintSection').then((m) => ({ default: m.ComplaintSection }))
);
const ProjectSection = lazy(() =>
  import('./components/Projects/ProjectSection').then((m) => ({ default: m.ProjectSection }))
);
const SubscriptionManagement = lazy(() =>
  import('./components/Subscription/SubscriptionManagement').then((m) => ({ default: m.SubscriptionManagement }))
);

// Lazy-loaded Modals and Secondary Views
const Register = lazy(() =>
  import('./components/Register').then((m) => ({ default: m.Register }))
);
const CommandPalette = lazy(() =>
  import('./components/CommandPalette').then((m) => ({ default: m.CommandPalette }))
);
const TaskModal = lazy(() =>
  import('./components/TaskManagement/TaskModal').then((m) => ({ default: m.TaskModal }))
);
const DeleteConfirmModal = lazy(() =>
  import('./components/TaskManagement/DeleteConfirmModal').then((m) => ({ default: m.DeleteConfirmModal }))
);
const TaskDetailModal = lazy(() =>
  import('./components/TaskManagement/TaskDetailModal').then((m) => ({ default: m.TaskDetailModal }))
);
const ComplaintModal = lazy(() =>
  import('./components/Complaints/ComplaintModal').then((m) => ({ default: m.ComplaintModal }))
);
const ResolveComplaintModal = lazy(() =>
  import('./components/Complaints/ResolveComplaintModal').then((m) => ({ default: m.ResolveComplaintModal }))
);
const DeleteComplaintModal = lazy(() =>
  import('./components/Complaints/DeleteComplaintModal').then((m) => ({ default: m.DeleteComplaintModal }))
);
const ProjectModal = lazy(() =>
  import('./components/Projects/ProjectModal').then((m) => ({ default: m.ProjectModal }))
);
const MilestonesModal = lazy(() =>
  import('./components/Projects/MilestonesModal').then((m) => ({ default: m.MilestonesModal }))
);
const DeleteProjectModal = lazy(() =>
  import('./components/Projects/DeleteProjectModal').then((m) => ({ default: m.DeleteProjectModal }))
);

// High-speed, micro-shimmer section loading fallback
const SectionSkeletonLoader = () => (
  <div
    style={{
      padding: '24px',
      width: '100%',
      minHeight: '60vh',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      animation: 'fadeIn 0.15s ease',
    }}
  >
    {/* Header Skeleton */}
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: '16px',
        borderBottom: '1px solid #f1f5f9',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div
          style={{
            width: '180px',
            height: '24px',
            borderRadius: '6px',
            background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.2s infinite',
          }}
        />
        <div
          style={{
            width: '260px',
            height: '14px',
            borderRadius: '4px',
            background: '#f8fafc',
          }}
        />
      </div>
      <div
        style={{
          width: '110px',
          height: '36px',
          borderRadius: '8px',
          background: '#eff6ff',
        }}
      />
    </div>

    {/* Metric Cards Skeleton */}
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
      }}
    >
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          style={{
            height: '90px',
            borderRadius: '12px',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div
            style={{
              width: '60%',
              height: '14px',
              borderRadius: '4px',
              background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.2s infinite',
            }}
          />
          <div
            style={{
              width: '40%',
              height: '22px',
              borderRadius: '4px',
              background: '#f1f5f9',
            }}
          />
        </div>
      ))}
    </div>

    {/* Main Content Area Skeleton */}
    <div
      style={{
        flex: 1,
        minHeight: '260px',
        borderRadius: '12px',
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
      }}
    >
      {[1, 2, 3, 4, 5].map((row) => (
        <div
          key={row}
          style={{
            height: '40px',
            borderRadius: '8px',
            background: row % 2 === 0 ? '#f8fafc' : '#ffffff',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            padding: '0 12px',
          }}
        >
          <div
            style={{
              width: `${40 + (row * 10) % 40}%`,
              height: '14px',
              borderRadius: '4px',
              background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.2s infinite',
            }}
          />
        </div>
      ))}
    </div>
  </div>
);

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
      {/* Global Modals for Tasks, Complaints, Projects, Command Palette */}
      <Suspense fallback={null}>
        <CommandPalette
          isOpen={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
          setActiveSection={handleSectionChange}
        />
        <TaskModal />
        <DeleteConfirmModal />
        <TaskDetailModal />
        <ComplaintModal />
        <ResolveComplaintModal />
        <DeleteComplaintModal />
        <ProjectModal />
        <MilestonesModal />
        <DeleteProjectModal />
      </Suspense>

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

          {/* Dynamic Section Routing with fast shimmer fallback */}
          <main className="page-body">
            <Suspense fallback={<SectionSkeletonLoader />}>
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
            </Suspense>
          </main>
        </div>
      </div>
    </>
  );
};

const MainApplication = () => {
  const { isAuthenticated, user, isSuperAdmin, isManager } = useAuth();

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
      const savedSection =
        localStorage.getItem('taskflow_active_section') || sessionStorage.getItem('taskflow_active_section');
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
          sessionStorage.setItem('taskflow_active_section', next);
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
      sessionStorage.setItem('taskflow_active_section', section);
    } catch {}
    setIsMobileMenuOpen(false);
  };

  // If unauthenticated, display Register or Login screen
  if (!isAuthenticated) {
    if (authView === 'register') {
      return (
        <Suspense fallback={<div style={{ minHeight: '100vh', background: '#f8fafc' }} />}>
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
        </Suspense>
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
