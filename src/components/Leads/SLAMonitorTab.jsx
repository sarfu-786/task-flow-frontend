import React from 'react';
import { useLeads } from '../../context/LeadContext';
import {
  Clock,
  AlertTriangle,
  Flame,
  Zap,
  CheckCircle2,
  PhoneCall,
  UserCheck,
  Building,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';

export const SLAMonitorTab = () => {
  const {
    leads,
    claimLead,
    openDispositionModal,
    openAuditModal,
  } = useLeads();

  // Tier 1 (Overdue >= 15m), Tier 2 (Overdue >= 30m), Tier 3 (Overdue >= 60m / Auto-Unassigned)
  const tier3Leads = leads.filter((l) => (l.sla_tier || 0) === 3 || l.is_high_priority_pool || l.assignedTo === 'Unassigned (High-Priority Queue)');
  const tier2Leads = leads.filter((l) => (l.sla_tier || 0) === 2);
  const tier1Leads = leads.filter((l) => (l.sla_tier || 0) === 1);
  const scheduledFollowups = leads.filter((l) => l.next_followup_at && (l.status !== 'Converted' && l.status !== 'Lost'));

  const formatDateTime = (dateStr) => {
    if (!dateStr) return 'Not Scheduled';
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="sla-monitor-tab" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Banner */}
      <div
        style={{
          padding: '20px 24px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, #1e1b4b, #312e81)',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px',
          boxShadow: '0 10px 25px -5px rgba(49, 46, 129, 0.3)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              padding: '12px',
              borderRadius: '14px',
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(4px)',
            }}
          >
            <Zap size={26} color="#fbbf24" />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>
              Intelligent Follow-up Scheduler & SLA Escalation Daemon
            </h3>
            <p style={{ margin: '3px 0 0', fontSize: '0.84rem', color: '#c7d2fe' }}>
              Automated tiered hierarchy: Tier 1 (T+15m Agent alert) → Tier 2 (T+30m Manager escalation) → Tier 3 (T+60m Auto-unassignment pool).
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, padding: '6px 12px', borderRadius: '999px', background: 'rgba(255, 255, 255, 0.15)', color: '#ffffff' }}>
            ● Daemon Running (30s Heartbeat)
          </span>
        </div>
      </div>

      {/* 3 Tier Summary Cards */}
      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: '16px' }}>
        {/* Tier 1 Card */}
        <div
          style={{
            padding: '18px',
            borderRadius: '16px',
            background: '#ffffff',
            border: '1px solid #fde68a',
            boxShadow: 'var(--shadow-sm)',
            borderLeft: '5px solid #f59e0b',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#d97706', textTransform: 'uppercase' }}>
              Tier 1: T+15m Warning
            </span>
            <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#b45309' }}>{tier1Leads.length}</span>
          </div>
          <p style={{ margin: '8px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
            Push notifications & browser toasts delivered to assigned agent owner.
          </p>
        </div>

        {/* Tier 2 Card */}
        <div
          style={{
            padding: '18px',
            borderRadius: '16px',
            background: '#ffffff',
            border: '1px solid #fed7aa',
            boxShadow: 'var(--shadow-sm)',
            borderLeft: '5px solid #ea580c',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#ea580c', textTransform: 'uppercase' }}>
              Tier 2: T+30m Escalation
            </span>
            <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#c2410c' }}>{tier2Leads.length}</span>
          </div>
          <p style={{ margin: '8px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
            In-app banner alerts pushed to Team Lead / Manager workspace.
          </p>
        </div>

        {/* Tier 3 Card */}
        <div
          style={{
            padding: '18px',
            borderRadius: '16px',
            background: '#ffffff',
            border: '1px solid #fecaca',
            boxShadow: 'var(--shadow-sm)',
            borderLeft: '5px solid #dc2626',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#dc2626', textTransform: 'uppercase' }}>
              Tier 3: T+60m Auto-Unassigned
            </span>
            <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#991b1b' }}>{tier3Leads.length}</span>
          </div>
          <p style={{ margin: '8px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
            Returned to High-Priority shared pool for immediate redistribution.
          </p>
        </div>
      </div>

      {/* Tier 3 High-Priority Shared Queue Section */}
      {tier3Leads.length > 0 && (
        <div
          style={{
            background: '#fff1f2',
            borderRadius: '16px',
            border: '2px dashed #f43f5e',
            padding: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Flame size={20} color="#e11d48" />
              <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#881337' }}>
                High-Priority Shared Queue ({tier3Leads.length} Unassigned Leads)
              </h4>
            </div>
            <span style={{ fontSize: '0.74rem', fontWeight: 700, background: '#ffffff', color: '#e11d48', padding: '3px 10px', borderRadius: '999px', border: '1px solid #fda4af' }}>
              Open for Claiming
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '12px' }}>
            {tier3Leads.map((lead) => (
              <div
                key={lead._id || lead.lead_id}
                style={{
                  background: '#ffffff',
                  borderRadius: '12px',
                  border: '1px solid #fecdd3',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '10px',
                  boxShadow: '0 2px 8px rgba(225, 29, 72, 0.08)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.94rem', fontWeight: 800, color: '#1e293b' }}>{lead.name}</span>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, background: '#ffe4e6', color: '#e11d48', padding: '2px 8px', borderRadius: '6px' }}>
                      Tier 3 Breach
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                    {lead.company || 'Enterprise Prospect'} • Pipeline: <strong>${lead.pipeline_value || lead.dealValue || 0}</strong>
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#e11d48', marginTop: '6px', fontWeight: 600 }}>
                    Scheduled: {formatDateTime(lead.next_followup_at)} (Overdue &gt;60m)
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => claimLead(lead._id || lead.lead_id)}
                    style={{
                      flex: 1,
                      padding: '8px',
                      borderRadius: '8px',
                      background: 'linear-gradient(135deg, #e11d48, #be123c)',
                      border: 'none',
                      color: '#ffffff',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                    }}
                  >
                    <UserCheck size={14} />
                    <span>Claim Lead Now</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => openDispositionModal(lead)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: '#f1f5f9',
                      border: '1px solid #cbd5e1',
                      color: '#334155',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    <PhoneCall size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Scheduled Follow-ups Table */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          padding: '20px',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div>
            <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#1e293b' }}>
              Scheduled Follow-up Timers & Real-Time SLA Monitor
            </h4>
            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
              Continuously evaluated against system clock with automated alerts
            </span>
          </div>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#2563eb' }}>
            {scheduledFollowups.length} Active Schedules
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                <th style={{ padding: '10px 12px' }}>LEAD</th>
                <th style={{ padding: '10px 12px' }}>SCHEDULED AT</th>
                <th style={{ padding: '10px 12px' }}>ASSIGNED OWNER</th>
                <th style={{ padding: '10px 12px' }}>LAST DISPOSITION</th>
                <th style={{ padding: '10px 12px' }}>SLA STATUS</th>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {scheduledFollowups.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                    No pending scheduled follow-ups.
                  </td>
                </tr>
              ) : (
                scheduledFollowups.map((lead) => {
                  const isOverdue = new Date(lead.next_followup_at).getTime() < Date.now();
                  const tier = lead.sla_tier || 0;

                  return (
                    <tr key={lead._id || lead.lead_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px', fontWeight: 700, color: '#1e293b' }}>
                        {lead.name}
                        <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 400 }}>{lead.company}</div>
                      </td>

                      <td style={{ padding: '12px', color: isOverdue ? '#dc2626' : '#334155', fontWeight: isOverdue ? 700 : 500 }}>
                        {formatDateTime(lead.next_followup_at)}
                      </td>

                      <td style={{ padding: '12px', color: '#334155' }}>
                        {lead.assignedTo}
                      </td>

                      <td style={{ padding: '12px', color: '#64748b' }}>
                        {lead.disposition_code || 'None'} {lead.retry_count > 0 && `(Retry #${lead.retry_count})`}
                      </td>

                      <td style={{ padding: '12px' }}>
                        {tier === 3 ? (
                          <span style={{ padding: '3px 8px', borderRadius: '6px', background: '#fef2f2', color: '#dc2626', fontWeight: 800, border: '1px solid #fecaca' }}>
                            ⚡ Tier 3 (Unassigned)
                          </span>
                        ) : tier === 2 ? (
                          <span style={{ padding: '3px 8px', borderRadius: '6px', background: '#fff7ed', color: '#ea580c', fontWeight: 800, border: '1px solid #fed7aa' }}>
                            🚨 Tier 2 (Escalated)
                          </span>
                        ) : tier === 1 ? (
                          <span style={{ padding: '3px 8px', borderRadius: '6px', background: '#fffbeb', color: '#d97706', fontWeight: 700, border: '1px solid #fde68a' }}>
                            ⚠️ Tier 1 (15m Overdue)
                          </span>
                        ) : isOverdue ? (
                          <span style={{ padding: '3px 8px', borderRadius: '6px', background: '#fffbeb', color: '#d97706', fontWeight: 600 }}>
                            Due Soon
                          </span>
                        ) : (
                          <span style={{ padding: '3px 8px', borderRadius: '6px', background: '#ecfdf5', color: '#059669', fontWeight: 600 }}>
                            ✓ On Schedule
                          </span>
                        )}
                      </td>

                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => openDispositionModal(lead)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '8px',
                            background: '#eff6ff',
                            border: '1px solid #bfdbfe',
                            color: '#1d4ed8',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          Log Dispo
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SLAMonitorTab;
