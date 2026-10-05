import React, { useState, useMemo } from 'react';
import { useProjects } from '../../context/ProjectContext';
import {
  Calendar,
  Layers,
  CheckCircle2,
  Clock,
  AlertCircle,
  Filter,
  ChevronRight,
  ChevronDown,
  Sparkles,
  ArrowRight,
  Eye,
  Plus,
} from 'lucide-react';

export const ProjectGanttView = ({ onViewProject, onOpenTaskModal }) => {
  const { projects, loading } = useProjects();

  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [zoomLevel, setZoomLevel] = useState('weeks'); // 'days' | 'weeks' | 'months'
  const [expandedPhases, setExpandedPhases] = useState({});

  // Toggle phase collapse
  const togglePhase = (phaseKey) => {
    setExpandedPhases((prev) => ({ ...prev, [phaseKey]: !prev[phaseKey] }));
  };

  // Filter projects
  const activeProjects = useMemo(() => {
    if (selectedProjectId === 'all') return projects;
    return projects.filter((p) => p._id === selectedProjectId);
  }, [projects, selectedProjectId]);

  // Determine timeline boundary
  const timelineDates = useMemo(() => {
    let minDate = new Date();
    let maxDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);

    projects.forEach((p) => {
      if (p.startDate) {
        const d = new Date(p.startDate);
        if (d < minDate) minDate = d;
      }
      if (p.targetDate || p.endDate) {
        const d = new Date(p.targetDate || p.endDate);
        if (d > maxDate) maxDate = d;
      }
    });

    // Pad 7 days before and 14 days after
    const start = new Date(minDate);
    start.setDate(start.getDate() - 7);
    const end = new Date(maxDate);
    end.setDate(end.getDate() + 14);

    const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    return { start, end, totalDays };
  }, [projects]);

  // Generate calendar columns based on zoom level
  const timeColumns = useMemo(() => {
    const cols = [];
    const curr = new Date(timelineDates.start);
    const stepDays = zoomLevel === 'days' ? 1 : zoomLevel === 'weeks' ? 7 : 30;

    while (curr <= timelineDates.end) {
      cols.push(new Date(curr));
      curr.setDate(curr.getDate() + stepDays);
    }
    return cols;
  }, [timelineDates, zoomLevel]);

  const calculatePositionPercent = (dateStr) => {
    if (!dateStr) return 0;
    const d = new Date(dateStr);
    const totalTime = timelineDates.end.getTime() - timelineDates.start.getTime();
    if (totalTime <= 0) return 0;
    const pos = d.getTime() - timelineDates.start.getTime();
    return Math.max(0, Math.min(100, (pos / totalTime) * 100));
  };

  const calculateWidthPercent = (startStr, endStr) => {
    const s = calculatePositionPercent(startStr || new Date().toISOString());
    const e = calculatePositionPercent(endStr || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString());
    return Math.max(2, e - s);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Urgent':
        return '#dc2626';
      case 'High':
        return '#ea580c';
      case 'Medium':
        return '#2563eb';
      default:
        return '#059669';
    }
  };

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '18px',
        border: '1.5px solid #e2e8f0',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Gantt Top Controls Strip */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1.5px solid #e2e8f0',
          backgroundColor: '#f8fafc',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Custom Select for Project Scope */}
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
              <option value="all">All Projects Gantt Timeline</option>
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

          {/* Zoom Level Switcher */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              backgroundColor: '#e2e8f0',
              padding: '3px',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
            }}
          >
            {[
              { id: 'days', label: 'Days' },
              { id: 'weeks', label: 'Weeks' },
              { id: 'months', label: 'Months' },
            ].map((z) => {
              const isSelected = zoomLevel === z.id;
              return (
                <button
                  key={z.id}
                  type="button"
                  onClick={() => setZoomLevel(z.id)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 700,
                    border: 'none',
                    backgroundColor: isSelected ? '#ffffff' : 'transparent',
                    color: isSelected ? '#2563eb' : '#64748b',
                    boxShadow: isSelected ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {z.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px', fontWeight: 600, color: '#64748b' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '12px', height: '8px', borderRadius: '3px', backgroundColor: '#10b981' }} />
            <span>Delivered</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '12px', height: '8px', borderRadius: '3px', backgroundColor: '#2563eb' }} />
            <span>In Delivery</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', transform: 'rotate(45deg)', backgroundColor: '#7c3aed' }} />
            <span>Milestone Gate</span>
          </div>
        </div>
      </div>

      {/* Main Gantt Body: Left Sticky Task List + Right Horizontal Timeline */}
      <div style={{ display: 'flex', overflowX: 'auto', minHeight: '460px', position: 'relative' }}>
        {/* Left Tree: Projects, Phases, Tasks (Sticky) */}
        <div
          style={{
            width: '320px',
            minWidth: '320px',
            borderRight: '1.5px solid #e2e8f0',
            backgroundColor: '#ffffff',
            position: 'sticky',
            left: 0,
            zIndex: 20,
          }}
        >
          {/* Header */}
          <div
            style={{
              height: '44px',
              padding: '0 16px',
              display: 'flex',
              alignItems: 'center',
              fontWeight: 800,
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: '#475569',
              backgroundColor: '#f8fafc',
              borderBottom: '1.5px solid #e2e8f0',
            }}
          >
            Project Structure & Deliverables
          </div>

          {/* Project List Items */}
          <div style={{ padding: '4px 0' }}>
            {activeProjects.map((project) => {
              const phases = project.phases && project.phases.length > 0 ? project.phases : [];
              const tasks = project.tasks && project.tasks.length > 0 ? project.tasks : [];

              return (
                <div key={project._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  {/* Project Row */}
                  <div
                    onClick={() => onViewProject && onViewProject(project)}
                    style={{
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: '#f8fafc',
                      cursor: 'pointer',
                      borderLeft: '4px solid #2563eb',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#f1f5f9';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = '#f8fafc';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                      <span
                        style={{
                          fontFamily: 'monospace',
                          fontSize: '11px',
                          fontWeight: 700,
                          color: '#2563eb',
                        }}
                      >
                        {project.projectId || project.projectCode || 'PRJ'}
                      </span>
                      <span
                        style={{
                          fontSize: '13px',
                          fontWeight: 700,
                          color: '#0f172a',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {project.name || project.title}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: 800,
                        color: '#059669',
                      }}
                    >
                      {project.progress || 0}%
                    </span>
                  </div>

                  {/* Phases & Tasks under this project */}
                  {phases.map((phase, pIdx) => {
                    const phaseKey = `${project._id}_${phase.phaseId || pIdx}`;
                    const isExpanded = expandedPhases[phaseKey] !== false; // default open
                    const phaseTasks = tasks.filter((t) => t.phaseName === phase.name || t.phase === phase.name || t.phaseId === phase.phaseId);

                    return (
                      <div key={phaseKey}>
                        <div
                          onClick={() => togglePhase(phaseKey)}
                          style={{
                            padding: '9px 14px 9px 24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            backgroundColor: '#ffffff',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: 600,
                            color: '#334155',
                            transition: 'background 0.15s ease',
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.backgroundColor = '#f8fafc';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor = '#ffffff';
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {isExpanded ? <ChevronDown size={14} style={{ color: '#64748b' }} /> : <ChevronRight size={14} style={{ color: '#64748b' }} />}
                            <span>{phase.name}</span>
                          </div>
                          <span style={{ fontSize: '11px', fontWeight: 500, color: '#94a3b8' }}>
                            {phaseTasks.length} tasks
                          </span>
                        </div>

                        {/* Tasks under Phase */}
                        {isExpanded &&
                          phaseTasks.map((task, tIdx) => (
                            <div
                              key={task.taskId || tIdx}
                              style={{
                                padding: '7px 14px 7px 40px',
                                fontSize: '12px',
                                color: '#475569',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                borderTop: '1px dashed #f1f5f9',
                              }}
                            >
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '170px' }}>
                                {task.taskName || task.title}
                              </span>
                              <span
                                style={{
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  color: ['Done', 'Completed', 'Closed'].includes(task.status) ? '#059669' : '#2563eb',
                                }}
                              >
                                {task.status || 'To Do'}
                              </span>
                            </div>
                          ))}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Timeline Canvas (Scrollable) */}
        <div style={{ flex: 1, minWidth: '800px', position: 'relative' }}>
          {/* Timeline Calendar Header */}
          <div
            style={{
              height: '44px',
              display: 'flex',
              backgroundColor: '#f8fafc',
              borderBottom: '1.5px solid #e2e8f0',
              position: 'sticky',
              top: 0,
              zIndex: 10,
            }}
          >
            {timeColumns.map((colDate, idx) => (
              <div
                key={idx}
                style={{
                  flex: 1,
                  padding: '10px 8px',
                  borderRight: '1px solid #e2e8f0',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#475569',
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                }}
              >
                {colDate.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </div>
            ))}
          </div>

          {/* Timeline Bars Canvas */}
          <div style={{ position: 'relative', padding: '8px 0' }}>
            {activeProjects.map((project) => {
              const phases = project.phases && project.phases.length > 0 ? project.phases : [];
              const milestones = project.milestones && project.milestones.length > 0 ? project.milestones : [];
              const tasks = project.tasks && project.tasks.length > 0 ? project.tasks : [];

              const projLeft = calculatePositionPercent(project.startDate);
              const projWidth = calculateWidthPercent(project.startDate, project.targetDate || project.endDate);

              return (
                <div key={project._id} style={{ marginBottom: '16px', position: 'relative' }}>
                  {/* Project Bar Row */}
                  <div style={{ height: '40px', position: 'relative', borderBottom: '1px solid #f1f5f9' }}>
                    <div
                      style={{
                        position: 'absolute',
                        top: '6px',
                        left: `${projLeft}%`,
                        width: `${projWidth}%`,
                        height: '26px',
                        borderRadius: '8px',
                        backgroundColor: '#eff6ff',
                        border: '1.5px solid #3b82f6',
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0 10px',
                        overflow: 'hidden',
                        boxShadow: '0 2px 6px rgba(59, 130, 246, 0.15)',
                        transition: 'all 0.15s ease',
                      }}
                      title={`${project.name || project.title} (${project.progress || 0}% complete)`}
                    >
                      <div
                        style={{
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          bottom: 0,
                          backgroundColor: 'rgba(37, 99, 235, 0.25)',
                          width: `${project.progress || 0}%`,
                        }}
                      />
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 800,
                          color: '#1e3a8a',
                          position: 'relative',
                          zIndex: 10,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {project.projectId || project.projectCode || 'PRJ'} • {project.progress || 0}%
                      </span>
                    </div>

                    {/* Milestones diamond markers on project row */}
                    {milestones.map((m, mIdx) => {
                      const mPos = calculatePositionPercent(m.dueDate || project.targetDate || project.endDate);
                      const isDone = m.status === 'Completed' || m.isCompleted;
                      return (
                        <div
                          key={mIdx}
                          style={{
                            position: 'absolute',
                            top: '11px',
                            left: `${mPos}%`,
                            width: '14px',
                            height: '14px',
                            transform: 'translateX(-50%) rotate(45deg)',
                            border: '2px solid #ffffff',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                            zIndex: 10,
                            cursor: 'pointer',
                            backgroundColor: isDone ? '#10b981' : '#7c3aed',
                          }}
                          title={`Milestone Gate: ${m.name || m.title} (${isDone ? 'Completed' : 'Upcoming'})`}
                        />
                      );
                    })}
                  </div>

                  {/* Phase & Task Bars */}
                  {phases.map((phase, pIdx) => {
                    const phaseKey = `${project._id}_${phase.phaseId || pIdx}`;
                    const isExpanded = expandedPhases[phaseKey] !== false;
                    const phaseTasks = tasks.filter((t) => t.phaseName === phase.name || t.phase === phase.name || t.phaseId === phase.phaseId);

                    return (
                      <div key={phaseKey}>
                        {/* Phase Row */}
                        <div style={{ height: '32px', position: 'relative', borderBottom: '1px solid #f8fafc' }}>
                          <div
                            style={{
                              position: 'absolute',
                              top: '7px',
                              left: `${calculatePositionPercent(phase.startDate || project.startDate)}%`,
                              width: `${calculateWidthPercent(phase.startDate || project.startDate, phase.endDate || project.targetDate || project.endDate)}%`,
                              height: '16px',
                              borderRadius: '4px',
                              backgroundColor: '#e2e8f0',
                              border: '1px solid #cbd5e1',
                            }}
                          />
                        </div>

                        {/* Task Rows */}
                        {isExpanded &&
                          phaseTasks.map((task, tIdx) => {
                            const taskLeft = calculatePositionPercent(task.startDate || project.startDate);
                            const taskWidth = calculateWidthPercent(task.startDate || project.startDate, task.dueDate || project.targetDate || project.endDate);
                            const isDone = ['Done', 'Completed', 'Closed'].includes(task.status);
                            const pColor = getPriorityColor(task.priority);

                            return (
                              <div
                                key={task.taskId || tIdx}
                                style={{ height: '28px', position: 'relative', borderBottom: '1px dashed #f1f5f9' }}
                              >
                                <div
                                  style={{
                                    position: 'absolute',
                                    top: '4px',
                                    left: `${taskLeft}%`,
                                    width: `${taskWidth}%`,
                                    height: '20px',
                                    borderRadius: '6px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '0 8px',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    overflow: 'hidden',
                                    cursor: 'pointer',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                                    transition: 'all 0.15s ease',
                                    backgroundColor: isDone ? '#dcfce7' : '#eff6ff',
                                    border: `1px solid ${isDone ? '#16a34a' : pColor}`,
                                    color: '#0f172a',
                                  }}
                                  title={`${task.taskName || task.title} • Assignee: ${task.assignedTo || 'Unassigned'} • Status: ${task.status}`}
                                >
                                  <div
                                    style={{
                                      position: 'absolute',
                                      left: 0,
                                      top: 0,
                                      bottom: 0,
                                      backgroundColor: isDone ? 'rgba(22, 163, 74, 0.25)' : 'rgba(37, 99, 235, 0.2)',
                                      width: `${task.progress || task.completionPercent || (isDone ? 100 : 0)}%`,
                                    }}
                                  />
                                  <span
                                    style={{
                                      position: 'relative',
                                      zIndex: 10,
                                      whiteSpace: 'nowrap',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                    }}
                                  >
                                    {task.taskName || task.title}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectGanttView;
