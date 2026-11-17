import React, { useState, useEffect, useRef, lazy, Suspense, Component } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TaskProvider, useTasks } from './context/TaskContext';
import { UserProvider } from './context/UserContext';
import { LeadProvider, useLeads } from './context/LeadContext';
import { OpportunityProvider, useOpportunities } from './context/OpportunityContext';
import { SubscriptionProvider } from './context/SubscriptionContext';
import { ComplaintProvider, useComplaints } from './context/ComplaintContext';
import { ProjectProvider, useProjects } from './context/ProjectContext';
import { Login } from './components/Login';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { RealtimeToast } from './components/RealtimeToast';
import { AlertTriangle, RefreshCw } from 'lucide-react';

// Resilient Dynamic Import Loader with auto-retry on transient chunk/network errors
const lazyWithRetry = (componentImport) =>
  lazy(async () => {
    try {
      return await componentImport();
    } catch (error) {
      console.warn('[Dynamic Import Retry] Retrying module load...', error);
      // Brief delay in case Vite dev server or hot reloader was reconnecting
      await new Promise((resolve) => setTimeout(resolve, 350));
      try {
        return await componentImport();
      } catch (retryError) {
        console.error('[Dynamic Import Failed]', retryError);
        throw retryError;
      }
    }
  });

// Defensive Error Boundary to catch any isolated view/modal crash and prevent white screen
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[TaskFlow ErrorBoundary caught error]:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div
          style={{
            padding: '32px 24px',
            textAlign: 'center',
            margin: '32px auto',
            maxWidth: '520px',
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #fee2e2',
            boxShadow: '0 10px 25px -5px rgba(239, 68, 68, 0.1)',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: '#fee2e2',
              color: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 14px auto',
            }}
          >
            <AlertTriangle size={24} />
          </div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', color: '#0f172a', fontWeight: 800 }}>
            Unable to display component
          </h3>
          <p style={{ margin: '0 0 18px 0', fontSize: '0.84rem', color: '#64748b', lineHeight: 1.5 }}>
            {this.state.error?.message || 'A network blip or resource bottleneck occurred while loading this view.'}
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={this.handleReset}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '8px',
                backgroundColor: '#f1f5f9',
                color: '#334155',
                border: '1px solid #cbd5e1',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer',
              }}
            >
              <RefreshCw size={14} />
              <span>Retry</span>
            </button>
            <button
              type="button"
              onClick={this.handleReload}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 18px',
                borderRadius: '8px',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer',
              }}
            >
              <span>Reload Page</span>
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Code-split & Lazy-loaded Dashboard and Workspace Views (with retry resilience)
const SuperAdminDashboard = lazyWithRetry(() =>
  import('./components/SuperAdmin/SuperAdminDashboard').then((m) => ({ default: m.SuperAdminDashboard }))
);
const ManagerDashboard = lazyWithRetry(() =>
  import('./components/ManagerDashboard/ManagerDashboard').then((m) => ({ default: m.ManagerDashboard }))
);
const OrganizationHierarchy = lazyWithRetry(() =>
  import('./components/TeamHierarchy/OrganizationHierarchy').then((m) => ({ default: m.OrganizationHierarchy }))
);
const TaskList = lazyWithRetry(() =>
  import('./components/TaskManagement/TaskList').then((m) => ({ default: m.TaskList }))
);
const UserSection = lazyWithRetry(() =>
  import('./components/UserSection').then((m) => ({ default: m.UserSection }))
);
const UserWorkspace = lazyWithRetry(() =>
  import('./components/UserWorkspace/UserWorkspace').then((m) => ({ default: m.UserWorkspace }))
);
const ApprovalSection = lazyWithRetry(() =>
  import('./components/SuperAdmin/ApprovalSection').then((m) => ({ default: m.ApprovalSection }))
);
const LeadSection = lazyWithRetry(() =>
  import('./components/Leads/LeadSection').then((m) => ({ default: m.LeadSection }))
);
const ComplaintSection = lazyWithRetry(() =>
  import('./components/Complaints/ComplaintSection').then((m) => ({ default: m.ComplaintSection || m.default }))
);
const ProjectSection = lazyWithRetry(() =>
  import('./components/Projects/ProjectSection').then((m) => ({ default: m.ProjectSection || m.default }))
);
const SubscriptionManagement = lazyWithRetry(() =>
  import('./components/Subscription/SubscriptionManagement').then((m) => ({ default: m.SubscriptionManagement || m.default }))
);

