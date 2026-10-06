import React, { useState, useMemo, useEffect } from 'react';
import { useProjects } from '../../context/ProjectContext';
import { useAuth } from '../../context/AuthContext';
import { MetricCard } from '../ManagerDashboard/MetricCard';
import { ProjectTable } from './ProjectTable';
import { ProjectDetailModal } from './ProjectDetailModal';
import { ProjectMetricDetailDialog } from './ProjectMetricDetailDialog';
import { ProjectGanttView } from './ProjectGanttView';
import { ProjectKanbanBoard } from './ProjectKanbanBoard';
import { ProjectResourceWorkload } from './ProjectResourceWorkload';
import { ProjectMISDashboard } from './ProjectMISDashboard';
import { ProjectReportsView } from './ProjectReportsView';
import { ProjectReportsModal } from './ProjectReportsModal';
import { ProjectDirectoryModal } from './ProjectDirectoryModal';
import { ProjectImportModal } from './ProjectImportModal';
import { ProjectExportModal } from './ProjectExportModal';
import { ProjectTaskModal } from './ProjectTaskModal';
import { ProjectIssueModal } from './ProjectIssueModal';
import { ProjectRiskModal } from './ProjectRiskModal';
import { ProjectTimesheetModal } from './ProjectTimesheetModal';

import {
  FolderKanban,
  Plus,
  TrendingUp,
  CheckCircle2,
  DollarSign,
  Crown,
  ShieldCheck,
  Briefcase,
  Download,
  Upload,
  Calendar,
  Kanban,
  Users,
  BarChart3,
  FileText,
  ArrowUpRight,
  Layers,
  FileSpreadsheet,
  AlertTriangle,
  AlertCircle,
} from 'lucide-react';

