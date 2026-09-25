import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useOpportunities } from '../../context/OpportunityContext';
import { MetricCard } from '../ManagerDashboard/MetricCard';
import { OpportunityModal } from './OpportunityModal';
import { DeleteOpportunityModal } from './DeleteOpportunityModal';
import { OpportunityMetricDetailDialog } from './OpportunityMetricDetailDialog';
import {
  TrendingUp,
  Plus,
  DollarSign,
  CheckCircle2,
  Layers,
  Crown,
  ShieldCheck,
  Briefcase,
} from 'lucide-react';

export const OpportunitySection = () => {
  const { user } = useAuth();
  const isSuperAdmin = user && user.role === 'Super Admin';
  const isManager = user && ['Manager', 'Executive', 'Administrator'].includes(user.role);

  const {
    opportunities,
    stats,
    openCreateModal,
    openEditModal,
    openDeleteModal,
  } = useOpportunities();

  // Active Metric Popup Dialog: 'pipeline' | 'won' | 'win_rate' | 'negotiation' | null
  const [activeMetricDialog, setActiveMetricDialog] = useState(null);

  const formatAmount = (num) => {
    if (!num && num !== 0) return '₹0';
    return `₹${Number(num).toLocaleString('en-IN')}`;
  };

  return (
    <div className="opportunity-management-page">
      {/* Modals */}
      <OpportunityModal />
      <DeleteOpportunityModal />

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
              Opportunities
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

