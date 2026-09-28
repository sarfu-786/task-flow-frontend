import React from 'react';
import { useLeads } from '../../context/LeadContext';
import {
  PhoneCall,
  PhoneOff,
  Clock,
  UserX,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  TrendingUp,
  User,
  Calendar,
} from 'lucide-react';

export const DispositionMatrixTab = () => {
  const { leads, openDispositionModal } = useLeads();

  const activeProspects = leads.filter((l) => l.status !== 'Converted' && l.status !== 'Lost');

  return (
    <div className="disposition-matrix-tab" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Informational Header Card */}
      <div
        style={{
          padding: '18px 22px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, #0f172a, #1e293b)',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px',
        }}
      >
        <div>
          <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>
            Outreach Disposition Framework Matrix
          </h3>
          <p style={{ margin: '3px 0 0', fontSize: '0.82rem', color: '#94a3b8' }}>
            Every contact attempt binds to a deterministic disposition code driving automated sub-state triggers & SLA actions.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.74rem', padding: '4px 10px', borderRadius: '6px', background: '#fffbeb', color: '#d97706', fontWeight: 700 }}>
            No Answer (+120m)
          </span>
          <span style={{ fontSize: '0.74rem', padding: '4px 10px', borderRadius: '6px', background: '#fff7ed', color: '#ea580c', fontWeight: 700 }}>
            Busy (+30m dialer)
          </span>
          <span style={{ fontSize: '0.74rem', padding: '4px 10px', borderRadius: '6px', background: '#eff6ff', color: '#2563eb', fontWeight: 700 }}>
            Callback (Calendar)
          </span>
          <span style={{ fontSize: '0.74rem', padding: '4px 10px', borderRadius: '6px', background: '#fef2f2', color: '#dc2626', fontWeight: 700 }}>
            Not Interested (Suppression)
          </span>
          <span style={{ fontSize: '0.74rem', padding: '4px 10px', borderRadius: '6px', background: '#ecfdf5', color: '#059669', fontWeight: 700 }}>
            Qualified (&lt;2s Handoff)
          </span>
        </div>
      </div>

      {/* Active Outreach Table */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          boxShadow: 'var(--shadow-sm)',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#1e293b' }}>
              Active Lead Queue & 1-Click Outreach Matrix
            </h4>
            <span style={{ fontSize: '0.76rem', color: '#64748b' }}>
              {activeProspects.length} leads waiting for contact attempt logging
            </span>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                <th style={{ padding: '10px 14px' }}>LEAD & PHONE</th>
                <th style={{ padding: '10px 14px' }}>CURRENT STATUS</th>
                <th style={{ padding: '10px 14px' }}>LAST DISPO</th>
                <th style={{ padding: '10px 14px' }}>RETRIES</th>
                <th style={{ padding: '10px 14px' }}>NEXT ACTION</th>
                <th style={{ padding: '10px 14px', textAlign: 'right' }}>QUICK LOG OUTCOME</th>
              </tr>
            </thead>
            <tbody>
              {activeProspects.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>
                    All leads processed or converted!
                  </td>
                </tr>
              ) : (
                activeProspects.map((lead) => (
                  <tr key={lead._id || lead.lead_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontWeight: 800, color: '#1e293b' }}>{lead.name}</div>
                      <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                        {lead.phone || 'No phone'} • {lead.company}
                      </div>
                    </td>

                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ padding: '2px 8px', borderRadius: '6px', background: '#eff6ff', color: '#2563eb', fontWeight: 700, fontSize: '0.74rem' }}>
                        {lead.status || 'New'}
                      </span>
                    </td>

                    <td style={{ padding: '12px 14px', color: '#334155', fontWeight: 600 }}>
                      {lead.disposition_code || 'None'}
                    </td>

                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ padding: '2px 8px', borderRadius: '6px', background: lead.retry_count > 3 ? '#fef2f2' : '#f1f5f9', color: lead.retry_count > 3 ? '#dc2626' : '#475569', fontWeight: 700, fontSize: '0.74rem' }}>
                        {lead.retry_count || 0}/5
                      </span>
                    </td>

                    <td style={{ padding: '12px 14px', fontSize: '0.76rem', color: '#64748b' }}>
                      {lead.next_followup_at ? new Date(lead.next_followup_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Immediate'}
                    </td>

                    <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => openDispositionModal(lead)}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '8px',
                          background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                          border: 'none',
                          color: '#ffffff',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)',
                        }}
                      >
                        <PhoneCall size={13} />
                        <span>Log Outcome</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DispositionMatrixTab;
