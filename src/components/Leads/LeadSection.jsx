import React, { useState, useMemo } from 'react';
import { useLeads } from '../../context/LeadContext';
import { useOpportunities } from '../../context/OpportunityContext';
import { LeadMetricDetailDialog } from './LeadMetricDetailDialog';
import { MISReportsModal } from './MISReportsModal';
import { EnhancedLeadTable } from './EnhancedLeadTable';
import { OpportunityTable } from '../Opportunities/OpportunityTable';
import { LostReasonModal } from '../Opportunities/LostReasonModal';
import { LeadDetailModal } from './LeadDetailModal';
import { AddCallLogModal } from './AddCallLogModal';
import { ScheduleFollowUpModal } from './ScheduleFollowUpModal';
import { QualifyLeadModal } from './QualifyLeadModal';
import { DispositionModal } from './DispositionModal';
import { AuditTrailModal } from './AuditTrailModal';
import { LeadImportModal } from './LeadImportModal';
import { LeadExportModal } from './LeadExportModal';
import {
  Target,
  Plus,
  TrendingUp,
  FileSpreadsheet,
  PhoneOutgoing,
  Sparkles,
  ArrowUpRight,
  CheckCheck,
  Upload,
  Download,
  Table as TableIcon,
  Briefcase,
  AlertTriangle,
  Flame,
} from 'lucide-react';

