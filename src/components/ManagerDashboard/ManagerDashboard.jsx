import React, { useState, useEffect } from 'react';
import { useTasks } from '../../context/TaskContext';
import { useAuth } from '../../context/AuthContext';
import { useUserManagement } from '../../context/UserContext';
import { MetricCard } from './MetricCard';
import { UserWorkModal } from './UserWorkModal';
import { EmployeeDrilldownModal } from './EmployeeDrilldownModal';
import {
  Users,
  CheckCircle2,
  Clock,
  ListTodo,
  ArrowRight,
  Eye,
  UserCheck,
} from 'lucide-react';

export const ManagerDashboard = ({ setActiveSection }) => {
  const { tasks } = useTasks();
  const { user } = useAuth();
  const { users } = useUserManagement();

  // Individual User Work Modal State (1-Click user drilldown)
  const [selectedUserForWork, setSelectedUserForWork] = useState(null);
  const [userWorkFilter, setUserWorkFilter] = useState('all');
  const [isWorkModalOpen, setIsWorkModalOpen] = useState(false);

  // Employee Drilldown Modal State
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [employeeDeptFilter, setEmployeeDeptFilter] = useState('all');
  const [employeeModalTitle, setEmployeeModalTitle] = useState('Employee Directory');

  const openEmployeeDrilldown = (dept = 'all', title = 'Employee Directory') => {
    setEmployeeDeptFilter(dept);
    setEmployeeModalTitle(title);
    setIsEmployeeModalOpen(true);
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
    if (isEmployeeModalOpen || isWorkModalOpen) {
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
  }, [isEmployeeModalOpen, isWorkModalOpen]);

  // Filter ONLY regular employees (exclude Managers, Executives, Administrators)
  const employeeUsers = users.filter(
    (u) =>
      u.role === 'User' ||
      (!u.role &&
        u.role !== 'Manager' &&
        u.role !== 'Executive' &&
        u.role !== 'Administrator')
  );

  const totalEmployees = employeeUsers.length;
  const completedTasksCount = tasks.filter((t) => t.status === 'Completed').length;
  const inProgressTasksCount = tasks.filter((t) => t.status === 'In Progress').length;
  const pendingTasksCount = tasks.filter((t) => t.status === 'To Do').length;

  return (
    <div className="manager-dashboard-container">
      {/* Header Banner */}
      <div
        className="section-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <h2 className="section-title">Manager Dashboard</h2>
          <p className="section-subtitle">
            Overview of team members, employee workload distribution, and task execution progress.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            className="btn btn-secondary"
            onClick={() => setActiveSection('user')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Users size={16} />
            <span>Manage Users</span>
          </button>

          <button
            className="btn btn-primary"
            onClick={() => setActiveSection('tasks')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <span>Go to Task Management</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* Top 4 Interactive Metric Cards */}
      <div className="stats-grid">
        {/* Total Employees */}
        <MetricCard
          title="Total Employees"
          value={totalEmployees}
          subtitle="Active Team Members"
          icon={Users}
          color="#0284c7"
          bgLight="#f0f9ff"
          isClickable={true}
          onClick={() => openEmployeeDrilldown('all', 'Employee Directory')}
        />

        {/* In Progress Tasks */}
        <MetricCard
          title="In Progress"
          value={inProgressTasksCount}
          subtitle="Active tasks in execution"
          icon={Clock}
          color="#d97706"
          bgLight="#fffbeb"
          isClickable={true}
          onClick={() => openEmployeeDrilldown('all', 'Employee Directory')}
        />

        {/* Completed Tasks */}
        <MetricCard
          title="Completed"
          value={completedTasksCount}
          subtitle="Successfully delivered"
          icon={CheckCircle2}
          color="#059669"
          bgLight="#ecfdf5"
          isClickable={true}
          onClick={() => openEmployeeDrilldown('all', 'Employee Directory')}
        />

        {/* Pending To-Do */}
        <MetricCard
          title="Pending Tasks"
          value={pendingTasksCount}
          subtitle="Awaiting action"
          icon={ListTodo}
          color="#6366f1"
          bgLight="#eef2ff"
          isClickable={true}
          onClick={() => openEmployeeDrilldown('all', 'Employee Directory')}
        />
      </div>

      {/* Team Workload & 1-Click Employee Status Section */}
      <div
        className="card"
        style={{
          marginBottom: '24px',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <div className="card-header">
          <div>
            <h3 className="card-title" style={{ fontSize: '1.15rem', color: 'var(--text-primary)' }}>
              <Users size={20} color="#2563eb" />
              <span>Team Workload & Member Status</span>
            </h3>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '3px' }}>
              Real-time employee status and workload monitoring. Click any status pill to inspect assigned tasks.
            </p>
          </div>

          <button
            className="btn btn-secondary"
            onClick={() => setActiveSection('user')}
            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
          >
            Manage Users Directory
          </button>
        </div>

        <div className="table-responsive">
          <table className="task-table">
            <thead>
              <tr>
                <th style={{ width: '45px' }}>#</th>
                <th>Employee</th>
                <th>Role</th>
                <th>Department</th>
                <th>Task Breakdown</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {employeeUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                      No employees found
                    </p>
                    <p style={{ fontSize: '0.85rem' }}>
                      Add employees in Team Management to view their workloads and statuses here.
                    </p>
                  </td>
                </tr>
              ) : (
                employeeUsers.map((member, index) => {
                  const memberName = (member.name || '').trim().toLowerCase();
                  const memberUsername = (member.username || '').trim().toLowerCase();
                  const memberId = (member._id || '').toString();

                  const memberTasks = tasks.filter((t) => {
                    if (!t) return false;
                    const taskAssigned = (t.assignedTo || '').trim().toLowerCase();
                    const taskUserId = t.user ? (t.user._id ? t.user._id.toString() : t.user.toString()) : '';

                    return (
                      taskAssigned === memberName ||
                      taskAssigned === memberUsername ||
                      (taskUserId && taskUserId === memberId) ||
                      (memberName === 'aarav sharma' && taskAssigned === 'sarah jenkins')
                    );
                  });

                  const userCompleted = memberTasks.filter((t) => t.status === 'Completed').length;
                  const userInProgress = memberTasks.filter((t) => t.status === 'In Progress').length;
                  const userPending = memberTasks.filter((t) => t.status === 'To Do').length;

                  return (
                    <tr key={member._id}>
                      <td>
                        <span className="sr-no-badge">{index + 1}</span>
                      </td>

                      {/* Employee Info */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {member.avatar ? (
                            <img
                              src={member.avatar}
                              alt={member.name}
                              style={{
                                width: '34px',
                                height: '34px',
                                borderRadius: '50%',
                                objectFit: 'cover',
                                border: '1.5px solid var(--border-color)',
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                width: '34px',
                                height: '34px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#ffffff',
                                fontWeight: 700,
                                fontSize: '0.8rem',
                              }}
                            >
                              {member.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                              {member.name}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {member.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            padding: '3px 8px',
                            borderRadius: 'var(--radius-sm)',
                            fontWeight: 600,
                            background: '#ecfdf5',
                            color: '#047857',
                            border: '1px solid #a7f3d0',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <UserCheck size={12} />
                          <span>{member.role || 'User'}</span>
                        </span>
                      </td>

                      {/* Department */}
                      <td>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          {member.department || 'Operations'}
                        </span>
                      </td>

                      {/* Task Breakdown Buttons */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            onClick={() => openUserWork(member, 'Completed')}
                            style={{
                              border: '1px solid #a7f3d0',
                              background: '#ecfdf5',
                              color: '#047857',
                              padding: '3px 8px',
                              borderRadius: 'var(--radius-full)',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                            title={`Inspect ${userCompleted} completed tasks for ${member.name}`}
                          >
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#059669' }} />
                            <span>{userCompleted} Done</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => openUserWork(member, 'In Progress')}
                            style={{
                              border: '1px solid #fde68a',
                              background: '#fffbeb',
                              color: '#b45309',
                              padding: '3px 8px',
                              borderRadius: 'var(--radius-full)',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                            title={`Inspect ${userInProgress} in-progress tasks for ${member.name}`}
                          >
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#d97706' }} />
                            <span>{userInProgress} Active</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => openUserWork(member, 'To Do')}
                            style={{
                              border: '1px solid #cbd5e1',
                              background: '#f1f5f9',
                              color: '#475569',
                              padding: '3px 8px',
                              borderRadius: 'var(--radius-full)',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                            title={`Inspect ${userPending} pending tasks for ${member.name}`}
                          >
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#64748b' }} />
                            <span>{userPending} Pending</span>
                          </button>
                        </div>
                      </td>

                      {/* View All Work Action */}
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => openUserWork(member, 'all')}
                          style={{
                            padding: '5px 10px',
                            fontSize: '0.775rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                          }}
                          title={`Open all work assigned to ${member.name}`}
                        >
                          <Eye size={13} />
                          <span>View Work</span>
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

      {/* 1-Click Employee Drilldown Modal */}
      <EmployeeDrilldownModal
        isOpen={isEmployeeModalOpen}
        initialDepartmentFilter={employeeDeptFilter}
        modalTitle={employeeModalTitle}
        onClose={() => setIsEmployeeModalOpen(false)}
        onOpenUserWork={openUserWork}
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
