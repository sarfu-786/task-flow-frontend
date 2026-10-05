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
  ChevronDown,
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
    (projects || []).forEach((p) => {
      const mgr = p.projectManager || p.managerName;
      if (mgr && mgr !== 'Unassigned') {
        userSet.add(mgr);
      }
      if (Array.isArray(p.teamMembers)) {
        p.teamMembers.forEach((tm) => {
          const name = tm.name || tm.user;
          if (name) userSet.add(name);
        });
      }
    });
    (users || []).forEach((u) => {
      if (u.name && u.status === 'Approved') {
        userSet.add(u.name);
      }
    });
    return Array.from(userSet).sort();
  }, [projects, users]);

  // Apply client-side date & health status filter if selected
  const displayedProjects = useMemo(() => {
    let list = Array.isArray(projects) ? projects : [];
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    if (statusFilter === 'On Track') {
      list = list.filter((p) => {
        if (p.health === 'On Track') return true;
        if (['Completed', 'Closed'].includes(p.status)) return true;
        const target = p.targetDate ? new Date(p.targetDate) : null;
        const isOverdue = target && target < now;
        const isCancelled = p.status === 'Cancelled';
        const isOnHold = p.status === 'On Hold';
        const isHighRisk = ['Critical', 'Urgent', 'High'].includes(p.priority) || p.status === 'Under Review';
        const isNearDeadline =
          target &&
          Math.ceil((target - now) / (1000 * 60 * 60 * 24)) <= 7 &&
          Math.ceil((target - now) / (1000 * 60 * 60 * 24)) >= 0;
        return !isOverdue && !isCancelled && !isOnHold && !isHighRisk && !isNearDeadline && p.status !== 'Delayed' && p.status !== 'Overdue';
      });
    } else if (statusFilter === 'At Risk') {
      list = list.filter((p) => {
        if (p.health === 'At Risk') return true;
        if (['Completed', 'Closed'].includes(p.status)) return false;
        const target = p.targetDate ? new Date(p.targetDate) : null;
        const isOverdue = target && target < now;
        if (isOverdue || p.status === 'Cancelled' || p.status === 'Delayed' || p.status === 'Overdue') return false;
        const isHighRisk = ['Critical', 'Urgent', 'High'].includes(p.priority) || p.status === 'Under Review';
        const isNearDeadline =
          target &&
          Math.ceil((target - now) / (1000 * 60 * 60 * 24)) <= 7 &&
          Math.ceil((target - now) / (1000 * 60 * 60 * 24)) >= 0;
        return p.status === 'On Hold' || isHighRisk || isNearDeadline || p.status === 'At Risk';
      });
    } else if (statusFilter === 'Delayed') {
      list = list.filter((p) => {
        if (p.health === 'Delayed') return true;
        if (['Completed', 'Closed'].includes(p.status)) return false;
        const target = p.targetDate ? new Date(p.targetDate) : null;
        const isOverdue = target && target < now;
        return isOverdue || p.status === 'Cancelled' || p.status === 'Delayed' || p.status === 'Overdue';
      });
    }

    if (dateFilter !== 'all') {
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();

      list = list.filter((p) => {
        const targetDate = p.targetDate || p.endDate;
        if (!targetDate) return false;
        const target = new Date(targetDate);
        if (isNaN(target.getTime())) return false;

        if (dateFilter === 'overdue') {
          return target < now && !['Completed', 'Closed'].includes(p.status);
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
          return ['Completed', 'Closed'].includes(p.status);
        }
        return true;
      });
    }

    return list;
  }, [projects, statusFilter, dateFilter]);

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
      case 'Closed':
        return {
          bg: 'bg-emerald-50 dark:bg-emerald-950/40',
          text: 'text-emerald-700 dark:text-emerald-300',
          border: 'border-emerald-200 dark:border-emerald-800',
          dot: 'bg-emerald-500',
        };
      case 'On Track':
        return {
          bg: 'bg-emerald-50 dark:bg-emerald-950/40',
          text: 'text-emerald-700 dark:text-emerald-300',
          border: 'border-emerald-200 dark:border-emerald-800',
          dot: 'bg-emerald-500',
        };
      case 'At Risk':
        return {
          bg: 'bg-amber-50 dark:bg-amber-950/40',
          text: 'text-amber-700 dark:text-amber-300',
          border: 'border-amber-200 dark:border-amber-800',
          dot: 'bg-amber-500',
        };
      case 'Delayed':
        return {
          bg: 'bg-rose-50 dark:bg-rose-950/40',
          text: 'text-rose-700 dark:text-rose-300',
          border: 'border-rose-200 dark:border-rose-800',
          dot: 'bg-rose-500',
        };
      case 'Active / In Progress':
      case 'Active':
      case 'In Progress':
        return {
          bg: 'bg-blue-50 dark:bg-blue-950/40',
          text: 'text-blue-700 dark:text-blue-300',
          border: 'border-blue-200 dark:border-blue-800',
          dot: 'bg-blue-500',
        };
      case 'Approved':
        return {
          bg: 'bg-indigo-50 dark:bg-indigo-950/40',
          text: 'text-indigo-700 dark:text-indigo-300',
          border: 'border-indigo-200 dark:border-indigo-800',
          dot: 'bg-indigo-500',
        };
      case 'Planning':
        return {
          bg: 'bg-amber-50 dark:bg-amber-950/40',
          text: 'text-amber-700 dark:text-amber-300',
          border: 'border-amber-200 dark:border-amber-800',
          dot: 'bg-amber-500',
        };
      case 'On Hold':
        return {
          bg: 'bg-orange-50 dark:bg-orange-950/40',
          text: 'text-orange-700 dark:text-orange-300',
          border: 'border-orange-200 dark:border-orange-800',
          dot: 'bg-orange-500',
        };
      case 'Cancelled':
        return {
          bg: 'bg-rose-50 dark:bg-rose-950/40',
          text: 'text-rose-700 dark:text-rose-300',
          border: 'border-rose-200 dark:border-rose-800',
          dot: 'bg-rose-500',
        };
      default:
        return {
          bg: 'bg-slate-50 dark:bg-slate-800',
          text: 'text-slate-700 dark:text-slate-300',
          border: 'border-slate-200 dark:border-slate-700',
          dot: 'bg-slate-400',
        };
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'Urgent':
      case 'High':
        return 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-800';
      case 'Medium':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      default:
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
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
    if (['Completed', 'Closed'].includes(status)) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
          Delivered
        </span>
      );
    }
    if (!targetDateStr) return null;
    const target = new Date(targetDateStr);
    const now = new Date();
    const diffDays = Math.ceil((target - now) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
          Overdue ({Math.abs(diffDays)}d)
        </span>
      );
    } else if (diffDays <= 7) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
          Due in {diffDays}d
        </span>
      );
    }
    return null;
  };

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '18px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Search & Filter Header Strip */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px',
          backgroundColor: '#f8fafc',
        }}
      >
        {/* Left: Search Box */}
        <div style={{ position: 'relative', flex: '1 1 260px', maxWidth: '420px', minWidth: '220px' }}>
          <Search
            size={16}
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }}
          />
          <input
            type="text"
            id="search-projects-input"
            placeholder="Search projects, client accounts, managers..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            style={{
              width: '100%',
              height: '40px',
              paddingLeft: '38px',
              paddingRight: '36px',
              backgroundColor: '#ffffff',
              border: '1.5px solid #cbd5e1',
              borderRadius: '12px',
              fontSize: '0.84rem',
              color: '#0f172a',
              outline: 'none',
              transition: 'all 0.15s ease',
              boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
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
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Right: Modern SaaS Filter Dropdowns */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Status Filter */}
          <div style={{ position: 'relative' }}>
            <select
              id="filter-project-status"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                height: '40px',
                paddingLeft: '14px',
                paddingRight: '32px',
                backgroundColor: '#ffffff',
                border: '1.5px solid #cbd5e1',
                borderRadius: '12px',
                fontSize: '0.84rem',
                fontWeight: 600,
                color: '#334155',
                appearance: 'none',
                WebkitAppearance: 'none',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              <option value="all">All Statuses</option>
              <option value="On Track">🟢 On Track</option>
              <option value="At Risk">🟡 At Risk</option>
              <option value="Delayed">🔴 Delayed</option>
              <option value="Draft">Draft</option>
              <option value="Planning">Planning</option>
              <option value="Approved">Approved</option>
              <option value="Active / In Progress">Active / In Progress</option>
              <option value="In Progress">In Progress</option>
              <option value="On Hold">On Hold</option>
              <option value="Completed">Completed</option>
              <option value="Closed">Closed</option>
            </select>
            <ChevronDown size={14} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#94a3b8' }} />
          </div>

          {/* User / Manager Filter */}
          <div style={{ position: 'relative', maxWidth: '180px' }}>
            <select
              id="filter-project-user"
              value={managerFilter}
              onChange={(e) => {
                setManagerFilter(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                height: '40px',
                paddingLeft: '14px',
                paddingRight: '32px',
                backgroundColor: '#ffffff',
                border: '1.5px solid #cbd5e1',
                borderRadius: '12px',
                fontSize: '0.84rem',
                fontWeight: 600,
                color: '#334155',
                appearance: 'none',
                WebkitAppearance: 'none',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              <option value="all">All Managers / Owners</option>
              {availableUsers.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
            <ChevronDown size={14} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#94a3b8' }} />
          </div>

          {/* Date / Deadline Filter */}
          <div style={{ position: 'relative' }}>
            <select
              id="filter-project-date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              style={{
                height: '40px',
                paddingLeft: '14px',
                paddingRight: '32px',
                backgroundColor: '#ffffff',
                border: '1.5px solid #cbd5e1',
                borderRadius: '12px',
                fontSize: '0.84rem',
                fontWeight: 600,
                color: '#334155',
                appearance: 'none',
                WebkitAppearance: 'none',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              <option value="all">All Deadlines</option>
              <option value="due_this_month">Due This Month</option>
              <option value="due_next_month">Due Next Month</option>
              <option value="overdue">Overdue Deadlines</option>
              <option value="completed">Completed Deliverables</option>
            </select>
            <ChevronDown size={14} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#94a3b8' }} />
          </div>

          {/* Reset Filters Button */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetAllFilters}
              style={{
                height: '40px',
                padding: '0 14px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                borderRadius: '12px',
                border: '1.5px solid #cbd5e1',
                backgroundColor: '#ffffff',
                color: '#64748b',
                fontSize: '0.84rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              title="Reset all active filters"
            >
              <RotateCcw size={14} />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Table Content */}
      <div style={{ overflowX: 'auto', minHeight: '300px' }}>
        {loading ? (
          <div style={{ padding: '80px 20px', textAlign: 'center' }}>
            <div
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
            <p style={{ fontSize: '0.84rem', fontWeight: 600, color: '#64748b', margin: 0 }}>Loading Projects Directory...</p>
          </div>
        ) : displayedProjects.length === 0 ? (
          <div style={{ padding: '80px 20px', textAlign: 'center' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                backgroundColor: '#f1f5f9',
                color: '#94a3b8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 14px',
              }}
            >
              <FolderKanban size={28} />
            </div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', margin: '0 0 6px 0' }}>
              No Projects Found
            </h3>
            <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0, maxWidth: '380px', marginInline: 'auto' }}>
              {hasActiveFilters
                ? 'No project records match your active search and filter criteria. Try clearing filters to view all projects.'
                : 'No projects registered in your workspace scope yet.'}
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetAllFilters}
                style={{
                  marginTop: '16px',
                  padding: '8px 18px',
                  borderRadius: '10px',
                  backgroundColor: '#eff6ff',
                  color: '#2563eb',
                  border: '1px solid #bfdbfe',
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
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1.5px solid #e2e8f0' }}>
                <th style={{ padding: '14px 18px', fontSize: '0.74rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', minWidth: '240px' }}>
                  Project ID & Name
                </th>
                <th style={{ padding: '14px 18px', fontSize: '0.74rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', minWidth: '160px' }}>
                  Client Account
                </th>
                <th style={{ padding: '14px 18px', fontSize: '0.74rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', minWidth: '160px' }}>
                  Manager / Owner
                </th>
                <th style={{ padding: '14px 18px', fontSize: '0.74rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', minWidth: '170px' }}>
                  Progress Velocity
                </th>
                <th style={{ padding: '14px 18px', fontSize: '0.74rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', minWidth: '160px' }}>
                  Schedule & Due Date
                </th>
                <th style={{ padding: '14px 18px', fontSize: '0.74rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', minWidth: '130px' }}>
                  Status
                </th>
                <th style={{ padding: '14px 18px', fontSize: '0.74rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right', minWidth: '120px' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {displayedProjects.map((project) => {
                const sBadge = getStatusBadge(project.status);
                const milestones = Array.isArray(project.milestones) ? project.milestones : [];
                const completedM = milestones.filter((m) => m.status === 'Completed' || m.isCompleted).length;
                const progress =
                  milestones.length > 0
                    ? Math.round((completedM / milestones.length) * 100)
                    : project.progress || 0;

                const isDropdownOpen = openDropdownId === project._id;
                const projCode = project.projectId || project.projectCode || 'PRJ-000';
                const projName = project.name || project.title;
                const clientName = project.client || project.clientName || 'Internal Client';
                const managerName = project.projectManager || project.managerName || 'Unassigned';
                const targetDateStr = project.targetDate || project.endDate;
                const deadlineTag = getDeadlineBadge(targetDateStr, project.status);

                return (
                  <tr
                    key={project._id}
                    style={{
                      borderBottom: '1px solid #f1f5f9',
                      transition: 'background-color 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
                  >
                    {/* Project ID & Name */}
                    <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span
                          style={{
                            fontFamily: 'monospace',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            color: '#2563eb',
                            backgroundColor: '#eff6ff',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            border: '1px solid #dbeafe',
                          }}
                        >
                          {projCode}
                        </span>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            color: '#64748b',
                            backgroundColor: '#f8fafc',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            border: '1px solid #e2e8f0',
                          }}
                        >
                          {project.projectType || project.category || 'Client Project'}
                        </span>
                      </div>
                      <div
                        onClick={() => onViewProject(project)}
                        style={{
                          fontSize: '0.88rem',
                          fontWeight: 700,
                          color: '#0f172a',
                          cursor: 'pointer',
                          textDecoration: 'none',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#2563eb')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = '#0f172a')}
                        title="Click to view full project specifications"
                      >
                        {projName}
                      </div>
                    </td>

                    {/* Client Account */}
                    <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Building size={14} color="#94a3b8" />
                        <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#334155' }}>
                          {clientName}
                        </span>
                      </div>
                    </td>

                    {/* Project Manager */}
                    <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            backgroundColor: '#eff6ff',
                            color: '#2563eb',
                            border: '1px solid #bfdbfe',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.75rem',
                          }}
                        >
                          {managerName !== 'Unassigned' ? managerName.charAt(0).toUpperCase() : '—'}
                        </div>
                        <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#334155' }}>
                          {managerName}
                        </span>
                      </div>
                    </td>

                    {/* Progress Velocity */}
                    <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                      <div style={{ minWidth: '140px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.76rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                          <span>{progress}%</span>
                          <span style={{ color: '#94a3b8', fontSize: '0.72rem', fontWeight: 500 }}>
                            {completedM}/{milestones.length || 0} gates
                          </span>
                        </div>
                        <div style={{ width: '100%', backgroundColor: '#e2e8f0', height: '7px', borderRadius: '999px', overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${progress}%`,
                              height: '100%',
                              borderRadius: '999px',
                              backgroundColor: progress === 100 ? '#16a34a' : progress > 50 ? '#2563eb' : '#d97706',
                              transition: 'width 0.3s ease',
                            }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Due Date & Deadline Status */}
                    <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Calendar size={13} color="#94a3b8" />
                          {formatDate(targetDateStr)}
                        </span>
                        {deadlineTag}
                      </div>
                    </td>

                    {/* Status Pill */}
                    <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 10px',
                          borderRadius: '999px',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          backgroundColor:
                            project.status === 'Completed' || project.status === 'Closed'
                              ? '#ecfdf5'
                              : project.status === 'Active / In Progress' || project.status === 'In Progress' || project.status === 'Active'
                              ? '#eff6ff'
                              : project.status === 'On Hold'
                              ? '#fffbeb'
                              : project.status === 'Approved'
                              ? '#f5f3ff'
                              : '#f8fafc',
                          color:
                            project.status === 'Completed' || project.status === 'Closed'
                              ? '#15803d'
                              : project.status === 'Active / In Progress' || project.status === 'In Progress' || project.status === 'Active'
                              ? '#1d4ed8'
                              : project.status === 'On Hold'
                              ? '#b45309'
                              : project.status === 'Approved'
                              ? '#6d28d9'
                              : '#475569',
                          border: `1px solid ${
                            project.status === 'Completed' || project.status === 'Closed'
                              ? '#bbf7d0'
                              : project.status === 'Active / In Progress' || project.status === 'In Progress' || project.status === 'Active'
                              ? '#bfdbfe'
                              : project.status === 'On Hold'
                              ? '#fde68a'
                              : project.status === 'Approved'
                              ? '#ddd6fe'
                              : '#e2e8f0'
                          }`,
                        }}
                      >
                        <span
                          style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            backgroundColor:
                              project.status === 'Completed' || project.status === 'Closed'
                                ? '#16a34a'
                                : project.status === 'Active / In Progress' || project.status === 'In Progress' || project.status === 'Active'
                                ? '#2563eb'
                                : project.status === 'On Hold'
                                ? '#d97706'
                                : '#64748b',
                          }}
                        />
                        <span>{project.status || 'Planning'}</span>
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '14px 18px', verticalAlign: 'middle', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', position: 'relative' }}>
                        {/* View Button */}
                        <button
                          type="button"
                          onClick={() => onViewProject(project)}
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                            backgroundColor: '#ffffff',
                            color: '#2563eb',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#eff6ff')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
                          title="View 360° Project Overview"
                        >
                          <Eye size={15} />
                        </button>

                        {/* Edit Button */}
                        <button
                          type="button"
                          onClick={() => onEditProject(project)}
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                            backgroundColor: '#ffffff',
                            color: '#475569',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
                          title="Edit Project"
                        >
                          <Edit2 size={14} />
                        </button>

                        {/* More Menu */}
                        <div style={{ position: 'relative' }}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenDropdownId(isDropdownOpen ? null : project._id);
                            }}
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '8px',
                              border: '1px solid #e2e8f0',
                              backgroundColor: isDropdownOpen ? '#f1f5f9' : '#ffffff',
                              color: '#475569',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                              transition: 'all 0.15s ease',
                            }}
                            title="More Actions"
                          >
                            <MoreVertical size={14} />
                          </button>

                          {/* Dropdown Menu */}
                          {isDropdownOpen && (
                            <div
                              ref={dropdownRef}
                              style={{
                                position: 'absolute',
                                right: 0,
                                top: '38px',
                                zIndex: 50,
                                backgroundColor: '#ffffff',
                                borderRadius: '14px',
                                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15), 0 8px 10px -6px rgba(0,0,0,0.1)',
                                border: '1px solid #e2e8f0',
                                padding: '6px',
                                minWidth: '190px',
                                textAlign: 'left',
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
                                  fontSize: '0.82rem',
                                  fontWeight: 600,
                                  color: '#334155',
                                  backgroundColor: 'transparent',
                                  border: 'none',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  cursor: 'pointer',
                                  transition: 'background-color 0.15s ease',
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                              >
                                <ListTodo size={15} color="#059669" />
                                <span>Milestones & Gates</span>
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
                                      fontSize: '0.82rem',
                                      fontWeight: 600,
                                      color: '#dc2626',
                                      backgroundColor: 'transparent',
                                      border: 'none',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '8px',
                                      cursor: 'pointer',
                                      transition: 'background-color 0.15s ease',
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fef2f2')}
                                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                                  >
                                    <Trash2 size={15} color="#dc2626" />
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
            padding: '14px 20px',
            borderTop: '1px solid #e2e8f0',
            backgroundColor: '#ffffff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            fontSize: '0.82rem',
          }}
        >
          <div style={{ color: '#64748b', fontWeight: 500 }}>
            Showing <strong style={{ color: '#0f172a' }}>{(currentPage - 1) * itemsPerPage + 1}</strong> to{' '}
            <strong style={{ color: '#0f172a' }}>{Math.min(currentPage * itemsPerPage, totalItems || displayedProjects.length)}</strong> of{' '}
            <strong style={{ color: '#0f172a' }}>{totalItems || displayedProjects.length}</strong> projects
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              style={{
                height: '34px',
                padding: '0 12px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                color: currentPage <= 1 ? '#cbd5e1' : '#334155',
                cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                fontSize: '0.82rem',
                transition: 'all 0.15s ease',
              }}
            >
              <ChevronLeft size={14} />
              <span>Prev</span>
            </button>

            <span style={{ padding: '0 8px', fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>
              Page {currentPage} of {totalPages || 1}
            </span>

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              style={{
                height: '34px',
                padding: '0 12px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                color: currentPage >= totalPages ? '#cbd5e1' : '#334155',
                cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                fontSize: '0.82rem',
                transition: 'all 0.15s ease',
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