export const LeadSection = () => {
  const {
    leads,
    stats,
    openCreateModal,
    openEditModal,
    openConvertModal,
    openDeleteModal,
    isImportModalOpen,
    openImportModal,
    closeImportModal,
    isExportModalOpen,
    openExportModal,
    closeExportModal,
  } = useLeads();

  const {
    opportunities,
    openCreateModal: openCreateOpportunityModal,
  } = useOpportunities();

  // Active Metric Popup Dialog: 'total' | 'qualified' | 'calls' | 'converted' | null
  const [activeMetricDialog, setActiveMetricDialog] = useState(null);

  // Active On-Page Workspace Tab: 'table' | 'opportunities'
  const [workspaceTab, setWorkspaceTab] = useState('table');

  // MIS Reports Modal
  const [isMISModalOpen, setIsMISModalOpen] = useState(false);

  // Hover state for KPI cards
  const [hoveredCard, setHoveredCard] = useState(null);

  // Dynamic real-time metrics computed from live leads & opportunities
  const metrics = useMemo(() => {
    const safeLeads = Array.isArray(leads) ? leads : [];
    const safeOpps = Array.isArray(opportunities) ? opportunities : [];

    const totalLeadsCount = safeLeads.length;
    const activeLeadsCount = safeLeads.filter(
      (l) => !['Converted', 'Not Interested', 'Invalid', 'Lost'].includes(l.status)
    ).length;
    const qualifiedCount = safeLeads.filter((l) => l.status === 'Qualified').length;
    const hotCount = safeLeads.filter(
      (l) => (l.leadTemperature === 'Hot' || (l.leadScore || 0) >= 70) && l.status !== 'Converted'
    ).length;
    const convertedCount = safeLeads.filter((l) => l.status === 'Converted').length;
    const conversionRate =
      totalLeadsCount > 0 ? Math.round((convertedCount / totalLeadsCount) * 100) : 0;

    // Call logs aggregation
    const allCallLogs = safeLeads.flatMap((l) => (Array.isArray(l.callLogs) ? l.callLogs : []));
    const totalCalls = allCallLogs.length;
    const connectedCalls = allCallLogs.filter((c) => c.callStatus === 'Connected Successfully').length;

    // Overdue & Due Today follow-ups
    const todayStr = new Date().toISOString().split('T')[0];
    let overdueCount = 0;
    let dueTodayCount = 0;
    safeLeads.forEach((l) => {
      if (['Converted', 'Not Interested', 'Invalid', 'Lost'].includes(l.status)) return;
      const fDateRaw = l.nextFollowUpDate || l.next_followup_at;
      if (fDateRaw) {
        try {
          const dStr = new Date(fDateRaw).toISOString().split('T')[0];
          if (dStr < todayStr) overdueCount += 1;
          else if (dStr === todayStr) dueTodayCount += 1;
        } catch { }
      } else if ((l.sla_tier || 0) > 0) {
        overdueCount += 1;
      }
    });

    // Pipeline value across active opportunities + unconverted leads
    const oppPipelineValue = safeOpps
      .filter((o) => o.stage !== 'Lost' && o.stage !== 'Closed Lost')
      .reduce((sum, o) => sum + (Number(o.amount) || 0), 0);
    const leadPipelineValue = safeLeads
      .filter((l) => !['Converted', 'Not Interested', 'Invalid', 'Lost'].includes(l.status))
      .reduce((sum, l) => sum + (Number(l.estimatedValue || l.dealValue || l.pipeline_value) || 0), 0);

    return {
      totalLeadsCount,
      activeLeadsCount,
      qualifiedCount,
      hotCount,
      convertedCount,
      conversionRate,
      totalCalls,
      connectedCalls,
      overdueCount,
      dueTodayCount,
      totalPipelineValue: oppPipelineValue + leadPipelineValue,
      opportunitiesCount: safeOpps.length,
    };
  }, [leads, opportunities, stats]);

  const formatINR = (val) => {
    const num = Number(val) || 0;
    if (num >= 10000000) return `₹${(num / 10000000).toFixed(1)}Cr`;
    if (num >= 100000) return `₹${(num / 100000).toFixed(1)}L`;
    return `₹${num.toLocaleString('en-IN')}`;
  };

  return (
    <div className="lead-management-page" style={{ paddingBottom: '28px' }}>
      {/* 1. Compact Header & Quick Actions Toolbar */}
      <div
        className="section-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '18px',
        }}
      >
        <div style={{ flex: '1 1 360px', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '4px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '11px',
                backgroundColor: '#eff6ff',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #bfdbfe',
                flexShrink: 0,
              }}
            >
              <Target size={20} />
            </div>

            <h1
              className="section-title"
              style={{
                margin: 0,
                fontSize: '1.38rem',
                fontWeight: 800,
                color: '#0f172a',
                letterSpacing: '-0.02em',
              }}
            >
              Lead Management & Sales Pipeline
            </h1>
          </div>

          <p
            className="section-subtitle"
            style={{
              margin: 0,
              color: '#64748b',
              fontSize: '0.83rem',
              lineHeight: 1.4,
            }}
          >
            Track prospects, log calls, manage follow-ups, and convert qualified leads into revenue opportunities.
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setIsMISModalOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 15px',
              borderRadius: '999px',
              fontWeight: 700,
              fontSize: '0.8rem',
              backgroundColor: '#f0f9ff',
              color: '#0284c7',
              border: '1px solid #bae6fd',
              cursor: 'pointer',
            }}
          >
            <FileSpreadsheet size={15} />
            <span>MIS Reports</span>
          </button>

          <button
            type="button"
            onClick={openImportModal}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '8px 14px',
              borderRadius: '999px',
              fontWeight: 700,
              fontSize: '0.8rem',
              backgroundColor: '#ffffff',
              color: '#334155',
              border: '1px solid #cbd5e1',
              cursor: 'pointer',
            }}
          >
            <Upload size={14} />
            <span>Import</span>
          </button>

          <button
            type="button"
            onClick={openExportModal}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '8px 14px',
              borderRadius: '999px',
              fontWeight: 700,
              fontSize: '0.8rem',
              backgroundColor: '#ffffff',
              color: '#334155',
              border: '1px solid #cbd5e1',
              cursor: 'pointer',
            }}
          >
            <Download size={14} />
            <span>Export</span>
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={openCreateModal}
            id="btn-add-lead-top"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '7px',
              padding: '8px 18px',
              borderRadius: '999px',
              fontWeight: 700,
              fontSize: '0.84rem',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
            }}
          >
            <Plus size={16} />
            <span>Create Lead</span>
          </button>
        </div>
      </div>

      {/* 2. Compact 4-Card Sales KPI Strip */}
      <div
        className="stats-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 210px), 1fr))',
          gap: '12px',
          marginBottom: '18px',
        }}
      >
        {/* KPI 1: Total Leads */}
        <div
          onClick={() => setActiveMetricDialog('total')}
          onMouseEnter={() => setHoveredCard('total')}
          onMouseLeave={() => setHoveredCard(null)}
          style={{
            backgroundColor: '#ffffff',
            border: `1.5px solid ${hoveredCard === 'total' ? '#2563eb' : '#e2e8f0'}`,
            borderRadius: '14px',
            padding: '14px 16px',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: hoveredCard === 'total' ? '0 8px 20px -4px rgba(37, 99, 235, 0.14)' : '0 1px 4px rgba(0,0,0,0.03)',
            transform: hoveredCard === 'total' ? 'translateY(-2px)' : 'translateY(0)',
            transition: 'all 0.2s ease',
            userSelect: 'none',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
              <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #bfdbfe', flexShrink: 0 }}>
                <Target size={15} />
              </div>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748b', whiteSpace: 'nowrap' }}>
                Total Leads
              </span>
            </div>
            <span style={{ fontSize: '0.67rem', fontWeight: 700, color: '#2563eb', background: '#eff6ff', padding: '2px 7px', borderRadius: '999px', display: 'inline-flex', alignItems: 'center', gap: '2px', whiteSpace: 'nowrap', flexShrink: 0 }}>
              <span>View</span>
              <ArrowUpRight size={11} />
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>
              {metrics.totalLeadsCount}
            </span>
            <span style={{ fontSize: '0.73rem', fontWeight: 600, color: '#64748b' }}>
              {metrics.activeLeadsCount} active in funnel
            </span>
          </div>
        </div>

        {/* KPI 2: Qualified & Hot Leads */}
        <div
          onClick={() => setActiveMetricDialog('qualified')}
          onMouseEnter={() => setHoveredCard('qualified')}
          onMouseLeave={() => setHoveredCard(null)}
          style={{
            backgroundColor: '#ffffff',
            border: `1.5px solid ${hoveredCard === 'qualified' ? '#059669' : '#e2e8f0'}`,
            borderRadius: '14px',
            padding: '14px 16px',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: hoveredCard === 'qualified' ? '0 8px 20px -4px rgba(5, 150, 105, 0.14)' : '0 1px 4px rgba(0,0,0,0.03)',
            transform: hoveredCard === 'qualified' ? 'translateY(-2px)' : 'translateY(0)',
            transition: 'all 0.2s ease',
            userSelect: 'none',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
              <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #a7f3d0', flexShrink: 0 }}>
                <Sparkles size={15} />
              </div>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748b', whiteSpace: 'nowrap' }}>
                Qualified & Hot
              </span>
            </div>
            {metrics.hotCount > 0 ? (
              <span style={{ fontSize: '0.67rem', fontWeight: 700, color: '#ea580c', background: '#fff7ed', border: '1px solid #fed7aa', padding: '2px 7px', borderRadius: '999px', display: 'inline-flex', alignItems: 'center', gap: '3px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                <Flame size={10} />
                <span>{metrics.hotCount} Hot</span>
              </span>
            ) : (
              <span style={{ fontSize: '0.67rem', fontWeight: 700, color: '#059669', background: '#ecfdf5', padding: '2px 7px', borderRadius: '999px', display: 'inline-flex', alignItems: 'center', gap: '2px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                <span>Ready</span>
                <ArrowUpRight size={11} />
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>
              {metrics.qualifiedCount}
            </span>
            <span style={{ fontSize: '0.73rem', fontWeight: 600, color: '#64748b' }}>
              ready for deal conversion
            </span>
          </div>
        </div>

        {/* KPI 3: Follow-Ups & Call Activity */}
        <div
          onClick={() => setActiveMetricDialog('calls')}
          onMouseEnter={() => setHoveredCard('calls')}
          onMouseLeave={() => setHoveredCard(null)}
          style={{
            backgroundColor: '#ffffff',
            border: `1.5px solid ${hoveredCard === 'calls' ? '#d97706' : metrics.overdueCount > 0 ? '#fecaca' : '#e2e8f0'}`,
            borderRadius: '14px',
            padding: '14px 16px',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: hoveredCard === 'calls' ? '0 8px 20px -4px rgba(217, 119, 6, 0.14)' : '0 1px 4px rgba(0,0,0,0.03)',
            transform: hoveredCard === 'calls' ? 'translateY(-2px)' : 'translateY(0)',
            transition: 'all 0.2s ease',
            userSelect: 'none',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
              <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#fffbeb', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #fde68a', flexShrink: 0 }}>
                <PhoneOutgoing size={15} />
              </div>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748b', whiteSpace: 'nowrap' }}>
                Calls Logged
              </span>
            </div>
            {metrics.overdueCount > 0 ? (
              <span style={{ fontSize: '0.67rem', fontWeight: 700, color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', padding: '2px 7px', borderRadius: '999px', display: 'inline-flex', alignItems: 'center', gap: '3px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                <AlertTriangle size={10} />
                <span>{metrics.overdueCount} Overdue</span>
              </span>
            ) : (
              <span style={{ fontSize: '0.67rem', fontWeight: 700, color: '#d97706', background: '#fffbeb', padding: '2px 7px', borderRadius: '999px', display: 'inline-flex', alignItems: 'center', gap: '2px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                <span>Logs</span>
                <ArrowUpRight size={11} />
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>
              {metrics.totalCalls}
            </span>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#059669', background: '#ecfdf5', padding: '2px 6px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
              <CheckCheck size={11} /> {metrics.connectedCalls} Connected
            </span>
            {metrics.dueTodayCount > 0 && (
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#b45309', background: '#fffbeb', padding: '2px 6px', borderRadius: '6px' }}>
                {metrics.dueTodayCount} Due Today
              </span>
            )}
          </div>
        </div>

        {/* KPI 4: Converted & Pipeline Revenue */}
        <div
          onClick={() => setActiveMetricDialog('converted')}
          onMouseEnter={() => setHoveredCard('converted')}
          onMouseLeave={() => setHoveredCard(null)}
          style={{
            backgroundColor: '#ffffff',
            border: `1.5px solid ${hoveredCard === 'converted' ? '#7c3aed' : '#e2e8f0'}`,
            borderRadius: '14px',
            padding: '14px 16px',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: hoveredCard === 'converted' ? '0 8px 20px -4px rgba(124, 58, 237, 0.14)' : '0 1px 4px rgba(0,0,0,0.03)',
            transform: hoveredCard === 'converted' ? 'translateY(-2px)' : 'translateY(0)',
            transition: 'all 0.2s ease',
            userSelect: 'none',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
              <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#f5f3ff', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #ddd6fe', flexShrink: 0 }}>
                <TrendingUp size={15} />
              </div>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748b', whiteSpace: 'nowrap' }}>
                Converted
              </span>
            </div>
            <span style={{ fontSize: '0.67rem', fontWeight: 700, color: '#6d28d9', background: '#ede9fe', padding: '2px 8px', borderRadius: '999px', whiteSpace: 'nowrap', flexShrink: 0 }}>
              {metrics.conversionRate}% Rate
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>
              {metrics.convertedCount}
            </span>
            <span style={{ fontSize: '0.73rem', fontWeight: 700, color: '#059669' }}>
              Pipeline: {formatINR(metrics.totalPipelineValue)}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Direct On-Page CRM Workspace (Zero Modal-Inside-Modal Friction) */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
          overflow: 'hidden',
        }}
      >
        {/* Workspace Navigation Tabs Bar */}
        <div
          style={{
            padding: '10px 14px',
            borderBottom: '1px solid #e2e8f0',
            background: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: '#e2e8f0',
              padding: '3px',
              borderRadius: '10px',
              flexWrap: 'wrap',
            }}
          >
            <button
              type="button"
              onClick={() => setWorkspaceTab('table')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '8px',
                border: 'none',
                background: workspaceTab === 'table' ? '#ffffff' : 'transparent',
                color: workspaceTab === 'table' ? '#2563eb' : '#475569',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer',
                boxShadow: workspaceTab === 'table' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              <TableIcon size={14} />
              <span>Leads</span>
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  padding: '1px 6px',
                  borderRadius: '999px',
                  background: workspaceTab === 'table' ? '#dbeafe' : '#cbd5e1',
                  color: workspaceTab === 'table' ? '#1d4ed8' : '#334155',
                }}
              >
                {metrics.totalLeadsCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setWorkspaceTab('opportunities')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '8px',
                border: 'none',
                background: workspaceTab === 'opportunities' ? '#ffffff' : 'transparent',
                color: workspaceTab === 'opportunities' ? '#7c3aed' : '#475569',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer',
                boxShadow: workspaceTab === 'opportunities' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              <Briefcase size={14} />
              <span>Opportunities</span>
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  padding: '1px 6px',
                  borderRadius: '999px',
                  background: workspaceTab === 'opportunities' ? '#ede9fe' : '#cbd5e1',
                  color: workspaceTab === 'opportunities' ? '#6d28d9' : '#334155',
                }}
              >
                {metrics.opportunitiesCount}
              </span>
            </button>
          </div>

          {/* New Deal Button when viewing Opportunities tab */}
          {workspaceTab === 'opportunities' && (
            <button
              type="button"
              onClick={openCreateOpportunityModal}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 12px',
                borderRadius: '8px',
                border: 'none',
                background: '#7c3aed',
                color: '#ffffff',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <Plus size={14} />
              <span>New Deal</span>
            </button>
          )}
        </div>

        {/* Workspace Active Content */}
        <div style={{ padding: 0 }}>
          {workspaceTab === 'table' && <EnhancedLeadTable />}
          {workspaceTab === 'opportunities' && <OpportunityTable />}
        </div>
      </div>

      {/* Pop-up Dialog 1: Lead Metric Detail Dialog (Total / Qualified / Calls / Converted) */}
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
      />

      {/* Pop-up Dialog 2: MIS Reports & Analytics Modal */}
      <MISReportsModal
        isOpen={isMISModalOpen}
        onClose={() => setIsMISModalOpen(false)}
      />

      {/* Core CRM Action Modals (Single Clean Mount) */}
      <LeadDetailModal />
      <AddCallLogModal />
      <ScheduleFollowUpModal />
      <QualifyLeadModal />
      <DispositionModal />
      <AuditTrailModal />
      <LostReasonModal />
      <LeadImportModal isOpen={isImportModalOpen} onClose={closeImportModal} />
      <LeadExportModal isOpen={isExportModalOpen} onClose={closeExportModal} />
    </div>
  );
};

export default LeadSection;
