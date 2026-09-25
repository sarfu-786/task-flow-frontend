import React, { useState, useEffect } from 'react';
import { useTasks } from '../../context/TaskContext';
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
  FolderKanban,
  Briefcase,
  Target,
  AlertCircle,
  CheckSquare,
} from 'lucide-react';

export const SuperAdminDashboard = () => {
  const { tasks } = useTasks();
  const { users } = useUserManagement();

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
  const activeUsers = users.filter((u) => u.status !== 'Rejected' && u.status !== 'Pending');

  // Managers & Leadership
  const managers = activeUsers.filter((u) => {
    const roles = Array.isArray(u.roles) && u.roles.length > 0 ? u.roles : [u.role || 'User'];
    return roles.some((r) => ['Manager', 'Executive', 'Administrator', 'Super Admin'].includes(r));
  });

  // Sales Coordinators
  const salesCoordinators = activeUsers.filter((u) => {
    const roles = Array.isArray(u.roles) && u.roles.length > 0 ? u.roles : [u.role || 'User'];
    return roles.includes('Sales Coordinator') || u.role === 'Sales Coordinator';
  });

  // Service Coordinators
  const serviceCoordinators = activeUsers.filter((u) => {
    const roles = Array.isArray(u.roles) && u.roles.length > 0 ? u.roles : [u.role || 'User'];
    return roles.includes('Service Coordinator') || u.role === 'Service Coordinator';
  });

  // Regular Staff
  const regularUsers = activeUsers.filter((u) => {
    const roles = Array.isArray(u.roles) && u.roles.length > 0 ? u.roles : [u.role || 'User'];
    return roles.includes('User') || roles.length === 0 || u.role === 'User';
  });

  // Overall Task Statistics
  const totalTasksCount = tasks.length;
  const completedTasksCount = tasks.filter((t) => t.status === 'Completed').length;
  const inProgressTasksCount = tasks.filter((t) => t.status === 'In Progress').length;
  const todoTasksCount = tasks.filter((t) => t.status === 'To Do' || !t.status).length;

  return (
    <div className="super-admin-dashboard fade-in" style={{ padding: '6px 0 32px 0' }}>
      {/* Curved Header Banner */}
      <div
        style={{
          marginBottom: '20px',
          padding: '16px 20px',
          background: '#ffffff',
          borderRadius: '20px',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span
              className="badge-official"
              style={{
                background: '#fef3c7',
                color: '#b45309',
                borderColor: '#fde68a',
                borderRadius: '999px',
                padding: '3px 10px',
                fontSize: '0.74rem',
                fontWeight: 700,
              }}
            >
              <Crown size={12} />
              <span>Super Admin Console</span>
            </span>
            <span
              className="badge-official badge-blue"
              style={{ borderRadius: '999px', padding: '3px 10px', fontSize: '0.74rem', fontWeight: 700 }}
            >
              {activeUsers.length} Active Personnel
            </span>
          </div>
          <h1 style={{ fontSize: '1.38rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Organization Command Center
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '999px',
              fontSize: '0.8rem',
              fontWeight: 700,
              color: '#334155',
            }}
          >
            <CheckSquare size={14} color="#2563eb" />
            <span>{totalTasksCount} Total Tasks</span>
          </span>
        </div>
      </div>

      {/* 9 Curved Interactive Divs Arranged in Order */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '16px',
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
          onClick={() => openEmployeeDrilldown('all', 'Managers & Leadership Roster', 'managers')}
        />

        {/* Card 3: Sales Coordinators */}
        <MetricCard
          title="Sales Coordinators"
          value={salesCoordinators.length}
          subtitle="CRM Pipeline Assigned"
          icon={Target}
          color="#0284c7"
          bgLight="#f0f9ff"
          isClickable={true}
          onClick={() => openEmployeeDrilldown('all', 'Sales Coordinators Directory', 'sales')}
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
          onClick={() => openEmployeeDrilldown('all', 'Service Coordinators Directory', 'service')}
        />

        {/* Card 5: Regular Staff */}
        <MetricCard
          title="Regular Staff"
          value={regularUsers.length}
          subtitle="Core Operations Team"
          icon={Briefcase}
          color="#7c3aed"
          bgLight="#f5f3ff"
          isClickable={true}
          onClick={() => openEmployeeDrilldown('all', 'Regular Staff Directory', 'regular')}
        />

        {/* Card 6: Total Assigned Tasks */}
        <MetricCard
          title="Total Assigned Tasks"
          value={totalTasksCount}
          subtitle="All Active Workflows"
          icon={ListTodo}
          color="#4f46e5"
          bgLight="#eef2ff"
          isClickable={true}
          onClick={() => openTasksDrilldown('all', 'Organization Tasks Overview')}
        />

        {/* Card 7: In Progress Work */}
        <MetricCard
          title="In Progress Work"
          value={inProgressTasksCount}
          subtitle="Active ongoing execution"
          icon={Clock}
          color="#d97706"
          bgLight="#fffbeb"
          isClickable={true}
          onClick={() => openTasksDrilldown('In Progress', 'In Progress Workflows')}
        />

        {/* Card 8: Completed Workflows */}
        <MetricCard
          title="Completed Workflows"
          value={completedTasksCount}
          subtitle="Delivered & Signed Off"
          icon={CheckCircle2}
          color="#059669"
          bgLight="#ecfdf5"
          isClickable={true}
          onClick={() => openTasksDrilldown('Completed', 'Completed Workflows')}
        />

        {/* Card 9: Pending Queue */}
        <MetricCard
          title="Pending Queue"
          value={todoTasksCount}
          subtitle="Awaiting Task Execution"
          icon={FolderKanban}
          color="#6366f1"
          bgLight="#f5f3ff"
          isClickable={true}
          onClick={() => openTasksDrilldown('To Do', 'Pending Queue Tasks')}
        />
      </div>

      {/* Drilldown Modals (Opened on specific card clicks) */}
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