// Lazy-loaded Modals and Secondary Views (with retry resilience)
const Register = lazyWithRetry(() =>
  import('./components/Register').then((m) => ({ default: m.Register || m.default }))
);
const CommandPalette = lazyWithRetry(() =>
  import('./components/CommandPalette').then((m) => ({ default: m.CommandPalette || m.default }))
);
const TaskModal = lazyWithRetry(() =>
  import('./components/TaskManagement/TaskModal').then((m) => ({ default: m.TaskModal || m.default }))
);
const DeleteConfirmModal = lazyWithRetry(() =>
  import('./components/TaskManagement/DeleteConfirmModal').then((m) => ({ default: m.DeleteConfirmModal || m.default }))
);
const TaskDetailModal = lazyWithRetry(() =>
  import('./components/TaskManagement/TaskDetailModal').then((m) => ({ default: m.TaskDetailModal || m.default }))
);
const LeadModal = lazyWithRetry(() =>
  import('./components/Leads/LeadModal').then((m) => ({ default: m.LeadModal || m.default }))
);
const ConvertLeadModal = lazyWithRetry(() =>
  import('./components/Leads/ConvertLeadModal').then((m) => ({ default: m.ConvertLeadModal || m.default }))
);
const DeleteLeadModal = lazyWithRetry(() =>
  import('./components/Leads/DeleteLeadModal').then((m) => ({ default: m.DeleteLeadModal || m.default }))
);
const OpportunityModal = lazyWithRetry(() =>
  import('./components/Opportunities/OpportunityModal').then((m) => ({ default: m.OpportunityModal || m.default }))
);
const DeleteOpportunityModal = lazyWithRetry(() =>
  import('./components/Opportunities/DeleteOpportunityModal').then((m) => ({ default: m.DeleteOpportunityModal || m.default }))
);
const ComplaintModal = lazyWithRetry(() =>
  import('./components/Complaints/ComplaintModal').then((m) => ({ default: m.ComplaintModal || m.default }))
);
const ResolveComplaintModal = lazyWithRetry(() =>
  import('./components/Complaints/ResolveComplaintModal').then((m) => ({ default: m.ResolveComplaintModal || m.default }))
);
const DeleteComplaintModal = lazyWithRetry(() =>
  import('./components/Complaints/DeleteComplaintModal').then((m) => ({ default: m.DeleteComplaintModal || m.default }))
);
const PublicComplaintPortal = lazyWithRetry(() =>
  import('./components/Complaints/PublicComplaintPortal').then((m) => ({ default: m.PublicComplaintPortal || m.default }))
);
const PublicTicketTracker = lazyWithRetry(() =>
  import('./components/Complaints/PublicTicketTracker').then((m) => ({ default: m.PublicTicketTracker || m.default }))
);
const ProjectModal = lazyWithRetry(() =>
  import('./components/Projects/ProjectModal').then((m) => ({ default: m.ProjectModal || m.default }))
);
const MilestonesModal = lazyWithRetry(() =>
  import('./components/Projects/MilestonesModal').then((m) => ({ default: m.MilestonesModal || m.default }))
);
const DeleteProjectModal = lazyWithRetry(() =>
  import('./components/Projects/DeleteProjectModal').then((m) => ({ default: m.DeleteProjectModal || m.default }))
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
  const {
    liveToast,
    dismissLiveToast,
    isTaskModalOpen,
    isDeleteModalOpen: isTaskDeleteModalOpen,
    isViewModalOpen: isTaskDetailModalOpen,
  } = useTasks();

  const {
    isLeadModalOpen,
    isConvertModalOpen: isLeadConvertModalOpen,
    isDeleteModalOpen: isLeadDeleteModalOpen,
  } = useLeads();

  const {
    isOpportunityModalOpen,
    isDeleteModalOpen: isOppDeleteModalOpen,
  } = useOpportunities();

  const {
    isCreateModalOpen: isComplaintCreateOpen,
    isEditModalOpen: isComplaintEditOpen,
    isResolveModalOpen: isComplaintResolveOpen,
    isDeleteModalOpen: isComplaintDeleteOpen,
  } = useComplaints();

  const {
    isCreateModalOpen: isProjectCreateOpen,
    isEditModalOpen: isProjectEditOpen,
    isMilestonesModalOpen: isProjectMilestonesOpen,
    isDeleteModalOpen: isProjectDeleteOpen,
  } = useProjects();

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
      {/* Global Modals: Only dynamically imported & mounted when active, eliminating initial network congestion and ERR_INSUFFICIENT_RESOURCES */}
      <ErrorBoundary fallback={null}>
        <Suspense fallback={null}>
          {isCommandPaletteOpen && (
            <CommandPalette
              isOpen={isCommandPaletteOpen}
              onClose={() => setIsCommandPaletteOpen(false)}
              setActiveSection={handleSectionChange}
            />
          )}
          {isTaskModalOpen && <TaskModal />}
          {isTaskDeleteModalOpen && <DeleteConfirmModal />}
          {isTaskDetailModalOpen && <TaskDetailModal />}
          {isLeadModalOpen && <LeadModal />}
          {isLeadConvertModalOpen && <ConvertLeadModal />}
          {isLeadDeleteModalOpen && <DeleteLeadModal />}
          {isOpportunityModalOpen && <OpportunityModal />}
          {isOppDeleteModalOpen && <DeleteOpportunityModal />}
          {(isComplaintCreateOpen || isComplaintEditOpen) && <ComplaintModal />}
          {isComplaintResolveOpen && <ResolveComplaintModal />}
          {isComplaintDeleteOpen && <DeleteComplaintModal />}
          {(isProjectCreateOpen || isProjectEditOpen) && <ProjectModal />}
          {isProjectMilestonesOpen && <MilestonesModal />}
          {isProjectDeleteOpen && <DeleteProjectModal />}
        </Suspense>
      </ErrorBoundary>

      {/* Real-time floating toast alert */}
      <RealtimeToast
        toast={liveToast}
        onClose={dismissLiveToast}
        onAction={() => {
          const toastType = liveToast?.type;
          const complaintId = liveToast?.complaintId;
          const ticketNumber = liveToast?.complaintTicketNumber || liveToast?.ticketNumber;
          dismissLiveToast();
          if (toastType === 'complaint_escalated' || liveToast?.taskType === 'complaint') {
            handleSectionChange('complaints');
            if (complaintId || ticketNumber) {
              window.dispatchEvent(
                new CustomEvent('open-complaint-detail', {
                  detail: { complaintId, ticketNumber },
                })
              );
            }
          } else if (toastType === 'user_registered' && (isSuperAdmin || isManager)) {
            handleSectionChange('approvals');
          } else if (
            toastType === 'lead_assigned' ||
            toastType === 'new_lead' ||
            toastType === 'lead_created' ||
            liveToast?.taskType === 'lead'
          ) {
            handleSectionChange('leads');
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
            <ErrorBoundary>
              <Suspense fallback={<SectionSkeletonLoader />}>
                {isSuperAdmin ? (
                  /* Super Admin Sections */
                  <>
                    {activeSection === 'superadmin' && <SuperAdminDashboard setActiveSection={handleSectionChange} />}
                    {activeSection === 'hierarchy' && <OrganizationHierarchy setActiveSection={handleSectionChange} />}
                    {(activeSection === 'employees' || activeSection === 'user') && <UserSection />}
                    {activeSection === 'tasks' && <TaskList />}
                    {activeSection === 'leads' && <LeadSection />}
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
                    {activeSection === 'complaints' && <ComplaintSection />}
                    {activeSection === 'projects' && <ProjectSection />}
                    {activeSection === 'subscription' && <SubscriptionManagement />}
                  </>
                ) : (
                  /* User / Coordinator Sections */
                  <>
                    {activeSection === 'user-workspace' && <UserWorkspace setActiveSection={handleSectionChange} />}
                    {activeSection === 'hierarchy' && <OrganizationHierarchy setActiveSection={handleSectionChange} />}
                    {(activeSection === 'employees' || activeSection === 'user') && <UserSection />}
                    {activeSection === 'tasks' && <TaskList />}
                    {activeSection === 'leads' && <LeadSection />}
                    {activeSection === 'complaints' && <ComplaintSection />}
                    {activeSection === 'projects' && <ProjectSection />}
                    {activeSection === 'subscription' && <SubscriptionManagement />}
                  </>
                )}
              </Suspense>
            </ErrorBoundary>
          </main>
        </div>
      </div>
    </>
  );
};

const MainApplication = () => {
  const { isAuthenticated, user, isSuperAdmin, isManager } = useAuth();

  // Unauthenticated view toggle: default to 'login', or support/track from hash
  const [authView, setAuthView] = useState(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.toLowerCase();
      const path = window.location.pathname.toLowerCase();
      if (hash === '#support' || path === '/support') return 'support';
      if (hash === '#track' || path === '/track') return 'track';
    }
    return 'login';
  });
  const [loginInitialEmail, setLoginInitialEmail] = useState('');
  const [loginSuccessMsg, setLoginSuccessMsg] = useState('');

  // Handle URL hash changes for public access (#support, #track)
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.toLowerCase();
      const path = window.location.pathname.toLowerCase();
      if (hash === '#support' || path === '/support') {
        setAuthView('support');
      } else if (hash === '#track' || path === '/track') {
        setAuthView('track');
      }
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Preload dashboard code-chunks in the background when on unauthenticated screen
  useEffect(() => {
    if (!isAuthenticated) {
      const timer = setTimeout(() => {
        import('./components/SuperAdmin/SuperAdminDashboard');
        import('./components/ManagerDashboard/ManagerDashboard');
        import('./components/UserWorkspace/UserWorkspace');
      }, 50);
      return () => clearTimeout(timer);
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
    'complaints',
    'projects',
    'subscription',
    'approvals',
  ];

  // Set active section directly to respective role's dashboard
  const [activeSection, setActiveSection] = useState(() => {
    if (isSuperAdmin) return 'superadmin';
    if (isManager) return 'manager';
    return 'user-workspace';
  });

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const prevUserIdRef = useRef(null);

  // Directly display dashboard when user/manager/super admin logs in
  useEffect(() => {
    if (user) {
      const currentUserId = (user._id || user.id || '').toString();
      // On fresh login or user switch -> direct display to role's dashboard
      if (prevUserIdRef.current !== currentUserId) {
        prevUserIdRef.current = currentUserId;
        const targetDashboard = isSuperAdmin
          ? 'superadmin'
          : isManager
          ? 'manager'
          : 'user-workspace';
        setActiveSection(targetDashboard);
        try {
          localStorage.setItem('taskflow_active_section', targetDashboard);
          sessionStorage.setItem('taskflow_active_section', targetDashboard);
        } catch {}
      } else {
        // Enforce role-based access on existing active section
        setActiveSection((prev) => {
          let next = prev;
          if (
            (prev === 'superadmin' && !isSuperAdmin) ||
            (prev === 'manager' && !isManager) ||
            !validSections.includes(prev)
          ) {
            next = isSuperAdmin ? 'superadmin' : isManager ? 'manager' : 'user-workspace';
          }
          try {
            localStorage.setItem('taskflow_active_section', next);
            sessionStorage.setItem('taskflow_active_section', next);
          } catch {}
          return next;
        });
      }
    } else {
      prevUserIdRef.current = null;
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

    if (authView === 'support') {
      return (
        <Suspense fallback={<div style={{ minHeight: '100vh', background: '#f8fafc' }} />}>
          <PublicComplaintPortal
            onGoToLogin={() => {
              try { window.location.hash = ''; } catch {}
              setAuthView('login');
            }}
            onGoToTrack={() => {
              try { window.location.hash = 'track'; } catch {}
              setAuthView('track');
            }}
          />
        </Suspense>
      );
    }

    if (authView === 'track') {
      return (
        <Suspense fallback={<div style={{ minHeight: '100vh', background: '#f8fafc' }} />}>
          <PublicTicketTracker
            onGoToLogin={() => {
              try { window.location.hash = ''; } catch {}
              setAuthView('login');
            }}
            onBackToSubmit={() => {
              try { window.location.hash = 'support'; } catch {}
              setAuthView('support');
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
        onSwitchToSupport={() => {
          try { window.location.hash = 'support'; } catch {}
          setAuthView('support');
        }}
        onSwitchToTrack={() => {
          try { window.location.hash = 'track'; } catch {}
          setAuthView('track');
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
