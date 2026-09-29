import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useOpportunities, STAGES } from '../../context/OpportunityContext';
import { MetricCard } from '../ManagerDashboard/MetricCard';
import { OpportunityMetricDetailDialog } from './OpportunityMetricDetailDialog';
import { OpportunityKanban } from './OpportunityKanban';
import { OpportunityTable } from './OpportunityTable';
import { LostReasonModal } from './LostReasonModal';
import {
  TrendingUp,
  Plus,
  DollarSign,
  CheckCircle2,
  Layers,
  Crown,
  ShieldCheck,
  Briefcase,
  LayoutGrid,
  Table as TableIcon,
  Search,
} from 'lucide-react';

export const OpportunitySection = () => {
  const { user } = useAuth();
  const isSuperAdmin = user && user.role === 'Super Admin';
  const isManager = user && ['Manager', 'Executive', 'Administrator'].includes(user.role);

  const {
    opportunities,
    stats,
    search,
    setSearch,
    stageFilter,
    setStageFilter,
    priorityFilter,
    setPriorityFilter,
    openCreateModal,
    openEditModal,
    openDeleteModal,
  } = useOpportunities();

  // Active Metric Popup Dialog: 'pipeline' | 'won' | 'win_rate' | 'negotiation' | null
  const [activeMetricDialog, setActiveMetricDialog] = useState(null);

  // View Mode: 'kanban' | 'table'
  const [viewMode, setViewMode] = useState('kanban');

  const formatAmount = (num) => {
    if (!num && num !== 0) return '₹0';
    return `₹${Number(num).toLocaleString('en-IN')}`;
  };

  return (
    <div className="opportunity-management-page" style={{ paddingBottom: '32px' }}>
      {/* Header Section */}
      <div
        className="section-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px',
          marginBottom: '20px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <TrendingUp className="text-primary" size={24} color="#059669" />
            <h2 className="section-title" style={{ margin: 0, fontSize: '1.4rem' }}>
              Opportunities & Deal Pipeline
            </h2>
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
                ? 'Full Organization Access'
                : isManager
                  ? 'Manager & Subordinates Scope'
                  : 'Personal & Subordinates Scope'}
            </span>
          </div>
          <p className="section-subtitle" style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            {isSuperAdmin
              ? 'Overall enterprise visibility: Track pipeline stages, deals, and won revenue across the entire organization.'
              : isManager
                ? 'Manage pipeline stages and revenue opportunities for yourself and your subordinate team.'
                : 'Track and update deal stages for yourself and your team subordinates.'}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            className="btn btn-primary"
            onClick={openCreateModal}
            id="btn-add-opportunity"
            style={{
              background: 'linear-gradient(135deg, #059669, #10b981)',
              borderColor: '#059669',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Plus size={16} />
            <span>Add Deal</span>
          </button>
        </div>
      </div>

      {/* 4 Curved Interactive Metric Cards Grid (Clicking opens dedicated popup dialog) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px',
          marginBottom: '20px',
        }}
      >
        <MetricCard
          title="Pipeline Value"
          value={formatAmount(stats?.totalPipelineValue)}
          subtitle={`${stats?.totalDeals ?? opportunities.length} Active Deals (Click for details)`}
          icon={Layers}
          color="#2563eb"
          bgLight="#eff6ff"
          isClickable={true}
          onClick={() => setActiveMetricDialog('pipeline')}
        />

        <MetricCard
          title="Won Revenue"
          value={formatAmount(stats?.wonValue)}
          subtitle={`${stats?.stageBreakdown?.Won?.count ?? opportunities.filter((o) => o.stage === 'Won').length} Deals Closed (Click for details)`}
          icon={CheckCircle2}
          color="#059669"
          bgLight="#ecfdf5"
          isClickable={true}
          onClick={() => setActiveMetricDialog('won')}
        />

        <MetricCard
          title="Win Rate Ratio"
          value={`${stats?.winRate ?? 0}%`}
          subtitle="Closed Won Ratio (Click for details)"
          icon={DollarSign}
          color="#7c3aed"
          bgLight="#f5f3ff"
          isClickable={true}
          onClick={() => setActiveMetricDialog('win_rate')}
        />

        <MetricCard
          title="In Negotiation"
          value={formatAmount(stats?.stageBreakdown?.Negotiation?.value)}
          subtitle={`${stats?.stageBreakdown?.Negotiation?.count ?? 0} High Probability Deals (Click for details)`}
          icon={TrendingUp}
          color="#d97706"
          bgLight="#fffbeb"
          isClickable={true}
          onClick={() => setActiveMetricDialog('negotiation')}
        />
      </div>

      {/* View Switcher & Filter Controls */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          background: '#ffffff',
          padding: '12px 16px',
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
          marginBottom: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', flex: 1 }}>
          <input
            type="text"
            placeholder="Search deals by name, company, contact..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              minWidth: '220px',
              flex: 1,
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '0.84rem',
              outline: 'none',
            }}
          />

          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '0.84rem',
              background: '#ffffff',
              outline: 'none',
            }}
          >
            <option value="all">All Stages</option>
            {STAGES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '0.84rem',
              background: '#ffffff',
              outline: 'none',
            }}
          >
            <option value="all">All Priorities</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>

        {/* View Mode Toggle Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#f1f5f9', padding: '4px', borderRadius: '10px' }}>
          <button
            type="button"
            onClick={() => setViewMode('kanban')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 12px',
              borderRadius: '8px',
              border: 'none',
              background: viewMode === 'kanban' ? '#ffffff' : 'transparent',
              color: viewMode === 'kanban' ? '#059669' : '#64748b',
              fontWeight: 700,
              fontSize: '0.78rem',
              cursor: 'pointer',
              boxShadow: viewMode === 'kanban' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
            }}
          >
            <LayoutGrid size={14} />
            <span>Kanban Board</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('table')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 12px',
              borderRadius: '8px',
              border: 'none',
              background: viewMode === 'table' ? '#ffffff' : 'transparent',
              color: viewMode === 'table' ? '#059669' : '#64748b',
              fontWeight: 700,
              fontSize: '0.78rem',
              cursor: 'pointer',
              boxShadow: viewMode === 'table' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
            }}
          >
            <TableIcon size={14} />
            <span>Pipeline Table</span>
          </button>
        </div>
      </div>

      {/* Render Kanban or Table */}
      {viewMode === 'kanban' ? <OpportunityKanban /> : <OpportunityTable />}

      {/* Lost Reason Dialog */}
      <LostReasonModal />

      {/* Dedicated Opportunity Metric Detail Scrollable Pop-up Dialog */}
      <OpportunityMetricDetailDialog
        open={!!activeMetricDialog}
        onClose={() => setActiveMetricDialog(null)}
        metricType={activeMetricDialog || 'pipeline'}
        onEditOpportunity={(opp) => {
          setActiveMetricDialog(null);
          openEditModal(opp);
        }}
        onDeleteOpportunity={(opp) => {
          setActiveMetricDialog(null);
          openDeleteModal(opp);
        }}
        onCreateOpportunity={() => {
          setActiveMetricDialog(null);
          openCreateModal();
        }}
      />
    </div>
  );
};

export default OpportunitySection;
