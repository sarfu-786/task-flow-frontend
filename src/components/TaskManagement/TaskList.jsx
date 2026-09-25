import React, { useState, useEffect } from 'react';
import { useTasks } from '../../context/TaskContext';
import { MetricCard } from '../ManagerDashboard/MetricCard';
import { ManagerTasksDrilldownModal } from '../ManagerDashboard/ManagerTasksDrilldownModal';
import { TaskModal } from './TaskModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { TaskDetailModal } from './TaskDetailModal';
import {
  Plus,
  CheckCircle2,
  Clock,
  ListTodo,
  FolderKanban,
} from 'lucide-react';

export const TaskList = () => {
  const { tasks, openCreateModal } = useTasks();

  const [isTasksModalOpen, setIsTasksModalOpen] = useState(false);
  const [tasksFilterParam, setTasksFilterParam] = useState('all');
  const [tasksModalTitle, setTasksModalTitle] = useState('Tasks Overview');

  const openTasksDrilldown = (status = 'all', title = 'Tasks Overview') => {
    setTasksFilterParam(status);
    setTasksModalTitle(title);
    setIsTasksModalOpen(true);
  };

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isTasksModalOpen) {
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
  }, [isTasksModalOpen]);

  // Metrics calculation
  const totalCount = tasks.length;
  const completedCount = tasks.filter((t) => t.status === 'Completed').length;
  const inProgressCount = tasks.filter((t) => t.status === 'In Progress').length;
  const todoCount = tasks.filter((t) => t.status === 'To Do' || !t.status).length;

  return (
    <div className="task-management-page fade-in" style={{ padding: '6px 0 32px 0' }}>
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
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span
              className="badge-official badge-blue"
              style={{ borderRadius: '999px', padding: '3px 10px', fontSize: '0.74rem', fontWeight: 700 }}
            >
              Task Operations
            </span>
            <span
              className="badge-official"
              style={{
                background: '#ecfdf5',
                color: '#059669',
                borderColor: '#a7f3d0',
                borderRadius: '999px',
                padding: '3px 10px',
                fontSize: '0.74rem',
                fontWeight: 700,
              }}
            >
              {completedCount}/{totalCount} Completed
            </span>
          </div>
          <h1 style={{ fontSize: '1.38rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Task Management
          </h1>
        </div>

        {/* Header Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Add Task Button */}
          <button
            type="button"
            className="btn btn-primary"
            onClick={openCreateModal}
            id="btn-add-new-task"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: '#2563eb',
              color: '#ffffff',
              padding: '10px 18px',
              borderRadius: '999px',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
              transition: 'all 0.2s',
            }}
          >
            <Plus size={16} />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* 4 Curved Task Metric Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px',
          marginBottom: '20px',
        }}
      >
        <MetricCard
          title="Total Assigned Tasks"
          value={totalCount}
          subtitle="All active organizational tasks"
          icon={ListTodo}
          color="#2563eb"
          bgLight="#eff6ff"
          isClickable={true}
          onClick={() => openTasksDrilldown('all', 'All Assigned Tasks')}
        />

        <MetricCard
          title="In Progress Work"
          value={inProgressCount}
          subtitle="Currently in execution"
          icon={Clock}
          color="#d97706"
          bgLight="#fffbeb"
          isClickable={true}
          onClick={() => openTasksDrilldown('In Progress', 'In Progress Tasks')}
        />

        <MetricCard
          title="Completed Workflows"
          value={completedCount}
          subtitle="Successfully finalized & delivered"
          icon={CheckCircle2}
          color="#059669"
          bgLight="#ecfdf5"
          isClickable={true}
          onClick={() => openTasksDrilldown('Completed', 'Completed Tasks')}
        />

        <MetricCard
          title="Pending Queue"
          value={todoCount}
          subtitle="Awaiting task execution"
          icon={FolderKanban}
          color="#6366f1"
          bgLight="#eef2ff"
          isClickable={true}
          onClick={() => openTasksDrilldown('To Do', 'Pending Tasks Queue')}
        />
      </div>

      {/* Drilldown Modal (Opened on clicking any card) */}
      <ManagerTasksDrilldownModal
        isOpen={isTasksModalOpen}
        onClose={() => setIsTasksModalOpen(false)}
        initialFilter={tasksFilterParam}
        modalTitle={tasksModalTitle}
      />

      {/* Task Detail View Modal */}
      <TaskDetailModal />

      {/* Task Creation & Edit Modal */}
      <TaskModal />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal />
    </div>
  );
};

export default TaskList;
