import React, { useState } from 'react';
import { useLeads } from '../../context/LeadContext';
import { MetricCard } from '../ManagerDashboard/MetricCard';
import { LeadModal } from './LeadModal';
import { ConvertLeadModal } from './ConvertLeadModal';
import { DeleteLeadModal } from './DeleteLeadModal';
import { LeadMetricDetailDialog } from './LeadMetricDetailDialog';
import { useAuth } from '../../context/AuthContext';
import {
  Target,
  Plus,
  TrendingUp,
  CheckCircle2,
  Clock,
  Crown,
  ShieldCheck,
  Briefcase,
} from 'lucide-react';

export const LeadSection = () => {
  const { user } = useAuth();
  const isSuperAdmin = user && user.role === 'Super Admin';
  const isManager = user && ['Manager', 'Executive', 'Administrator'].includes(user.role);

  const {
    leads,
    stats,
    openCreateModal,
    openEditModal,
    openConvertModal,
    openDeleteModal,
  } = useLeads();

  // Active Metric Popup Dialog: 'total' | 'qualified' | 'contacted' | 'converted' | null
  const [activeMetricDialog, setActiveMetricDialog] = useState(null);

  return (
    <div className="lead-management-page" style={{ paddingBottom: '32px' }}>
      {/* Modals */}
      <LeadModal />
      <ConvertLeadModal />
      <DeleteLeadModal />

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
            <Target className="text-primary" size={24} color="#2563eb" />
            <h2 className="section-title" style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>
              Leads Management
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
              ? 'Overall enterprise visibility: View, manage, and assign leads across the entire organization.'
              : isManager
                ? 'Review, qualify, and manage leads for yourself and your subordinate team.'
                : 'Create and track leads for yourself and your team subordinates.'}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            className="btn btn-primary"
            onClick={openCreateModal}
            id="btn-add-lead"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={16} />
            <span>Add Lead</span>
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
          title="Total Leads"
          value={stats?.total ?? leads.length}
          subtitle="All registered prospects (Click for details)"
          icon={Target}
          color="#2563eb"
          bgLight="#eff6ff"
          isClickable={true}
          onClick={() => setActiveMetricDialog('total')}
        />

        <MetricCard
          title="Qualified Leads"
          value={stats?.qualified ?? leads.filter((l) => l.status === 'Qualified').length}
          subtitle="Ready for deal conversion (Click for details)"
          icon={CheckCircle2}
          color="#059669"
          bgLight="#ecfdf5"
          isClickable={true}
          onClick={() => setActiveMetricDialog('qualified')}
        />

        <MetricCard
          title="In Contact"
          value={stats?.contacted ?? leads.filter((l) => l.status === 'Contacted').length}
          subtitle="Active sales discussions (Click for details)"
          icon={Clock}
          color="#d97706"
          bgLight="#fffbeb"
          isClickable={true}
          onClick={() => setActiveMetricDialog('contacted')}
        />

        <MetricCard
          title="Converted Deals"
          value={stats?.converted ?? leads.filter((l) => l.status === 'Converted').length}
          subtitle={`${stats?.conversionRate ?? 0}% Win Rate (Click for details)`}
          icon={TrendingUp}
          color="#7c3aed"
          bgLight="#f5f3ff"
          isClickable={true}
          onClick={() => setActiveMetricDialog('converted')}
        />
      </div>

      {/* Dedicated Lead Metric Detail Scrollable Pop-up Dialog */}
      <LeadMetricDetailDialog
        open={!!activeMetricDialog}
        onClose={() => setActiveMetricDialog(null)}
        metricType={activeMetricDialog || 'total'}
        onEditLead={(lead) => {
          setActiveMetricDialog(null);
          openEditModal(lead);
        }}
        onConvertLead={(lead) => {
          setActiveMetricDialog(null);
          openConvertModal(lead);
        }}
        onDeleteLead={(lead) => {
          setActiveMetricDialog(null);
          openDeleteModal(lead);
        }}
        onCreateLead={() => {
          setActiveMetricDialog(null);
          openCreateModal();
        }}
      />
    </div>
  );
};

