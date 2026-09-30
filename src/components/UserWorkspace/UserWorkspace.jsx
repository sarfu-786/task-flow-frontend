import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTasks } from '../../context/TaskContext';
import { useUserManagement } from '../../context/UserContext';
import { MetricCard } from '../ManagerDashboard/MetricCard';
import { EmployeeDrilldownModal } from '../ManagerDashboard/EmployeeDrilldownModal';
import { ManagerTasksDrilldownModal } from '../ManagerDashboard/ManagerTasksDrilldownModal';
import { UserWorkModal } from '../ManagerDashboard/UserWorkModal';
import { SuperiorDetailModal } from '../ManagerDashboard/SuperiorDetailModal';
import { RoleDeptModal } from '../UserManagement/RoleDeptModal';
import { UserDetailModal } from '../UserManagement/UserDetailModal';
import { WorkProgressCharts } from '../common/WorkProgressCharts';
import {
  Users,
  CheckCircle2,
  Clock,
  ListTodo,
  Briefcase,
  Shield,
  ShieldCheck,
  Plus,
  ExternalLink,
  Award,
  User,
  Bell,
  ArrowRight,
  Target,
} from 'lucide-react';

// Helper to get all user IDs that are subordinate to (under) the current user in hierarchy
const getSubordinateUserIds = (user, allUsers) => {
  if (!user || !allUsers || !Array.isArray(allUsers)) return new Set();
  const userIdStr = (user._id ? user._id.toString() : (user.id ? user.id.toString() : '')).trim();
  const userNameStr = (user.name || '').toLowerCase().trim();

  const subordinateIds = new Set();
  if (!userIdStr && !userNameStr) return subordinateIds;

  const queue = [userIdStr];
  const processed = new Set([userIdStr]);

  while (queue.length > 0) {
    const currentParentId = queue.shift();
    const parentUser = allUsers.find((u) => u && (u._id || u.id) && (u._id || u.id).toString() === currentParentId);
    const parentName = (parentUser?.name || (currentParentId === userIdStr ? userNameStr : '')).toLowerCase().trim();

    for (const u of allUsers) {
      if (!u) continue;
      const uIdStr = (u._id || u.id || '').toString();
      if (!uIdStr || uIdStr === userIdStr || processed.has(uIdStr)) continue;

      const repIdStr = u.reportsTo ? (u.reportsTo._id ? u.reportsTo._id.toString() : u.reportsTo.toString()) : '';
      const repNameStr = (u.reportsToName || '').toLowerCase().trim();
      const createdByStr = u.createdBy ? (u.createdBy._id ? u.createdBy._id.toString() : u.createdBy.toString()) : '';

      const isDirectReport =
        (currentParentId && repIdStr === currentParentId) ||
        (parentName && repNameStr && (repNameStr.includes(parentName) || parentName.includes(repNameStr)));

      const isCreatedByParent = currentParentId && createdByStr === currentParentId;

      if (isDirectReport || isCreatedByParent) {
        subordinateIds.add(uIdStr);
        processed.add(uIdStr);
        queue.push(uIdStr);
      }
    }
  }

  return subordinateIds;
};

