import React, { useState } from 'react';
import { useTasks } from '../../context/TaskContext';
import {
  Clock,
  CheckCircle2,
  ListTodo,
  Globe,
  FileText,
  Share2,
  Database,
  TrendingUp,
  Calendar,
  User,
  Paperclip,
  Edit2,
  Trash2,
  Eye,
  ArrowRight,
  ArrowLeft,
  Plus,
  AlertCircle,
} from 'lucide-react';

export const TaskKanbanBoard = ({ tasks = [], onEditTask, onDeleteTask }) => {
  const { updateStatus, openCreateModal, openViewModal, openEditModal, openDeleteModal } = useTasks();
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);

  const columns = [
    {
      id: 'To Do',
      title: 'To Do',
      icon: ListTodo,
      color: '#4f46e5',
      bgColor: '#eef2ff',
      borderColor: '#c7d2fe',
      badgeBg: '#e0e7ff',
      badgeText: '#3730a3',
    },
    {
      id: 'In Progress',
      title: 'In Progress',
      icon: Clock,
      color: '#d97706',
      bgColor: '#fffbeb',
      borderColor: '#fde68a',
      badgeBg: '#fef3c7',
      badgeText: '#92400e',
    },
    {
      id: 'Completed',
      title: 'Completed',
      icon: CheckCircle2,
      color: '#059669',
      bgColor: '#ecfdf5',
      borderColor: '#a7f3d0',
      badgeBg: '#d1fae5',
      badgeText: '#065f46',
    },
  ];

  const getTaskTypeBadge = (type) => {
    switch (type?.toLowerCase()) {
      case 'internet work':
        return (
          <span className="badge-type badge-type-internet">
            <Globe size={11} />
            <span>Internet Work</span>
          </span>
        );
      case 'documentation':
        return (
          <span className="badge-type badge-type-doc">
            <FileText size={11} />
            <span>Documentation</span>
          </span>
        );
      case 'social media':
        return (
          <span className="badge-type badge-type-social">
            <Share2 size={11} />
            <span>Social Media</span>
          </span>
        );
      case 'backend work':
        return (
          <span className="badge-type badge-type-backend">
            <Database size={11} />
            <span>Backend Work</span>
          </span>
        );
      case 'sells':
      case 'sales':
        return (
          <span className="badge-type badge-type-sales">
            <TrendingUp size={11} />
            <span>Sales & Deals</span>
          </span>
        );
      default:
        return (
          <span className="badge-type">
            <span>{type || 'General'}</span>
          </span>
        );
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'High':
        return (
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#dc2626', background: '#fef2f2', padding: '2px 7px', borderRadius: '6px', border: '1px solid #fee2e2' }}>
            High
          </span>
        );
      case 'Medium':
        return (
          <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#d97706', background: '#fffbeb', padding: '2px 7px', borderRadius: '6px', border: '1px solid #fef3c7' }}>
            Medium
          </span>
        );
      case 'Low':
        return (
          <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b', background: '#f1f5f9', padding: '2px 7px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
            Low
          </span>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const isOverdue = (task) => {
    if (task.status === 'Completed' || !task.expectedDate) return false;
    const exp = new Date(task.expectedDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return exp < today;
  };

  // Drag & Drop handlers
  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedTaskId(taskId);
  };

  const handleDragOver = (e, columnId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumn !== columnId) {
      setDragOverColumn(columnId);
    }
  };

  const handleDragLeave = (e, columnId) => {
    if (dragOverColumn === columnId) {
      setDragOverColumn(null);
    }
  };

  const handleDrop = async (e, targetStatus) => {
    e.preventDefault();
    setDragOverColumn(null);
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (!taskId) return;

    const task = tasks.find((t) => t._id?.toString() === taskId.toString());
    if (task && task.status !== targetStatus) {
      await updateStatus(taskId, targetStatus);
    }
    setDraggedTaskId(null);
  };

  return (
    <div
      className="kanban-board-container"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '20px',
        alignItems: 'start',
        marginTop: '16px',
      }}
    >
      {columns.map((col) => {
        const colTasks = tasks.filter(
          (t) => (t.status || 'To Do') === col.id || (col.id === 'To Do' && !t.status)
        );
        const IconComponent = col.icon;
        const isHovered = dragOverColumn === col.id;

        return (
          <div
            key={col.id}
            className={`kanban-column ${isHovered ? 'kanban-column-hover' : ''}`}
            onDragOver={(e) => handleDragOver(e, col.id)}
            onDragLeave={(e) => handleDragLeave(e, col.id)}
            onDrop={(e) => handleDrop(e, col.id)}
            style={{
              background: '#f8fafc',
              borderRadius: '16px',
              border: `2px solid ${isHovered ? col.color : '#e2e8f0'}`,
              boxShadow: isHovered ? `0 8px 24px rgba(0,0,0,0.08)` : 'var(--shadow-sm)',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              display: 'flex',
              flexDirection: 'column',
              minHeight: '480px',
              maxHeight: 'calc(100vh - 260px)',
              overflow: 'hidden',
            }}
          >
            {/* Column Header */}
            <div
              style={{
                padding: '14px 16px',
                background: col.bgColor,
                borderBottom: `1px solid ${col.borderColor}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '8px',
                    background: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: col.color,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
                  }}
                >
                  <IconComponent size={16} />
                </div>
                <h3 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 800, color: '#0f172a' }}>
                  {col.title}
                </h3>
              </div>

              <span
                style={{
                  background: col.badgeBg,
                  color: col.badgeText,
                  fontWeight: 800,
                  fontSize: '0.78rem',
                  padding: '3px 10px',
                  borderRadius: '999px',
                }}
              >
                {colTasks.length}
              </span>
            </div>

            {/* Column Cards List */}
            <div
              className="custom-scrollbar"
              style={{
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                overflowY: 'auto',
                flex: 1,
              }}
            >
              {colTasks.length === 0 ? (
                <div
                  style={{
                    padding: '32px 16px',
                    textAlign: 'center',
                    color: '#94a3b8',
                    border: '2px dashed #e2e8f0',
                    borderRadius: '12px',
                    background: '#ffffff',
                    margin: '8px 0',
                  }}
                >
                  <ListTodo size={24} style={{ margin: '0 auto 6px', color: '#cbd5e1' }} />
                  <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>No tasks in {col.title}</div>
                  <div style={{ fontSize: '0.72rem', marginTop: '2px' }}>Drag tasks here to update status</div>
                </div>
              ) : (
                colTasks.map((task) => {
                  const overdue = isOverdue(task);
                  const isDragging = draggedTaskId === task._id;
                  const attachmentCount = Array.isArray(task.attachments) ? task.attachments.length : 0;

                  return (
                    <div
                      key={task._id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task._id)}
                      className={`kanban-card ${isDragging ? 'kanban-card-dragging' : ''}`}
                      style={{
                        background: '#ffffff',
                        borderRadius: '12px',
                        border: overdue ? '1px solid #fca5a5' : '1px solid #e2e8f0',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                        padding: '14px',
                        cursor: 'grab',
                        transition: 'all 0.15s ease',
                        position: 'relative',
                      }}
                    >
                      {/* Top row: Type badge & Priority badge */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: '8px',
                          gap: '6px',
                          flexWrap: 'wrap',
                        }}
                      >
                        {getTaskTypeBadge(task.taskType)}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {task.priority && getPriorityBadge(task.priority)}
                          {overdue && (
                            <span
                              style={{
                                fontSize: '0.68rem',
                                fontWeight: 700,
                                background: '#fef2f2',
                                color: '#dc2626',
                                border: '1px solid #fecaca',
                                padding: '1px 6px',
                                borderRadius: '4px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                              }}
                            >
                              <AlertCircle size={10} /> Overdue
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Description */}
                      <p
                        style={{
                          fontSize: '0.88rem',
                          fontWeight: 600,
                          color: '#1e293b',
                          margin: '0 0 10px 0',
                          lineHeight: '1.45',
                          wordBreak: 'break-word',
                        }}
                      >
                        {task.description}
                      </p>

                      {/* Remark if any */}
                      {task.remark && (
                        <p
                          style={{
                            fontSize: '0.76rem',
                            color: '#64748b',
                            background: '#f8fafc',
                            padding: '6px 8px',
                            borderRadius: '6px',
                            margin: '0 0 10px 0',
                            borderLeft: '2px solid #cbd5e1',
                          }}
                        >
                          {task.remark}
                        </p>
                      )}

                      {/* Completion Remark if completed */}
                      {task.status === 'Completed' && task.completionRemark && (
                        <p
                          style={{
                            fontSize: '0.76rem',
                            color: '#047857',
                            background: '#ecfdf5',
                            padding: '6px 8px',
                            borderRadius: '6px',
                            margin: '0 0 10px 0',
                            borderLeft: '2px solid #10b981',
                          }}
                        >
                          <strong>Done:</strong> {task.completionRemark}
                        </p>
                      )}

                      {/* Meta Footer: Assignee, Due Date, Attachments */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          borderTop: '1px solid #f1f5f9',
                          paddingTop: '10px',
                          marginTop: '4px',
                          fontSize: '0.74rem',
                          color: '#64748b',
                          flexWrap: 'wrap',
                          gap: '6px',
                        }}
                      >
                        {/* Assignee */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            fontWeight: 600,
                            color: '#334155',
                          }}
                        >
                          <div
                            style={{
                              width: '20px',
                              height: '20px',
                              borderRadius: '50%',
                              background: '#eff6ff',
                              color: '#2563eb',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.65rem',
                              fontWeight: 700,
                            }}
                          >
                            {(task.assignedTo || 'U').charAt(0).toUpperCase()}
                          </div>
                          <span style={{ maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {task.assignedTo || 'Unassigned'}
                          </span>
                        </div>

                        {/* Due Date & Attachments */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {attachmentCount > 0 && (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                color: '#2563eb',
                                fontWeight: 700,
                                background: '#eff6ff',
                                padding: '2px 6px',
                                borderRadius: '4px',
                              }}
                              title={`${attachmentCount} file attachment(s)`}
                            >
                              <Paperclip size={11} />
                              <span>{attachmentCount}</span>
                            </span>
                          )}

                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              color: overdue ? '#dc2626' : '#64748b',
                              fontWeight: overdue ? 700 : 500,
                            }}
                          >
                            <Calendar size={12} />
                            <span>{formatDate(task.expectedDate)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Card Action Toolbar (Quick Move, Edit, Delete) */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginTop: '10px',
                          paddingTop: '8px',
                          borderTop: '1px dashed #f1f5f9',
                        }}
                      >
                        <div style={{ display: 'flex', gap: '4px' }}>
                          {col.id !== 'To Do' && (
                            <button
                              type="button"
                              onClick={() =>
                                updateStatus(
                                  task._id,
                                  col.id === 'Completed' ? 'In Progress' : 'To Do'
                                )
                              }
                              title="Move Backward"
                              style={{
                                background: '#f1f5f9',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '4px 6px',
                                color: '#475569',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                fontSize: '0.7rem',
                                gap: '2px',
                              }}
                            >
                              <ArrowLeft size={11} />
                            </button>
                          )}
                          {col.id !== 'Completed' && (
                            <button
                              type="button"
                              onClick={() =>
                                updateStatus(
                                  task._id,
                                  col.id === 'To Do' ? 'In Progress' : 'Completed'
                                )
                              }
                              title="Advance Status"
                              style={{
                                background: col.id === 'To Do' ? '#fffbeb' : '#ecfdf5',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '4px 8px',
                                color: col.id === 'To Do' ? '#b45309' : '#059669',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                gap: '3px',
                              }}
                            >
                              <span>{col.id === 'To Do' ? 'Start' : 'Complete'}</span>
                              <ArrowRight size={11} />
                            </button>
                          )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <button
                            type="button"
                            onClick={() => openViewModal(task)}
                            title="View Task Details"
                            style={{
                              background: '#eff6ff',
                              border: '1px solid #bfdbfe',
                              padding: '4px 6px',
                              color: '#2563eb',
                              cursor: 'pointer',
                              borderRadius: '6px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Eye size={13} />
                          </button>

                          <button
                            type="button"
                            onClick={() => onEditTask ? onEditTask(task) : openEditModal(task)}
                            title="Edit Task"
                            style={{
                              background: '#f8fafc',
                              border: '1px solid #e2e8f0',
                              padding: '4px 6px',
                              color: '#475569',
                              cursor: 'pointer',
                              borderRadius: '6px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Edit2 size={13} />
                          </button>

                          <button
                            type="button"
                            onClick={() => onDeleteTask ? onDeleteTask(task) : openDeleteModal(task)}
                            title="Delete Task"
                            style={{
                              background: '#fef2f2',
                              border: '1px solid #fecaca',
                              padding: '4px 6px',
                              color: '#dc2626',
                              cursor: 'pointer',
                              borderRadius: '6px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Quick Add Button in Column */}
            <div style={{ padding: '10px 12px', borderTop: '1px solid #e2e8f0', background: '#ffffff' }}>
              <button
                type="button"
                onClick={openCreateModal}
                style={{
                  width: '100%',
                  background: '#f8fafc',
                  border: '1px dashed #cbd5e1',
                  borderRadius: '8px',
                  padding: '8px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: '#475569',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                }}
              >
                <Plus size={13} />
                <span>Add {col.title} Task</span>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