export const ProjectSection = () => {
  const {
    projects,
    stats,
    viewMode,
    setViewMode,
    isCreateModalOpen,
    setIsCreateModalOpen,
    isEditModalOpen,
    setIsEditModalOpen,
    isMilestonesModalOpen,
    setIsMilestonesModalOpen,
    isDeleteModalOpen,
    setIsDeleteModalOpen,
    isDetailModalOpen,
    setIsDetailModalOpen,
    isImportModalOpen,
    setIsImportModalOpen,
    isExportModalOpen,
    setIsExportModalOpen,
    isTaskModalOpen,
    setIsTaskModalOpen,
    isIssueModalOpen,
    setIsIssueModalOpen,
    isRiskModalOpen,
    setIsRiskModalOpen,
    isTimesheetModalOpen,
    setIsTimesheetModalOpen,
    projectForDetail,
    setProjectForDetail,
    projectToEdit,
    setProjectToEdit,
    projectForMilestones,
    setProjectForMilestones,
    projectToDelete,
    setProjectToDelete,
    openCreateModal,
    openEditModal,
    openMilestonesModal,
    openDeleteModal,
    openDetailModal,
    openTaskModal,
    openIssueModal,
    openRiskModal,
    openTimesheetModal,
    openImportModal,
    openExportModal,
    statusFilter,
    setStatusFilter,
    setCurrentPage,
  } = useProjects();

  const { isSuperAdmin, isManager } = useAuth();

  // Hover state for interactive KPI and feature cards
  const [hoveredCard, setHoveredCard] = useState(null);

  // Pop-up modals for Directory and Reports / MIS Hub
  const [isDirectoryModalOpen, setIsDirectoryModalOpen] = useState(false);
  const [isReportsModalOpen, setIsReportsModalOpen] = useState(false);
  const [reportsModalInitialTab, setReportsModalInitialTab] = useState('reports');

  // Active Metric Dialog: 'total' | 'in_progress' | 'completed' | 'budget' | null
  const [activeMetricDialog, setActiveMetricDialog] = useState(null);

  // Health Card click handler to open Project Directory with filter applied
  const handleHealthCardClick = (healthStatus) => {
    if (setStatusFilter) setStatusFilter(healthStatus);
    if (setCurrentPage) setCurrentPage(1);
    setIsDirectoryModalOpen(true);
  };

  // Sub-modal specific project target
  const [activeTargetProject, setActiveTargetProject] = useState(null);

  const handleOpenTaskForProject = (proj) => {
    setActiveTargetProject(proj);
    if (openTaskModal) openTaskModal(proj);
    else setIsTaskModalOpen(true);
  };

  const handleOpenIssueForProject = (proj) => {
    setActiveTargetProject(proj);
    if (openIssueModal) openIssueModal(proj);
    else setIsIssueModalOpen(true);
  };

  const handleOpenRiskForProject = (proj) => {
    setActiveTargetProject(proj);
    if (openRiskModal) openRiskModal(proj);
    else setIsRiskModalOpen(true);
  };

  const handleOpenTimesheetForProject = (proj) => {
    setActiveTargetProject(proj);
    if (openTimesheetModal) openTimesheetModal(proj);
    else setIsTimesheetModalOpen(true);
  };



  // Dynamic Project Health calculation
  const healthStats = useMemo(() => {
    const list = Array.isArray(projects) ? projects : [];
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    let onTrack = 0;
    let atRisk = 0;
    let delayed = 0;

    list.forEach((p) => {
      const isCompleted = ['Completed', 'Closed', 'Delivered'].includes(p.status);
      if (isCompleted) {
        onTrack++;
        return;
      }

      const targetDate = p.targetDate ? new Date(p.targetDate) : null;
      const isOverdue = targetDate && targetDate < now;
      const isCancelled = p.status === 'Cancelled';
      const isOnHold = p.status === 'On Hold';
      const isHighRisk = ['Critical', 'Urgent', 'High'].includes(p.priority) || p.status === 'Under Review';
      const isNearDeadline = targetDate && Math.ceil((targetDate - now) / (1000 * 60 * 60 * 24)) <= 7 && Math.ceil((targetDate - now) / (1000 * 60 * 60 * 24)) >= 0;

      if (isOverdue || isCancelled || p.status === 'Overdue') {
        delayed++;
      } else if (isOnHold || isHighRisk || isNearDeadline) {
        atRisk++;
      } else {
        onTrack++;
      }
    });

    return { onTrack, atRisk, delayed };
  }, [projects]);

  // Optional Financial Variance calculation if actualCost data exists
  const financialMetrics = useMemo(() => {
    const list = Array.isArray(projects) ? projects : [];
    let totalBudget = 0;
    let totalActual = 0;
    let hasActualCost = false;

    list.forEach((p) => {
      if (p.budget) totalBudget += Number(p.budget) || 0;
      if (p.actualCost !== undefined && p.actualCost !== null && Number(p.actualCost) > 0) {
        totalActual += Number(p.actualCost) || 0;
        hasActualCost = true;
      }
    });

    const variance = totalBudget - totalActual;
    return { totalBudget, totalActual, variance, hasActualCost };
  }, [projects]);

  const activeProjectsCount = stats.inProgress || projects.filter((p) => ['In Progress', 'Active'].includes(p.status)).length;
  const totalProjectsCount = stats.total || projects.length;

  return (
    <div className="project-management-page" style={{ paddingBottom: '36px' }}>
      {/* Top Header Section */}
      <div
        className="section-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '20px',
        }}
      >
        {/* Header Left Info */}
        <div style={{ flex: '1 1 500px', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '12px',
                backgroundColor: '#eff6ff',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #bfdbfe',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.15)',
                flexShrink: 0,
              }}
            >
              <FolderKanban size={22} />
            </div>

            <h1
              className="section-title"
              style={{
                margin: 0,
                fontSize: '1.45rem',
                fontWeight: 800,
                color: '#0f172a',
                letterSpacing: '-0.02em',
              }}
            >
              Project Management
            </h1>

            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '3px 10px',
                borderRadius: '999px',
                fontSize: '0.74rem',
                fontWeight: 700,
                background: isSuperAdmin ? '#fef3c7' : isManager ? '#eff6ff' : '#ecfdf5',
                color: isSuperAdmin ? '#b45309' : isManager ? '#1d4ed8' : '#047857',
                border: `1px solid ${isSuperAdmin ? '#fde68a' : isManager ? '#bfdbfe' : '#a7f3d0'}`,
              }}
            >
              {isSuperAdmin ? <Crown size={12} /> : isManager ? <ShieldCheck size={12} /> : <Briefcase size={12} />}
              {isSuperAdmin
                ? 'Super Admin • Entire Organization Projects'
                : isManager
                ? 'Manager • Team & Subordinate Projects'
                : 'Assigned Workspace Projects'}
            </span>
          </div>
        </div>

        {/* Header Right Action: Create Project */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* PRIMARY CREATE PROJECT CTA BUTTON */}
          <button
            type="button"
            id="btn-create-project"
            onClick={() => {
              if (openCreateModal) openCreateModal();
              else setIsCreateModalOpen(true);
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 18px',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '0.86rem',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 3px 10px rgba(37, 99, 235, 0.22)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#1d4ed8';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#2563eb';
            }}
          >
            <Plus size={16} />
            <span>Create Project</span>
          </button>
        </div>
      </div>

      {/* 2. SECTION A: Key Portfolio Metrics (4 Cards) */}
      <div style={{ marginBottom: '18px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '10px',
            gap: '8px',
          }}
        >
          <BarChart3 size={15} color="#475569" />
          <span
            style={{
              fontSize: '0.78rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: '#475569',
            }}
          >
            Portfolio Metrics
          </span>
        </div>

        <div
          className="stats-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
            gap: '14px',
          }}
        >
          {/* Metric Card 1: Total Projects */}
          <div
            onClick={() => setActiveMetricDialog('total')}
            onMouseEnter={() => setHoveredCard('total')}
            onMouseLeave={() => setHoveredCard(null)}
            style={{
              backgroundColor: '#ffffff',
              border: `1.5px solid ${hoveredCard === 'total' ? '#2563eb' : '#e2e8f0'}`,
              borderRadius: '16px',
              padding: '16px 18px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              boxShadow:
                hoveredCard === 'total'
                  ? '0 10px 20px -4px rgba(37, 99, 235, 0.14), 0 2px 6px -2px rgba(0, 0, 0, 0.04)'
                  : '0 2px 6px rgba(0, 0, 0, 0.02)',
              transform: hoveredCard === 'total' ? 'translateY(-2px)' : 'translateY(0)',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              overflow: 'hidden',
              userSelect: 'none',
              minHeight: '120px',
            }}
            title="Click to view total projects registry"
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    backgroundColor: '#eff6ff',
                    color: '#2563eb',
                    border: '1px solid #bfdbfe',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <FolderKanban size={19} />
                </div>
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    color: '#2563eb',
                    backgroundColor: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    padding: '2px 7px',
                    borderRadius: '999px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '3px',
                  }}
                >
                  <span>View All</span>
                  <ArrowUpRight size={11} />
                </span>
              </div>

              <div
                style={{
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  color: '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  marginBottom: '2px',
                }}
              >
                Total Projects
              </div>

              <div
                style={{
                  fontSize: '1.65rem',
                  fontWeight: 800,
                  color: '#0f172a',
                  lineHeight: 1.15,
                  marginBottom: '4px',
                }}
              >
                {stats.total || 0}
              </div>
            </div>

            <div style={{ fontSize: '0.72rem', color: '#64748b', lineHeight: 1.3 }}>
              All registered client deliverables in pipeline
            </div>
          </div>

          {/* Metric Card 2: Active Projects (Renamed from In Execution) */}
          <div
            onClick={() => setActiveMetricDialog('in_progress')}
            onMouseEnter={() => setHoveredCard('in_progress')}
            onMouseLeave={() => setHoveredCard(null)}
            style={{
              backgroundColor: '#ffffff',
              border: `1.5px solid ${hoveredCard === 'in_progress' ? '#0284c7' : '#e2e8f0'}`,
              borderRadius: '16px',
              padding: '16px 18px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              boxShadow:
                hoveredCard === 'in_progress'
                  ? '0 10px 20px -4px rgba(2, 132, 199, 0.14), 0 2px 6px -2px rgba(0, 0, 0, 0.04)'
                  : '0 2px 6px rgba(0, 0, 0, 0.02)',
              transform: hoveredCard === 'in_progress' ? 'translateY(-2px)' : 'translateY(0)',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              overflow: 'hidden',
              userSelect: 'none',
              minHeight: '120px',
            }}
            title="Click to view active projects in execution"
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    backgroundColor: '#f0f9ff',
                    color: '#0284c7',
                    border: '1px solid #bae6fd',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <TrendingUp size={19} />
                </div>
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    color: '#0284c7',
                    backgroundColor: '#f0f9ff',
                    border: '1px solid #bae6fd',
                    padding: '2px 7px',
                    borderRadius: '999px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '3px',
                  }}
                >
                  <span>Active</span>
                  <ArrowUpRight size={11} />
                </span>
              </div>

              <div
                style={{
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  color: '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  marginBottom: '2px',
                }}
              >
                Active Projects
              </div>

              <div
                style={{
                  fontSize: '1.65rem',
                  fontWeight: 800,
                  color: '#0f172a',
                  lineHeight: 1.15,
                  marginBottom: '4px',
                }}
              >
                {stats.inProgress || 0}
              </div>
            </div>

            <div style={{ fontSize: '0.72rem', color: '#64748b', lineHeight: 1.3 }}>
              Active sprints & development deliverables
            </div>
          </div>

          {/* Metric Card 3: Delivered */}
          <div
            onClick={() => setActiveMetricDialog('completed')}
            onMouseEnter={() => setHoveredCard('completed')}
            onMouseLeave={() => setHoveredCard(null)}
            style={{
              backgroundColor: '#ffffff',
              border: `1.5px solid ${hoveredCard === 'completed' ? '#059669' : '#e2e8f0'}`,
              borderRadius: '16px',
              padding: '16px 18px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              boxShadow:
                hoveredCard === 'completed'
                  ? '0 10px 20px -4px rgba(5, 150, 105, 0.14), 0 2px 6px -2px rgba(0, 0, 0, 0.04)'
                  : '0 2px 6px rgba(0, 0, 0, 0.02)',
              transform: hoveredCard === 'completed' ? 'translateY(-2px)' : 'translateY(0)',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              overflow: 'hidden',
              userSelect: 'none',
              minHeight: '120px',
            }}
            title="Click to view delivered projects"
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    backgroundColor: '#ecfdf5',
                    color: '#059669',
                    border: '1px solid #a7f3d0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <CheckCircle2 size={19} />
                </div>
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    color: '#059669',
                    backgroundColor: '#ecfdf5',
                    border: '1px solid #a7f3d0',
                    padding: '2px 7px',
                    borderRadius: '999px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '3px',
                  }}
                >
                  <span>Delivered</span>
                  <ArrowUpRight size={11} />
                </span>
              </div>

              <div
                style={{
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  color: '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  marginBottom: '2px',
                }}
              >
                Delivered
              </div>

              <div
                style={{
                  fontSize: '1.65rem',
                  fontWeight: 800,
                  color: '#0f172a',
                  lineHeight: 1.15,
                  marginBottom: '4px',
                }}
              >
                {stats.completed || 0}
              </div>
            </div>

            <div style={{ fontSize: '0.72rem', color: '#64748b', lineHeight: 1.3 }}>
              100% milestone sign-off & delivered
            </div>
          </div>

          {/* Metric Card 4: Portfolio Value */}
          <div
            onClick={() => setActiveMetricDialog('budget')}
            onMouseEnter={() => setHoveredCard('budget')}
            onMouseLeave={() => setHoveredCard(null)}
            style={{
              backgroundColor: '#ffffff',
              border: `1.5px solid ${hoveredCard === 'budget' ? '#7c3aed' : '#e2e8f0'}`,
              borderRadius: '16px',
              padding: '16px 18px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              boxShadow:
                hoveredCard === 'budget'
                  ? '0 10px 20px -4px rgba(124, 58, 237, 0.14), 0 2px 6px -2px rgba(0, 0, 0, 0.04)'
                  : '0 2px 6px rgba(0, 0, 0, 0.02)',
              transform: hoveredCard === 'budget' ? 'translateY(-2px)' : 'translateY(0)',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              overflow: 'hidden',
              userSelect: 'none',
              minHeight: '120px',
            }}
            title="Click to view portfolio budget allocation"
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    backgroundColor: '#f5f3ff',
                    color: '#7c3aed',
                    border: '1px solid #ddd6fe',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <DollarSign size={19} />
                </div>
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    color: '#7c3aed',
                    backgroundColor: '#f5f3ff',
                    border: '1px solid #ddd6fe',
                    padding: '2px 7px',
                    borderRadius: '999px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '3px',
                  }}
                >
                  <span>Valuation</span>
                  <ArrowUpRight size={11} />
                </span>
              </div>

              <div
                style={{
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  color: '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  marginBottom: '2px',
                }}
              >
                Portfolio Value
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: '6px',
                  marginBottom: '4px',
                  flexWrap: 'wrap',
                }}
              >
                <div
                  style={{
                    fontSize: '1.5rem',
                    fontWeight: 800,
                    color: '#0f172a',
                    lineHeight: 1.15,
                  }}
                >
                  {stats.totalBudget ? `$${Number(stats.totalBudget).toLocaleString()}` : '$0'}
                </div>
                {financialMetrics.hasActualCost ? (
                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      color: financialMetrics.variance >= 0 ? '#059669' : '#dc2626',
                      backgroundColor: financialMetrics.variance >= 0 ? '#ecfdf5' : '#fef2f2',
                      padding: '1.5px 6px',
                      borderRadius: '5px',
                    }}
                    title={`Total Actual Spent: $${financialMetrics.totalActual.toLocaleString()}`}
                  >
                    {financialMetrics.variance >= 0 ? `+$${financialMetrics.variance.toLocaleString()} Margin` : `-$${Math.abs(financialMetrics.variance).toLocaleString()} Over`}
                  </span>
                ) : (
                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      color: '#6d28d9',
                      backgroundColor: '#ede9fe',
                      padding: '1.5px 6px',
                      borderRadius: '5px',
                    }}
                  >
                    {stats.avgProgress || 0}% Avg
                  </span>
                )}
              </div>
            </div>

            <div style={{ fontSize: '0.72rem', color: '#64748b', lineHeight: 1.3 }}>
              Total contract valuation across authorized projects
            </div>
          </div>
        </div>
      </div>

      {/* 2.5 SECTION: Compact Project Health Visibility & Quick Filter */}
      <div style={{ marginBottom: '18px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '10px',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={15} color="#475569" />
            <span
              style={{
                fontSize: '0.78rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: '#475569',
              }}
            >
              Project Health
            </span>
          </div>
          <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>
            Click any status to filter Project Directory
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))',
            gap: '12px',
          }}
        >
          {/* Health 1: On Track */}
          <div
            id="health-card-on-track"
            role="button"
            tabIndex={0}
            onClick={() => handleHealthCardClick('On Track')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleHealthCardClick('On Track');
              }
            }}
            onMouseEnter={() => setHoveredCard('health-on-track')}
            onMouseLeave={() => setHoveredCard(null)}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              padding: '12px 16px',
              border: hoveredCard === 'health-on-track' ? '1.5px solid #059669' : '1px solid #e2e8f0',
              boxShadow: hoveredCard === 'health-on-track' ? '0 4px 14px rgba(5, 150, 105, 0.12)' : '0 1px 3px rgba(0, 0, 0, 0.02)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              transform: hoveredCard === 'health-on-track' ? 'translateY(-1.5px)' : 'none',
              transition: 'all 0.18s ease',
            }}
            title="Click to view On Track projects in Directory"
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }} />
                <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em', color: '#059669' }}>
                  On Track
                </span>
              </div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#059669', marginTop: '2px', lineHeight: '1.2' }}>
                {healthStats.onTrack}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '8px',
                  backgroundColor: '#ecfdf5',
                  color: '#059669',
                  border: '1px solid #a7f3d0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CheckCircle2 size={17} />
              </div>
              <ArrowUpRight size={14} style={{ color: hoveredCard === 'health-on-track' ? '#059669' : '#94a3b8', transition: 'color 0.15s ease' }} />
            </div>
          </div>

          {/* Health 2: At Risk */}
          <div
            id="health-card-at-risk"
            role="button"
            tabIndex={0}
            onClick={() => handleHealthCardClick('At Risk')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleHealthCardClick('At Risk');
              }
            }}
            onMouseEnter={() => setHoveredCard('health-at-risk')}
            onMouseLeave={() => setHoveredCard(null)}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              padding: '12px 16px',
              border: hoveredCard === 'health-at-risk' ? '1.5px solid #d97706' : '1px solid #e2e8f0',
              boxShadow: hoveredCard === 'health-at-risk' ? '0 4px 14px rgba(217, 119, 6, 0.12)' : '0 1px 3px rgba(0, 0, 0, 0.02)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              transform: hoveredCard === 'health-at-risk' ? 'translateY(-1.5px)' : 'none',
              transition: 'all 0.18s ease',
            }}
            title="Click to view At Risk projects in Directory"
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#f59e0b', display: 'inline-block' }} />
                <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em', color: '#d97706' }}>
                  At Risk
                </span>
              </div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#d97706', marginTop: '2px', lineHeight: '1.2' }}>
                {healthStats.atRisk}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '8px',
                  backgroundColor: '#fffbeb',
                  color: '#d97706',
                  border: '1px solid #fde68a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <AlertTriangle size={17} />
              </div>
              <ArrowUpRight size={14} style={{ color: hoveredCard === 'health-at-risk' ? '#d97706' : '#94a3b8', transition: 'color 0.15s ease' }} />
            </div>
          </div>

          {/* Health 3: Delayed */}
          <div
            id="health-card-delayed"
            role="button"
            tabIndex={0}
            onClick={() => handleHealthCardClick('Delayed')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleHealthCardClick('Delayed');
              }
            }}
            onMouseEnter={() => setHoveredCard('health-delayed')}
            onMouseLeave={() => setHoveredCard(null)}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              padding: '12px 16px',
              border: hoveredCard === 'health-delayed' ? '1.5px solid #dc2626' : '1px solid #e2e8f0',
              boxShadow: hoveredCard === 'health-delayed' ? '0 4px 14px rgba(220, 38, 38, 0.12)' : '0 1px 3px rgba(0, 0, 0, 0.02)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              transform: hoveredCard === 'health-delayed' ? 'translateY(-1.5px)' : 'none',
              transition: 'all 0.18s ease',
            }}
            title="Click to view Delayed projects in Directory"
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#ef4444', display: 'inline-block' }} />
                <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em', color: '#dc2626' }}>
                  Delayed
                </span>
              </div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#dc2626', marginTop: '2px', lineHeight: '1.2' }}>
                {healthStats.delayed}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '8px',
                  backgroundColor: '#fef2f2',
                  color: '#dc2626',
                  border: '1px solid #fecaca',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Calendar size={17} />
              </div>
              <ArrowUpRight size={14} style={{ color: hoveredCard === 'health-delayed' ? '#dc2626' : '#94a3b8', transition: 'color 0.15s ease' }} />
            </div>
          </div>
        </div>
      </div>

      {/* 3. SECTION B: Two Action Cards (Project Directory & Project Reports / Portfolio MIS) */}
      <div style={{ marginBottom: '18px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '10px',
            gap: '8px',
          }}
        >
          <Layers size={15} color="#475569" />
          <span
            style={{
              fontSize: '0.78rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: '#475569',
            }}
          >
            Project Operations & Reporting Hub
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
            gap: '14px',
          }}
        >
          {/* Action Card 1: Project Directory */}
          <div
            id="card-project-directory"
            onClick={() => {
              setIsDirectoryModalOpen(true);
            }}
            onMouseEnter={() => setHoveredCard('directory')}
            onMouseLeave={() => setHoveredCard(null)}
            style={{
              backgroundColor: '#ffffff',
              border: `1.5px solid ${hoveredCard === 'directory' ? '#4f46e5' : '#e2e8f0'}`,
              borderRadius: '16px',
              padding: '18px 20px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              boxShadow:
                hoveredCard === 'directory'
                  ? '0 10px 20px -4px rgba(79, 70, 229, 0.14), 0 2px 6px -2px rgba(0, 0, 0, 0.04)'
                  : '0 2px 6px rgba(0, 0, 0, 0.02)',
              transform: hoveredCard === 'directory' ? 'translateY(-2px)' : 'translateY(0)',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              overflow: 'hidden',
              userSelect: 'none',
              minHeight: '128px',
            }}
            title="Click to launch Project Directory pop-up"
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '10px' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '11px',
                    backgroundColor: '#eef2ff',
                    color: '#4f46e5',
                    border: '1px solid #c7d2fe',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <FolderKanban size={21} />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      color: '#475569',
                      backgroundColor: '#f1f5f9',
                      border: '1px solid #e2e8f0',
                      padding: '2px 7px',
                      borderRadius: '999px',
                    }}
                  >
                    {totalProjectsCount} {totalProjectsCount === 1 ? 'Project' : 'Projects'}
                  </span>
                  <span
                    style={{
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      color: '#4f46e5',
                      backgroundColor: '#eef2ff',
                      border: '1px solid #c7d2fe',
                      padding: '4px 10px',
                      borderRadius: '999px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <span>Open Directory</span>
                    <ArrowUpRight size={12} />
                  </span>
                </div>
              </div>

              <div
                style={{
                  fontSize: '1.02rem',
                  fontWeight: 800,
                  color: '#0f172a',
                  letterSpacing: '-0.01em',
                  marginBottom: '5px',
                }}
              >
                Project Directory
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    color: '#4338ca',
                    backgroundColor: '#eef2ff',
                    padding: '2px 7px',
                    borderRadius: '5px',
                  }}
                >
                  Table & Kanban
                </span>
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    color: '#4338ca',
                    backgroundColor: '#eef2ff',
                    padding: '2px 7px',
                    borderRadius: '5px',
                  }}
                >
                  Gantt & Workload
                </span>
              </div>
            </div>

            <div style={{ fontSize: '0.74rem', color: '#64748b', lineHeight: 1.35 }}>
              Manage projects, timelines, milestones, teams, resources, and project activities.
            </div>
          </div>

          {/* Action Card 2: Project Reports & Portfolio MIS */}
          <div
            id="card-project-reports-mis"
            onClick={() => {
              setHoveredCard(null);
              setReportsModalInitialTab('reports');
              setIsReportsModalOpen(true);
            }}
            onMouseEnter={() => setHoveredCard('mis')}
            onMouseLeave={() => setHoveredCard(null)}
            style={{
              backgroundColor: '#ffffff',
              border: `1.5px solid ${hoveredCard === 'mis' ? '#0284c7' : '#e2e8f0'}`,
              borderRadius: '16px',
              padding: '18px 20px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              boxShadow:
                hoveredCard === 'mis'
                  ? '0 10px 20px -4px rgba(2, 132, 199, 0.14), 0 2px 6px -2px rgba(0, 0, 0, 0.04)'
                  : '0 2px 6px rgba(0, 0, 0, 0.02)',
              transform: hoveredCard === 'mis' ? 'translateY(-2px)' : 'translateY(0)',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              overflow: 'hidden',
              userSelect: 'none',
              minHeight: '128px',
            }}
            title="Click to launch Project Reports & Portfolio MIS pop-up"
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '10px' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '11px',
                    backgroundColor: '#f0f9ff',
                    color: '#0284c7',
                    border: '1px solid #bae6fd',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <FileSpreadsheet size={21} />
                </div>

                <span
                  style={{
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    color: '#0284c7',
                    backgroundColor: '#f0f9ff',
                    border: '1px solid #bae6fd',
                    padding: '4px 10px',
                    borderRadius: '999px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <span>View Reports & MIS</span>
                  <ArrowUpRight size={12} />
                </span>
              </div>

              <div
                style={{
                  fontSize: '1.02rem',
                  fontWeight: 800,
                  color: '#0f172a',
                  letterSpacing: '-0.01em',
                  marginBottom: '5px',
                }}
              >
                Project Reports & Portfolio MIS
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    color: '#0369a1',
                    backgroundColor: '#e0f2fe',
                    padding: '2px 7px',
                    borderRadius: '5px',
                  }}
                >
                  Portfolio MIS
                </span>
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    color: '#0369a1',
                    backgroundColor: '#e0f2fe',
                    padding: '2px 7px',
                    borderRadius: '5px',
                  }}
                >
                  Executive Reports
                </span>
              </div>
            </div>

            <div style={{ fontSize: '0.74rem', color: '#64748b', lineHeight: 1.35 }}>
              Review project health, progress, workload, costs, and analytics.
            </div>
          </div>
        </div>
      </div>



      {/* Metric Detail Popup Dialog */}
      <ProjectMetricDetailDialog
        open={!!activeMetricDialog}
        onClose={() => setActiveMetricDialog(null)}
        metricType={activeMetricDialog || 'total'}
        onEditProject={(p) => {
          if (openEditModal) openEditModal(p);
          else {
            setProjectToEdit(p);
            setIsEditModalOpen(true);
          }
        }}
        onOpenMilestones={(p) => {
          if (openMilestonesModal) openMilestonesModal(p);
          else {
            setProjectForMilestones(p);
            setIsMilestonesModalOpen(true);
          }
        }}
        onDeleteProject={(p) => {
          if (openDeleteModal) openDeleteModal(p);
          else {
            setProjectToDelete(p);
            setIsDeleteModalOpen(true);
          }
        }}
        canDelete={isSuperAdmin || isManager}
      />

      {/* Project Detail Hub Modal */}
      <ProjectDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setProjectForDetail(null);
        }}
        project={projectForDetail}
        onEdit={(p) => {
          if (openEditModal) openEditModal(p);
          else {
            setProjectToEdit(p);
            setIsEditModalOpen(true);
          }
        }}
        onOpenTaskModal={handleOpenTaskForProject}
        onOpenIssueModal={handleOpenIssueForProject}
        onOpenRiskModal={handleOpenRiskForProject}
        onOpenTimesheetModal={handleOpenTimesheetForProject}
        onDelete={(p) => {
          if (openDeleteModal) openDeleteModal(p);
          else {
            setProjectToDelete(p);
            setIsDeleteModalOpen(true);
          }
        }}
      />

      {/* SEPARATE IMPORT MODAL */}
      <ProjectImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />

      {/* SEPARATE EXPORT MODAL */}
      <ProjectExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />

      {/* SUB-ENTITY MODALS */}
      <ProjectTaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setActiveTargetProject(null);
        }}
        project={activeTargetProject || projectForDetail}
      />

      <ProjectIssueModal
        isOpen={isIssueModalOpen}
        onClose={() => {
          setIsIssueModalOpen(false);
          setActiveTargetProject(null);
        }}
        project={activeTargetProject || projectForDetail}
      />

      <ProjectRiskModal
        isOpen={isRiskModalOpen}
        onClose={() => {
          setIsRiskModalOpen(false);
          setActiveTargetProject(null);
        }}
        project={activeTargetProject || projectForDetail}
      />

      <ProjectTimesheetModal
        isOpen={isTimesheetModalOpen}
        onClose={() => {
          setIsTimesheetModalOpen(false);
          setActiveTargetProject(null);
        }}
        project={activeTargetProject || projectForDetail}
      />

      {/* POP-UP REPORTS & PORTFOLIO MIS MODAL */}
      <ProjectReportsModal
        isOpen={isReportsModalOpen}
        onClose={() => setIsReportsModalOpen(false)}
        initialTab={reportsModalInitialTab}
        onViewProject={(p) => {
          if (openDetailModal) openDetailModal(p);
          else {
            setProjectForDetail(p);
            setIsDetailModalOpen(true);
          }
        }}
      />

      {/* POP-UP PROJECT DIRECTORY MODAL */}
      <ProjectDirectoryModal
        isOpen={isDirectoryModalOpen}
        onClose={() => setIsDirectoryModalOpen(false)}
        onViewProject={(p) => {
          if (openDetailModal) openDetailModal(p);
          else {
            setProjectForDetail(p);
            setIsDetailModalOpen(true);
          }
        }}
        onEditProject={(p) => {
          if (openEditModal) openEditModal(p);
          else {
            setProjectToEdit(p);
            setIsEditModalOpen(true);
          }
        }}
        onOpenMilestones={(p) => {
          if (openMilestonesModal) openMilestonesModal(p);
          else {
            setProjectForMilestones(p);
            setIsMilestonesModalOpen(true);
          }
        }}
        onDeleteProject={(p) => {
          if (openDeleteModal) openDeleteModal(p);
          else {
            setProjectToDelete(p);
            setIsDeleteModalOpen(true);
          }
        }}
        canDelete={isSuperAdmin || isManager}
        onOpenTaskModal={handleOpenTaskForProject}
        onOpenImport={() => {
          if (openImportModal) openImportModal();
          else setIsImportModalOpen(true);
        }}
        onOpenExport={() => {
          if (openExportModal) openExportModal();
          else setIsExportModalOpen(true);
        }}
      />
    </div>
  );
};

export default ProjectSection;
