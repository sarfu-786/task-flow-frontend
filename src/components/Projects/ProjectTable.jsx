import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useProjects } from '../../context/ProjectContext';
import { useUserManagement } from '../../context/UserContext';
import { useAuth } from '../../context/AuthContext';
import {
  Search,
  X,
  FolderKanban,
  Building,
  User,
  Calendar,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  ListTodo,
  Edit2,
  Trash2,
  MoreVertical,
  Eye,
  ChevronLeft,
  ChevronRight,
  Filter,
  RotateCcw,
  Sparkles,
  Layers,
  AlertCircle,
} from 'lucide-react';

export const ProjectTable = ({
  onViewProject,
  onEditProject,
  onOpenMilestones,
  onDeleteProject,
  canDelete = false,
}) => {
  const {
    projects,
    loading,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    priorityFilter,
    setPriorityFilter,
    categoryFilter,
    setCategoryFilter,
    managerFilter,
    setManagerFilter,
    currentPage,
    setCurrentPage,
    totalPages,
    totalItems,
    itemsPerPage,
  } = useProjects();

  const { users } = useUserManagement ? useUserManagement() : { users: [] };
  const { isSuperAdmin, isManager } = useAuth();

  // Local deadline / date filter: 'all' | 'due_this_month' | 'due_next_month' | 'overdue' | 'completed'
  const [dateFilter, setDateFilter] = useState('all');

  // Open action dropdown menu per row
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Compute distinct users for filter dropdown
  const availableUsers = useMemo(() => {
    const userSet = new Set();
    // From projects
    (projects || []).forEach((p) => {
      if (p.managerName && p.managerName !== 'Unassigned') {
        userSet.add(p.managerName);
      }
      if (Array.isArray(p.teamMembers)) {
        p.teamMembers.forEach((tm) => {
          if (tm.name) userSet.add(tm.name);
        });
      }
    });
    // From approved users
    (users || []).forEach((u) => {
      if (u.name && u.status === 'Approved') {
        userSet.add(u.name);
      }
    });
    return Array.from(userSet).sort();
  }, [projects, users]);

  // Apply client-side date filter if selected
  const displayedProjects = useMemo(() => {
    let list = Array.isArray(projects) ? projects : [];

    if (dateFilter !== 'all') {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();

      list = list.filter((p) => {
        if (!p.targetDate) return false;
        const target = new Date(p.targetDate);
        if (isNaN(target.getTime())) return false;

        if (dateFilter === 'overdue') {
          return target < now && p.status !== 'Completed';
        }
        if (dateFilter === 'due_this_month') {
          return target.getFullYear() === currentYear && target.getMonth() === currentMonth;
        }
        if (dateFilter === 'due_next_month') {
          const nextMonthDate = new Date(currentYear, currentMonth + 1, 1);
          return (
            target.getFullYear() === nextMonthDate.getFullYear() &&
            target.getMonth() === nextMonthDate.getMonth()
          );
        }
        if (dateFilter === 'completed') {
          return p.status === 'Completed';
        }
        return true;
      });
    }

    return list;
  }, [projects, dateFilter]);

  const hasActiveFilters =
    search.trim() !== '' ||
    statusFilter !== 'all' ||
    managerFilter !== 'all' ||
    dateFilter !== 'all' ||
    categoryFilter !== 'all' ||
    priorityFilter !== 'all';

  const resetAllFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setManagerFilter('all');
    setDateFilter('all');
    if (setCategoryFilter) setCategoryFilter('all');
    if (setPriorityFilter) setPriorityFilter('all');
    setCurrentPage(1);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Completed':
        return { bg: '#ecfdf5', color: '#047857', border: '#a7f3d0', dot: '#10b981' };
      case 'In Progress':
        return { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe', dot: '#3b82f6' };
      case 'Under Review':
        return { bg: '#f5f3ff', color: '#6d28d9', border: '#ddd6fe', dot: '#8b5cf6' };
      case 'Planning':
        return { bg: '#fffbeb', color: '#b45309', border: '#fde68a', dot: '#f59e0b' };
      case 'On Hold':
        return { bg: '#fef2f2', color: '#b91c1c', border: '#fecaca', dot: '#ef4444' };
      default:
        return { bg: '#f8fafc', color: '#475569', border: '#e2e8f0', dot: '#94a3b8' };
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'Urgent':
        return { bg: '#fef2f2', color: '#dc2626', border: '#fee2e2' };
      case 'High':
        return { bg: '#fff7ed', color: '#ea580c', border: '#ffedd5' };
      case 'Medium':
        return { bg: '#fffbeb', color: '#d97706', border: '#fef3c7' };
      default:
        return { bg: '#f0fdf4', color: '#16a34a', border: '#dcfce7' };
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getDeadlineBadge = (targetDateStr, status) => {
    if (status === 'Completed') {
      return (
        <span
          style={{
            fontSize: '0.68rem',
            fontWeight: 700,
            color: '#059669',
            backgroundColor: '#ecfdf5',
            border: '1px solid #a7f3d0',
            padding: '1px 6px',
            borderRadius: '999px',
          }}
        >
          Completed
        </span>
      );
    }
    if (!targetDateStr) return null;
    const target = new Date(targetDateStr);
    const now = new Date();
    const diffDays = Math.ceil((target - now) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return (
        <span
          style={{
            fontSize: '0.68rem',
            fontWeight: 700,
            color: '#dc2626',
            backgroundColor: '#fef2f2',
            border: '1px solid #fee2e2',
            padding: '1px 6px',
            borderRadius: '999px',
          }}
        >
          Overdue
        </span>
      );
    } else if (diffDays <= 7) {
      return (
        <span
          style={{
            fontSize: '0.68rem',
            fontWeight: 700,
            color: '#d97706',
            backgroundColor: '#fffbeb',
            border: '1px solid #fef3c7',
            padding: '1px 6px',
            borderRadius: '999px',
          }}
        >
          Due soon
        </span>
      );
    }
    return null;
  };

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '20px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.05)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Search & Filter Header Strip */}
      <div
        style={{
          padding: '18px 22px',
          borderBottom: '1px solid #f1f5f9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px',
          background: 'linear-gradient(to right, #ffffff, #fcfcfd)',
        }}
      >
        {/* Left: Search Box */}
        <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: '380px', minWidth: '220px' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#94a3b8',
            }}
          />
          <input
            type="text"
            id="search-projects-input"
            placeholder="Search projects, clients, managers..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            style={{
              width: '100%',
              padding: '9px 34px 9px 36px',
              borderRadius: '12px',
              border: '1px solid #cbd5e1',
              fontSize: '0.86rem',
              color: '#0f172a',
              outline: 'none',
              backgroundColor: '#ffffff',
              boxSizing: 'border-box',
              transition: 'border-color 0.15s ease',
            }}
            onFocus={(e) => (e.target.style.borderColor = '#2563eb')}
            onBlur={(e) => (e.target.style.borderColor = '#cbd5e1')}
          />
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setCurrentPage(1);
              }}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4px',
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Right: Filter Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Status Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <select
              id="filter-project-status"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                padding: '8px 12px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                fontSize: '0.84rem',
                color: '#334155',
                backgroundColor: '#ffffff',
                outline: 'none',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <option value="all">All Statuses</option>
              <option value="Planning">Planning</option>
              <option value="In Progress">In Progress</option>
              <option value="Under Review">Under Review</option>
              <option value="Completed">Completed</option>
              <option value="On Hold">On Hold</option>
            </select>
          </div>

          {/* User Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <select
              id="filter-project-user"
              value={managerFilter}
              onChange={(e) => {
                setManagerFilter(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                padding: '8px 12px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                fontSize: '0.84rem',
                color: '#334155',
                backgroundColor: '#ffffff',
                outline: 'none',
                fontWeight: 600,
                cursor: 'pointer',
                maxWidth: '180px',
              }}
            >
              <option value="all">All Users</option>
              {availableUsers.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>

          {/* Date Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <select
              id="filter-project-date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                fontSize: '0.84rem',
                color: '#334155',
                backgroundColor: '#ffffff',
                outline: 'none',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <option value="all">All Deadlines</option>
              <option value="due_this_month">Due This Month</option>
              <option value="due_next_month">Due Next Month</option>
              <option value="overdue">Overdue Deadlines</option>
              <option value="completed">Completed Deliverables</option>
            </select>
          </div>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetAllFilters}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '8px 12px',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                backgroundColor: '#f8fafc',
                color: '#64748b',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              title="Reset all filters"
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f1f5f9';
                e.currentTarget.style.color = '#0f172a';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#f8fafc';
                e.currentTarget.style.color = '#64748b';
              }}
            >
              <RotateCcw size={13} />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Table Section */}
      <div style={{ overflowX: 'auto', minHeight: '260px' }}>
        {loading ? (
          <div style={{ padding: '60px 24px', textAlign: 'center' }}>
            <div
              className="spinner-lg"
              style={{
                width: '36px',
                height: '36px',
                border: '3px solid #e2e8f0',
                borderTopColor: '#2563eb',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
                margin: '0 auto 12px',
              }}
            />
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.88rem' }}>Loading Projects Directory...</p>
          </div>
        ) : displayedProjects.length === 0 ? (
          <div style={{ padding: '64px 24px', textAlign: 'center' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '18px',
                backgroundColor: '#f1f5f9',
                color: '#64748b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 14px',
              }}
            >
              <FolderKanban size={26} />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0' }}>
              No Projects Found
            </h3>
            <p style={{ fontSize: '0.84rem', color: '#64748b', margin: '0 0 16px 0', maxWidth: '420px', marginInline: 'auto' }}>
              {hasActiveFilters
                ? 'No project records match your current search and filter criteria. Try clearing filters to view all projects.'
                : 'No projects registered in your workspace scope yet.'}
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetAllFilters}
                style={{
                  padding: '7px 16px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  color: '#2563eb',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                }}
              >
                Clear Active Filters
              </button>
            )}
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th
                  style={{
                    padding: '13px 20px',
                    fontSize: '0.74rem',
                    fontWeight: 800,
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    minWidth: '220px',
                  }}
                >
                  Project Name
                </th>
                <th
                  style={{
                    padding: '13px 20px',
                    fontSize: '0.74rem',
                    fontWeight: 800,
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    minWidth: '160px',
                  }}
                >
                  Client
                </th>
                <th
                  style={{
                    padding: '13px 20px',
                    fontSize: '0.74rem',
                    fontWeight: 800,
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    minWidth: '160px',
                  }}
                >
                  Project Manager
                </th>
                <th
                  style={{
                    padding: '13px 20px',
                    fontSize: '0.74rem',
                    fontWeight: 800,
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    minWidth: '180px',
                  }}
                >
                  Progress
                </th>
                <th
                  style={{
                    padding: '13px 20px',
                    fontSize: '0.74rem',
                    fontWeight: 800,
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    minWidth: '170px',
                  }}
                >
                  Expected Completion / Deadline
                </th>
                <th
                  style={{
                    padding: '13px 20px',
                    fontSize: '0.74rem',
                    fontWeight: 800,
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    minWidth: '120px',
                  }}
                >
                  Status
                </th>
                <th
                  style={{
                    padding: '13px 20px',
                    fontSize: '0.74rem',
                    fontWeight: 800,
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    textAlign: 'right',
                    minWidth: '130px',
                  }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {displayedProjects.map((project) => {
                const sBadge = getStatusBadge(project.status);
                const pBadge = getPriorityBadge(project.priority);
                const milestones = Array.isArray(project.milestones) ? project.milestones : [];
                const completedM = milestones.filter((m) => m.isCompleted).length;
                const progress =
                  milestones.length > 0
                    ? Math.round((completedM / milestones.length) * 100)
                    : project.progress || 0;

                const isDropdownOpen = openDropdownId === project._id;

                return (
                  <tr
                    key={project._id}
                    style={{
                      borderBottom: '1px solid #f1f5f9',
                      transition: 'background-color 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fcfdfe')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    {/* Project Name */}
                    <td style={{ padding: '14px 20px', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                        <span
                          style={{
                            fontFamily: 'monospace',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            color: '#0f172a',
                            backgroundColor: '#f1f5f9',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            border: '1px solid #e2e8f0',
                          }}
                        >
                          {project.projectCode || 'PRJ-000'}
                        </span>
                        <span
                          style={{
                            fontSize: '0.68rem',
                            fontWeight: 600,
                            color: '#64748b',
                            backgroundColor: '#f8fafc',
                            padding: '1px 6px',
                            borderRadius: '4px',
                          }}
                        >
                          {project.category || 'Web Application'}
                        </span>
                      </div>
                      <div
                        onClick={() => onViewProject(project)}
                        style={{
                          fontWeight: 700,
                          fontSize: '0.9rem',
                          color: '#0f172a',
                          cursor: 'pointer',
                          display: 'inline-block',
                          transition: 'color 0.15s ease',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#2563eb')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = '#0f172a')}
                        title="Click to view project details"
                      >
                        {project.name}
                      </div>
                    </td>

                    {/* Client */}
                    <td style={{ padding: '14px 20px', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Building size={14} color="#64748b" style={{ flexShrink: 0 }} />
                        <span style={{ fontWeight: 600, fontSize: '0.86rem', color: '#334155' }}>
                          {project.clientName || 'N/A'}
                        </span>
                      </div>
                    </td>

                    {/* Project Manager */}
                    <td style={{ padding: '14px 20px', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            backgroundColor: project.managerName && project.managerName !== 'Unassigned' ? '#eff6ff' : '#f1f5f9',
                            color: project.managerName && project.managerName !== 'Unassigned' ? '#2563eb' : '#64748b',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          {project.managerName && project.managerName !== 'Unassigned'
                            ? project.managerName.charAt(0).toUpperCase()
                            : '—'}
                        </div>
                        <span
                          style={{
                            fontSize: '0.84rem',
                            fontWeight: 600,
                            color: project.managerName && project.managerName !== 'Unassigned' ? '#0f172a' : '#94a3b8',
                          }}
                        >
                          {project.managerName || 'Unassigned'}
                        </span>
                      </div>
                    </td>

                    {/* Progress */}
                    <td style={{ padding: '14px 20px', verticalAlign: 'middle' }}>
                      <div style={{ minWidth: '150px' }}>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '4px',
                            fontSize: '0.74rem',
                          }}
                        >
                          <span style={{ fontWeight: 800, color: progress === 100 ? '#059669' : '#0f172a' }}>
                            {progress}%
                          </span>
                          <span style={{ color: '#64748b', fontSize: '0.72rem' }}>
                            {completedM}/{milestones.length} Milestones
                          </span>
                        </div>
                        <div
                          style={{
                            width: '100%',
                            height: '6px',
                            backgroundColor: '#f1f5f9',
                            borderRadius: '999px',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              width: `${progress}%`,
                              height: '100%',
                              backgroundColor: progress === 100 ? '#10b981' : '#2563eb',
                              borderRadius: '999px',
                              transition: 'width 0.3s ease',
                            }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Expected Completion / Deadline */}
                    <td style={{ padding: '14px 20px', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <Calendar size={13} color="#64748b" />
                          <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#334155' }}>
                            {formatDate(project.targetDate)}
                          </span>
                        </div>
                        {getDeadlineBadge(project.targetDate, project.status)}
                      </div>
                    </td>

                    {/* Status */}
                    <td style={{ padding: '14px 20px', verticalAlign: 'middle' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '3px 9px',
                          borderRadius: '999px',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          backgroundColor: sBadge.bg,
                          color: sBadge.color,
                          border: `1px solid ${sBadge.border}`,
                        }}
                      >
                        <span
                          style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            backgroundColor: sBadge.dot,
                          }}
                        />
                        <span>{project.status || 'Planning'}</span>
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '14px 20px', verticalAlign: 'middle', textAlign: 'right' }}>
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          position: 'relative',
                        }}
                      >
                        {/* View Button (Icon Only) */}
                        <button
                          type="button"
                          onClick={() => onViewProject(project)}
                          style={{
                            width: '30px',
                            height: '30px',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                            backgroundColor: '#ffffff',
                            color: '#2563eb',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                          title="View Project Details"
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#eff6ff';
                            e.currentTarget.style.borderColor = '#bfdbfe';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#ffffff';
                            e.currentTarget.style.borderColor = '#e2e8f0';
                          }}
                        >
                          <Eye size={14} />
                        </button>

                        {/* Edit Button */}
                        <button
                          type="button"
                          onClick={() => onEditProject(project)}
                          style={{
                            width: '30px',
                            height: '30px',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                            backgroundColor: '#ffffff',
                            color: '#475569',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                          title="Edit Project"
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#f8fafc';
                            e.currentTarget.style.borderColor = '#94a3b8';
                            e.currentTarget.style.color = '#0f172a';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#ffffff';
                            e.currentTarget.style.borderColor = '#e2e8f0';
                            e.currentTarget.style.color = '#475569';
                          }}
                        >
                          <Edit2 size={13} />
                        </button>

                        {/* More (⋮) Menu Button */}
                        <div style={{ position: 'relative' }}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenDropdownId(isDropdownOpen ? null : project._id);
                            }}
                            style={{
                              width: '30px',
                              height: '30px',
                              borderRadius: '8px',
                              border: '1px solid #e2e8f0',
                              backgroundColor: isDropdownOpen ? '#f1f5f9' : '#ffffff',
                              color: '#475569',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                            }}
                            title="More Options"
                          >
                            <MoreVertical size={14} />
                          </button>

                          {/* Dropdown Menu - ONLY Milestones & Delete */}
                          {isDropdownOpen && (
                            <div
                              ref={dropdownRef}
                              style={{
                                position: 'absolute',
                                right: 0,
                                top: '34px',
                                zIndex: 100,
                                backgroundColor: '#ffffff',
                                borderRadius: '12px',
                                boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.18), 0 8px 10px -6px rgba(15, 23, 42, 0.1)',
                                border: '1px solid #e2e8f0',
                                padding: '6px',
                                minWidth: '190px',
                                textAlign: 'left',
                                animation: 'fadeIn 0.15s ease',
                              }}
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenDropdownId(null);
                                  onOpenMilestones(project);
                                }}
                                style={{
                                  width: '100%',
                                  padding: '8px 12px',
                                  borderRadius: '8px',
                                  border: 'none',
                                  background: 'none',
                                  color: '#334155',
                                  fontSize: '0.82rem',
                                  fontWeight: 600,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  cursor: 'pointer',
                                  transition: 'background-color 0.12s ease',
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                              >
                                <ListTodo size={14} color="#059669" />
                                <span>Milestones & Deliverables</span>
                              </button>

                              {canDelete && (
                                <>
                                  <div style={{ height: '1px', backgroundColor: '#f1f5f9', margin: '4px 0' }} />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenDropdownId(null);
                                      onDeleteProject(project);
                                    }}
                                    style={{
                                      width: '100%',
                                      padding: '8px 12px',
                                      borderRadius: '8px',
                                      border: 'none',
                                      background: 'none',
                                      color: '#dc2626',
                                      fontSize: '0.82rem',
                                      fontWeight: 600,
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '8px',
                                      cursor: 'pointer',
                                      transition: 'background-color 0.12s ease',
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fef2f2')}
                                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                                  >
                                    <Trash2 size={14} color="#dc2626" />
                                    <span>Delete Project</span>
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Footer */}
      {!loading && displayedProjects.length > 0 && (
        <div
          style={{
            padding: '14px 22px',
            borderTop: '1px solid #f1f5f9',
            backgroundColor: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
            Showing <strong>{(currentPage - 1) * itemsPerPage + 1}</strong> to{' '}
            <strong>{Math.min(currentPage * itemsPerPage, totalItems || displayedProjects.length)}</strong> of{' '}
            <strong>{totalItems || displayedProjects.length}</strong> projects
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                backgroundColor: '#ffffff',
                color: currentPage <= 1 ? '#cbd5e1' : '#334155',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
              }}
            >
              <ChevronLeft size={14} />
              <span>Prev</span>
            </button>

            <span
              style={{
                fontSize: '0.82rem',
                fontWeight: 700,
                color: '#334155',
                padding: '0 8px',
              }}
            >
              Page {currentPage} of {totalPages || 1}
            </span>

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                backgroundColor: '#ffffff',
                color: currentPage >= totalPages ? '#cbd5e1' : '#334155',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
              }}
            >
              <span>Next</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectTable;
