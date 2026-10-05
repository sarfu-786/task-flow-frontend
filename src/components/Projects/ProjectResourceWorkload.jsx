import React, { useState, useMemo } from 'react';
import { useProjects } from '../../context/ProjectContext';
import { useAuth } from '../../context/AuthContext';
import {
  Users,
  Briefcase,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Search,
  Filter,
  TrendingUp,
  UserCheck,
  Calendar,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Zap,
} from 'lucide-react';

export const ProjectResourceWorkload = ({ onViewProject }) => {
  const { projects, loading } = useProjects();
  const { user: currentUser } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [capacityFilter, setCapacityFilter] = useState('all'); // 'all' | 'overallocated' | 'optimal' | 'underutilized'
  const [selectedProjectFilter, setSelectedProjectFilter] = useState('all');
  const [expandedUsers, setExpandedUsers] = useState({});

  const toggleUserExpand = (userName) => {
    setExpandedUsers((prev) => ({ ...prev, [userName]: !prev[userName] }));
  };

  // Aggregate workload by team member across all accessible projects
  const teamWorkload = useMemo(() => {
    const userMap = {};

    projects.forEach((proj) => {
      if (selectedProjectFilter !== 'all' && proj._id !== selectedProjectFilter) {
        return;
      }

      // Collect team members registered on project
      const team = proj.teamMembers || [];
      team.forEach((tm) => {
        const name = tm.name || tm.user || 'Unassigned';
        if (!userMap[name]) {
          userMap[name] = {
            name,
            role: tm.role || 'Contributor',
            email: tm.email || '',
            department: tm.department || proj.department || 'Engineering',
            projects: new Set(),
            tasks: [],
            totalEstimatedHours: 0,
            totalLoggedHours: 0,
            completedTasks: 0,
            pendingTasks: 0,
            overdueTasks: 0,
          };
        }
        userMap[name].projects.add(proj.name || proj.title || 'Untitled Project');
      });

      // Include Project Manager
      const mgrName = proj.managerName || proj.projectManager;
      if (mgrName && mgrName !== 'Unassigned') {
        if (!userMap[mgrName]) {
          userMap[mgrName] = {
            name: mgrName,
            role: 'Project Manager',
            email: '',
            department: proj.department || 'Engineering',
            projects: new Set(),
            tasks: [],
            totalEstimatedHours: 0,
            totalLoggedHours: 0,
            completedTasks: 0,
            pendingTasks: 0,
            overdueTasks: 0,
          };
        }
        userMap[mgrName].projects.add(proj.name || proj.title || 'Untitled Project');
      }

      // Also traverse all tasks within this project
      const tasks = proj.tasks || [];
      tasks.forEach((task) => {
        const assignee = task.assignedTo || task.assignee || 'Unassigned';
        if (!userMap[assignee]) {
          userMap[assignee] = {
            name: assignee,
            role: 'Team Member',
            email: '',
            department: proj.department || 'Engineering',
            projects: new Set(),
            tasks: [],
            totalEstimatedHours: 0,
            totalLoggedHours: 0,
            completedTasks: 0,
            pendingTasks: 0,
            overdueTasks: 0,
          };
        }

        userMap[assignee].projects.add(proj.name || proj.title || 'Untitled Project');
        
        const est = Number(task.estimatedHours) || 0;
        const logged = Number(task.actualHours) || 0;
        userMap[assignee].totalEstimatedHours += est;
        userMap[assignee].totalLoggedHours += logged;

        const isDone = ['Done', 'Completed', 'Closed'].includes(task.status);
        const isOverdue = !isDone && task.dueDate && new Date(task.dueDate) < new Date();

        if (isDone) {
          userMap[assignee].completedTasks += 1;
        } else {
          userMap[assignee].pendingTasks += 1;
        }

        if (isOverdue) {
          userMap[assignee].overdueTasks += 1;
        }

        userMap[assignee].tasks.push({
          taskId: task.taskId || task._id,
          taskName: task.taskName || task.title,
          projectName: proj.name || proj.title,
          projectId: proj._id,
          priority: task.priority || 'Medium',
          status: task.status || 'To Do',
          dueDate: task.dueDate,
          estimatedHours: est,
          actualHours: logged,
          progress: task.progress || task.completionPercent || 0,
        });
      });
    });

    return Object.values(userMap).map((member) => {
      const projectList = Array.from(member.projects);
      const totalTasks = member.tasks.length;
      
      const capacityBase = member.totalEstimatedHours > 0 ? member.totalEstimatedHours : 40;
      const utilization = Math.round((member.totalLoggedHours / capacityBase) * 100);

      let statusLevel = 'Optimal';
      let statusStyle = { bg: '#ecfdf5', color: '#059669', border: '#a7f3d0' };

      if (utilization > 100 || member.overdueTasks > 2) {
        statusLevel = 'Overallocated';
        statusStyle = { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' };
      } else if (utilization < 40 && totalTasks <= 1) {
        statusLevel = 'Underutilized';
        statusStyle = { bg: '#fffbeb', color: '#d97706', border: '#fde68a' };
      }

      return {
        ...member,
        projects: projectList,
        totalTasks,
        utilization,
        statusLevel,
        statusStyle,
      };
    });
  }, [projects, selectedProjectFilter]);

  // Filtered members
  const filteredMembers = useMemo(() => {
    return teamWorkload.filter((member) => {
      const matchesSearch =
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.department.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      if (capacityFilter === 'overallocated' && member.statusLevel !== 'Overallocated') return false;
      if (capacityFilter === 'optimal' && member.statusLevel !== 'Optimal') return false;
      if (capacityFilter === 'underutilized' && member.statusLevel !== 'Underutilized') return false;

      return true;
    });
  }, [teamWorkload, searchTerm, capacityFilter]);

  // Overall metrics
  const aggregateMetrics = useMemo(() => {
    const totalResources = teamWorkload.length;
    const totalAssignedTasks = teamWorkload.reduce((sum, m) => sum + m.totalTasks, 0);
    const totalEstimated = teamWorkload.reduce((sum, m) => sum + m.totalEstimatedHours, 0);
    const totalLogged = teamWorkload.reduce((sum, m) => sum + m.totalLoggedHours, 0);
    const overallocatedCount = teamWorkload.filter((m) => m.statusLevel === 'Overallocated').length;

    return {
      totalResources,
      totalAssignedTasks,
      totalEstimated,
      totalLogged,
      overallocatedCount,
    };
  }, [teamWorkload]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Top summary cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
        }}
      >
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '18px 20px',
            border: '1.5px solid #e2e8f0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              backgroundColor: '#eef2ff',
              color: '#4f46e5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Users size={22} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748b' }}>
              Active Resources
            </p>
            <h4 style={{ margin: '4px 0 0 0', fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>
              {aggregateMetrics.totalResources}
            </h4>
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '18px 20px',
            border: '1.5px solid #e2e8f0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              backgroundColor: '#eff6ff',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Briefcase size={22} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748b' }}>
              Active Deliverables
            </p>
            <h4 style={{ margin: '4px 0 0 0', fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>
              {aggregateMetrics.totalAssignedTasks}
            </h4>
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '18px 20px',
            border: '1.5px solid #e2e8f0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              backgroundColor: '#ecfdf5',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Clock size={22} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748b' }}>
              Hours (Logged / Est)
            </p>
            <h4 style={{ margin: '4px 0 0 0', fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>
              {aggregateMetrics.totalLogged}h <span style={{ fontSize: '13px', fontWeight: 600, color: '#94a3b8' }}>/ {aggregateMetrics.totalEstimated}h</span>
            </h4>
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '18px 20px',
            border: '1.5px solid #e2e8f0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              backgroundColor: '#fef2f2',
              color: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <AlertTriangle size={22} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748b' }}>
              Overloaded Members
            </p>
            <h4 style={{ margin: '4px 0 0 0', fontSize: '22px', fontWeight: 800, color: '#dc2626' }}>
              {aggregateMetrics.overallocatedCount}
            </h4>
          </div>
        </div>
      </div>

      {/* Control bar */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '16px 20px',
          border: '1.5px solid #e2e8f0',
          boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '14px',
        }}
      >
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 280px', maxWidth: '420px' }}>
          <Search size={15} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Search resource by name, role, department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              height: '40px',
              paddingLeft: '38px',
              paddingRight: '14px',
              backgroundColor: '#ffffff',
              border: '1.5px solid #cbd5e1',
              borderRadius: '10px',
              fontSize: '13px',
              color: '#1e293b',
              outline: 'none',
            }}
          />
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Project selector */}
          <div style={{ position: 'relative' }}>
            <select
              value={selectedProjectFilter}
              onChange={(e) => setSelectedProjectFilter(e.target.value)}
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
                maxWidth: '260px',
                outline: 'none',
              }}
            >
              <option value="all">All Accessible Projects</option>
              {projects.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.projectId || p.projectCode ? `[${p.projectId || p.projectCode}] ` : ''}{p.name || p.title}
                </option>
              ))}
            </select>
            <ChevronDown size={14} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', pointerEvents: 'none' }} />
          </div>

          {/* Capacity status tabs */}
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
              { id: 'all', label: 'All', color: '#2563eb' },
              { id: 'optimal', label: 'Optimal', color: '#059669' },
              { id: 'overallocated', label: 'Overallocated', color: '#dc2626' },
            ].map((tab) => {
              const isSelected = capacityFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setCapacityFilter(tab.id)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 700,
                    border: 'none',
                    backgroundColor: isSelected ? '#ffffff' : 'transparent',
                    color: isSelected ? tab.color : '#64748b',
                    boxShadow: isSelected ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Resource cards list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {filteredMembers.length === 0 ? (
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              padding: '48px 24px',
              textAlign: 'center',
              border: '1.5px solid #e2e8f0',
            }}
          >
            <Users size={36} style={{ margin: '0 auto 12px auto', color: '#cbd5e1' }} />
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#334155' }}>
              No resource records found
            </h3>
            <p style={{ margin: '6px 0 0 0', fontSize: '12px', color: '#64748b' }}>
              Try adjusting your search or filters to see team allocations.
            </p>
          </div>
        ) : (
          filteredMembers.map((member) => {
            const isExpanded = !!expandedUsers[member.name];

            return (
              <div
                key={member.name}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '16px',
                  border: '1.5px solid #e2e8f0',
                  overflow: 'hidden',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                  transition: 'all 0.15s ease',
                }}
              >
                {/* Main Card Header */}
                <div
                  style={{
                    padding: '18px 22px',
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px',
                  }}
                >
                  {/* Left: Avatar & Info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '14px',
                        background: 'linear-gradient(135deg, #2563eb, #4f46e5)',
                        color: '#ffffff',
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '16px',
                        boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
                        flexShrink: 0,
                      }}
                    >
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
                          {member.name}
                        </h4>
                        <span
                          style={{
                            padding: '2px 9px',
                            fontSize: '11px',
                            fontWeight: 700,
                            borderRadius: '12px',
                            backgroundColor: member.statusStyle.bg,
                            color: member.statusStyle.color,
                            border: `1px solid ${member.statusStyle.border}`,
                          }}
                        >
                          {member.statusLevel}
                        </span>
                      </div>
                      <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>{member.role}</span>
                        <span>•</span>
                        <span>{member.department}</span>
                        <span>•</span>
                        <span style={{ color: '#2563eb', fontWeight: 700 }}>
                          {member.projects.length} Project{member.projects.length !== 1 ? 's' : ''}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Middle: Workload Metrics */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(4, 1fr)',
                      gap: '18px',
                      textAlign: 'center',
                      padding: '0 16px',
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 800 }}>Tasks</span>
                      <p style={{ margin: '2px 0 0 0', fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                        {member.totalTasks}
                      </p>
                    </div>
                    <div>
                      <span style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 800 }}>Done</span>
                      <p style={{ margin: '2px 0 0 0', fontSize: '16px', fontWeight: 800, color: '#059669' }}>
                        {member.completedTasks}
                      </p>
                    </div>
                    <div>
                      <span style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 800 }}>Pending</span>
                      <p style={{ margin: '2px 0 0 0', fontSize: '16px', fontWeight: 800, color: '#d97706' }}>
                        {member.pendingTasks}
                      </p>
                    </div>
                    <div>
                      <span style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 800 }}>Overdue</span>
                      <p style={{ margin: '2px 0 0 0', fontSize: '16px', fontWeight: 800, color: member.overdueTasks > 0 ? '#dc2626' : '#94a3b8' }}>
                        {member.overdueTasks}
                      </p>
                    </div>
                  </div>

                  {/* Right: Hours & Progress */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '18px', minWidth: '220px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                        <span style={{ color: '#475569' }}>
                          {member.totalLoggedHours}h / {member.totalEstimatedHours}h
                        </span>
                        <span style={{ color: '#2563eb' }}>
                          {member.utilization}%
                        </span>
                      </div>
                      <div style={{ width: '100%', backgroundColor: '#e2e8f0', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                        <div
                          style={{
                            height: '100%',
                            borderRadius: '4px',
                            backgroundColor: member.utilization > 100 ? '#ef4444' : member.utilization > 75 ? '#2563eb' : '#10b981',
                            width: `${Math.min(member.utilization, 100)}%`,
                            transition: 'width 0.3s ease',
                          }}
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => toggleUserExpand(member.name)}
                      style={{
                        padding: '8px',
                        color: '#64748b',
                        borderRadius: '10px',
                        backgroundColor: isExpanded ? '#f1f5f9' : 'transparent',
                        border: '1px solid #e2e8f0',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      title={isExpanded ? 'Hide deliverables' : 'Show deliverables'}
                    >
                      {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>
                  </div>
                </div>

                {/* Expanded deliverables breakdown */}
                {isExpanded && (
                  <div
                    style={{
                      padding: '16px 22px',
                      backgroundColor: '#f8fafc',
                      borderTop: '1.5px solid #e2e8f0',
                    }}
                  >
                    <h5 style={{ margin: '0 0 12px 0', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#475569' }}>
                      Assigned Deliverables & Task Ledger ({member.tasks.length})
                    </h5>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {member.tasks.map((task, idx) => (
                        <div
                          key={task.taskId || idx}
                          style={{
                            backgroundColor: '#ffffff',
                            borderRadius: '10px',
                            padding: '10px 14px',
                            border: '1px solid #e2e8f0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '12px',
                            fontSize: '12px',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                            <span style={{ fontWeight: 700, color: '#0f172a' }}>{task.taskName}</span>
                            <span style={{ color: '#64748b' }}>•</span>
                            <span style={{ color: '#2563eb', fontWeight: 600 }}>{task.projectName}</span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                            <span style={{ fontWeight: 600, color: '#64748b' }}>{task.actualHours}h logged / {task.estimatedHours}h est</span>
                            <span
                              style={{
                                padding: '2px 8px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: 700,
                                backgroundColor: ['Done', 'Completed', 'Closed'].includes(task.status) ? '#ecfdf5' : '#eff6ff',
                                color: ['Done', 'Completed', 'Closed'].includes(task.status) ? '#059669' : '#2563eb',
                                border: `1px solid ${['Done', 'Completed', 'Closed'].includes(task.status) ? '#a7f3d0' : '#bfdbfe'}`,
                              }}
                            >
                              {task.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ProjectResourceWorkload;
