import React, { useState } from 'react';
import { useTasks } from '../../context/TaskContext';
import { Pagination } from './Pagination';
import { TaskModal } from './TaskModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import {
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
  FolderKanban,
  CheckSquare,
  TrendingUp,
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
      case 'sells':
      case 'sales':
        return (
          <span className="badge-type badge-type-sells" style={{ background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' }}>
            <TrendingUp size={13} />
            <span>Sells</span>
          </span>
        );
      default:
        return <span className="badge-type">{type}</span>;
    }
  };

  const getStatusBadge = (task) => {
    const statusClasses = {
      'To Do': 'badge-status-todo',

    };

    const nextStatusMap = {
      'To Do': 'In Progress',

    };

    return (
      <button
        type="button"
        className={`badge-status ${statusClasses[task.status] || ''}`}
        onClick={() => updateStatus(task._id, nextStatusMap[task.status] || 'To Do')}
        title={`Click to switch status to "${nextStatusMap[task.status]}"`}
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
        <Calendar size={13} color={isOverdue ? '#ef4444' : '#64748b'} />
        <span style={{ color: isOverdue ? '#dc2626' : 'var(--text-secondary)', fontSize: '0.82rem', fontWeight: isOverdue ? 600 : 400 }}>
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
    <div className="task-management-page">
      {/* Header section with Add Task CTA */}
      <div
        className="section-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '14px',
          marginBottom: '18px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckSquare className="text-primary" size={24} />
            <h2 className="section-title" style={{ margin: 0, fontSize: '1.4rem' }}>
              Task Management
            </h2>
          </div>
        </div>

        <button
          className="btn btn-primary"
          onClick={openCreateModal}
          id="btn-add-new-task"
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Plus size={16} />
          <span>Add Task</span>
        </button>
      </div>

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '16px' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Main Task Container */}
      <div className="task-container-box">
        {/* Navigation Toolbar with Filters */}
        <div className="task-nav-toolbar">
          {/* Filters: Task Type & Status */}
          <div className="task-filters-row" style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="filters-group-center">
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                Task Type:
              </label>
              <select
                className="select-filter"
                value={taskTypeFilter}
                onChange={(e) => setTaskTypeFilter(e.target.value)}
                id="filter-task-type"
              >
                <option value="all">All Task Types</option>
                <option value="internet work">Internet Work</option>
                <option value="documentation">Documentation</option>
                <option value="social media">Social Media</option>
                <option value="backend work">Backend Work</option>
                <option value="sells">Sells</option>
              </select>

              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, marginLeft: '12px' }}>
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
              Total: <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{totalTasks}</span>
            </div>
          </div>
        </div>

        {/* Task Table */}
        <div className="table-responsive">
          <table className="task-table">
            <thead>
              <tr>
                <th style={{ width: '50px', textAlign: 'center' }}>Sr. No</th>
                <th>Description</th>
                <th style={{ width: '150px' }}>Task Type</th>
                <th style={{ width: '150px' }}>Expected Date</th>
                <th style={{ width: '130px' }}>Status</th>
                <th>Remark</th>
                <th style={{ width: '110px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--text-muted)' }}>
                      <RefreshCw size={18} className="animate-spin" />
                      <span>Loading tasks...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedTasks.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                      No tasks found
                    </p>
                    <p style={{ fontSize: '0.85rem', margin: 0 }}>
                      {search || taskTypeFilter !== 'all' || statusFilter !== 'all'
                        ? 'Try adjusting your search query or filter selection.'
                        : 'Click "Add Task" to create your first task.'}
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedTasks.map((task, index) => {
                  const serialNumber = (currentPage - 1) * itemsPerPage + index + 1;
                  return (
                    <tr key={task._id}>
                      {/* Sr. No */}
                      <td style={{ textAlign: 'center' }}>
                        <span className="sr-no-badge">{serialNumber}</span>
                      </td>

                      {/* Description */}
                      <td>
                        <div style={{ fontWeight: 500, color: 'var(--text-primary)', maxWidth: '340px' }}>
                          {task.description}
                        </div>
                        {task.assignedTo && (
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            Assigned to: <strong style={{ color: 'var(--text-secondary)' }}>{task.assignedTo}</strong>
                          </div>
                        )}
                      </td>

                      {/* Task Type */}
                      <td>{getTaskTypeBadge(task.taskType)}</td>

                      {/* Expected Date */}
                      <td>{formatDate(task.expectedDate)}</td>

                      {/* Status */}
                      <td>{getStatusBadge(task)}</td>

                      {/* Remark */}
                      <td>
                        <span style={{ color: task.remark ? 'var(--text-secondary)' : 'var(--text-muted)', fontSize: '0.82rem', fontStyle: task.remark ? 'normal' : 'italic' }}>
                          {task.remark || 'No remark'}
                        </span>
                      </td>

                      {/* Actions: Edit & Delete */}
                      <td style={{ textAlign: 'right' }}>
                        <div className="task-actions-cell" style={{ justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            className="btn-action-update"
                            onClick={() => openEditModal(task)}
                            title="Edit / Update Task"
                            id={`btn-update-task-${task._id}`}
                          >
                            <Edit2 size={14} />
                          </button>

                          <button
                            type="button"
                            className="btn-action-delete"
                            onClick={() => openDeleteModal(task)}
                            title="Delete Task"
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

        {/* Pagination (5-10 entries per page) */}
        <Pagination />
      </div>
    </div>
  );
};
