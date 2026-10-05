import React, { useState } from 'react';
import { useComplaints } from '../../context/ComplaintContext';
import { useAuth } from '../../context/AuthContext';
import { ComplaintMetricDetailDialog } from './ComplaintMetricDetailDialog';
import { ComplaintDirectoryModal } from './ComplaintDirectoryModal';
import { ComplaintMISModal } from './ComplaintMISModal';
import { ComplaintModal } from './ComplaintModal';
import { ComplaintDetailModal } from './ComplaintDetailModal';
import { ResolveComplaintModal } from './ResolveComplaintModal';
import { DeleteComplaintModal } from './DeleteComplaintModal';
import {
  AlertCircle,
  Plus,
  Flame,
  Clock,
  CheckCircle2,
  Crown,
  User,
  BarChart3,
  Layers,
  FileSpreadsheet,
  ArrowUpRight,
  Sparkles,
  ShieldAlert,
  Calendar,
} from 'lucide-react';

export const ComplaintSection = () => {
  const { stats, allComplaints } = useComplaints();
  const { isSuperAdmin, user } = useAuth();
  const isManager = user && ['Manager', 'Executive', 'Administrator'].includes(user.role);

  // Active Metric Popup Dialog: 'total' | 'urgent' | 'sla_risk' | 'resolved' | null
  const [activeMetricDialog, setActiveMetricDialog] = useState(null);

  // Pop-up modals for Directory and MIS
  const [isDirectoryOpen, setIsDirectoryOpen] = useState(false);
  const [isMISModalOpen, setIsMISModalOpen] = useState(false);

  // Modals for CRUD and detailed operations
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [complaintToEdit, setComplaintToEdit] = useState(null);
  const [complaintToResolve, setComplaintToResolve] = useState(null);
  const [complaintToDelete, setComplaintToDelete] = useState(null);
  const [complaintToView, setComplaintToView] = useState(null);

  // Hover states for interactive cards
  const [hoveredCard, setHoveredCard] = useState(null);

  const totalCount = stats.total || (allComplaints ? allComplaints.length : 0);
  const urgentCount = stats.urgent || 0;
  const slaRiskCount = (stats.slaBreached || 0) + (stats.slaAtRisk || 0);
  const resolvedCount = stats.resolved || 0;
  const resolutionRate = totalCount > 0 ? Math.round((resolvedCount / totalCount) * 100) : 100;

  return (
    <div className="complaint-management-page" style={{ paddingBottom: '36px' }}>
      {/* 1. Section Header */}
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
                backgroundColor: '#fef2f2',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #fee2e2',
                boxShadow: '0 4px 12px rgba(220, 38, 38, 0.12)',
                flexShrink: 0,
              }}
            >
              <AlertCircle size={22} />
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
              Complaint & SLA Management
            </h1>

            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: '#fef2f2',
                color: '#dc2626',
                border: '1px solid #fee2e2',
                padding: '3px 10px',
                borderRadius: '999px',
                fontSize: '0.74rem',
                fontWeight: 700,
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#dc2626',
                  animation: 'pulse 1.5s infinite',
                }}
              />
              Live SLA Monitoring
            </span>

            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '3px 10px',
                borderRadius: '999px',
                fontSize: '0.74rem',
                fontWeight: 700,
                background: isSuperAdmin ? '#fef3c7' : '#ecfdf5',
                color: isSuperAdmin ? '#b45309' : '#047857',
                border: `1px solid ${isSuperAdmin ? '#fde68a' : '#a7f3d0'}`,
              }}
            >
              {isSuperAdmin ? <Crown size={12} /> : <User size={12} />}
              {isSuperAdmin
                ? 'Super Admin • Entire Organization (All Complaints)'
                : isManager
                ? 'Manager • Team & Subordinate Hierarchy'
                : 'Assigned Complaints Only'}
            </span>
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
            End-to-end incident management: Track ticket progression, enforce strict SLA countdowns, conduct RCA/CAPA investigations & generate executive MIS reports.
          </p>
        </div>

        {/* Header Right Action */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setIsCreateOpen(true)}
            id="btn-log-complaint-top"
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
            <span>Log Complaint</span>
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
          {/* Metric Card 1: Total Complaints */}
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
            title="Click to view total registered complaints"
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
                  <AlertCircle size={22} />
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
                Total Complaints
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
                {totalCount}
              </div>
            </div>

            <div style={{ fontSize: '0.76rem', color: '#64748b', lineHeight: 1.35 }}>
              {isSuperAdmin ? 'All organization tickets' : 'Assigned in your scope'}
            </div>
          </div>

          {/* Metric Card 2: Urgent Escalations */}
          <div
            onClick={() => setActiveMetricDialog('urgent')}
            onMouseEnter={() => setHoveredCard('urgent')}
            onMouseLeave={() => setHoveredCard(null)}
            style={{
              backgroundColor: '#ffffff',
              border: `1.5px solid ${hoveredCard === 'urgent' ? '#dc2626' : '#e2e8f0'}`,
              borderRadius: '18px',
              padding: '20px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              boxShadow:
                hoveredCard === 'urgent'
                  ? '0 12px 24px -4px rgba(220, 38, 38, 0.16), 0 4px 10px -2px rgba(0, 0, 0, 0.04)'
                  : '0 2px 6px rgba(0, 0, 0, 0.03)',
              transform: hoveredCard === 'urgent' ? 'translateY(-3px)' : 'translateY(0)',
              transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
              overflow: 'hidden',
              userSelect: 'none',
              minHeight: '135px',
            }}
            title="Click to view urgent 4-hour SLA tickets"
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px', marginBottom: '10px' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    backgroundColor: '#fee2e2',
                    color: '#dc2626',
                    border: '1px solid #fecaca',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Flame size={22} />
                </div>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: '#dc2626',
                    backgroundColor: '#fee2e2',
                    border: '1px solid #fecaca',
                    padding: '3px 8px',
                    borderRadius: '999px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <span>4h SLA</span>
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
                Urgent Escalations
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
                {urgentCount}
              </div>
            </div>

            <div style={{ fontSize: '0.76rem', color: '#64748b', lineHeight: 1.35 }}>
              Rapid 4-hour SLA priority resolution target
            </div>
          </div>

          {/* Metric Card 3: SLA Breached / At Risk */}
          <div
            onClick={() => setActiveMetricDialog('sla_risk')}
            onMouseEnter={() => setHoveredCard('sla_risk')}
            onMouseLeave={() => setHoveredCard(null)}
            style={{
              backgroundColor: '#ffffff',
              border: `1.5px solid ${hoveredCard === 'sla_risk' ? '#d97706' : '#e2e8f0'}`,
              borderRadius: '18px',
              padding: '20px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              boxShadow:
                hoveredCard === 'sla_risk'
                  ? '0 12px 24px -4px rgba(217, 119, 6, 0.16), 0 4px 10px -2px rgba(0, 0, 0, 0.04)'
                  : '0 2px 6px rgba(0, 0, 0, 0.03)',
              transform: hoveredCard === 'sla_risk' ? 'translateY(-3px)' : 'translateY(0)',
              transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
              overflow: 'hidden',
              userSelect: 'none',
              minHeight: '135px',
            }}
            title="Click to view tickets at risk or breached"
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
                  <Clock size={22} />
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
                  <span>SLA Alert</span>
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
                SLA Breached / At Risk
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
                {slaRiskCount}
              </div>
            </div>

            <div style={{ fontSize: '0.76rem', color: '#64748b', lineHeight: 1.35 }}>
              {stats.slaBreached || 0} breached, {stats.slaAtRisk || 0} nearing deadline
            </div>
          </div>

          {/* Metric Card 4: Resolved & Met SLA */}
          <div
            onClick={() => setActiveMetricDialog('resolved')}
            onMouseEnter={() => setHoveredCard('resolved')}
            onMouseLeave={() => setHoveredCard(null)}
            style={{
              backgroundColor: '#ffffff',
              border: `1.5px solid ${hoveredCard === 'resolved' ? '#059669' : '#e2e8f0'}`,
              borderRadius: '18px',
              padding: '20px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              boxShadow:
                hoveredCard === 'resolved'
                  ? '0 12px 24px -4px rgba(5, 150, 105, 0.16), 0 4px 10px -2px rgba(0, 0, 0, 0.04)'
                  : '0 2px 6px rgba(0, 0, 0, 0.03)',
              transform: hoveredCard === 'resolved' ? 'translateY(-3px)' : 'translateY(0)',
              transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
              overflow: 'hidden',
              userSelect: 'none',
              minHeight: '135px',
            }}
            title="Click to view resolved tickets"
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
                  <CheckCircle2 size={22} />
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
                  <span>Resolved</span>
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
                Resolved & Met SLA
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
                  {resolvedCount}
                </div>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: '#047857',
                    backgroundColor: '#ecfdf5',
                    padding: '2px 7px',
                    borderRadius: '6px',
                  }}
                >
                  {resolutionRate}% Rate
                </span>
              </div>
            </div>

            <div style={{ fontSize: '0.76rem', color: '#64748b', lineHeight: 1.35 }}>
              Tickets successfully resolved within SLA window
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
          {/* Navigation Card 1: Complaint Directory & Workflow */}
          <div
            onClick={() => setIsDirectoryOpen(true)}
            onMouseEnter={() => setHoveredCard('directory')}
            onMouseLeave={() => setHoveredCard(null)}
            style={{
              backgroundColor: '#ffffff',
              border: `1.5px solid ${hoveredCard === 'directory' ? '#2563eb' : '#e2e8f0'}`,
              borderRadius: '18px',
              padding: '22px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              boxShadow:
                hoveredCard === 'directory'
                  ? '0 14px 28px -4px rgba(37, 99, 235, 0.16), 0 4px 10px -2px rgba(0, 0, 0, 0.04)'
                  : '0 2px 6px rgba(0, 0, 0, 0.03)',
              transform: hoveredCard === 'directory' ? 'translateY(-3px)' : 'translateY(0)',
              transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
              overflow: 'hidden',
              userSelect: 'none',
              minHeight: '145px',
            }}
            title="Click to launch Complaint Directory with Table, Kanban & Cards"
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px', marginBottom: '12px' }}>
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '14px',
                    backgroundColor: '#eff6ff',
                    color: '#2563eb',
                    border: '1px solid #bfdbfe',
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
                    color: '#2563eb',
                    backgroundColor: '#eff6ff',
                    border: '1px solid #bfdbfe',
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
                Complaint Directory
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    color: '#1d4ed8',
                    backgroundColor: '#eff6ff',
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
                    color: '#1d4ed8',
                    backgroundColor: '#eff6ff',
                    padding: '2px 8px',
                    borderRadius: '6px',
                  }}
                >
                  Kanban Pipeline
                </span>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    color: '#1d4ed8',
                    backgroundColor: '#eff6ff',
                    padding: '2px 8px',
                    borderRadius: '6px',
                  }}
                >
                  Cards View
                </span>
              </div>
            </div>

            <div style={{ fontSize: '0.78rem', color: '#64748b', lineHeight: 1.4 }}>
              Comprehensive complaint database, multi-stage workflow, SLA trackers, RCA & quick reassignments
            </div>
          </div>

          {/* Navigation Card 2: Complaint MIS Reports & Analytics */}
          <div
            onClick={() => setIsMISModalOpen(true)}
            onMouseEnter={() => setHoveredCard('mis')}
            onMouseLeave={() => setHoveredCard(null)}
            style={{
              backgroundColor: '#ffffff',
              border: `1.5px solid ${hoveredCard === 'mis' ? '#059669' : '#e2e8f0'}`,
              borderRadius: '18px',
              padding: '22px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              boxShadow:
                hoveredCard === 'mis'
                  ? '0 14px 28px -4px rgba(5, 150, 105, 0.16), 0 4px 10px -2px rgba(0, 0, 0, 0.04)'
                  : '0 2px 6px rgba(0, 0, 0, 0.03)',
              transform: hoveredCard === 'mis' ? 'translateY(-3px)' : 'translateY(0)',
              transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
              overflow: 'hidden',
              userSelect: 'none',
              minHeight: '145px',
            }}
            title="Click to view 20 Executive MIS Reports and Excel exports"
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px', marginBottom: '12px' }}>
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '14px',
                    backgroundColor: '#ecfdf5',
                    color: '#059669',
                    border: '1px solid #a7f3d0',
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
                    color: '#059669',
                    backgroundColor: '#ecfdf5',
                    border: '1px solid #a7f3d0',
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
                MIS Reports & Analytics
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: '#047857',
                    backgroundColor: '#ecfdf5',
                    padding: '2px 8px',
                    borderRadius: '6px',
                  }}
                >
                  20 Reports Available
                </span>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    color: '#047857',
                    backgroundColor: '#ecfdf5',
                    padding: '2px 8px',
                    borderRadius: '6px',
                  }}
                >
                  Excel Export Ready
                </span>
              </div>
            </div>

            <div style={{ fontSize: '0.78rem', color: '#64748b', lineHeight: 1.4 }}>
              SLA compliance, MTTR velocity, RCA & CAPA, user productivity, CSAT sentiment & exception management
            </div>
          </div>
        </div>
      </div>

      {/* Pop-up Dialog 1: Metric Detail Dialog (Total / Urgent / SLA Risk / Resolved) */}
      <ComplaintMetricDetailDialog
        open={!!activeMetricDialog}
        onClose={() => setActiveMetricDialog(null)}
        metricType={activeMetricDialog || 'total'}
        onViewTicket={(ticket) => {
          setActiveMetricDialog(null);
          setComplaintToView(ticket);
        }}
        onEditTicket={(ticket) => {
          setActiveMetricDialog(null);
          setComplaintToEdit(ticket);
        }}
        onResolveTicket={(ticket) => {
          setActiveMetricDialog(null);
          setComplaintToResolve(ticket);
        }}
        onDeleteTicket={(ticket) => {
          setActiveMetricDialog(null);
          setComplaintToDelete(ticket);
        }}
        canDelete={isSuperAdmin}
        onCreateTicket={() => {
          setActiveMetricDialog(null);
          setIsCreateOpen(true);
        }}
      />

      {/* Pop-up Dialog 2: Complaint Directory Modal (Table, Kanban, Cards) */}
      <ComplaintDirectoryModal
        isOpen={isDirectoryOpen}
        onClose={() => setIsDirectoryOpen(false)}
        onView={(ticket) => {
          setComplaintToView(ticket);
        }}
        onEdit={(ticket) => {
          setComplaintToEdit(ticket);
        }}
        onResolve={(ticket) => {
          setComplaintToResolve(ticket);
        }}
        onDelete={(ticket) => {
          setComplaintToDelete(ticket);
        }}
        canDelete={isSuperAdmin}
        onCreate={() => {
          setIsCreateOpen(true);
        }}
      />

      {/* Pop-up Dialog 3: MIS Reports & Analytics Modal (All 20 Reports) */}
      <ComplaintMISModal
        isOpen={isMISModalOpen}
        onClose={() => setIsMISModalOpen(false)}
      />

      {/* CRUD & View Popups */}
      <ComplaintModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        complaintToEdit={null}
      />
      <ComplaintModal
        isOpen={!!complaintToEdit}
        onClose={() => setComplaintToEdit(null)}
        complaintToEdit={complaintToEdit}
      />
      <ResolveComplaintModal
        isOpen={!!complaintToResolve}
        onClose={() => setComplaintToResolve(null)}
        complaint={complaintToResolve}
      />
      <DeleteComplaintModal
        isOpen={!!complaintToDelete}
        onClose={() => setComplaintToDelete(null)}
        complaint={complaintToDelete}
      />
      <ComplaintDetailModal
        isOpen={!!complaintToView}
        onClose={() => setComplaintToView(null)}
        complaint={complaintToView}
        onEdit={(t) => {
          setComplaintToView(null);
          setComplaintToEdit(t);
        }}
        onResolve={(t) => {
          setComplaintToView(null);
          setComplaintToResolve(t);
        }}
        onDelete={(t) => {
          setComplaintToView(null);
          setComplaintToDelete(t);
        }}
      />
    </div>
  );
};

export default ComplaintSection;
