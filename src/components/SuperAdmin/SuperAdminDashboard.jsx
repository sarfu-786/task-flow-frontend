import React, { useState, useEffect } from 'react';
import { useTasks } from '../../context/TaskContext';
import { useAuth } from '../../context/AuthContext';
import { useUserManagement } from '../../context/UserContext';
import { MetricCard } from '../ManagerDashboard/MetricCard';
import { UserWorkModal } from '../ManagerDashboard/UserWorkModal';
import { EmployeeDrilldownModal } from '../ManagerDashboard/EmployeeDrilldownModal';
import { ManagerTasksDrilldownModal } from '../ManagerDashboard/ManagerTasksDrilldownModal';
import {
  Users,
  CheckCircle2,
  Clock,
  ListTodo,
  Crown,
  ShieldCheck,
  ChevronRight,
  FolderKanban,
  CheckSquare,
  ArrowRight,
  Shield,
  Briefcase,
  Layers,
} from 'lucide-react';

export const SuperAdminDashboard = ({ setActiveSection }) => {
  const { tasks } = useTasks();
  const { user: currentUser } = useAuth();
  const { users } = useUserManagement();

  // Drilldown states
  const [selectedUserForWork, setSelectedUserForWork] = useState(null);
  const [userWorkFilter, setUserWorkFilter] = useState('all');
  const [isWorkModalOpen, setIsWorkModalOpen] = useState(false);

  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [employeeDeptFilter, setEmployeeDeptFilter] = useState('all');
  const [employeeModalTitle, setEmployeeModalTitle] = useState('All Users');

  const [isTasksModalOpen, setIsTasksModalOpen] = useState(false);
  const [tasksFilter, setTasksFilter] = useState('all');
  const [tasksModalTitle, setTasksModalTitle] = useState('Tasks Overview');

  const openEmployeeDrilldown = (dept = 'all', title = 'Organization Users') => {
    setEmployeeDeptFilter(dept);
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
  const activeUsers = users.filter((u) => u.status !== 'Rejected' && u.status !== 'Pending');

  // Managers & Seniors
  const managers = activeUsers.filter(
    (u) =>
      u.role === 'Manager' ||
      u.role === 'Executive' ||
      u.role === 'Administrator' ||
      u.role === 'Super Admin'
  );

  // Standard Employees / Users
  const regularUsers = activeUsers.filter(
    (u) =>
      u.role === 'User' ||
      (!u.role && u.role !== 'Manager' && u.role !== 'Executive' && u.role !== 'Administrator' && u.role !== 'Super Admin')
  );

  // Overall Task Statistics
  const totalTasksCount = tasks.length;
  const completedTasksCount = tasks.filter((t) => t.status === 'Completed').length;
  const inProgressTasksCount = tasks.filter((t) => t.status === 'In Progress').length;
  const todoTasksCount = tasks.filter((t) => t.status === 'To Do' || !t.status).length;

  return (
    <div className="super-admin-dashboard" style={{ paddingBottom: '32px' }}>
      {/* Official White Header Banner */}
      <div
        className="card"
        style={{
          padding: '24px 28px',
          marginBottom: '24px',
          borderRadius: '16px',
          border: '1px solid var(--border-color)',
          background: '#ffffff',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                background: '#fef3c7',
                color: '#b45309',
                border: '1px solid #fde68a',
                padding: '2px 8px',
                borderRadius: '999px',
                fontSize: '0.72rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              <Crown size={12} /> Super Admin Dashboard
            </span>
          </div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
            Organization Executive Overview
          </h2>
        </div>
      </div>

      {/* 4 Core Essential Organization KPIs (Enlarged, Uniform Size, Interactive Hover) */}
      <div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '18px',
          }}
        >
          {/* 1. Total Users */}
          <div
            className="superadmin-kpi-card"
            style={{
              cursor: 'pointer',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '14px',
              padding: '22px 24px',
              minHeight: '140px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            onClick={() => openEmployeeDrilldown('all', 'All Users')}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 12px 24px -4px rgba(2, 132, 199, 0.15)';
              e.currentTarget.style.borderColor = '#93c5fd';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.04)';
              e.currentTarget.style.borderColor = '#e2e8f0';
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0284c7' }}>Total Users</span>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#f0f9ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7' }}>
                <Users size={20} />
              </div>
            </div>
            <div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>{activeUsers.length}</div>
              <span style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '6px', display: 'block' }}>
                {managers.length} Managers • {regularUsers.length} Contributors
              </span>
            </div>
          </div>

          {/* 2. Total Tasks */}
          <div
            className="superadmin-kpi-card"
            style={{
              cursor: 'pointer',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '14px',
              padding: '22px 24px',
              minHeight: '140px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            onClick={() => openTasksDrilldown('all', 'All Organization Tasks')}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 12px 24px -4px rgba(79, 70, 229, 0.15)';
              e.currentTarget.style.borderColor = '#a5b4fc';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.04)';
              e.currentTarget.style.borderColor = '#e2e8f0';
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#4f46e5' }}>Total Tasks</span>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5' }}>
                <ListTodo size={20} />
              </div>
            </div>
            <div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>{totalTasksCount}</div>
              <span style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '6px', display: 'block' }}>
                Assigned Workflows
              </span>
            </div>
          </div>

          {/* 3. In Progress */}
          <div
            className="superadmin-kpi-card"
            style={{
              cursor: 'pointer',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '14px',
              padding: '22px 24px',
              minHeight: '140px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            onClick={() => openTasksDrilldown('In Progress', 'In Progress Tasks')}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 12px 24px -4px rgba(217, 119, 6, 0.15)';
              e.currentTarget.style.borderColor = '#fcd34d';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.04)';
              e.currentTarget.style.borderColor = '#e2e8f0';
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#d97706' }}>In Progress</span>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706' }}>
                <Clock size={20} />
              </div>
            </div>
            <div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>{inProgressTasksCount}</div>
              <span style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '6px', display: 'block' }}>
                Active Execution
              </span>
            </div>
          </div>

          {/* 4. Completed */}
          <div
            className="superadmin-kpi-card"
            style={{
              cursor: 'pointer',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '14px',
              padding: '22px 24px',
              minHeight: '140px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            onClick={() => openTasksDrilldown('Completed', 'Completed Tasks')}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 12px 24px -4px rgba(5, 150, 105, 0.15)';
              e.currentTarget.style.borderColor = '#86efac';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.04)';
              e.currentTarget.style.borderColor = '#e2e8f0';
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#059669' }}>Completed</span>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
                <CheckCircle2 size={20} />
              </div>
            </div>
            <div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>{completedTasksCount}</div>
              <span style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 700, marginTop: '6px', display: 'block' }}>
                {totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0}% Delivered
              </span>
            </div>
          </div>
        </div>
      </div>



      {/* 1-Click Drilldown Modals */}
      <EmployeeDrilldownModal
        isOpen={isEmployeeModalOpen}
        initialDepartmentFilter={employeeDeptFilter}
        modalTitle={employeeModalTitle}
        onClose={() => setIsEmployeeModalOpen(false)}
        onOpenUserWork={openUserWork}
      />

      <ManagerTasksDrilldownModal
        isOpen={isTasksModalOpen}
        initialFilter={tasksFilter}
        modalTitle={tasksModalTitle}
        onClose={() => setIsTasksModalOpen(false)}
      />

      <UserWorkModal
        user={selectedUserForWork}
        initialFilter={userWorkFilter}
        isOpen={isWorkModalOpen}
        onClose={closeUserWork}
      />
    </div>
  );
};
