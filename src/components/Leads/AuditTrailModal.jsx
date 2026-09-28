import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useLeads } from '../../context/LeadContext';
import {
  Shield,
  ShieldCheck,
  X,
  Clock,
  User,
  Activity,
  Calendar,
  Layers,
  Search,
  RefreshCw,
} from 'lucide-react';

export const AuditTrailModal = () => {
  const { isAuditModalOpen, leadForAudit, closeAuditModal } = useLeads();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = leadForAudit ? { entity_id: leadForAudit._id || leadForAudit.lead_id } : { limit: 100 };
      const res = await api.getAuditLogs(params);
      if (res.success) {
        setLogs(res.logs || []);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuditModalOpen) {
      fetchLogs();
    }
  }, [isAuditModalOpen, leadForAudit]);

  if (!isAuditModalOpen) return null;

  const filteredLogs = logs.filter((l) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      (l.action && l.action.toLowerCase().includes(q)) ||
      (l.delta && l.delta.toLowerCase().includes(q)) ||
      (l.operator_name && l.operator_name.toLowerCase().includes(q))
    );
  });

  const getActionBadgeColor = (action) => {
    switch (action) {
      case 'CREATE':
        return { bg: '#ecfdf5', color: '#059669', border: '#a7f3d0' };
      case 'DISPOSITION_LOGGED':
        return { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' };
      case 'CONVERT':
        return { bg: '#f5f3ff', color: '#7c3aed', border: '#ddd6fe' };
      case 'STATUS_CHANGE':
        return { bg: '#fffbeb', color: '#d97706', border: '#fde68a' };
      case 'SLA_TIER1_BREACH':
      case 'SLA_TIER2_ESCALATION':
      case 'SLA_TIER3_UNASSIGNMENT':
        return { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' };
      default:
        return { bg: '#f1f5f9', color: '#475569', border: '#e2e8f0' };
    }
  };

  return (
    <div
      className="modal-overlay active"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(6px)',
        zIndex: 1200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) closeAuditModal();
      }}
    >
      <div
        className="modal-content"
        style={{
          background: '#ffffff',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '780px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
          animation: 'modalSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            background: 'linear-gradient(135deg, #0f172a, #1e293b)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ShieldCheck size={22} color="#ffffff" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>
                Immutable Audit Trail & Activity Log
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
                {leadForAudit
                  ? `Audit records for lead: ${leadForAudit.name}`
                  : 'Organization-wide immutable compliance change log'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeAuditModal}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '8px',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#cbd5e1',
              cursor: 'pointer',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Search filter */}
        <div style={{ padding: '14px 24px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Search size={16} color="#64748b" />
          <input
            type="text"
            placeholder="Search audit actions, delta, operator name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: '0.86rem',
              color: '#1e293b',
            }}
          />
          <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 600 }}>
            {filteredLogs.length} Records
          </span>
        </div>

        {/* Body Timeline */}
        <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {loading ? (
            <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
              <RefreshCw size={20} className="spin" style={{ margin: '0 auto 6px' }} />
              <div>Loading audit trails...</div>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8', fontSize: '0.88rem' }}>
              No audit records found matching your query.
            </div>
          ) : (
            filteredLogs.map((log) => {
              const badgeStyle = getActionBadgeColor(log.action);
              return (
                <div
                  key={log.log_id || log._id}
                  style={{
                    padding: '14px 16px',
                    borderRadius: '12px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: '6px',
                          background: badgeStyle.bg,
                          color: badgeStyle.color,
                          border: `1px solid ${badgeStyle.border}`,
                        }}
                      >
                        {log.action}
                      </span>
                      <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#1e293b' }}>
                        {log.entity_type} ({log.entity_id})
                      </span>
                    </div>

                    <div style={{ fontSize: '0.74rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} />
                      <span>{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                  </div>

                  <p style={{ margin: 0, fontSize: '0.84rem', color: '#334155', fontWeight: 500 }}>
                    {log.delta}
                  </p>

                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>
                    Operator: <strong>{log.operator_name}</strong> ({log.operator_role}) • IP: {log.ip_address || '127.0.0.1'}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default AuditTrailModal;
