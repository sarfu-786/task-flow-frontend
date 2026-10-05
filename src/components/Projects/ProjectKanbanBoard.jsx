import React, { useState, useMemo } from 'react';
import { useProjects } from '../../context/ProjectContext';
import {
  Layers,
  Plus,
  Clock,
  User,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Filter,
  ArrowRight,
  ArrowLeft,
  Tag,
  ListTodo,
  ChevronDown,
  Building,
} from 'lucide-react';

export const ProjectKanbanBoard = ({ onOpenTaskModal, onViewProject }) => {
  const { projects, updateTaskStatus } = useProjects();

  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  const KANBAN_COLUMNS = [
    { id: 'To Do', label: 'To Do', color: '#475569', bg: '#f8fafc', headerBg: '#ffffff', border: '#e2e8f0', dot: '#94a3b8' },
    { id: 'In Progress', label: 'In Progress', color: '#2563eb', bg: '#f0f7ff', headerBg: '#ffffff', border: '#bfdbfe', dot: '#3b82f6' },
    { id: 'Review', label: 'Review / QA', color: '#7c3aed', bg: '#faf5ff', headerBg: '#ffffff', border: '#e9d5ff', dot: '#8b5cf6' },
    { id: 'Completed', label: 'Completed', color: '#059669', bg: '#f0fdf4', headerBg: '#ffffff', border: '#bbf7d0', dot: '#10b981' },
  ];

  // Aggregate all tasks with project metadata
  const allTasks = useMemo(() => {
    const list = [];
    projects.forEach((p) => {
      if (selectedProjectId !== 'all' && p._id !== selectedProjectId) return;

      (p.tasks || []).forEach((t) => {
        if (priorityFilter !== 'all' && t.priority !== priorityFilter) return;

        list.push({
          ...t,
          projectId: p._id,
          projectCode: p.projectId || p.projectCode || 'PRJ',
          projectName: p.name || p.title,
          clientName: p.client || p.clientName || 'Client',
        });
      });
    });
    return list;
  }, [projects, selectedProjectId, priorityFilter]);

  const handleMoveTask = async (task, targetStatus) => {
    try {
      const progress = targetStatus === 'Completed' ? 100 : targetStatus === 'In Progress' ? 50 : 0;
      await updateTaskStatus(task.projectId, task.taskId || task._id, targetStatus, progress);
    } catch (err) {
      console.error('[Move Task Error]', err);
    }
  };

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'Urgent':
      case 'High':
        return { bg: '#fef2f2', color: '#dc2626', border: '#fee2e2' };
      case 'Medium':
        return { bg: '#fffbeb', color: '#d97706', border: '#fef3c7' };
      default:
        return { bg: '#ecfdf5', color: '#059669', border: '#d1fae5' };
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Filters Strip */}
      <div
        style={{
          padding: '16px 20px',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1.5px solid #e2e8f0',
          boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Project Filter */}
          <div style={{ position: 'relative' }}>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              style={{
                height: '40px',
                padding: '0 36px 0 14px',
                backgroundColor: '#ffffff',
                border: '1.5px solid #cbd5e1',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: 600,
                color: '#1e293b',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                cursor: 'pointer',
                appearance: 'none',
                maxWidth: '280px',
                outline: 'none',
              }}
            >
              <option value="all">All Projects Deliverables</option>
              {projects.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.projectId || p.projectCode || 'PRJ'} - {p.name || p.title}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#64748b',
                pointerEvents: 'none',
              }}
            />
          </div>

          {/* Priority Filter */}
          <div style={{ position: 'relative' }}>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              style={{
                height: '40px',
                padding: '0 36px 0 14px',
                backgroundColor: '#ffffff',
                border: '1.5px solid #cbd5e1',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: 600,
                color: '#1e293b',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                cursor: 'pointer',
                appearance: 'none',
                outline: 'none',
              }}
            >
              <option value="all">All Priorities</option>
              <option value="Urgent">Urgent Priority</option>
              <option value="High">High Priority</option>
              <option value="Medium">Medium Priority</option>
              <option value="Low">Low Priority</option>
            </select>
            <ChevronDown
              size={14}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#64748b',
                pointerEvents: 'none',
              }}
            />
          </div>
        </div>

        {onOpenTaskModal && (
          <button
            type="button"
            onClick={() => onOpenTaskModal()}
            style={{
              height: '40px',
              padding: '0 18px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              borderRadius: '10px',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 700,
              border: 'none',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#1d4ed8';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#2563eb';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <Plus size={16} />
            <span>Add Deliverable Task</span>
          </button>
        )}
      </div>

      {/* 4-Column Kanban Canvas */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '16px',
          alignItems: 'start',
        }}
      >
        {KANBAN_COLUMNS.map((col) => {
          const colTasks = allTasks.filter((t) => {
            const st = (t.status || 'To Do').toLowerCase();
            if (col.id === 'To Do') return st === 'to do' || st === 'draft' || st === 'planning';
            if (col.id === 'In Progress') return st === 'in progress' || st === 'in_progress';
            if (col.id === 'Review') return st === 'review' || st === 'under review' || st === 'qa';
            if (col.id === 'Completed') return st === 'completed' || st === 'done' || st === 'closed';
            return false;
          });

          return (
            <div
              key={col.id}
              style={{
                backgroundColor: col.bg,
                borderRadius: '16px',
                border: `1.5px solid ${col.border}`,
                display: 'flex',
                flexDirection: 'column',
                minHeight: '540px',
                overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
              }}
            >
              {/* Column Header */}
              <div
                style={{
                  padding: '14px 18px',
                  borderBottom: `1.5px solid ${col.border}`,
                  backgroundColor: col.headerBg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      backgroundColor: col.dot,
                    }}
                  />
                  <span
                    style={{
                      fontWeight: 800,
                      fontSize: '13px',
                      color: col.color,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {col.label}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    padding: '2px 9px',
                    borderRadius: '12px',
                    backgroundColor: col.bg,
                    color: col.color,
                    border: `1px solid ${col.border}`,
                  }}
                >
                  {colTasks.length}
                </span>
              </div>

              {/* Task Cards Container */}
              <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, overflowY: 'auto' }}>
                {colTasks.length === 0 ? (
                  <div style={{ padding: '48px 16px', textAlign: 'center', color: '#94a3b8', fontSize: '12px', fontStyle: 'italic' }}>
                    No deliverable tasks in {col.label}
                  </div>
                ) : (
                  colTasks.map((task, tIdx) => {
                    const prioStyle = getPriorityStyle(task.priority);
                    const formattedDue = formatDate(task.dueDate);

                    return (
                      <div
                        key={task.taskId || task._id || tIdx}
                        style={{
                          backgroundColor: '#ffffff',
                          padding: '14px 16px',
                          borderRadius: '12px',
                          border: '1.5px solid #e2e8f0',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px',
                          transition: 'all 0.15s ease',
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.borderColor = '#93c5fd';
                          e.currentTarget.style.boxShadow = '0 6px 16px rgba(37, 99, 235, 0.08)';
                          e.currentTarget.style.transform = 'translateY(-1px)';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.borderColor = '#e2e8f0';
                          e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.03)';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                      >
                        {/* Card Header: Project Code & Priority */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                          <span
                            style={{
                              fontFamily: 'monospace',
                              fontWeight: 700,
                              fontSize: '11px',
                              color: '#2563eb',
                              backgroundColor: '#eff6ff',
                              border: '1px solid #bfdbfe',
                              padding: '2px 7px',
                              borderRadius: '6px',
                            }}
                          >
                            {task.projectCode}
                          </span>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '6px',
                              backgroundColor: prioStyle.bg,
                              color: prioStyle.color,
                              border: `1px solid ${prioStyle.border}`,
                            }}
                          >
                            {task.priority || 'Medium'}
                          </span>
                        </div>

                        {/* Title */}
                        <h4
                          style={{
                            fontSize: '13px',
                            fontWeight: 700,
                            color: '#0f172a',
                            lineHeight: 1.4,
                            margin: 0,
                          }}
                        >
                          {task.taskName || task.title}
                        </h4>

                        {/* Project / Client Context */}
                        <p
                          style={{
                            fontSize: '12px',
                            color: '#64748b',
                            margin: 0,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          <Building size={13} style={{ color: '#94a3b8', flexShrink: 0 }} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {task.projectName}
                          </span>
                        </p>

                        {/* Bottom Row: Assignee & Due Date */}
                        <div
                          style={{
                            paddingTop: '10px',
                            borderTop: '1px solid #f1f5f9',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            fontSize: '11px',
                            color: '#64748b',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', maxWidth: '140px', overflow: 'hidden' }}>
                            <div
                              style={{
                                width: '22px',
                                height: '22px',
                                borderRadius: '50%',
                                backgroundColor: '#e2e8f0',
                                color: '#1e293b',
                                fontWeight: 700,
                                fontSize: '10px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                              }}
                            >
                              {(task.assignedTo || 'U').charAt(0).toUpperCase()}
                            </div>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {task.assignedTo || 'Unassigned'}
                            </span>
                          </div>

                          {formattedDue && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600, color: '#475569' }}>
                              <Calendar size={12} style={{ color: '#94a3b8' }} />
                              {formattedDue}
                            </span>
                          )}
                        </div>

                        {/* Quick Status Shift Buttons */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '6px',
                            paddingTop: '6px',
                          }}
                        >
                          {col.id !== 'To Do' && (
                            <button
                              type="button"
                              onClick={() => {
                                const prev =
                                  col.id === 'Completed'
                                    ? 'Review'
                                    : col.id === 'Review'
                                    ? 'In Progress'
                                    : 'To Do';
                                handleMoveTask(task, prev);
                              }}
                              style={{
                                padding: '4px 10px',
                                backgroundColor: '#f1f5f9',
                                border: '1px solid #e2e8f0',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: 600,
                                color: '#475569',
                                cursor: 'pointer',
                                transition: 'all 0.1s ease',
                              }}
                              onMouseOver={(e) => {
                                e.currentTarget.style.backgroundColor = '#e2e8f0';
                              }}
                              onMouseOut={(e) => {
                                e.currentTarget.style.backgroundColor = '#f1f5f9';
                              }}
                            >
                              ← Move Back
                            </button>
                          )}
                          {col.id !== 'Completed' && (
                            <button
                              type="button"
                              onClick={() => {
                                const next =
                                  col.id === 'To Do'
                                    ? 'In Progress'
                                    : col.id === 'In Progress'
                                    ? 'Review'
                                    : 'Completed';
                                handleMoveTask(task, next);
                              }}
                              style={{
                                marginLeft: 'auto',
                                padding: '4px 12px',
                                backgroundColor: '#eff6ff',
                                border: '1px solid #bfdbfe',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: 700,
                                color: '#2563eb',
                                cursor: 'pointer',
                                transition: 'all 0.1s ease',
                              }}
                              onMouseOver={(e) => {
                                e.currentTarget.style.backgroundColor = '#dbeafe';
                              }}
                              onMouseOut={(e) => {
                                e.currentTarget.style.backgroundColor = '#eff6ff';
                              }}
                            >
                              Advance →
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProjectKanbanBoard;