export const UserWorkspace = ({ setActiveSection }) => {
  const { user, userRoles } = useAuth();
  const { tasks, notifications } = useTasks();
  const { users } = useUserManagement();

  // 1. Employee / Personnel Directory Drilldown Modal State (Reference Image Popup)
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [employeeDeptFilter, setEmployeeDeptFilter] = useState('all');
  const [employeeModalTitle, setEmployeeModalTitle] = useState('All Organization Personnel');

  // 2. Tasks Overview Drilldown Modal State (All, Completed, In Progress, To Do)
  const [isTasksModalOpen, setIsTasksModalOpen] = useState(false);
  const [tasksFilterParam, setTasksFilterParam] = useState('all');
  const [tasksModalTitle, setTasksModalTitle] = useState('My Assigned Work');

  // 3. User Work Modal State (Opened on clicking "View Work" in Employee Drilldown)
  const [selectedUserForWork, setSelectedUserForWork] = useState(null);
  const [userWorkFilter, setUserWorkFilter] = useState('all');
  const [isWorkModalOpen, setIsWorkModalOpen] = useState(false);

  // 4. Superior Detail Modal State
  const [isSuperiorModalOpen, setIsSuperiorModalOpen] = useState(false);

  // 5. Role & Department Detail Modal State
  const [isRoleDeptModalOpen, setIsRoleDeptModalOpen] = useState(false);
  const [selectedRoleForModal, setSelectedRoleForModal] = useState('User');

  // 6. User Profile Detail Modal State
  const [selectedUserDetail, setSelectedUserDetail] = useState(null);
  const [isUserDetailOpen, setIsUserDetailOpen] = useState(false);

  // Active Approved Users
  const activeUsers = (users || []).filter((u) => u && u.status !== 'Rejected' && u.status !== 'Pending');

  // Subordinates calculation
  const subordinateIds = getSubordinateUserIds(user, activeUsers);
  const mySubordinates = activeUsers.filter((u) => {
    if (!u) return false;
    const uId = (u._id || u.id || '').toString();
    return subordinateIds.has(uId);
  });
  const subordinateNames = mySubordinates.map((u) => (u.name || '').toLowerCase().trim());
  const subordinateUsernames = mySubordinates.map((u) => (u.username || '').toLowerCase().trim());
  const subordinateIdList = Array.from(subordinateIds);

  // Filter tasks: own tasks + assigned subordinate tasks
  const userIdentifier = (user?.name || '').toLowerCase().trim();
  const userUsername = (user?.username || '').toLowerCase().trim();
  const userId = (user?._id || user?.id || '').toString();

  const safeTasks = Array.isArray(tasks) ? tasks : [];
  const safeNotifications = Array.isArray(notifications) ? notifications : [];

  const myTasks = safeTasks.filter((t) => {
    if (!t) return false;
    const tAssigned = (t.assignedTo || '').toLowerCase().trim();
    const tUser = t.user ? (t.user._id ? t.user._id.toString() : t.user.toString()) : '';
    const tAssignedBy = (t.assignedBy || '').toLowerCase().trim();
    const isSelf =
      (userIdentifier && tAssigned === userIdentifier) ||
      (userUsername && tAssigned === userUsername) ||
      (userId && tUser === userId) ||
      tAssigned === 'current user';
    const isSubordinate =
      subordinateNames.includes(tAssigned) ||
      subordinateUsernames.includes(tAssigned) ||
      subordinateIdList.includes(tUser);
    const isAssignedBySelfOrSub =
      (userIdentifier && tAssignedBy.includes(userIdentifier)) ||
      (userUsername && tAssignedBy.includes(userUsername)) ||
      subordinateNames.some((n) => tAssignedBy.includes(n));
    return isSelf || isSubordinate || isAssignedBySelfOrSub;
  });

  // Self & Team Metrics
  const totalMyTasks = myTasks.length;
  const completedTasks = myTasks.filter((t) => t && t.status === 'Completed');
  const inProgressTasks = myTasks.filter((t) => t && t.status === 'In Progress');
  const todoTasks = myTasks.filter((t) => t && (t.status === 'To Do' || !t.status));

  // Check for latest task assignment notification for this user
  const latestAssignmentNotif = safeNotifications.find(
    (n) => n && (n.type === 'task_assigned' || (n.assignedBy && n.forRole !== 'Manager') || n.forRole === 'User')
  );

  // Modal Handlers
  const openEmployeeDrilldown = (dept = 'all', title = 'All Organization Personnel') => {
    setEmployeeDeptFilter(dept);
    setEmployeeModalTitle(title);
    setIsEmployeeModalOpen(true);
  };

  const closeEmployeeDrilldown = () => {
    setIsEmployeeModalOpen(false);
  };

  const openTasksDrilldown = (status = 'all', title = 'My Assigned Work') => {
    setTasksFilterParam(status);
    setTasksModalTitle(title);
    setIsTasksModalOpen(true);
  };

  const closeTasksDrilldown = () => {
    setIsTasksModalOpen(false);
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

  const openSuperiorDetail = () => {
    setIsSuperiorModalOpen(true);
  };

  const closeSuperiorDetail = () => {
    setIsSuperiorModalOpen(false);
  };

  const openRoleDeptDetail = (role) => {
    setSelectedRoleForModal(role || user?.role || 'User');
    setIsRoleDeptModalOpen(true);
  };

  const closeRoleDeptDetail = () => {
    setIsRoleDeptModalOpen(false);
  };

  const openUserDetail = (targetUser) => {
    setSelectedUserDetail(targetUser || user);
    setIsUserDetailOpen(true);
  };

  const closeUserDetail = () => {
    setIsUserDetailOpen(false);
    setSelectedUserDetail(null);
  };

  // Lock body scroll when any drilldown modal is open
  useEffect(() => {
    if (
      isEmployeeModalOpen ||
      isTasksModalOpen ||
      isWorkModalOpen ||
      isSuperiorModalOpen ||
      isRoleDeptModalOpen ||
      isUserDetailOpen
    ) {
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
  }, [
    isEmployeeModalOpen,
    isTasksModalOpen,
    isWorkModalOpen,
    isSuperiorModalOpen,
    isRoleDeptModalOpen,
    isUserDetailOpen,
  ]);

  return (
    <div
      className="workspace-page-container user-workspace-wrapper fade-in"
      id="user-workspace-root"
      style={{
        maxWidth: '1240px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        paddingBottom: '32px',
      }}
    >
      {/* 1. CURVED HEADER BANNER (Clickable Profile & Role & Senior tags -> Pop-Ups) */}
      <div
        className="card workspace-header-card card-official-banner"
        style={{
          background: '#ffffff',
          borderRadius: '20px',
          border: '1px solid var(--border-color)',
          padding: '20px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
            <span
              className="badge-official badge-blue"
              style={{ borderRadius: '999px', padding: '3px 10px', fontSize: '0.74rem', fontWeight: 700 }}
            >
              <Briefcase size={13} />
              <span>User Workspace</span>
            </span>

            {/* Clickable Role Badges -> Opens RoleDeptModal */}
            {(userRoles || [user?.role || 'User']).map((r, i) => (
              <span
                key={i}
                onClick={() => openRoleDeptDetail(r)}
                className="badge-official badge-gray"
                style={{
                  borderRadius: '999px',
                  padding: '3px 10px',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
                title={`Click to view ${r} role permissions in pop-up`}
              >
                <Award size={11} />
                <span>{r}</span>
              </span>
            ))}
          </div>

          <h1
            style={{
              fontSize: '1.45rem',
              fontWeight: 800,
              color: '#0f172a',
              margin: 0,
              cursor: 'pointer',
            }}
            onClick={() => openUserDetail(user)}
            title="Click to view personal profile in pop-up"
          >
            Welcome back, {user?.name || 'User'}
          </h1>
        </div>

        {/* Header Right Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Reports To / Direct Senior Tag -> Opens SuperiorDetailModal */}
          <div
            className="reports-to-tag"
            onClick={openSuperiorDetail}
            title="Click to view supervisor hierarchy & contact in pop-up"
            style={{
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              padding: '6px 14px',
              borderRadius: '999px',
              fontSize: '0.82rem',
              color: '#1d4ed8',
              fontWeight: 600,
            }}
          >
            <ShieldCheck size={14} color="#2563eb" />
            <span>Reports To: {user?.reportsToName || 'Super Admin'}</span>
            <ExternalLink size={11} color="#2563eb" />
          </div>
        </div>
      </div>

      {/* 2. TASK ASSIGNMENT ALERT NOTIFICATION BANNER (Clickable Div -> opens Pop-Up) */}
      {latestAssignmentNotif && (
        <div
          onClick={() => openTasksDrilldown('To Do', 'Pending Task Assignments')}
          style={{
            background: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: '16px',
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            boxShadow: 'var(--shadow-sm)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          title="Click to view pending assignments in pop-up modal"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: '#dbeafe',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Bell size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.92rem' }}>
                  {latestAssignmentNotif.assignedBy || 'Manager'} assigned you a task
                </span>
                <span
                  style={{
                    fontSize: '0.7rem',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: '#dbeafe',
                    color: '#1d4ed8',
                    fontWeight: 600,
                  }}
                >
                  INBOX MESSAGE
                </span>
              </div>
              <p style={{ margin: '2px 0 0 0', color: 'var(--text-secondary)', fontSize: '0.84rem' }}>
                {latestAssignmentNotif.taskDescription || latestAssignmentNotif.message} •{' '}
                <span style={{ color: 'var(--text-muted)' }}>{latestAssignmentNotif.remark}</span>
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={(e) => {
                e.stopPropagation();
                openTasksDrilldown('To Do', 'Pending Task Assignments');
              }}
              style={{
                padding: '6px 14px',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                borderRadius: '999px',
              }}
            >
              <span>View in Pop-up</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* 3. TOP 5 CURVED INTERACTIVE METRIC CARDS (Click ANY Div to open exact reference pop-up modal!) */}
      <div
        className="stats-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
        }}
      >

        {/* CARD 2: Total Assigned Work -> Opens Tasks Drilldown Modal */}
        <MetricCard
          title="Total Assigned Work"
          value={totalMyTasks}
          subtitle="All active assigned tasks"
          icon={Briefcase}
          color="#2563eb"
          bgLight="#eff6ff"
          isClickable={true}
          onClick={() => openTasksDrilldown('all', 'All Assigned Personal Work')}
        />

        {/* CARD 3: In Progress Work -> Opens In Progress Tasks Modal */}
        <MetricCard
          title="In Progress Work"
          value={inProgressTasks.length}
          subtitle="Currently executing workflows"
          icon={Clock}
          color="#d97706"
          bgLight="#fffbeb"
          isClickable={true}
          onClick={() => openTasksDrilldown('In Progress', 'In Progress Workflows')}
        />

        {/* CARD 4: Completed Work -> Opens Completed Tasks Modal */}
        <MetricCard
          title="Completed Work"
          value={completedTasks.length}
          subtitle="Successfully finalized & delivered"
          icon={CheckCircle2}
          color="#059669"
          bgLight="#ecfdf5"
          isClickable={true}
          onClick={() => openTasksDrilldown('Completed', 'Completed Workflows')}
        />

        {/* CARD 5: Pending Queue -> Opens Pending Tasks Modal */}
        <MetricCard
          title="Pending Queue"
          value={todoTasks.length}
          subtitle="Awaiting task execution"
          icon={ListTodo}
          color="#6366f1"
          bgLight="#eef2ff"
          isClickable={true}
          onClick={() => openTasksDrilldown('To Do', 'Pending Tasks Queue')}
        />
      </div>

      {/* User Work Progress & Completion Visualizations (Own-Data-Only) */}
      <div style={{ marginTop: '20px' }}>
        <WorkProgressCharts tasks={myTasks} openTasksDrilldown={openTasksDrilldown} />
      </div>

      {/* Enterprise LMS & Sales Funnel Summary for User */}
      <div
        style={{
          marginTop: '24px',
          padding: '20px 24px',
          borderRadius: '20px',
          background: '#ffffff',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-card)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              padding: '12px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              color: '#ffffff',
            }}
          >
            <Target size={24} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
              My Sales Leads & Outreach Pipeline
            </h3>
            <p style={{ margin: '3px 0 0', fontSize: '0.82rem', color: '#64748b' }}>
              View assigned leads, 1-click log call dispositions, manage scheduled callbacks, and claim unassigned queue leads.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setActiveSection && setActiveSection('leads')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
            border: 'none',
            color: '#ffffff',
            fontSize: '0.86rem',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)',
          }}
        >
          <span>Open My Leads</span>
          <Target size={16} />
        </button>
      </div>

      {/* ========================================================
          POP-UP MODALS (All Drilldowns Render As Clean Pop-Ups)
          ======================================================== */}

      {/* Pop-Up 1: All Organization Personnel Modal (Exact Reference Image!) */}
      <EmployeeDrilldownModal
        isOpen={isEmployeeModalOpen}
        onClose={closeEmployeeDrilldown}
        initialDepartmentFilter={employeeDeptFilter}
        modalTitle={employeeModalTitle}
        onSelectUserForWork={(targetUser) => openUserWork(targetUser, 'all')}
      />

      {/* Pop-Up 2: Tasks Drilldown Modal (All, Completed, In Progress, To Do) */}
      <ManagerTasksDrilldownModal
        isOpen={isTasksModalOpen}
        onClose={closeTasksDrilldown}
        initialFilter={tasksFilterParam}
        modalTitle={tasksModalTitle}
      />

      {/* Pop-Up 3: User Work Modal (Opened when clicking "View Work" in Personnel Modal) */}
      <UserWorkModal
        isOpen={isWorkModalOpen}
        onClose={closeUserWork}
        user={selectedUserForWork}
        initialFilter={userWorkFilter}
      />

      {/* Pop-Up 4: Superior / Supervisor Profile Modal */}
      <SuperiorDetailModal
        isOpen={isSuperiorModalOpen}
        onClose={closeSuperiorDetail}
        superiorName={user?.reportsToName}
      />

      {/* Pop-Up 5: Role & Department Permissions Modal */}
      <RoleDeptModal
        role={selectedRoleForModal}
        department={user?.department || 'Operations'}
        isOpen={isRoleDeptModalOpen}
        onClose={closeRoleDeptDetail}
      />

      {/* Pop-Up 6: Personal Profile Modal */}
      <UserDetailModal
        user={selectedUserDetail}
        isOpen={isUserDetailOpen}
        onClose={closeUserDetail}
        onOpenWork={(u, filter) => openUserWork(u, filter || 'all')}
        onViewManager={() => openSuperiorDetail()}
      />
    </div>
  );
};

export default UserWorkspace;
