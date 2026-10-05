import React, { useState } from 'react';
import { useLeads } from '../../context/LeadContext';
import { useAuth } from '../../context/AuthContext';
import { LeadMetricDetailDialog } from './LeadMetricDetailDialog';
import { LeadDirectoryModal } from './LeadDirectoryModal';
import { MISReportsModal } from './MISReportsModal';
import { LeadModal } from './LeadModal';
import { LeadDetailModal } from './LeadDetailModal';
import { AddCallLogModal } from './AddCallLogModal';
import { ScheduleFollowUpModal } from './ScheduleFollowUpModal';
import { QualifyLeadModal } from './QualifyLeadModal';
import { ConvertLeadModal } from './ConvertLeadModal';
import { DeleteLeadModal } from './DeleteLeadModal';
import { DispositionModal } from './DispositionModal';
import { AuditTrailModal } from './AuditTrailModal';
import { LeadImportModal } from './LeadImportModal';
import { LeadExportModal } from './LeadExportModal';
import {
  Target,
  Plus,
  TrendingUp,
  Layers,
  FileSpreadsheet,
  PhoneOutgoing,
  Sparkles,
  ArrowUpRight,
  BarChart3,
  PhoneCall,
  CheckCheck,
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
    isImportModalOpen,
    closeImportModal,
    isExportModalOpen,
    closeExportModal,
  } = useLeads();

  // Active Metric Popup Dialog: 'total' | 'qualified' | 'contacted' | 'converted' | null
  const [activeMetricDialog, setActiveMetricDialog] = useState(null);

  // Pop-up modals for Directory and MIS
  const [isLeadDirectoryOpen, setIsLeadDirectoryOpen] = useState(false);
  const [isMISModalOpen, setIsMISModalOpen] = useState(false);

  // Hover states for interactive cards
  const [hoveredCard, setHoveredCard] = useState(null);

  // Computed metric data calculated dynamically from the actual lead records
  const totalLeadsCount = leads.length;
  const qualifiedCount = leads.filter((l) => l.status === 'Qualified').length;
  const convertedCount = leads.filter((l) => l.status === 'Converted').length;
  const conversionRate =
    totalLeadsCount > 0 ? Math.round((convertedCount / totalLeadsCount) * 100) : 0;

  // Dynamic call activity metrics aggregated directly from actual lead call logs
  const allCallLogs = leads.flatMap((l) => (Array.isArray(l.callLogs) ? l.callLogs : []));
  const totalCalls = allCallLogs.length;
  const connectedCalls = allCallLogs.filter((c) => c.callStatus === 'Connected Successfully').length;
  const callbackCalls = allCallLogs.filter((c) => c.callStatus === 'Call Back Requested').length;

  const overdueCount =
    stats?.overdueFollowUps !== undefined
      ? stats.overdueFollowUps
      : leads.filter((l) => (l.sla_tier || 0) > 0).length;

  return (
    <div className="lead-management-page" style={{ paddingBottom: '36px' }}>
      {/* 1. Header Section */}
      <div
        className="section-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '22px',
        }}
      >
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
                flexShrink: 0,
              }}
            >
              <Target size={22} />
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
              Lead Management & Lead to Opportunity
            </h1>
          </div>

          <p
            className="section-subtitle"
            style={{
              margin: 0,
              color: '#64748b',
              fontSize: '0.86rem',
              lineHeight: 1.45,
            }}
          >
            Comprehensive Lead CRM pipeline: Track customer interactions, qualify prospects, and seamlessly convert leads into active opportunities.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            className="btn btn-primary"
            onClick={openCreateModal}
            id="btn-add-lead-top"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              borderRadius: '12px',
              fontWeight: 700,
              fontSize: '0.9rem',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.22)',
              transition: 'all 0.2s ease',
            }}
          >
            <Plus size={18} />
            <span>Add Lead</span>
          </button>
        </div>
      </div>

      {/* 2. SECTION A: Key Metrics & Pipeline Summary (4 Cards) */}
      <div style={{ marginBottom: '22px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '12px',
            gap: '8px',
          }}
        >
          <BarChart3 size={16} color="#475569" />
          <span
            style={{
              fontSize: '0.8rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: '#475569',
            }}
          >
            Pipeline Metrics & Activity
          </span>
        </div>

        <div
          className="stats-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
            gap: '16px',
          }}
        >
          {/* Metric Card 1: Total Leads */}
          <div
            onClick={() => setActiveMetricDialog('total')}
            onMouseEnter={() => setHoveredCard('total')}
            onMouseLeave={() => setHoveredCard(null)}
            style={{
              backgroundColor: '#ffffff',
              border: `1.5px solid ${hoveredCard === 'total' ? '#2563eb' : '#e2e8f0'}`,
              borderRadius: '18px',
              padding: '20px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              boxShadow:
                hoveredCard === 'total'
                  ? '0 12px 24px -4px rgba(37, 99, 235, 0.16), 0 4px 10px -2px rgba(0, 0, 0, 0.04)'
                  : '0 2px 6px rgba(0, 0, 0, 0.03)',
              transform: hoveredCard === 'total' ? 'translateY(-3px)' : 'translateY(0)',
              transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
              overflow: 'hidden',
              userSelect: 'none',
              minHeight: '135px',
            }}
            title="Click to view total leads registry"
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px', marginBottom: '10px' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    backgroundColor: '#eff6ff',
                    color: '#2563eb',
                    border: '1px solid #bfdbfe',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Target size={22} />
                </div>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: '#2563eb',
                    backgroundColor: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    padding: '3px 8px',
                    borderRadius: '999px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <span>View All</span>
                  <ArrowUpRight size={12} />
                </span>
              </div>

              <div
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  marginBottom: '4px',
                }}
              >
                Total Leads
              </div>

              <div
                style={{
                  fontSize: '1.9rem',
                  fontWeight: 800,
                  color: '#0f172a',
                  lineHeight: 1.15,
                  marginBottom: '6px',
                }}
              >
                {totalLeadsCount}
              </div>
            </div>

            <div style={{ fontSize: '0.76rem', color: '#64748b', lineHeight: 1.35 }}>
              All registered prospects in pipeline
            </div>
          </div>

          {/* Metric Card 2: Qualified Leads */}
          <div
            onClick={() => setActiveMetricDialog('qualified')}
            onMouseEnter={() => setHoveredCard('qualified')}
            onMouseLeave={() => setHoveredCard(null)}
            style={{
              backgroundColor: '#ffffff',
              border: `1.5px solid ${hoveredCard === 'qualified' ? '#059669' : '#e2e8f0'}`,
              borderRadius: '18px',
              padding: '20px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              boxShadow:
                hoveredCard === 'qualified'
                  ? '0 12px 24px -4px rgba(5, 150, 105, 0.16), 0 4px 10px -2px rgba(0, 0, 0, 0.04)'
                  : '0 2px 6px rgba(0, 0, 0, 0.03)',
              transform: hoveredCard === 'qualified' ? 'translateY(-3px)' : 'translateY(0)',
              transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
              overflow: 'hidden',
              userSelect: 'none',
              minHeight: '135px',
            }}
            title="Click to view qualified prospects"
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px', marginBottom: '10px' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    backgroundColor: '#ecfdf5',
                    color: '#059669',
                    border: '1px solid #a7f3d0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Sparkles size={22} />
                </div>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: '#059669',
                    backgroundColor: '#ecfdf5',
                    border: '1px solid #a7f3d0',
                    padding: '3px 8px',
                    borderRadius: '999px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <span>Qualified</span>
                  <ArrowUpRight size={12} />
                </span>
              </div>

              <div
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  marginBottom: '4px',
                }}
              >
                Qualified Leads
              </div>

              <div
                style={{
                  fontSize: '1.9rem',
                  fontWeight: 800,
                  color: '#0f172a',
                  lineHeight: 1.15,
                  marginBottom: '6px',
                }}
              >
                {qualifiedCount}
              </div>
            </div>

            <div style={{ fontSize: '0.76rem', color: '#64748b', lineHeight: 1.35 }}>
              Prospects ready for deal conversion
            </div>
          </div>

          {/* Metric Card 3: Call Activity */}
          <div
            onClick={() => setActiveMetricDialog('calls')}
            onMouseEnter={() => setHoveredCard('calls')}
            onMouseLeave={() => setHoveredCard(null)}
            style={{
              backgroundColor: '#ffffff',
              border: `1.5px solid ${hoveredCard === 'calls' ? '#d97706' : '#e2e8f0'}`,
              borderRadius: '18px',
              padding: '20px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              boxShadow:
                hoveredCard === 'calls'
                  ? '0 12px 24px -4px rgba(217, 119, 6, 0.16), 0 4px 10px -2px rgba(0, 0, 0, 0.04)'
                  : '0 2px 6px rgba(0, 0, 0, 0.03)',
              transform: hoveredCard === 'calls' ? 'translateY(-3px)' : 'translateY(0)',
              transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
              overflow: 'hidden',
              userSelect: 'none',
              minHeight: '135px',
            }}
            title="Click to view call interaction logs"
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px', marginBottom: '10px' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    backgroundColor: '#fffbeb',
                    color: '#d97706',
                    border: '1px solid #fde68a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <PhoneOutgoing size={22} />
                </div>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: '#d97706',
                    backgroundColor: '#fffbeb',
                    border: '1px solid #fde68a',
                    padding: '3px 8px',
                    borderRadius: '999px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <span>Call Logs</span>
                  <ArrowUpRight size={12} />
                </span>
              </div>

              <div
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  marginBottom: '4px',
                }}
              >
                Call Activity
              </div>

              <div
                style={{
                  fontSize: '1.9rem',
                  fontWeight: 800,
                  color: '#0f172a',
                  lineHeight: 1.15,
                  marginBottom: '6px',
                }}
              >
                {totalCalls}
              </div>
            </div>

            {/* Clear, structured micro-badges for calls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  color: '#047857',
                  backgroundColor: '#ecfdf5',
                  padding: '2px 6px',
                  borderRadius: '6px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                }}
              >
                <CheckCheck size={11} />
                <span>{connectedCalls} Connected</span>
              </span>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  color: '#b45309',
                  backgroundColor: '#fffbeb',
                  padding: '2px 6px',
                  borderRadius: '6px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                }}
              >
                <PhoneCall size={11} />
                <span>{callbackCalls} Callbacks</span>
              </span>
            </div>
          </div>

          {/* Metric Card 4: Converted Leads */}
          <div
            onClick={() => setActiveMetricDialog('converted')}
            onMouseEnter={() => setHoveredCard('converted')}
            onMouseLeave={() => setHoveredCard(null)}
            style={{
              backgroundColor: '#ffffff',
              border: `1.5px solid ${hoveredCard === 'converted' ? '#7c3aed' : '#e2e8f0'}`,
              borderRadius: '18px',
              padding: '20px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              boxShadow:
                hoveredCard === 'converted'
                  ? '0 12px 24px -4px rgba(124, 58, 237, 0.16), 0 4px 10px -2px rgba(0, 0, 0, 0.04)'
                  : '0 2px 6px rgba(0, 0, 0, 0.03)',
              transform: hoveredCard === 'converted' ? 'translateY(-3px)' : 'translateY(0)',
              transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
              overflow: 'hidden',
              userSelect: 'none',
              minHeight: '135px',
            }}
            title="Click to view converted leads & opportunities"
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px', marginBottom: '10px' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    backgroundColor: '#f5f3ff',
                    color: '#7c3aed',
                    border: '1px solid #ddd6fe',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <TrendingUp size={22} />
                </div>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: '#7c3aed',
                    backgroundColor: '#f5f3ff',
                    border: '1px solid #ddd6fe',
                    padding: '3px 8px',
                    borderRadius: '999px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <span>Converted</span>
                  <ArrowUpRight size={12} />
                </span>
              </div>

              <div
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  marginBottom: '4px',
                }}
              >
                Converted Leads
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: '8px',
                  marginBottom: '6px',
                }}
              >
                <div
                  style={{
                    fontSize: '1.9rem',
                    fontWeight: 800,
                    color: '#0f172a',
                    lineHeight: 1.15,
                  }}
                >
                  {convertedCount}
                </div>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: '#6d28d9',
                    backgroundColor: '#ede9fe',
                    padding: '2px 7px',
                    borderRadius: '6px',
                  }}
                >
                  {conversionRate}% Rate
                </span>
              </div>
            </div>

            <div style={{ fontSize: '0.76rem', color: '#64748b', lineHeight: 1.35 }}>
              Leads successfully converted to deals
            </div>
          </div>
        </div>
      </div>

      {/* 3. SECTION B: Navigation & Management Tools (2 Distinct Action Cards) */}
      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '12px',
            gap: '8px',
          }}
        >
          <Layers size={16} color="#475569" />
          <span
            style={{
              fontSize: '0.8rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: '#475569',
            }}
          >
            Operations & Executive Reports
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
            gap: '16px',
          }}
        >
          {/* Navigation Card 1: Lead Directory & Actions */}
          <div
            onClick={() => setIsLeadDirectoryOpen(true)}
            onMouseEnter={() => setHoveredCard('directory')}
            onMouseLeave={() => setHoveredCard(null)}
            style={{
              backgroundColor: '#ffffff',
              border: `1.5px solid ${hoveredCard === 'directory' ? '#4f46e5' : '#e2e8f0'}`,
              borderRadius: '18px',
              padding: '22px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              boxShadow:
                hoveredCard === 'directory'
                  ? '0 14px 28px -4px rgba(79, 70, 229, 0.16), 0 4px 10px -2px rgba(0, 0, 0, 0.04)'
                  : '0 2px 6px rgba(0, 0, 0, 0.03)',
              transform: hoveredCard === 'directory' ? 'translateY(-3px)' : 'translateY(0)',
              transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
              overflow: 'hidden',
              userSelect: 'none',
              minHeight: '145px',
            }}
            title="Click to launch Lead Directory & Kanban Board"
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px', marginBottom: '12px' }}>
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '14px',
                    backgroundColor: '#eef2ff',
                    color: '#4f46e5',
                    border: '1px solid #c7d2fe',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Layers size={24} />
                </div>

                <span
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: '#4f46e5',
                    backgroundColor: '#eef2ff',
                    border: '1px solid #c7d2fe',
                    padding: '5px 12px',
                    borderRadius: '999px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <span>Open Directory</span>
                  <ArrowUpRight size={14} />
                </span>
              </div>

              <div
                style={{
                  fontSize: '1.1rem',
                  fontWeight: 800,
                  color: '#0f172a',
                  letterSpacing: '-0.01em',
                  marginBottom: '6px',
                }}
              >
                Lead Directory
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    color: '#4338ca',
                    backgroundColor: '#eef2ff',
                    padding: '2px 8px',
                    borderRadius: '6px',
                  }}
                >
                  Table Registry
                </span>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    color: '#4338ca',
                    backgroundColor: '#eef2ff',
                    padding: '2px 8px',
                    borderRadius: '6px',
                  }}
                >
                  Kanban Pipeline
                </span>
              </div>
            </div>

            <div style={{ fontSize: '0.78rem', color: '#64748b', lineHeight: 1.4 }}>
              Comprehensive lead database, stage workflow, follow-up scheduler & pipeline actions
            </div>
          </div>

          {/* Navigation Card 2: MIS Reports & Analytics */}
          <div
            onClick={() => setIsMISModalOpen(true)}
            onMouseEnter={() => setHoveredCard('mis')}
            onMouseLeave={() => setHoveredCard(null)}
            style={{
              backgroundColor: '#ffffff',
              border: `1.5px solid ${hoveredCard === 'mis' ? '#0284c7' : '#e2e8f0'}`,
              borderRadius: '18px',
              padding: '22px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              boxShadow:
                hoveredCard === 'mis'
                  ? '0 14px 28px -4px rgba(2, 132, 199, 0.16), 0 4px 10px -2px rgba(0, 0, 0, 0.04)'
                  : '0 2px 6px rgba(0, 0, 0, 0.03)',
              transform: hoveredCard === 'mis' ? 'translateY(-3px)' : 'translateY(0)',
              transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
              overflow: 'hidden',
              userSelect: 'none',
              minHeight: '145px',
            }}
            title="Click to view MIS Reports and Excel exports"
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px', marginBottom: '12px' }}>
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '14px',
                    backgroundColor: '#f0f9ff',
                    color: '#0284c7',
                    border: '1px solid #bae6fd',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <FileSpreadsheet size={24} />
                </div>

                <span
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: '#0284c7',
                    backgroundColor: '#f0f9ff',
                    border: '1px solid #bae6fd',
                    padding: '5px 12px',
                    borderRadius: '999px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <span>View Reports</span>
                  <ArrowUpRight size={14} />
                </span>
              </div>

              <div
                style={{
                  fontSize: '1.1rem',
                  fontWeight: 800,
                  color: '#0f172a',
                  letterSpacing: '-0.01em',
                  marginBottom: '6px',
                }}
              >
                MIS Reports
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: '#0369a1',
                    backgroundColor: '#e0f2fe',
                    padding: '2px 8px',
                    borderRadius: '6px',
                  }}
                >
                  5 Reports Available
                </span>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    color: '#0369a1',
                    backgroundColor: '#f0f9ff',
                    padding: '2px 8px',
                    borderRadius: '6px',
                  }}
                >
                  Excel Export Ready
                </span>
              </div>
            </div>

            <div style={{ fontSize: '0.78rem', color: '#64748b', lineHeight: 1.4 }}>
              Funnel velocity, agent efficiency, disposition outcomes, pipeline aging & marketing attribution
            </div>
          </div>
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

      {/* Pop-up Dialog 2: Lead Directory & Actions Pop-up Modal */}
      <LeadDirectoryModal
        isOpen={isLeadDirectoryOpen}
        onClose={() => setIsLeadDirectoryOpen(false)}
      />

      {/* Pop-up Dialog 3: MIS Reports & Analytics Pop-up Modal */}
      <MISReportsModal
        isOpen={isMISModalOpen}
        onClose={() => setIsMISModalOpen(false)}
      />

      {/* CRM Modals (Preserved Exactly) */}
      <LeadModal />
      <LeadDetailModal />
      <AddCallLogModal />
      <ScheduleFollowUpModal />
      <QualifyLeadModal />
      <ConvertLeadModal />
      <DeleteLeadModal />
      <DispositionModal />
      <AuditTrailModal />
      <LeadImportModal isOpen={isImportModalOpen} onClose={closeImportModal} />
      <LeadExportModal isOpen={isExportModalOpen} onClose={closeExportModal} />
    </div>
  );
};

export default LeadSection;
