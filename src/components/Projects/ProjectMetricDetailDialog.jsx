import React, { useState, useEffect, useMemo } from 'react';
import {
  FolderKanban,
  CheckCircle2,
  TrendingUp,
  DollarSign,
  Search,
  X,
  Plus,
  Edit2,
  Trash2,
  ListTodo,
  Calendar,
  Building,
  User,
  ChevronLeft,
  ChevronRight,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useProjects } from '../../context/ProjectContext';

export const ProjectMetricDetailDialog = ({
  open,
  onClose,
  metricType = 'total', // 'total' | 'in_progress' | 'completed' | 'budget'
  onEditProject,
  onOpenMilestones,
  onDeleteProject,
  canDelete = false,
  onCreateProject,
}) => {
  const { projects: contextProjects, stats } = useProjects();

  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [page, setPage] = useState(0);
  const rowsPerPage = 6;

  useEffect(() => {
    if (!open) return;
    setSearchTerm('');
    setActiveTab('all');
    setCategoryFilter('all');
    setPage(0);
  }, [open, metricType]);

  // Dialog configuration
  const config = useMemo(() => {
    switch (metricType) {
      case 'in_progress':
        return {
          title: 'In Execution Projects',
          subtitle: 'Active client deliverables currently in design, development, and sprint execution.',
          icon: TrendingUp,
          primaryColor: '#0284c7',
          bgLight: '#f0f9ff',
          borderColor: '#bae6fd',
          badgeText: 'Active Execution',
          emptyMessage: 'No projects currently in execution.',
        };
      case 'completed':
        return {
          title: 'Delivered & Completed Projects',
          subtitle: 'Successfully finalized deliverables with 100% milestone sign-off.',
          icon: CheckCircle2,
          primaryColor: '#059669',
          bgLight: '#ecfdf5',
          borderColor: '#a7f3d0',
          badgeText: 'Delivered Sign-off',
          emptyMessage: 'No completed projects found matching the criteria.',
        };
      case 'budget':
        return {
          title: 'Portfolio Budget & Financials',
          subtitle: 'Detailed budget allocation, total project contract values, and financial tracking.',
          icon: DollarSign,
          primaryColor: '#7c3aed',
          bgLight: '#f5f3ff',
          borderColor: '#ddd6fe',
          badgeText: 'Portfolio Budget',
          emptyMessage: 'No budgeted projects found.',
        };
      case 'total':
      default:
        return {
          title: 'Total Projects Directory',
          subtitle: 'Complete registry of all organization client projects, deliverables, and progress.',
          icon: FolderKanban,
          primaryColor: '#2563eb',
          bgLight: '#eff6ff',
          borderColor: '#bfdbfe',
          badgeText: 'Project Registry',
          emptyMessage: 'No projects found in the system.',
        };
    }
  }, [metricType]);

  // Filter projects according to metricType and local filters
  const filteredProjects = useMemo(() => {
    return (contextProjects || []).filter((p) => {
      // 1. Metric Type base filter
      if (metricType === 'in_progress') {
        if (!['In Progress', 'Under Review'].includes(p.status)) return false;
      } else if (metricType === 'completed') {
        if (p.status !== 'Completed') return false;
      }

      // 2. Sub-tab filter
      if (activeTab !== 'all') {
        if (p.status !== activeTab) return false;
      }

      // 3. Category Filter
      if (categoryFilter !== 'all' && p.category !== categoryFilter) {
        return false;
      }

      // 4. Search Filter
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const code = (p.projectCode || '').toLowerCase();
        const name = (p.name || '').toLowerCase();
        const client = (p.clientName || '').toLowerCase();
        const mgr = (p.managerName || '').toLowerCase();
        const cat = (p.category || '').toLowerCase();

        return (
          code.includes(q) ||
          name.includes(q) ||
          client.includes(q) ||
          mgr.includes(q) ||
          cat.includes(q)
        );
      }

      return true;
    });
  }, [contextProjects, metricType, activeTab, categoryFilter, searchTerm]);

  // Categories list
  const availableCategories = useMemo(() => {
    const cats = new Set();
    (contextProjects || []).forEach((p) => {
      if (p.category) cats.add(p.category);
    });
    return Array.from(cats);
  }, [contextProjects]);

  const totalPages = Math.ceil(filteredProjects.length / rowsPerPage) || 1;
  const paginatedProjects = filteredProjects.slice(page * rowsPerPage, (page + 1) * rowsPerPage);

  if (!open) return null;

  const IconComponent = config.icon;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Completed':
        return { bg: '#ecfdf5', color: '#047857', border: '#a7f3d0' };
      case 'In Progress':
        return { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' };
      case 'Under Review':
        return { bg: '#f5f3ff', color: '#6d28d9', border: '#ddd6fe' };
      case 'Planning':
        return { bg: '#fffbeb', color: '#b45309', border: '#fde68a' };
      case 'On Hold':
        return { bg: '#fef2f2', color: '#b91c1c', border: '#fecaca' };
      default:
        return { bg: '#f8fafc', color: '#475569', border: '#e2e8f0' };
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

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '1080px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.3)',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 28px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(to right, #ffffff, #f8fafc)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '14px',
                backgroundColor: config.bgLight,
                color: config.primaryColor,
                border: `1.5px solid ${config.borderColor}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 4px 12px ${config.primaryColor}20`,
                flexShrink: 0,
              }}
            >
              <IconComponent size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                  {config.title}
                </h2>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '3px 10px',
                    borderRadius: '999px',
                    backgroundColor: config.bgLight,
                    color: config.primaryColor,
                    border: `1px solid ${config.borderColor}`,
                    fontSize: '0.72rem',
                    fontWeight: 700,
                  }}
                >
                  {config.badgeText}
                </span>
              </div>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.84rem', color: '#64748b' }}>
                {config.subtitle}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={() => {
                onClose();
                onCreateProject();
              }}
              className="btn btn-primary btn-curvy-action"
              style={{
                backgroundColor: '#2563eb',
                color: '#ffffff',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 16px',
                fontSize: '0.82rem',
                borderRadius: '999px',
                border: 'none',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <Plus size={15} />
              <span>Create Project</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                border: 'none',
                backgroundColor: '#f1f5f9',
                color: '#64748b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Toolbar: Search & Category Filter */}
        <div
          style={{
            padding: '14px 28px',
            backgroundColor: '#ffffff',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          {/* Search Box */}
          <div style={{ position: 'relative', flex: '1 1 260px', maxWidth: '360px' }}>
            <Search
              size={15}
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}
            />
            <input
              type="text"
              placeholder="Search code, name, client, manager..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(0);
              }}
              style={{
                width: '100%',
                padding: '7px 12px 7px 34px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.84rem',
                color: '#0f172a',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(0);
              }}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.82rem',
                color: '#334155',
                background: '#ffffff',
                outline: 'none',
              }}
            >
              <option value="all">All Categories</option>
              {availableCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0' }}>
          {paginatedProjects.length === 0 ? (
            <div style={{ padding: '60px 24px', textAlign: 'center' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  background: '#f8fafc',
                  color: '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px',
                }}
              >
                <FolderKanban size={28} />
              </div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
                {config.emptyMessage}
              </h4>
              <p style={{ fontSize: '0.82rem', color: '#64748b' }}>
                No projects matched your active filters in this category.
              </p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '12px 20px', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                    Project
                  </th>
                  <th style={{ padding: '12px 20px', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                    Client & Category
                  </th>
                  <th style={{ padding: '12px 20px', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                    Milestones & Progress
                  </th>
                  <th style={{ padding: '12px 20px', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                    Budget & Priority
                  </th>
                  <th style={{ padding: '12px 20px', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                    Status
                  </th>
                  <th style={{ padding: '12px 20px', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', textAlign: 'right' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedProjects.map((project) => {
                  const sBadge = getStatusBadge(project.status);
                  const pBadge = getPriorityBadge(project.priority);
                  const milestones = Array.isArray(project.milestones) ? project.milestones : [];
                  const completedM = milestones.filter((m) => m.isCompleted).length;
                  const progress = milestones.length > 0 ? Math.round((completedM / milestones.length) * 100) : project.progress || 0;

                  return (
                    <tr
                      key={project._id}
                      style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.15s ease' }}
                      className="table-row-hover"
                    >
                      {/* Project Code & Name */}
                      <td style={{ padding: '14px 20px', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span
                            style={{
                              fontFamily: 'monospace',
                              fontSize: '0.76rem',
                              fontWeight: 700,
                              color: '#0f172a',
                              background: '#f1f5f9',
                              padding: '2px 6px',
                              borderRadius: '4px',
                            }}
                          >
                            {project.projectCode}
                          </span>
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0f172a', marginTop: '2px' }}>
                          {project.name}
                        </div>
                      </td>

                      {/* Client & Category */}
                      <td style={{ padding: '14px 20px', verticalAlign: 'middle' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#334155' }}>
                          {project.clientName}
                        </div>
                        <span
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            color: '#64748b',
                            background: '#f1f5f9',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            display: 'inline-block',
                            marginTop: '2px',
                          }}
                        >
                          {project.category}
                        </span>
                      </td>

                      {/* Milestones & Progress Bar */}
                      <td style={{ padding: '14px 20px', verticalAlign: 'middle', minWidth: '180px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.74rem' }}>
                          <span style={{ fontWeight: 700, color: '#0f172a' }}>{progress}% Complete</span>
                          <span style={{ color: '#64748b' }}>
                            {completedM}/{milestones.length} Milestones
                          </span>
                        </div>
                        <div style={{ width: '100%', height: '6px', background: '#f1f5f9', borderRadius: '999px', overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${progress}%`,
                              height: '100%',
                              background: progress === 100 ? '#10b981' : '#059669',
                              borderRadius: '999px',
                            }}
                          />
                        </div>
                      </td>

                      {/* Budget & Priority */}
                      <td style={{ padding: '14px 20px', verticalAlign: 'middle' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0f172a' }}>
                          {project.currency === 'INR' ? '₹' : '$'}
                          {Number(project.budget || 0).toLocaleString()}
                        </div>
                        <span
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: '999px',
                            background: pBadge.bg,
                            color: pBadge.color,
                            border: `1px solid ${pBadge.border}`,
                            display: 'inline-block',
                            marginTop: '2px',
                          }}
                        >
                          {project.priority}
                        </span>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '14px 20px', verticalAlign: 'middle' }}>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '999px',
                            background: sBadge.bg,
                            color: sBadge.color,
                            border: `1px solid ${sBadge.border}`,
                          }}
                        >
                          {project.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 20px', verticalAlign: 'middle', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onOpenMilestones(project);
                            }}
                            style={{
                              background: '#ecfdf5',
                              border: '1px solid #a7f3d0',
                              color: '#059669',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              fontSize: '0.74rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                            title="Manage Milestones"
                          >
                            <ListTodo size={13} />
                            <span>Milestones</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onEditProject(project);
                            }}
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '6px',
                              border: '1px solid #e2e8f0',
                              background: '#ffffff',
                              color: '#475569',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                            }}
                            title="Edit Project"
                          >
                            <Edit2 size={13} />
                          </button>

                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => {
                                onClose();
                                onDeleteProject(project);
                              }}
                              style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '6px',
                                border: '1px solid #fee2e2',
                                background: '#fef2f2',
                                color: '#dc2626',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                              }}
                              title="Delete Project"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer / Pagination */}
        <div
          style={{
            padding: '14px 28px',
            backgroundColor: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
            Showing <strong>{filteredProjects.length > 0 ? page * rowsPerPage + 1 : 0}</strong> to{' '}
            <strong>{Math.min((page + 1) * rowsPerPage, filteredProjects.length)}</strong> of{' '}
            <strong>{filteredProjects.length}</strong> projects
          </div>

          {totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                type="button"
                disabled={page <= 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0',
                  background: '#ffffff',
                  color: page <= 0 ? '#cbd5e1' : '#334155',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: page <= 0 ? 'not-allowed' : 'pointer',
                }}
              >
                <ChevronLeft size={15} />
              </button>

              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155', padding: '0 4px' }}>
                {page + 1} / {totalPages}
              </span>

              <button
                type="button"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0',
                  background: '#ffffff',
                  color: page >= totalPages - 1 ? '#cbd5e1' : '#334155',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer',
                }}
              >
                <ChevronRight size={15} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
