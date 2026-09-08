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
  UserCheck,
  ShieldCheck,
  PlusCircle,
  FolderKanban,
  ChevronRight,
  User,
  ExternalLink,
} from 'lucide-react';

export const ManagerDashboard = ({ setActiveSection }) => {
  const { tasks, openCreateModal: openCreateTaskModal } = useTasks();
  const { user: currentUser } = useAuth();
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

  // Find subordinates reporting to this Manager
  const currentUserId = currentUser?._id ? currentUser._id.toString() : '';
  const currentUserName = (currentUser?.name || '').toLowerCase();

  const directSubordinates = activeUsers.filter((u) => {
    if (u._id === currentUserId) return false;
    const repId = u.reportsTo ? u.reportsTo.toString() : '';
    const repName = (u.reportsToName || '').toLowerCase();
    return (repId && repId === currentUserId) || (repName && repName.includes(currentUserName));
  });

  // Team members list: active subordinates belonging to this manager
  const teamMembers = activeUsers.filter((u) => u._id !== currentUserId);

  const teamNames = [
    currentUserName,
    (currentUser?.username || '').toLowerCase(),
    ...teamMembers.map((m) => (m.name || '').toLowerCase()),
    ...teamMembers.map((m) => (m.username || '').toLowerCase()),
  ];

  // Team tasks
  const teamTasks = tasks.filter((t) => {
    const assigned = (t.assignedTo || '').toLowerCase();
    return teamNames.includes(assigned);
  });

  const totalTeamMembers = teamMembers.length;
  const completedTasksCount = teamTasks.filter((t) => t.status === 'Completed').length;
  const inProgressTasksCount = teamTasks.filter((t) => t.status === 'In Progress').length;
  const pendingTasksCount = teamTasks.filter((t) => t.status === 'To Do').length;

  return (
    <div className="manager-dashboard-container" style={{ paddingBottom: '36px' }}>
      {/* Header Banner - Clean, Minimal & Informative */}
      <div
        className="section-header"
        style={{
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <h2 className="section-title" style={{ margin: 0 }}>Manager Dashboard</h2>
            {/* Interactive Reporting Superior Tag with Hover & Click Popup */}
            <div
              onClick={() => setIsSuperiorModalOpen(true)}
              className="interactive-superior-badge"
              style={{
                fontSize: '0.78rem',
                fontWeight: 600,
                padding: '4px 12px',
                borderRadius: '999px',
                background: '#eff6ff',
                color: '#1d4ed8',
                border: '1px solid #bfdbfe',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 1px 3px rgba(37, 99, 235, 0.08)',
              }}
              title="Click to view superior reporting details in popup"
            >
              <ShieldCheck size={14} color="#2563eb" />
              <span>Reports To: {currentUser?.reportsToName || 'Sarfaraj Ahmad (Super Admin)'}</span>
              <ExternalLink size={11} color="#2563eb" />
            </div>
          </div>
        </div>

        {/* Quick Assign Task */}
        <button
          type="button"
          className="btn btn-primary"
          onClick={openCreateTaskModal}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <PlusCircle size={16} />
          <span>Assign Task</span>
        </button>
      </div>

      {/* Top 4 Interactive Metric Cards */}
      <div className="stats-grid">
        {/* Total Direct Subordinates */}
        <MetricCard
          title="Reporting Team"
          value={totalTeamMembers}
          icon={Users}
          color="#0284c7"
          bgLight="#f0f9ff"
          isClickable={true}
          onClick={() => openEmployeeDrilldown('all', 'My Reporting Team')}
        />

        {/* In Progress Tasks */}
        <MetricCard
          title="In Progress"
          value={inProgressTasksCount}
          icon={Clock}
          color="#d97706"
          bgLight="#fffbeb"
          isClickable={true}
          onClick={() => openTasksDrilldown('In Progress', 'Team In Progress Active Tasks')}
        />

        {/* Completed Tasks */}
        <MetricCard
          title="Completed"
          value={completedTasksCount}
          icon={CheckCircle2}
          color="#059669"
          bgLight="#ecfdf5"
          isClickable={true}
          onClick={() => openTasksDrilldown('Completed', 'Team Completed Tasks & Workflows')}
        />

        {/* Pending To-Do */}
        <MetricCard
          title="Pending Tasks"
          value={pendingTasksCount}
          icon={ListTodo}
          color="#6366f1"
          bgLight="#eef2ff"
          isClickable={true}
          onClick={() => openTasksDrilldown('To Do', 'Team Pending To-Do Tasks')}
        />
      </div>

      {/* Direct Subordinates & Reporting Members Section */}
      <div className="task-container-box" style={{ marginTop: '24px' }}>
        <div className="task-nav-toolbar" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Direct Reporting Team Members
              </h4>
            </div>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setActiveSection && setActiveSection('tasks')}
              style={{ fontSize: '0.82rem', padding: '6px 12px' }}
            >
              <FolderKanban size={14} />
              <span>Team Task Management</span>
            </button>
          </div>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th style={{ width: '60px', textAlign: 'center' }}>Sr. No</th>
                <th>Team Member</th>
                <th>Department</th>
                <th>Reporting Branch</th>
                <th style={{ textAlign: 'center' }}>Completed</th>
                <th style={{ textAlign: 'center' }}>Pending</th>
                <th style={{ textAlign: 'right' }}>Workload</th>
              </tr>
            </thead>
            <tbody>
              {teamMembers.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '32px' }}>
                    <p style={{ color: 'var(--text-muted)', margin: 0 }}>No direct reporting members found.</p>
                  </td>
                </tr>
              ) : (
                teamMembers.map((member, index) => {
                  const memberName = (member.name || '').toLowerCase();
                  const memberUsername = (member.username || '').toLowerCase();
                  const memberId = member._id ? member._id.toString() : '';

                  const memberTasks = tasks.filter((t) => {
                    const assigned = (t.assignedTo || '').toLowerCase();
                    const taskUserId = t.user ? (t.user._id ? t.user._id.toString() : t.user.toString()) : '';
                    return assigned === memberName || assigned === memberUsername || taskUserId === memberId;
                  });

                  const completedCount = memberTasks.filter((t) => t.status === 'Completed').length;
                  const pendingCount = memberTasks.filter((t) => t.status !== 'Completed').length;

                  return (
                    <tr
                      key={member._id}
                      className="interactive-table-row"
                      onClick={() => openUserWork(member, 'all')}
                      title={`Click to view ${member.name}'s details and full workload in popup`}
                      style={{ cursor: 'pointer' }}
                    >
                      <td style={{ textAlign: 'center' }}>
                        <span className="sr-no-badge">{index + 1}</span>
                      </td>

                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {member.avatar ? (
                            <img
                              src={member.avatar}
                              alt={member.name}
                              style={{
                                width: '34px',
                                height: '34px',
                                borderRadius: '50%',
                                objectFit: 'cover',
                                border: '1px solid var(--border-color)',
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                width: '34px',
                                height: '34px',
                                borderRadius: '50%',
                                background: '#0284c7',
                                color: '#ffffff',
                                fontWeight: 700,
                                fontSize: '0.8rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              {member.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                              {member.name}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {member.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                          {member.department || 'Operations'}
                        </span>
                      </td>

                      <td>
                        <span
                          style={{
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            color: '#1e40af',
                            background: '#eff6ff',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            border: '1px solid #bfdbfe',
                            display: 'inline-block',
                          }}
                        >
                          Reports to: {member.reportsToName || `${currentUser?.name} (Manager)`}
                        </span>
                      </td>

                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="badge-status badge-status-completed"
                          onClick={(e) => {
                            e.stopPropagation();
                            openUserWork(member, 'Completed');
                          }}
                          title={`Click to view ${member.name}'s completed tasks in popup`}
                          style={{ cursor: 'pointer', padding: '4px 8px' }}
                        >
                          <CheckCircle2 size={12} />
                          <span>{completedCount} Done</span>
                        </button>
                      </td>

                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="badge-status badge-status-progress"
                          onClick={(e) => {
                            e.stopPropagation();
                            openUserWork(member, 'To Do');
                          }}
                          title={`Click to view ${member.name}'s pending tasks in popup`}
                          style={{ cursor: 'pointer', padding: '4px 8px' }}
                        >
                          <Clock size={12} />
                          <span>{pendingCount} Pending</span>
                        </button>
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            openUserWork(member, 'all');
                          }}
                          style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                        >
                          Inspect Work
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 1-Click Superior Detail Popup Modal */}
      <SuperiorDetailModal
        isOpen={isSuperiorModalOpen}
        onClose={() => setIsSuperiorModalOpen(false)}
        superiorName={currentUser?.reportsToName}
        currentUser={currentUser}
      />

      {/* 1-Click Employee Drilldown Modal */}
      <EmployeeDrilldownModal
        isOpen={isEmployeeModalOpen}
        initialDepartmentFilter={employeeDeptFilter}
        modalTitle={employeeModalTitle}
        onClose={() => setIsEmployeeModalOpen(false)}
        onOpenUserWork={openUserWork}
      />

      {/* 1-Click Tasks Status Drilldown Modal (Completed, In Progress, Pending To-Do) */}
      <ManagerTasksDrilldownModal
        isOpen={isTasksModalOpen}
        initialFilter={tasksFilter}
        modalTitle={tasksModalTitle}
        onClose={() => setIsTasksModalOpen(false)}
      />

      {/* 1-Click Individual User Work Inspection Modal */}
      <UserWorkModal
        user={selectedUserForWork}
        initialFilter={userWorkFilter}
        isOpen={isWorkModalOpen}
        onClose={closeUserWork}
      />
    </div>
  );
};

