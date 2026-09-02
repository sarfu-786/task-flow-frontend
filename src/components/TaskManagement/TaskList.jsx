import React, { useState } from 'react';
import { useTasks } from '../../context/TaskContext';
import { Pagination } from './Pagination';
import { TaskModal } from './TaskModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { MetricCard } from '../ManagerDashboard/MetricCard';
import { ManagerTasksDrilldownModal } from '../ManagerDashboard/ManagerTasksDrilldownModal';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  AlertCircle,
  Clock,
  CheckCircle2,
  FileText,
  Globe,
  Share2,
  Database,
  RefreshCw,
  ListTodo,
  TrendingUp,
  BarChart3,
  Filter,
} from 'lucide-react';

export const TaskList = () => {
  const {
    tasks,
    paginatedTasks,
    totalTasks,
    currentPage,
    itemsPerPage,
    stats,
    loading,
    error,
    search,
    setSearch,
    taskTypeFilter,
    setTaskTypeFilter,
    statusFilter,
    setStatusFilter,
    openCreateModal,
    openEditModal,
    openDeleteModal,
    updateStatus,
  } = useTasks();

  // Top Metrics Cards Drilldown Modal State (1-Click top cards)
  const [isDrilldownModalOpen, setIsDrilldownModalOpen] = useState(false);
  const [drilldownStatusFilter, setDrilldownStatusFilter] = useState('all');
  const [drilldownModalTitle, setDrilldownModalTitle] = useState('Tasks Overview');

  const openMetricDrilldown = (filter, title) => {
    setDrilldownStatusFilter(filter);
    setDrilldownModalTitle(title);
    setIsDrilldownModalOpen(true);
  };

  // Compute Task Metric Totals
  const total = stats?.total || tasks.length;
  const completed = stats?.completed || tasks.filter((t) => t.status === 'Completed').length;
  const inProgress = stats?.inProgress || tasks.filter((t) => t.status === 'In Progress').length;
  const toDo = stats?.toDo || tasks.filter((t) => t.status === 'To Do').length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Task Category breakdown
  const typeCounts = {
    'internet work': stats?.byType?.['internet work'] || tasks.filter((t) => t.taskType === 'internet work').length,
    'documentation': stats?.byType?.['documentation'] || tasks.filter((t) => t.taskType === 'documentation').length,
    'social media': stats?.byType?.['social media'] || tasks.filter((t) => t.taskType === 'social media').length,
    'backend work': stats?.byType?.['backend work'] || tasks.filter((t) => t.taskType === 'backend work').length,
  };

  const getTaskTypeBadge = (type) => {
    switch (type) {
      case 'internet work':
        return (
          <span className="badge-type badge-type-internet">
            <Globe size={13} />
            <span>Internet Work</span>
          </span>
        );
      case 'documentation':
        return (
          <span className="badge-type badge-type-doc">
            <FileText size={13} />
            <span>Documentation</span>
          </span>
        );
      case 'social media':
        return (
          <span className="badge-type badge-type-social">
            <Share2 size={13} />
            <span>Social Media</span>
          </span>
        );
      case 'backend work':
        return (
          <span className="badge-type badge-type-backend">
            <Database size={13} />
            <span>Backend Work</span>
          </span>
        );
      default:
        return <span className="badge-type">{type}</span>;
    }
  };

  const getStatusBadge = (task) => {
    const statusClasses = {
      'To Do': 'badge-status-todo',
      'In Progress': 'badge-status-progress',
      'Completed': 'badge-status-completed',
    };

    const nextStatusMap = {
      'To Do': 'In Progress',
      'In Progress': 'Completed',
      'Completed': 'To Do',
    };

    return (
      <button
        type="button"
        className={`badge-status ${statusClasses[task.status] || ''}`}
        onClick={() => updateStatus(task._id, nextStatusMap[task.status] || 'To Do')}
        title={`Click to change status to "${nextStatusMap[task.status]}"`}
      >
        <span className="status-dot" />
        <span>{task.status}</span>
      </button>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    const isOverdue = date < new Date() && date.toDateString() !== new Date().toDateString();

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Calendar size={14} color={isOverdue ? '#ef4444' : '#94a3b8'} />
        <span style={{ color: isOverdue ? '#fca5a5' : '#cbd5e1', fontSize: '0.85rem' }}>
          {date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </span>
      </div>
    );
  };

  return (
    <div>
      {/* Header section with Add Task CTA */}
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
          <h2 className="section-title">Task Management & Operations</h2>
        </div>
        <button
          className="btn btn-primary"
          onClick={openCreateModal}
          id="btn-add-new-task"
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Plus size={18} />
          <span>Add New Task</span>
        </button>
      </div>

      {error && (
        <div className="alert alert-danger">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Top 4 Interactive Metric Cards Shifted into Task Management */}
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <MetricCard
          title="Total Assigned Tasks"
          value={total}
          icon={ListTodo}
          color="#2563eb"
          bgLight="#eff6ff"
          isClickable={true}
          onClick={() => openMetricDrilldown('all', 'Total Assigned Tasks Overview')}
        />
        <MetricCard
          title="Completed Workflows"
          value={completed}
          icon={CheckCircle2}
          color="#059669"
          bgLight="#ecfdf5"
          isClickable={true}
          onClick={() => openMetricDrilldown('Completed', 'Completed Tasks & Workflows')}
        />
        <MetricCard
          title="In Progress"
          value={inProgress}
          icon={Clock}
          color="#d97706"
          bgLight="#fffbeb"
          isClickable={true}
          onClick={() => openMetricDrilldown('In Progress', 'In Progress Active Tasks')}
        />
        <MetricCard
          title="Pending To-Do"
          value={toDo}
          icon={AlertCircle}
          color="#475569"
          bgLight="#f1f5f9"
          isClickable={true}
          onClick={() => openMetricDrilldown('To Do', 'Pending To-Do Tasks')}
        />
      </div>

      {/* Main Task Container Div */}
      <div className="task-container-box">
        {/* Dynamic Navigation Toolbar with Search box above description and center controls */}
        <div className="task-nav-toolbar">
          {/* Search Box above description */}
          <div className="search-wrapper-top">
            <Search className="search-icon-inside" />
            <input
              type="text"
              className="search-input-top"
              placeholder="Search tasks by description, remark, or keywords..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              id="task-search-input"
            />
          </div>

          {/* Center Navbar Filters: Type of Work, Status Filter */}
          <div className="task-filters-row">
            <div className="filters-group-center">
              <label style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>
                Type of Work:
              </label>
              <select
                className="select-filter"
                value={taskTypeFilter}
                onChange={(e) => setTaskTypeFilter(e.target.value)}
                id="filter-task-type"
              >
                <option value="all">All Task Types</option>
                <option value="internet work">(i) Internet Work</option>
                <option value="documentation">(ii) Documentation</option>
                <option value="social media">(iii) Social Media</option>
                <option value="backend work">(iv) Backend Work</option>
              </select>

              <label style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600, marginLeft: '12px' }}>
                Status:
              </label>
              <select
                className="select-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                id="filter-task-status"
              >
                <option value="all">All Statuses</option>
                <option value="To Do">To Do</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Total Results: <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{totalTasks}</span>
            </div>
          </div>
        </div>

        {/* Task Table with Sr No 1-10 per page, Type, Expected Date, Description, Remark, Actions */}
        <div className="table-responsive">
          <table className="task-table">
            <thead>
              <tr>
                <th style={{ width: '60px', textAlign: 'center' }}>Sr No.</th>
                <th style={{ width: '150px' }}>Type of Work</th>
                <th>Task Description</th>
                <th style={{ width: '160px' }}>Expected Date</th>
                <th style={{ width: '130px' }}>Status</th>
                <th>Remark</th>
                <th style={{ width: '140px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '48px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', color: 'var(--text-muted)' }}>
                      <RefreshCw size={20} className="animate-spin" />
                      <span>Loading task records...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedTasks.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                    <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                      No tasks found
                    </p>
                    <p style={{ fontSize: '0.85rem' }}>
                      {search || taskTypeFilter !== 'all' || statusFilter !== 'all'
                        ? 'Try adjusting your search query or filter selection.'
                        : 'Click "Add New Task" to create your first entry.'}
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedTasks.map((task, index) => {
                  const serialNumber = (currentPage - 1) * itemsPerPage + index + 1;
                  return (
                    <tr key={task._id}>
                      {/* Sr. No (1-10 per page) */}
                      <td style={{ textAlign: 'center' }}>
                        <span className="sr-no-badge">{serialNumber}</span>
                      </td>

                      {/* Type of Work */}
                      <td>{getTaskTypeBadge(task.taskType)}</td>

                      {/* Description */}
                      <td>
                        <div style={{ fontWeight: 500, color: 'var(--text-primary)', maxWidth: '340px' }}>
                          {task.description}
                        </div>
                      </td>

                      {/* Expected Completion Date */}
                      <td>{formatDate(task.expectedDate)}</td>

                      {/* Task Status */}
                      <td>{getStatusBadge(task)}</td>

                      {/* Remark */}
                      <td>
                        <span style={{ color: task.remark ? 'var(--text-secondary)' : 'var(--text-muted)', fontSize: '0.85rem', fontStyle: task.remark ? 'normal' : 'italic' }}>
                          {task.remark || 'No remark provided'}
                        </span>
                      </td>

                      {/* Edit, Update & Delete Actions */}
                      <td style={{ textAlign: 'right' }}>
                        <div className="task-actions-cell" style={{ justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            className="btn-action-update"
                            onClick={() => openEditModal(task)}
                            title="Update task details"
                            id={`btn-update-task-${task._id}`}
                          >
                            <Edit2 size={13} />
                            <span>Update</span>
                          </button>

                          <button
                            type="button"
                            className="btn-action-delete"
                            onClick={() => openDeleteModal(task)}
                            title="Delete task"
                            id={`btn-delete-task-${task._id}`}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination at bottom (5-10 items per page) */}
        <Pagination />
      </div>

      {/* 1-Click Top Metric Cards Drilldown Modal (All Tasks, Completed, In Progress, To Do) */}
      <ManagerTasksDrilldownModal
        isOpen={isDrilldownModalOpen}
        initialFilter={drilldownStatusFilter}
        modalTitle={drilldownModalTitle}
        onClose={() => setIsDrilldownModalOpen(false)}
      />

      {/* Modals */}
      <TaskModal />
      <DeleteConfirmModal />
    </div>
  );
};
