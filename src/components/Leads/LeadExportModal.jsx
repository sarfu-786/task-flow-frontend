import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useLeads } from '../../context/LeadContext';
import { useAuth } from '../../context/AuthContext';
import {
  Download,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  Clock,
  History,
  RefreshCw,
  X,
  Filter,
  ShieldCheck,
  Crown,
  UserCheck,
  Layers,
  FileText,
} from 'lucide-react';

export const LeadExportModal = ({ isOpen, onClose }) => {
  const { totalLeads, search, statusFilter, priorityFilter, sourceFilter, assignedToFilter } = useLeads();
  const { user, isSuperAdmin } = useAuth();

  const [activeView, setActiveView] = useState('export'); // 'export' | 'history'
  const [exportScope, setExportScope] = useState('filtered'); // 'filtered' | 'all'
  const [exportLoading, setExportLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [statusMessage, setStatusMessage] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setActiveView('export');
      setStatusMessage(null);
    }
  }, [isOpen]);

  const loadHistory = async () => {
    try {
      setHistoryLoading(true);
      const res = await api.getLeadExcelHistory();
      if (res && res.success) {
        // Filter for export actions
        const exports = (res.history || []).filter(
          (h) => h.action === 'EXPORT_EXCEL' || (h.details && h.details.includes('Export'))
        );
        setHistoryData(exports);
      }
    } catch (err) {
      console.error('[LeadExportModal] Load History Error:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleExecuteExport = async () => {
    try {
      setExportLoading(true);
      setStatusMessage(null);

      const exportParams = {
        scope: exportScope,
        search: exportScope === 'filtered' ? search : '',
        status: exportScope === 'filtered' ? statusFilter : 'all',
        priority: exportScope === 'filtered' ? priorityFilter : 'all',
        source: exportScope === 'filtered' ? sourceFilter : 'all',
        assignedTo: exportScope === 'filtered' ? assignedToFilter : 'all',
      };

      const blob = await api.exportLeadExcel(exportParams);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const dateStr = new Date().toISOString().slice(0, 10);
      a.download = `Leads_Export_${dateStr}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setStatusMessage({
        type: 'success',
        text: 'Excel workbook (.xlsx) successfully generated and downloaded.',
      });
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Failed to export leads to Excel.',
      });
    } finally {
      setExportLoading(false);
    }
  };

  if (!isOpen) return null;

  const hasActiveFilters =
    search ||
    (statusFilter && statusFilter !== 'all') ||
    (priorityFilter && priorityFilter !== 'all') ||
    (sourceFilter && sourceFilter !== 'all') ||
    (assignedToFilter && assignedToFilter !== 'all');

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '860px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.3)',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 28px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(to right, #ffffff, #f0fdf4)',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '14px',
                backgroundColor: '#ecfdf5',
                color: '#059669',
                border: '1.5px solid #a7f3d0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(5, 150, 105, 0.15)',
                flexShrink: 0,
              }}
            >
              <Download size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2
                  style={{
                    margin: 0,
                    fontSize: '1.25rem',
                    fontWeight: 800,
                    color: '#0f172a',
                    letterSpacing: '-0.01em',
                  }}
                >
                  Export Leads to Excel
                </h2>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '3px 10px',
                    borderRadius: '999px',
                    backgroundColor: '#ecfdf5',
                    color: '#059669',
                    border: '1px solid #a7f3d0',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                  }}
                >
                  .xlsx Only
                </span>
              </div>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.84rem', color: '#64748b' }}>
                Export filtered MIS lead records or full hierarchy-scoped dataset into `.xlsx` workbook.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Toggle History View */}
            <button
              type="button"
              onClick={() => {
                if (activeView === 'export') {
                  setActiveView('history');
                  loadHistory();
                } else {
                  setActiveView('export');
                }
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 13px',
                borderRadius: '9px',
                backgroundColor: activeView === 'history' ? '#ecfdf5' : '#f8fafc',
                color: activeView === 'history' ? '#059669' : '#475569',
                border: `1px solid ${activeView === 'history' ? '#a7f3d0' : '#e2e8f0'}`,
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <History size={14} />
              <span>{activeView === 'history' ? 'Back to Export' : 'Export History'}</span>
            </button>

            {/* Separator */}
            <div style={{ width: '1px', height: '24px', backgroundColor: '#e2e8f0', margin: '0 2px' }} />

            {/* Dedicated Top-Right Cut/Close Button */}
            <button
              type="button"
              onClick={onClose}
              id="btn-close-lead-export-modal"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                border: 'none',
                backgroundColor: '#f1f5f9',
                color: '#64748b',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#fee2e2';
                e.currentTarget.style.color = '#dc2626';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#f1f5f9';
                e.currentTarget.style.color = '#64748b';
              }}
              aria-label="Close modal"
              title="Close modal"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div
          style={{
            padding: '24px 28px',
            backgroundColor: '#f8fafc',
            overflowY: 'auto',
            flex: '1 1 auto',
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          {/* Status Alert */}
          {statusMessage && (
            <div
              style={{
                padding: '12px 18px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                backgroundColor: statusMessage.type === 'success' ? '#ecfdf5' : '#fef2f2',
                color: statusMessage.type === 'success' ? '#065f46' : '#991b1b',
                border: `1px solid ${statusMessage.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
                fontSize: '0.85rem',
                fontWeight: 600,
              }}
            >
              {statusMessage.type === 'success' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {activeView === 'history' ? (
            /* History View */
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                    Lead Export Audit History
                  </h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                    Log of Excel (.xlsx) lead exports requested by users.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={loadHistory}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    backgroundColor: '#f1f5f9',
                    border: '1px solid #e2e8f0',
                    color: '#475569',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <RefreshCw size={13} className={historyLoading ? 'animate-spin' : ''} />
                  <span>Refresh</span>
                </button>
              </div>

              {historyLoading ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                  <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 8px auto', color: '#059669' }} />
                  <div style={{ fontSize: '0.85rem' }}>Loading export history...</div>
                </div>
              ) : historyData.length === 0 ? (
                <div
                  style={{
                    padding: '40px',
                    textAlign: 'center',
                    color: '#94a3b8',
                    backgroundColor: '#f8fafc',
                    borderRadius: '12px',
                    fontSize: '0.85rem',
                  }}
                >
                  No Lead Excel exports logged yet.
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <th style={{ padding: '10px 14px', textAlign: 'left', color: '#475569', fontWeight: 700 }}>Timestamp</th>
                        <th style={{ padding: '10px 14px', textAlign: 'left', color: '#475569', fontWeight: 700 }}>Action</th>
                        <th style={{ padding: '10px 14px', textAlign: 'left', color: '#475569', fontWeight: 700 }}>Exported By</th>
                        <th style={{ padding: '10px 14px', textAlign: 'left', color: '#475569', fontWeight: 700 }}>Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyData.map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '10px 14px', color: '#64748b', whiteSpace: 'nowrap' }}>
                            {item.timestamp ? new Date(item.timestamp).toLocaleString() : '—'}
                          </td>
                          <td style={{ padding: '10px 14px' }}>
                            <span
                              style={{
                                padding: '2px 8px',
                                borderRadius: '6px',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                backgroundColor: '#ecfdf5',
                                color: '#059669',
                              }}
                            >
                              {item.action}
                            </span>
                          </td>
                          <td style={{ padding: '10px 14px', fontWeight: 600, color: '#1e293b' }}>
                            {item.userName || item.user || 'User'}
                          </td>
                          <td style={{ padding: '10px 14px', color: '#334155' }}>
                            {item.details || 'Excel (.xlsx) Lead records exported'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            /* Main Export Workflow */
            <>
              {/* Hierarchy & Permission Status Banner */}
              <div
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '16px',
                  border: '1px solid #e2e8f0',
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '10px',
                      backgroundColor: isSuperAdmin ? '#fef3c7' : '#ecfdf5',
                      color: isSuperAdmin ? '#b45309' : '#047857',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {isSuperAdmin ? <Crown size={18} /> : <UserCheck size={18} />}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a' }}>
                      Security & Permission Scope: {isSuperAdmin ? 'Super Admin' : user?.role || 'User'}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                      {isSuperAdmin
                        ? 'Full organization-wide export clearance. All accessible records included.'
                        : 'Scoped to your subordinate hierarchy & directly assigned leads.'}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    padding: '4px 10px',
                    borderRadius: '8px',
                    backgroundColor: '#f1f5f9',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    color: '#475569',
                  }}
                >
                  Accessible Leads: <strong style={{ color: '#0f172a' }}>{totalLeads || 0}</strong>
                </div>
              </div>

              {/* Export Scope Selector */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '16px',
                }}
              >
                {/* Option 1: Filtered Selection */}
                <div
                  onClick={() => setExportScope('filtered')}
                  style={{
                    backgroundColor: exportScope === 'filtered' ? '#ecfdf5' : '#ffffff',
                    borderRadius: '16px',
                    border: `2px solid ${exportScope === 'filtered' ? '#059669' : '#e2e8f0'}`,
                    padding: '20px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Filter size={18} color={exportScope === 'filtered' ? '#059669' : '#64748b'} />
                      <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f172a' }}>
                        Current Filtered Leads
                      </span>
                    </div>
                    <input
                      type="radio"
                      name="leadExportScope"
                      checked={exportScope === 'filtered'}
                      onChange={() => setExportScope('filtered')}
                      style={{ accentColor: '#059669' }}
                    />
                  </div>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b', lineHeight: 1.4 }}>
                    Preserves your active search query, status filters, priority, source, and assignee criteria.
                  </p>
                  {hasActiveFilters && (
                    <div
                      style={{
                        marginTop: '6px',
                        padding: '6px 10px',
                        borderRadius: '8px',
                        backgroundColor: '#ffffff',
                        border: '1px solid #d1fae5',
                        fontSize: '0.72rem',
                        color: '#065f46',
                        fontWeight: 600,
                      }}
                    >
                      Active filters applied: {search ? `Search "${search}" ` : ''}
                      {statusFilter !== 'all' ? `Status: ${statusFilter} ` : ''}
                      {priorityFilter !== 'all' ? `Priority: ${priorityFilter} ` : ''}
                    </div>
                  )}
                </div>

                {/* Option 2: All Accessible Records */}
                <div
                  onClick={() => setExportScope('all')}
                  style={{
                    backgroundColor: exportScope === 'all' ? '#ecfdf5' : '#ffffff',
                    borderRadius: '16px',
                    border: `2px solid ${exportScope === 'all' ? '#059669' : '#e2e8f0'}`,
                    padding: '20px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Layers size={18} color={exportScope === 'all' ? '#059669' : '#64748b'} />
                      <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f172a' }}>
                        All Accessible Leads
                      </span>
                    </div>
                    <input
                      type="radio"
                      name="leadExportScope"
                      checked={exportScope === 'all'}
                      onChange={() => setExportScope('all')}
                      style={{ accentColor: '#059669' }}
                    />
                  </div>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b', lineHeight: 1.4 }}>
                    Exports all lead records permitted by your organizational role without applying active search filters.
                  </p>
                  <div
                    style={{
                      marginTop: '6px',
                      padding: '6px 10px',
                      borderRadius: '8px',
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      fontSize: '0.72rem',
                      color: '#475569',
                      fontWeight: 600,
                    }}
                  >
                    Hierarchy Scoped ({totalLeads || 0} total leads)
                  </div>
                </div>
              </div>

              {/* Export Field Blueprint Preview */}
              <div
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '16px',
                  border: '1px solid #e2e8f0',
                  padding: '18px 22px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#0f172a' }}>
                  Excel Columns Included in `.xlsx` File
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                    gap: '8px',
                  }}
                >
                  {[
                    'Lead ID',
                    'Full Name',
                    'Email Address',
                    'Phone Number',
                    'Company Name',
                    'Lead Status',
                    'Priority Level',
                    'Lead Source',
                    'Lead Value ($)',
                    'Assigned To',
                    'Created Date',
                    'Last Updated',
                  ].map((field, fIdx) => (
                    <div
                      key={fIdx}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '8px',
                        backgroundColor: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: '#334155',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <CheckCircle2 size={13} color="#059669" />
                      <span>{field}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '4px' }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '10px',
                    backgroundColor: '#f1f5f9',
                    color: '#475569',
                    border: '1px solid #e2e8f0',
                    fontWeight: 700,
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={exportLoading}
                  onClick={handleExecuteExport}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 24px',
                    borderRadius: '10px',
                    backgroundColor: '#059669',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '0.86rem',
                    cursor: exportLoading ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 14px rgba(5, 150, 105, 0.3)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {exportLoading ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      <span>Generating Excel File...</span>
                    </>
                  ) : (
                    <>
                      <Download size={16} />
                      <span>Download Excel Workbook (.xlsx)</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeadExportModal;
