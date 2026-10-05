import React, { useState, useEffect, useMemo } from 'react';
import { useProjects } from '../../context/ProjectContext';
import { useAuth } from '../../context/AuthContext';
import {
  PieChart,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Clock,
  DollarSign,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Layers,
  Users,
  Target,
  FileText,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  HelpCircle,
  Sparkles,
} from 'lucide-react';

export const ProjectMISDashboard = ({ onViewProject }) => {
  const { misStats, fetchMISStats, fetchMisStats, loading, projects } = useProjects();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!misStats) {
      const fn = fetchMISStats || fetchMisStats;
      if (typeof fn === 'function') {
        fn().catch(() => {});
      }
    }
  }, [fetchMISStats, fetchMisStats, misStats]);

  const handleRefresh = async () => {
    setRefreshing(true);
    const fn = fetchMISStats || fetchMisStats;
    if (typeof fn === 'function') {
      await fn().catch(() => {});
    }
    setRefreshing(false);
  };

  const computedFallbackStats = useMemo(() => {
    const list = Array.isArray(projects) ? projects : [];
    const totalProjects = list.length;
    const activeProjects = list.filter((p) =>
      ['Active', 'In Progress', 'Active / In Progress', 'Planning', 'Approved'].includes(p.status)
    ).length;
    const completedProjects = list.filter((p) =>
      ['Completed', 'Closed'].includes(p.status)
    ).length;
    const onHoldProjects = list.filter((p) => p.status === 'On Hold').length;
    const cancelledProjects = list.filter((p) => p.status === 'Cancelled').length;

    const now = new Date();
    const overdueProjects = list.filter((p) => {
      const isDone = ['Completed', 'Closed'].includes(p.status);
      return !isDone && (p.targetDate || p.endDate) && new Date(p.targetDate || p.endDate) < now;
    }).length;

    const statusBreakdown = {};
    const priorityBreakdown = {};
    let totalBudget = 0;
    let totalActualCost = 0;
    let totalMilestones = 0;
    let completedMilestones = 0;
    let totalTasks = 0;
    let completedTasks = 0;
    let totalIssues = 0;
    let openIssues = 0;
    let criticalRisks = 0;
    let totalLoggedHours = 0;
    const upcomingDeadlines = [];

    list.forEach((p) => {
      const st = p.status || 'Draft';
      statusBreakdown[st] = (statusBreakdown[st] || 0) + 1;

      const prio = p.priority || 'Medium';
      priorityBreakdown[prio] = (priorityBreakdown[prio] || 0) + 1;

      totalBudget += Number(p.budget) || 0;
      totalActualCost += Number(p.actualCost) || 0;

      const miles = Array.isArray(p.milestones) ? p.milestones : [];
      totalMilestones += miles.length;
      completedMilestones += miles.filter((m) => m.status === 'Completed' || m.isCompleted).length;

      const tsks = Array.isArray(p.tasks) ? p.tasks : [];
      totalTasks += tsks.length;
      completedTasks += tsks.filter((t) => ['Done', 'Completed', 'Closed'].includes(t.status)).length;

      const isss = Array.isArray(p.issues) ? p.issues : [];
      totalIssues += isss.length;
      openIssues += isss.filter((i) => !['Closed', 'Resolved'].includes(i.status)).length;

      const rsks = Array.isArray(p.risks) ? p.risks : [];
      criticalRisks += rsks.filter((r) => r.riskLevel === 'Critical' || r.riskLevel === 'High').length;

      const tsheets = Array.isArray(p.timesheets) ? p.timesheets : [];
      totalLoggedHours += tsheets.reduce((acc, t) => acc + (Number(t.hours) || 0), 0);

      if (p.targetDate && !['Completed', 'Closed'].includes(p.status)) {
        const d = new Date(p.targetDate);
        const daysDiff = Math.ceil((d - now) / (1000 * 60 * 60 * 24));
        if (daysDiff >= -15 && daysDiff <= 45) {
          upcomingDeadlines.push(p);
        }
      }
    });

    const budgetUtilization = totalBudget > 0 ? Math.round((totalActualCost / totalBudget) * 100) : 0;

    return {
      totalProjects,
      activeProjects,
      completedProjects,
      onHoldProjects,
      cancelledProjects,
      overdueProjects,
      statusBreakdown,
      priorityBreakdown,
      totalBudget,
      totalActualCost,
      budgetUtilization,
      totalMilestones,
      completedMilestones,
      totalTasks,
      completedTasks,
      totalIssues,
      openIssues,
      criticalRisks,
      totalLoggedHours,
      upcomingDeadlines,
    };
  }, [projects]);

  const stats = useMemo(() => {
    if (!misStats) return computedFallbackStats;
    const summary = misStats.summary || (misStats.totalProjects !== undefined ? misStats : {});
    const charts = misStats.charts || {};

    return {
      totalProjects: summary.totalProjects ?? computedFallbackStats.totalProjects,
      activeProjects: summary.activeProjects ?? computedFallbackStats.activeProjects,
      completedProjects: summary.completedProjects ?? computedFallbackStats.completedProjects,
      onHoldProjects: summary.onHoldProjects ?? computedFallbackStats.onHoldProjects,
      cancelledProjects: summary.cancelledProjects ?? computedFallbackStats.cancelledProjects,
      overdueProjects: summary.overdueProjects ?? computedFallbackStats.overdueProjects,
      totalBudget: summary.totalBudget ?? computedFallbackStats.totalBudget,
      totalActualCost: summary.totalActualCost ?? computedFallbackStats.totalActualCost,
      budgetUtilization: summary.budgetUtilization ?? computedFallbackStats.budgetUtilization,
      totalMilestones: summary.milestonesTotal ?? summary.totalMilestones ?? computedFallbackStats.totalMilestones,
      completedMilestones: summary.milestonesCompleted ?? summary.completedMilestones ?? computedFallbackStats.completedMilestones,
      totalTasks: summary.tasksTotal ?? summary.totalTasks ?? computedFallbackStats.totalTasks,
      completedTasks: summary.tasksCompleted ?? summary.completedTasks ?? computedFallbackStats.completedTasks,
      totalIssues: summary.totalIssuesCount ?? summary.totalIssues ?? computedFallbackStats.totalIssues,
      openIssues: summary.openIssuesCount ?? summary.openIssues ?? computedFallbackStats.openIssues,
      criticalRisks: summary.criticalRisks ?? computedFallbackStats.criticalRisks,
      totalLoggedHours: summary.totalActualHours ?? summary.totalLoggedHours ?? computedFallbackStats.totalLoggedHours,
      statusBreakdown: charts.byStatus || summary.statusBreakdown || computedFallbackStats.statusBreakdown,
      priorityBreakdown: charts.byPriority || summary.priorityBreakdown || computedFallbackStats.priorityBreakdown,
      upcomingDeadlines: computedFallbackStats.upcomingDeadlines || [],
    };
  }, [misStats, computedFallbackStats]);

  const statusColors = {
    Draft: '#64748b',
    Planning: '#3b82f6',
    Approved: '#6366f1',
    'Active / In Progress': '#10b981',
    Active: '#10b981',
    'In Progress': '#10b981',
    'On Hold': '#f59e0b',
    Completed: '#059669',
    Closed: '#7c3aed',
    Cancelled: '#ef4444',
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #0f172a 100%)',
          borderRadius: '24px',
          padding: '28px 32px',
          color: '#ffffff',
          boxShadow: '0 10px 25px -5px rgba(30, 27, 75, 0.4)',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '20px',
        }}
      >
        <div style={{ position: 'relative', zIndex: 10, maxWidth: '650px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: '#a5b4fc',
              fontSize: '11px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: '8px',
            }}
          >
            <Sparkles size={14} />
            <span>Project Intelligence & Portfolio MIS</span>
          </div>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 800, letterSpacing: '-0.02em', color: '#ffffff' }}>
            Executive Analytics & Performance
          </h2>
          <p style={{ margin: '6px 0 0 0', fontSize: '13px', color: 'rgba(224, 231, 255, 0.8)', lineHeight: 1.5 }}>
            Hierarchy-scoped real-time intelligence on delivery timelines, milestone velocity, resource capacity, and financial budget variances.
          </p>
        </div>
      </div>

      {/* Top 6 KPI Counter Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '14px',
        }}
      >
        {/* Total Projects */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '16px 18px',
            border: '1.5px solid #e2e8f0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#64748b' }}>
              Total
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#eef2ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Layers size={16} />
            </div>
          </div>
          <p style={{ margin: '8px 0 2px 0', fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>
            {stats.totalProjects}
          </p>
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>Portfolio Scope</span>
        </div>

        {/* Active Projects */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '16px 18px',
            border: '1.5px solid #e2e8f0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#64748b' }}>
              Active
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={16} />
            </div>
          </div>
          <p style={{ margin: '8px 0 2px 0', fontSize: '24px', fontWeight: 800, color: '#059669' }}>
            {stats.activeProjects}
          </p>
          <span style={{ fontSize: '11px', color: '#10b981' }}>In Delivery</span>
        </div>

        {/* Completed */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '16px 18px',
            border: '1.5px solid #e2e8f0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#64748b' }}>
              Completed
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#f0fdf4', color: '#047857', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={16} />
            </div>
          </div>
          <p style={{ margin: '8px 0 2px 0', fontSize: '24px', fontWeight: 800, color: '#047857' }}>
            {stats.completedProjects}
          </p>
          <span style={{ fontSize: '11px', color: '#059669' }}>Delivered & Closed</span>
        </div>

        {/* On Hold */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '16px 18px',
            border: '1.5px solid #e2e8f0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#64748b' }}>
              On Hold
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#fffbeb', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertCircle size={16} />
            </div>
          </div>
          <p style={{ margin: '8px 0 2px 0', fontSize: '24px', fontWeight: 800, color: '#d97706' }}>
            {stats.onHoldProjects}
          </p>
          <span style={{ fontSize: '11px', color: '#f59e0b' }}>Paused</span>
        </div>

        {/* Overdue */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '16px 18px',
            border: '1.5px solid #e2e8f0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#64748b' }}>
              Overdue
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#fef2f2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={16} />
            </div>
          </div>
          <p style={{ margin: '8px 0 2px 0', fontSize: '24px', fontWeight: 800, color: '#dc2626' }}>
            {stats.overdueProjects}
          </p>
          <span style={{ fontSize: '11px', color: '#ef4444' }}>Past Target Date</span>
        </div>

        {/* Cancelled */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '16px 18px',
            border: '1.5px solid #e2e8f0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#64748b' }}>
              Cancelled
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#f1f5f9', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldAlert size={16} />
            </div>
          </div>
          <p style={{ margin: '8px 0 2px 0', fontSize: '24px', fontWeight: 800, color: '#475569' }}>
            {stats.cancelledProjects}
          </p>
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>Terminated</span>
        </div>
      </div>

      {/* Row 2: Financial & Delivery Progress Highlights */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '18px',
        }}
      >
        {/* Budget Financials Card */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '18px',
            padding: '22px 24px',
            border: '1.5px solid #e2e8f0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ padding: '8px', borderRadius: '10px', backgroundColor: '#ecfdf5', color: '#059669' }}>
                <DollarSign size={20} />
              </div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                Financial & Budget Health
              </h3>
            </div>
            <span style={{ fontSize: '12px', fontWeight: 700, padding: '3px 10px', borderRadius: '12px', backgroundColor: '#ecfdf5', color: '#059669' }}>
              {stats.budgetUtilization || 0}% Utilized
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span style={{ color: '#64748b' }}>Total Allocated Budget:</span>
              <span style={{ fontWeight: 800, color: '#0f172a' }}>
                {formatCurrency(stats.totalBudget)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span style={{ color: '#64748b' }}>Total Actual Incurred:</span>
              <span style={{ fontWeight: 800, color: '#2563eb' }}>
                {formatCurrency(stats.totalActualCost)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span style={{ color: '#64748b' }}>Remaining Margin:</span>
              <span style={{ fontWeight: 800, color: (stats.totalBudget - stats.totalActualCost) >= 0 ? '#059669' : '#dc2626' }}>
                {formatCurrency(stats.totalBudget - stats.totalActualCost)}
              </span>
            </div>

            {/* Visual utilization bar */}
            <div style={{ paddingTop: '8px' }}>
              <div style={{ width: '100%', backgroundColor: '#e2e8f0', height: '10px', borderRadius: '5px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    borderRadius: '5px',
                    backgroundColor: (stats.budgetUtilization || 0) > 100 ? '#ef4444' : (stats.budgetUtilization || 0) > 80 ? '#f59e0b' : '#10b981',
                    width: `${Math.min(stats.budgetUtilization || 0, 100)}%`,
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Milestone & Task Velocity */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '18px',
            padding: '22px 24px',
            border: '1.5px solid #e2e8f0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{ padding: '8px', borderRadius: '10px', backgroundColor: '#eff6ff', color: '#2563eb' }}>
              <Target size={20} />
            </div>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
              Milestone & Task Velocity
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Milestones */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                <span style={{ color: '#475569' }}>Milestone Completion</span>
                <span style={{ color: '#2563eb' }}>
                  {stats.completedMilestones || 0} / {stats.totalMilestones || 0} ({stats.totalMilestones ? Math.round((stats.completedMilestones / stats.totalMilestones) * 100) : 0}%)
                </span>
              </div>
              <div style={{ width: '100%', backgroundColor: '#e2e8f0', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                <div
                  style={{
                    backgroundColor: '#2563eb',
                    height: '100%',
                    borderRadius: '4px',
                    width: `${stats.totalMilestones ? Math.min((stats.completedMilestones / stats.totalMilestones) * 100, 100) : 0}%`,
                  }}
                />
              </div>
            </div>

            {/* Deliverable Tasks */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                <span style={{ color: '#475569' }}>Task Completion Rate</span>
                <span style={{ color: '#059669' }}>
                  {stats.completedTasks || 0} / {stats.totalTasks || 0} ({stats.totalTasks ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0}%)
                </span>
              </div>
              <div style={{ width: '100%', backgroundColor: '#e2e8f0', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                <div
                  style={{
                    backgroundColor: '#10b981',
                    height: '100%',
                    borderRadius: '4px',
                    width: `${stats.totalTasks ? Math.min((stats.completedTasks / stats.totalTasks) * 100, 100) : 0}%`,
                  }}
                />
              </div>
            </div>

            {/* Total Logged Hours */}
            <div style={{ paddingTop: '8px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span style={{ color: '#64748b' }}>Total Logged Timesheet Hours:</span>
              <span style={{ fontWeight: 800, color: '#0f172a' }}>
                {stats.totalLoggedHours || 0} hrs
              </span>
            </div>
          </div>
        </div>

        {/* Quality & Risk Posture */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '18px',
            padding: '22px 24px',
            border: '1.5px solid #e2e8f0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{ padding: '8px', borderRadius: '10px', backgroundColor: '#fffbeb', color: '#d97706' }}>
              <AlertCircle size={20} />
            </div>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
              Risk & Quality Posture
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
            <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: '#64748b' }}>Open Defects</span>
              <p style={{ margin: '4px 0 0 0', fontSize: '20px', fontWeight: 800, color: '#dc2626' }}>
                {stats.openIssues || 0} <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>/ {stats.totalIssues || 0}</span>
              </p>
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: '#64748b' }}>Critical Risks</span>
              <p style={{ margin: '4px 0 0 0', fontSize: '20px', fontWeight: 800, color: '#d97706' }}>
                {stats.criticalRisks || 0}
              </p>
            </div>
          </div>

          <p style={{ margin: 0, fontSize: '12px', color: '#64748b', lineHeight: 1.5 }}>
            Continuously triage open defects and maintain mitigation action plans for critical risk items to safeguard delivery schedules.
          </p>
        </div>
      </div>

      {/* Row 3: Status Breakdown & Upcoming Deadlines */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '18px',
        }}
      >
        {/* Status Distribution */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '18px',
            padding: '22px 24px',
            border: '1.5px solid #e2e8f0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
          }}
        >
          <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart3 size={18} style={{ color: '#4f46e5' }} />
            Project Status Distribution
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {Object.keys(stats.statusBreakdown || {}).length === 0 ? (
              <p style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'center', padding: '24px 0' }}>No status data available</p>
            ) : (
              Object.entries(stats.statusBreakdown).map(([statusKey, count]) => {
                const percent = stats.totalProjects ? Math.round((count / stats.totalProjects) * 100) : 0;
                const dotColor = statusColors[statusKey] || '#64748b';

                return (
                  <div key={statusKey} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', fontWeight: 700 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: dotColor }} />
                        <span style={{ color: '#334155' }}>{statusKey}</span>
                      </div>
                      <span style={{ color: '#64748b' }}>
                        {count} ({percent}%)
                      </span>
                    </div>
                    <div style={{ width: '100%', backgroundColor: '#f1f5f9', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                      <div
                        style={{
                          backgroundColor: dotColor,
                          height: '100%',
                          borderRadius: '4px',
                          width: `${percent}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Upcoming Project Milestones & Deadlines */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '18px',
            padding: '22px 24px',
            border: '1.5px solid #e2e8f0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
          }}
        >
          <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={18} style={{ color: '#dc2626' }} />
            Upcoming Project Deadlines (Next 30 Days)
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {(!stats.upcomingDeadlines || stats.upcomingDeadlines.length === 0) ? (
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <CheckCircle2 size={32} style={{ margin: '0 auto 8px auto', color: '#10b981' }} />
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                  No imminent project deadlines in the next 30 days.
                </p>
              </div>
            ) : (
              stats.upcomingDeadlines.map((p, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1, paddingRight: '12px' }}>
                    <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.name}
                    </h4>
                    <p style={{ margin: '3px 0 0 0', fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>Manager: {p.managerName || p.projectManager || (typeof p.manager === 'object' ? p.manager?.name : '') || 'Unassigned'}</span>
                      <span>•</span>
                      <span style={{ color: '#dc2626', fontWeight: 700 }}>
                        Due: {new Date(p.targetDate).toLocaleDateString()}
                      </span>
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      const fullProj = projects.find((x) => x._id === p._id);
                      if (fullProj && onViewProject) onViewProject(fullProj);
                    }}
                    style={{
                      padding: '6px',
                      color: '#4f46e5',
                      borderRadius: '8px',
                      backgroundColor: '#eef2ff',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    title="View Project"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectMISDashboard;
