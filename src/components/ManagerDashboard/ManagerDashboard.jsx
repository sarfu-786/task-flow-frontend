import React, { useState, useEffect } from 'react';
import { useTasks } from '../../context/TaskContext';
import { useAuth } from '../../context/AuthContext';
import { useUserManagement } from '../../context/UserContext';
import { MetricCard } from './MetricCard';
import { UserWorkModal } from './UserWorkModal';
import { EmployeeDrilldownModal } from './EmployeeDrilldownModal';
import { ManagerTasksDrilldownModal } from './ManagerTasksDrilldownModal';
import { SuperiorDetailModal } from './SuperiorDetailModal';
import {
  Users,
  CheckCircle2,
  Clock,
  ListTodo,
  ShieldCheck,
  ExternalLink,
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

export const ManagerDashboard = () => {
  const { tasks } = useTasks();
  const { user: currentUser, userRoles } = useAuth();
  const { users } = useUserManagement();

  // Superior Detail Popup Modal State
  const [isSuperiorModalOpen, setIsSuperiorModalOpen] = useState(false);

  // Individual User Work Modal State (1-Click user drilldown)
  const [selectedUserForWork, setSelectedUserForWork] = useState(null);
  const [userWorkFilter, setUserWorkFilter] = useState('all');
  const [isWorkModalOpen, setIsWorkModalOpen] = useState(false);

  // Employee Directory Drilldown Modal State
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [employeeDeptFilter, setEmployeeDeptFilter] = useState('all');
  const [employeeModalTitle, setEmployeeModalTitle] = useState('My Reporting Team');

  // Tasks Drilldown Modal State (Completed, In Progress, Pending To-Do)
  const [isTasksModalOpen, setIsTasksModalOpen] = useState(false);
  const [tasksFilter, setTasksFilter] = useState('all');
  const [tasksModalTitle, setTasksModalTitle] = useState('Team Tasks Overview');

  const openEmployeeDrilldown = (dept = 'all', title = 'My Reporting Team') => {
    setEmployeeDeptFilter(dept);
    setEmployeeModalTitle(title);
    setIsEmployeeModalOpen(true);
  };

  const openTasksDrilldown = (status = 'all', title = 'Team Tasks Overview') => {
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

  // Lock body scroll when any modal is open
  useEffect(() => {
    if (isEmployeeModalOpen || isWorkModalOpen || isTasksModalOpen || isSuperiorModalOpen) {
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
  }, [isEmployeeModalOpen, isWorkModalOpen, isTasksModalOpen, isSuperiorModalOpen]);

  // Active Approved Users
  const activeUsers = users.filter((u) => u.status !== 'Rejected' && u.status !== 'Pending');

  // Find all recursive subordinates under this Manager in hierarchy
  const subordinateIds = getSubordinateUserIds(currentUser, activeUsers);
  const currentUserId = (currentUser?._id || currentUser?.id || '').toString();

  // Team members who report directly or indirectly to this Manager
  const currentUserName = (currentUser?.name || '').toLowerCase().trim();
  const teamMembers = activeUsers.filter((u) => {
    const uId = (u._id || u.id || '').toString();
    const repId = (u.reportsTo ? (u.reportsTo._id ? u.reportsTo._id.toString() : u.reportsTo.toString()) : '').trim();
    const repName = (u.reportsToName || '').toLowerCase().trim();
    const isDirect = (currentUserId && repId === currentUserId) || (currentUserName && repName.includes(currentUserName));
    return isDirect || subordinateIds.has(uId);
  });

  const totalTeamMembers = teamMembers.length;

  // Filter Tasks belonging to this Manager + Team
  const teamMemberNames = new Set(teamMembers.map((m) => (m.name || '').toLowerCase().trim()));
  const teamMemberUsernames = new Set(teamMembers.map((m) => (m.username || '').toLowerCase().trim()));
  if (currentUserName) teamMemberNames.add(currentUserName);

  const teamTasks = tasks.filter((t) => {
    const assigned = (t.assignedTo || '').toLowerCase().trim();
    const taskUserId = t.user ? (t.user._id ? t.user._id.toString() : t.user.toString()) : '';
    return teamMemberNames.has(assigned) || teamMemberUsernames.has(assigned) || subordinateIds.has(taskUserId) || taskUserId === currentUserId;
  });

  const inProgressTasksCount = teamTasks.filter((t) => t.status === 'In Progress').length;
  const completedTasksCount = teamTasks.filter((t) => t.status === 'Completed').length;
  const pendingTasksCount = teamTasks.filter((t) => t.status === 'To Do' || !t.status).length;

  return (
    <div className="manager-dashboard fade-in" style={{ paddingBottom: '32px' }}>
      {/* Header Greeting Banner Div */}
      <div
        className="card-official-banner"
        style={{
          background: '#ffffff',
          borderRadius: '20px',
          padding: '20px 24px',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-card)',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span
              className="badge-official badge-blue"
              style={{ borderRadius: '999px', padding: '3px 10px', fontSize: '0.74rem', fontWeight: 700 }}
            >
              <ShieldCheck size={13} />
              <span>Manager Console</span>
            </span>
            {userRoles.map((r, i) => (
              <span
                key={i}
                className="badge-official badge-gray"
                style={{ borderRadius: '999px', padding: '3px 10px', fontSize: '0.74rem', fontWeight: 700 }}
              >
                {r}
              </span>
            ))}
          </div>
          <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Welcome back, {currentUser?.name || 'Manager'}
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            className="reports-to-tag"
            onClick={() => setIsSuperiorModalOpen(true)}
            title="Click to view supervisor hierarchy"
            style={{ cursor: 'pointer' }}
          >
            <ShieldCheck size={14} color="#2563eb" />
            <span>Reports To: {currentUser?.reportsToName || 'Sarfaraj Ahmad (Super Admin)'}</span>
            <ExternalLink size={11} color="#2563eb" />
          </div>
        </div>
      </div>

      {/* Top 4 Workload Metrics (Clicking opens corresponding popup modal) */}
      <div className="stats-grid">
        <MetricCard
          title="Reporting Team"
          value={totalTeamMembers}
          icon={Users}
          color="#0284c7"
          bgLight="#f0f9ff"
          isClickable={true}
          onClick={() => openEmployeeDrilldown('all', 'My Reporting Team')}
        />
        <MetricCard
          title="In Progress Work"
          value={inProgressTasksCount}
          icon={Clock}
          color="#d97706"
          bgLight="#fffbeb"
          isClickable={true}
          onClick={() => openTasksDrilldown('In Progress', 'Team In Progress Workflows')}
        />
        <MetricCard
          title="Completed Work"
          value={completedTasksCount}
          icon={CheckCircle2}
          color="#059669"
          bgLight="#ecfdf5"
          isClickable={true}
          onClick={() => openTasksDrilldown('Completed', 'Team Completed Workflows')}
        />
        <MetricCard
          title="Pending Queue"
          value={pendingTasksCount}
          icon={ListTodo}
          color="#6366f1"
          bgLight="#eef2ff"
          isClickable={true}
          onClick={() => openTasksDrilldown('To Do', 'Team Pending Queue')}
        />
      </div>

      {/* Drilldown Modals */}
      <EmployeeDrilldownModal
        isOpen={isEmployeeModalOpen}
        onClose={() => setIsEmployeeModalOpen(false)}
        initialDepartmentFilter={employeeDeptFilter}
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

      <SuperiorDetailModal
        isOpen={isSuperiorModalOpen}
        onClose={() => setIsSuperiorModalOpen(false)}
        superiorName={currentUser?.reportsToName}
      />
    </div>
  );
};

export default ManagerDashboard;
