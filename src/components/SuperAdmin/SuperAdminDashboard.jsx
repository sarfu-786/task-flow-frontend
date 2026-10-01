import React, { useState, useEffect, useMemo } from 'react';
import { useTasks } from '../../context/TaskContext';
import { useUserManagement } from '../../context/UserContext';
import { useLeads } from '../../context/LeadContext';
import { MetricCard } from '../ManagerDashboard/MetricCard';
import { UserWorkModal } from '../ManagerDashboard/UserWorkModal';
import { EmployeeDrilldownModal } from '../ManagerDashboard/EmployeeDrilldownModal';
import { ManagerTasksDrilldownModal } from '../ManagerDashboard/ManagerTasksDrilldownModal';
import { WorkProgressCharts } from '../common/WorkProgressCharts';
import {
  Users,
  CheckCircle2,
  Clock,
  ListTodo,
  Crown,
  ShieldCheck,
  FolderKanban,
  Briefcase,
  Target,
  AlertCircle,
  CheckSquare,
  UserCheck,
  Calendar,
  Activity,
} from 'lucide-react';

export const SuperAdminDashboard = ({ setActiveSection }) => {
  const { tasks } = useTasks();
  const { users, pendingApprovalsCount } = useUserManagement();
  const { leads } = useLeads();

  // Time filter state: 'all' | 'today' | 'week' | 'month'
  const [timeFilter, setTimeFilter] = useState('all');

  // Drilldown states
  const [selectedUserForWork, setSelectedUserForWork] = useState(null);
  const [userWorkFilter, setUserWorkFilter] = useState('all');
  const [isWorkModalOpen, setIsWorkModalOpen] = useState(false);

  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [employeeDeptFilter, setEmployeeDeptFilter] = useState('all');
  const [employeeRoleFilter, setEmployeeRoleFilter] = useState('all');
  const [employeeModalTitle, setEmployeeModalTitle] = useState('All Users');

  const [isTasksModalOpen, setIsTasksModalOpen] = useState(false);
  const [tasksFilter, setTasksFilter] = useState('all');
  const [tasksModalTitle, setTasksModalTitle] = useState('Tasks Overview');

  const openEmployeeDrilldown = (dept = 'all', title = 'Organization Users', role = 'all') => {
    setEmployeeDeptFilter(dept);
    setEmployeeRoleFilter(role);
    setEmployeeModalTitle(title);
    setIsEmployeeModalOpen(true);
  };

  const openTasksDrilldown = (status = 'all', title = 'Organization Tasks') => {
    setTasksFilter(status);
    setTasksModalTitle(title);
    setIsTasksModalOpen(true);
  };

  const openUserWork = (targetUser, filter = 'all') => {
    setSelectedUserForWork(targetUser);
    setUserWorkFilter(filter);
    setIsWorkModalOpen(true);
  };

  const closeUserWork = () => {
    setIsWorkModalOpen(false);
    setSelectedUserForWork(null);
  };

  // Lock body scroll when any drilldown modal is active
  useEffect(() => {
    if (isEmployeeModalOpen || isWorkModalOpen || isTasksModalOpen) {
      document.body.style.overflow = 'hidden';
      document.body.classList.add('modal-open');
    } else {
      document.body.style.overflow = 'unset';
      document.body.classList.remove('modal-open');
    }
    return () => {
      document.body.style.overflow = 'unset';
      document.body.classList.remove('modal-open');
    };
  }, [isEmployeeModalOpen, isWorkModalOpen, isTasksModalOpen]);

  // Active Approved Users
  const activeUsers = useMemo(() => {
    return (users || []).filter((u) => u.status !== 'Rejected' && u.status !== 'Pending');
  }, [users]);

  // Managers & Leadership
  const managers = useMemo(() => {
    return activeUsers.filter((u) => {
      const roles = Array.isArray(u.roles) && u.roles.length > 0 ? u.roles : [u.role || 'User'];
      return roles.some((r) => ['Manager', 'Executive', 'Administrator', 'Super Admin'].includes(r));
    });
  }, [activeUsers]);

  // Sales Coordinators
  const salesCoordinators = useMemo(() => {
    return activeUsers.filter((u) => {
      const roles = Array.isArray(u.roles) && u.roles.length > 0 ? u.roles : [u.role || 'User'];
      return roles.includes('Sales Coordinator') || u.role === 'Sales Coordinator';
    });
  }, [activeUsers]);

  // Service Coordinators
  const serviceCoordinators = useMemo(() => {
    return activeUsers.filter((u) => {
      const roles = Array.isArray(u.roles) && u.roles.length > 0 ? u.roles : [u.role || 'User'];
      return roles.includes('Service Coordinator') || u.role === 'Service Coordinator';
    });
  }, [activeUsers]);

  // Regular Staff
  const regularUsers = useMemo(() => {
    return activeUsers.filter((u) => {
      const roles = Array.isArray(u.roles) && u.roles.length > 0 ? u.roles : [u.role || 'User'];
      return roles.includes('User') || roles.length === 0 || u.role === 'User';
    });
  }, [activeUsers]);

  // Time-filtered tasks calculation
  const filteredTasks = useMemo(() => {
    if (timeFilter === 'all') return tasks || [];
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    if (timeFilter === 'today') {
      return (tasks || []).filter((t) => {
        const d = t.createdAt || t.updatedAt || t.dueDate;
        if (!d) return false;
        return new Date(d).getTime() >= todayStart;
      });
    }

    if (timeFilter === 'week') {
      const weekStart = todayStart - 7 * 24 * 60 * 60 * 1000;
      return (tasks || []).filter((t) => {
        const d = t.createdAt || t.updatedAt || t.dueDate;
        if (!d) return false;
        return new Date(d).getTime() >= weekStart;
      });
    }

    if (timeFilter === 'month') {
      const monthStart = todayStart - 30 * 24 * 60 * 60 * 1000;
      return (tasks || []).filter((t) => {
        const d = t.createdAt || t.updatedAt || t.dueDate;
        if (!d) return false;
        return new Date(d).getTime() >= monthStart;
      });
    }

    return tasks || [];
  }, [tasks, timeFilter]);

  // Overall Task Statistics
  const totalTasksCount = filteredTasks.length;
  const completedTasksCount = filteredTasks.filter((t) => t.status === 'Completed').length;
  const inProgressTasksCount = filteredTasks.filter((t) => t.status === 'In Progress').length;
  const todoTasksCount = filteredTasks.filter((t) => t.status === 'To Do' || !t.status).length;

  // Overdue Task Calculation
  const overdueTasks = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return (tasks || []).filter((t) => {
      if (t.status === 'Completed') return false;
      if (!t.dueDate) return false;
      return new Date(t.dueDate) < today;
    });
  }, [tasks]);

  // "Today's Work" Calculations
  const todayTasksDue = useMemo(() => {
    const todayStr = new Date().toDateString();
    return (tasks || []).filter((t) => {
      if (t.status === 'Completed') return false;
      if (!t.dueDate) return false;
      return new Date(t.dueDate).toDateString() === todayStr;
    });
  }, [tasks]);

  const todayTasksCompleted = useMemo(() => {
    const todayStr = new Date().toDateString();
    return (tasks || []).filter((t) => {
      if (t.status !== 'Completed') return false;
      const compDate = t.completedAt || t.updatedAt || t.createdAt;
      return compDate && new Date(compDate).toDateString() === todayStr;
    });
  }, [tasks]);

  const todayFollowUpsDue = useMemo(() => {
    const todayStr = new Date().toDateString();
    return (leads || []).filter((l) => {
      if (!l.next_follow_up) return false;
      return new Date(l.next_follow_up).toDateString() === todayStr;
    });
  }, [leads]);

  const leadsRequiringAction = useMemo(() => {
    return (leads || []).filter((l) => {
      if (l.status === 'New') return true;
      if (l.status === 'Follow-Up' || l.status === 'Follow_Up') {
        if (!l.next_follow_up) return true;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return new Date(l.next_follow_up) <= today;
      }
      return false;
    });
  }, [leads]);



  return (
    <div className="super-admin-dashboard fade-in" style={{ padding: '2px 0 20px 0' }}>
      {/* 1. Header Command Banner with Timeframe Filter */}
      <div
        style={{
          marginBottom: '12px',
          padding: '12px 18px',
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-card)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
            <span
              className="badge-official"
              style={{
                background: '#fef3c7',
                color: '#b45309',
                borderColor: '#fde68a',
                borderRadius: '999px',
                padding: '2px 8px',
                fontSize: '0.72rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Crown size={11} />
              <span>Super Admin Console</span>
            </span>
            <span
              className="badge-official badge-blue"
              style={{ borderRadius: '999px', padding: '2px 8px', fontSize: '0.72rem', fontWeight: 700 }}
            >
              {activeUsers.length} Active Personnel
            </span>
          </div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Organization Command Center
          </h1>
        </div>

        {/* Action Toolbar with Period Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Non-destructive Timeframe Toggle */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              background: '#f1f5f9',
              padding: '2px',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              gap: '2px',
            }}
          >
            {[
              { id: 'all', label: 'All Time' },
              { id: 'today', label: 'Today' },
              { id: 'week', label: 'This Week' },
              { id: 'month', label: 'This Month' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setTimeFilter(tab.id)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '8px',
                  fontSize: '0.75rem',
                  fontWeight: timeFilter === tab.id ? 700 : 600,
                  color: timeFilter === tab.id ? '#2563eb' : '#64748b',
                  background: timeFilter === tab.id ? '#ffffff' : 'transparent',
                  border: 'none',
                  boxShadow: timeFilter === tab.id ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 12px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '999px',
              fontSize: '0.76rem',
              fontWeight: 700,
              color: '#334155',
            }}
          >
            <CheckSquare size={13} color="#2563eb" />
            <span>{totalTasksCount} Total Tasks</span>
          </span>
        </div>
      </div>

      {/* 2. Pending Registration Approvals Callout Banner (If Pending) */}
      {pendingApprovalsCount > 0 && (
        <div
          style={{
            marginBottom: '12px',
            padding: '12px 18px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #fffbeb, #fef3c7)',
            border: '1.5px solid #fde68a',
            boxShadow: '0 3px 10px rgba(217, 119, 6, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            animation: 'fadeIn 0.25s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: '#d97706',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 2px 6px rgba(217, 119, 6, 0.25)',
              }}
            >
              <UserCheck size={18} />
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: '#78350f' }}>
                {pendingApprovalsCount} Registration {pendingApprovalsCount === 1 ? 'Request' : 'Requests'} Awaiting Approval
              </h4>
              <p style={{ margin: '1px 0 0', fontSize: '0.78rem', color: '#92400e' }}>
                New employee sign-ups are waiting in queue. As Super Admin, review applicant credentials and grant system access.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setActiveSection && setActiveSection('approvals')}
            style={{
              padding: '7px 14px',
              borderRadius: '8px',
              background: '#d97706',
              color: '#ffffff',
              border: 'none',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              boxShadow: '0 2px 6px rgba(217, 119, 6, 0.2)',
              transition: 'all 0.15s ease',
            }}
          >
            <UserCheck size={14} />
            <span>Review & Approve ({pendingApprovalsCount})</span>
          </button>
        </div>
      )}

      {/* 3. Existing 8 KPI Metric Cards (Preserved 100% Functionality & Click Handlers) */}
      <div
        className="stats-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 210px), 1fr))',
          gap: '12px',
          marginBottom: '14px',
        }}
      >
        {/* Card 1: Total Personnel */}
        <MetricCard
          title="Total Personnel"
          value={activeUsers.length}
          subtitle="Registered & Active Roster"
          icon={Users}
          color="#0f172a"
          bgLight="#f8fafc"
          isClickable={true}
          compact={true}
          onClick={() => openEmployeeDrilldown('all', 'All Organization Personnel', 'all')}
        />

        {/* Card 2: Managers & Leadership */}
        <MetricCard
          title="Managers & Leadership"
          value={managers.length}
          subtitle="Supervisors & Admins"
          icon={ShieldCheck}
          color="#2563eb"
          bgLight="#eff6ff"
          isClickable={true}
          compact={true}
          onClick={() => openEmployeeDrilldown('all', 'Managers & Leadership Roster', 'managers')}
        />

        {/* Card 3: Regular Staff */}
        <MetricCard
          title="Regular Staff"
          value={regularUsers.length}
          subtitle="Core Operations Team"
          icon={Briefcase}
          color="#7c3aed"
          bgLight="#f5f3ff"
          isClickable={true}
          compact={true}
          onClick={() => openEmployeeDrilldown('all', 'Regular Staff Directory', 'regular')}
        />

        {/* Card 4: Service Coordinators */}
        <MetricCard
          title="Service Coordinators"
          value={serviceCoordinators.length}
          subtitle="Complaints & SLA Support"
          icon={AlertCircle}
          color="#dc2626"
          bgLight="#fef2f2"
          isClickable={true}
          compact={true}
          onClick={() => openEmployeeDrilldown('all', 'Service Coordinators Directory', 'service')}
        />

        {/* Card 5: Total Assigned Tasks */}
        <MetricCard
          title="Total Assigned Tasks"
          value={totalTasksCount}
          subtitle="All Active Workflows"
          icon={ListTodo}
          color="#4f46e5"
          bgLight="#eef2ff"
          isClickable={true}
          compact={true}
          onClick={() => openTasksDrilldown('all', 'Organization Tasks Overview')}
        />

        {/* Card 6: In Progress Work */}
        <MetricCard
          title="In Progress Work"
          value={inProgressTasksCount}
          subtitle="Active ongoing execution"
          icon={Clock}
          color="#d97706"
          bgLight="#fffbeb"
          isClickable={true}
          compact={true}
          onClick={() => openTasksDrilldown('In Progress', 'In Progress Workflows')}
        />

        {/* Card 7: Completed Tasks */}
        <MetricCard
          title="Completed Tasks"
          value={completedTasksCount}
          subtitle="Delivered & Signed Off"
          icon={CheckCircle2}
          color="#059669"
          bgLight="#ecfdf5"
          isClickable={true}
          compact={true}
          onClick={() => openTasksDrilldown('Completed', 'Completed Workflows')}
        />

        {/* Card 8: Pending Queue */}
        <MetricCard
          title="Pending Queue"
          value={todoTasksCount}
          subtitle="Awaiting Task Execution"
          icon={FolderKanban}
          color="#6366f1"
          bgLight="#f5f3ff"
          isClickable={true}
          compact={true}
          onClick={() => openTasksDrilldown('To Do', 'Pending Queue Tasks')}
        />
      </div>

      {/* 4. WORK PROGRESS & COMPLETION VISUALIZATIONS */}
      <WorkProgressCharts tasks={filteredTasks} openTasksDrilldown={openTasksDrilldown} />

      {/* 5. TODAY'S WORK SECTION */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '20px',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-card)',
          padding: '20px 24px',
          marginBottom: '24px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={18} color="#2563eb" />
            <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Today's Work
            </h2>
            <span
              style={{
                fontSize: '0.74rem',
                fontWeight: 600,
                color: '#64748b',
                background: '#f1f5f9',
                padding: '2px 8px',
                borderRadius: '6px',
              }}
            >
              {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
          </div>
          <span style={{ fontSize: '0.76rem', color: '#94a3b8', fontWeight: 600 }}>
            Real-time daily operations snapshot
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))',
            gap: '12px',
          }}
        >
          {/* Mini Card 1: Tasks Due Today */}
          <div
            onClick={() => openTasksDrilldown('all', "Tasks Due Today")}
            style={{
              padding: '14px 16px',
              borderRadius: '14px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              cursor: 'pointer',
              transition: 'all 0.18s ease',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#2563eb';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#e2e8f0';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                Tasks Due Today
              </span>
              <Clock size={16} color="#2563eb" />
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a' }}>
              {todayTasksDue.length}
            </div>
          </div>

          {/* Mini Card 2: Overdue Tasks */}
          <div
            onClick={() => openTasksDrilldown('all', 'Overdue Tasks Queue')}
            style={{
              padding: '14px 16px',
              borderRadius: '14px',
              background: overdueTasks.length > 0 ? '#fef2f2' : '#f8fafc',
              border: `1px solid ${overdueTasks.length > 0 ? '#fecaca' : '#e2e8f0'}`,
              cursor: 'pointer',
              transition: 'all 0.18s ease',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#dc2626';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = overdueTasks.length > 0 ? '#fecaca' : '#e2e8f0';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.76rem', fontWeight: 700, color: overdueTasks.length > 0 ? '#b91c1c' : '#475569', textTransform: 'uppercase' }}>
                Overdue Tasks
              </span>
              <AlertCircle size={16} color={overdueTasks.length > 0 ? '#dc2626' : '#94a3b8'} />
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: overdueTasks.length > 0 ? '#dc2626' : '#0f172a' }}>
              {overdueTasks.length}
            </div>
          </div>

          {/* Mini Card 3: Tasks Completed Today */}
          <div
            onClick={() => openTasksDrilldown('Completed', 'Tasks Completed Today')}
            style={{
              padding: '14px 16px',
              borderRadius: '14px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              cursor: 'pointer',
              transition: 'all 0.18s ease',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#059669';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#e2e8f0';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                Completed Today
              </span>
              <CheckCircle2 size={16} color="#059669" />
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a' }}>
              {todayTasksCompleted.length}
            </div>
          </div>

          {/* Mini Card 4: Follow-ups Due Today */}
          <div
            onClick={() => setActiveSection && setActiveSection('leads')}
            style={{
              padding: '14px 16px',
              borderRadius: '14px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              cursor: 'pointer',
              transition: 'all 0.18s ease',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#0284c7';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#e2e8f0';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                Follow-ups Today
              </span>
              <Target size={16} color="#0284c7" />
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a' }}>
              {todayFollowUpsDue.length}
            </div>
          </div>

          {/* Mini Card 5: Leads Requiring Action */}
          <div
            onClick={() => setActiveSection && setActiveSection('leads')}
            style={{
              padding: '14px 16px',
              borderRadius: '14px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              cursor: 'pointer',
              transition: 'all 0.18s ease',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#7c3aed';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#e2e8f0';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                Leads In Pipeline
              </span>
              <Activity size={16} color="#7c3aed" />
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a' }}>
              {leadsRequiringAction.length}
            </div>
          </div>

          {/* Mini Card 6: Pending Approvals */}
          <div
            onClick={() => setActiveSection && setActiveSection('approvals')}
            style={{
              padding: '14px 16px',
              borderRadius: '14px',
              background: pendingApprovalsCount > 0 ? '#fffbeb' : '#f8fafc',
              border: `1px solid ${pendingApprovalsCount > 0 ? '#fde68a' : '#e2e8f0'}`,
              cursor: 'pointer',
              transition: 'all 0.18s ease',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#d97706';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = pendingApprovalsCount > 0 ? '#fde68a' : '#e2e8f0';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.76rem', fontWeight: 700, color: pendingApprovalsCount > 0 ? '#b45309' : '#475569', textTransform: 'uppercase' }}>
                Approvals Queue
              </span>
              <UserCheck size={16} color={pendingApprovalsCount > 0 ? '#d97706' : '#94a3b8'} />
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: pendingApprovalsCount > 0 ? '#d97706' : '#0f172a' }}>
              {pendingApprovalsCount || 0}
            </div>
          </div>
        </div>
      </div>



      {/* Drilldown Modals (Opened on specific card clicks - Preserved 100%) */}
      <EmployeeDrilldownModal
        isOpen={isEmployeeModalOpen}
        onClose={() => setIsEmployeeModalOpen(false)}
        initialDepartmentFilter={employeeDeptFilter}
        roleFilter={employeeRoleFilter}
        modalTitle={employeeModalTitle}
        onSelectUserForWork={(targetUser) => openUserWork(targetUser)}
      />

      <ManagerTasksDrilldownModal
        isOpen={isTasksModalOpen}
        onClose={() => setIsTasksModalOpen(false)}
        initialFilter={tasksFilter}
        modalTitle={tasksModalTitle}
      />

      <UserWorkModal
        isOpen={isWorkModalOpen}
        onClose={closeUserWork}
        user={selectedUserForWork}
        initialFilter={userWorkFilter}
      />
    </div>
  );
};

export default SuperAdminDashboard;
