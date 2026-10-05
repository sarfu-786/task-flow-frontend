import React, { useState, useEffect } from 'react';
import { complaintApi } from '../../services/api';
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
  Layers,
  Crown,
  UserCheck,
  FileText,
  BarChart3,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';

// ============================================================================
// DYNAMIC COLUMN BLUEPRINTS BY REPORT & RAW EXPORT
// ============================================================================
const MIS_REPORT_COLUMNS = {
  'MIS-C01': ['Ticket ID', 'Customer Name', 'Organization', 'Subject', 'Category', 'Priority', 'Severity', 'Status', 'Assigned To', 'Created Date'],
  'MIS-C02': ['Ticket ID', 'Customer Name', 'Subject', 'Category', 'Priority', 'Severity', 'Age (Hours)', 'Age (Days)', 'Status', 'Assignee'],
  'MIS-C03': ['Ticket ID', 'Customer Name', 'Priority', 'SLA Target (Hours)', 'SLA Status', 'SLA Deadline', 'Resolved Date', 'Assigned To'],
  'MIS-C04': ['Ticket ID', 'Customer Name', 'Subject', 'Priority', 'First Response Target', 'SLA Status', 'Assigned To'],
  'MIS-C05': ['Ticket ID', 'Customer Name', 'Category', 'Priority', 'Resolution Time (Hrs)', 'SLA Target (Hrs)', 'Result (Met/Breached)', 'Resolved By'],
  'MIS-C06': ['Category', 'Sub-Category', 'Ticket Volume', 'Resolved Count', 'Breached Count', 'Percentage Share %'],
  'MIS-C07': ['Severity Level', 'Urgent (4h SLA)', 'High (12h SLA)', 'Medium (24h SLA)', 'Low (48h SLA)', 'Total Volume'],
  'MIS-C08': ['Coordinator / Agent', 'Total Assigned', 'In Progress', 'Resolved', 'SLA Breached', 'Resolution Rate %', 'Avg CSAT ★'],
  'MIS-C09': ['Team / Department', 'Total Inflow', 'Resolved Count', 'Active Workload', 'SLA Breaches', 'Efficiency Rate %'],
  'MIS-C10': ['Ticket ID', 'Customer Name', 'Subject', 'Priority', 'Severity', 'Coordinator', 'Escalation Trigger', 'Status'],
  'MIS-C11': ['Resolution Code / Disposition', 'Closure Classification', 'Frequency Count', 'Percentage Share %'],
  'MIS-C12': ['Ticket ID', 'Customer Name', 'Category', 'Root Cause', 'Corrective Action (CAPA)', 'Preventive Action', 'Resolved Date'],
  'MIS-C13': ['Ticket ID', 'Customer Name', 'Subject', 'Reopen Count', 'Reopen Reason', 'Assigned Coordinator', 'Status'],
  'MIS-C15': ['Customer Account', 'Company', 'Total Tickets', 'Active Backlog', 'Resolved Count', 'SLA Breached', 'Resolution Rate %'],
  'MIS-C16': ['Product / Service Domain', 'Defect Count', 'Critical Severity', 'Resolved Count'],
  'MIS-C18': ['Ticket ID', 'Customer Name', 'CSAT Rating (1-5★)', 'Customer Feedback / Notes', 'Handled By'],
  'MIS-C20': ['Ticket ID', 'Customer Name', 'Severity', 'Priority', 'Exception Flag', 'Assigned Coordinator', 'Status'],
};

const STANDARD_TICKET_COLUMNS = [
  'Ticket Number',
  'Customer Name',
  'Email',
  'Phone',
  'Company',
  'Subject',
  'Category',
  'Sub Category',
  'Priority Level',
  'Severity Level',
  'Status',
  'SLA Status',
  'SLA Deadline',
  'Assigned To',
  'Team',
  'Created Date',
  'Resolved Date',
];

export const ComplaintExportModal = ({
  isOpen,
  onClose,
  activeReportId = 'MIS-C01',
  activeReportTitle = 'Volume & Inflow MIS',
  activeFilters = {},
}) => {
  const { user, isSuperAdmin, isManager, userRoles } = useAuth();

  const [activeView, setActiveView] = useState('export'); // 'export' | 'history'
  const [exportScope, setExportScope] = useState('active_report'); // 'active_report' | 'filtered_tickets' | 'all'
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
      const res = await complaintApi.getComplaintExcelHistory();
      if (res && res.success) {
        const exports = (res.history || []).filter(
          (h) => h.action === 'EXPORT_EXCEL' || (h.details && h.details.includes('Export'))
        );
        setHistoryData(exports);
      }
    } catch (err) {
      console.error('[ComplaintExportModal] Load History Error:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleExecuteExport = async () => {
    try {
      setExportLoading(true);
      setStatusMessage(null);

      if (exportScope === 'active_report') {
        // Direct download of the active MIS report calculated dataset (.xlsx)
        const exportUrl = complaintApi.getComplaintMISExportUrl(activeReportId, 'xlsx');
        window.open(exportUrl, '_blank');
        setStatusMessage({
          type: 'success',
          text: `MIS Report "${activeReportTitle}" workbook generated successfully (.xlsx)`,
        });
      } else {
        // Export raw complaint records (filtered or all authorized)
        const exportParams = {
          scope: exportScope === 'filtered_tickets' ? 'filtered' : 'all',
          startDate: activeFilters.startDate || '',
          endDate: activeFilters.endDate || '',
          status: activeFilters.status !== 'all' ? activeFilters.status : '',
          category: activeFilters.category !== 'all' ? activeFilters.category : '',
          priority: activeFilters.priority !== 'all' ? activeFilters.priority : '',
          severity: activeFilters.severity !== 'all' ? activeFilters.severity : '',
          search: activeFilters.search || '',
        };

        const blob = await complaintApi.exportComplaintExcel(exportParams);
        if (!blob || blob.size === 0) {
          throw new Error('No authorized records available for export.');
        }

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const dateStr = new Date().toISOString().slice(0, 10);
        const filePrefix = exportScope === 'filtered_tickets' ? 'Filtered_Complaints' : 'Authorized_Complaints';
        a.download = `${filePrefix}_${dateStr}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        setStatusMessage({
          type: 'success',
          text: exportScope === 'filtered_tickets'
            ? 'Filtered complaint tickets exported successfully (.xlsx)'
            : 'All authorized complaint tickets exported successfully (.xlsx)',
        });
      }
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Failed to export complaints to Excel.',
      });
    } finally {
      setExportLoading(false);
    }
  };

  if (!isOpen) return null;

  // Dynamic Security Scope Computation across Super Admin, Manager, and User
  const isSuperAdminRole = isSuperAdmin || user?.role === 'Super Admin' || (Array.isArray(userRoles) && userRoles.includes('Super Admin'));
  const isManagerRole = !isSuperAdminRole && (isManager || ['Manager', 'Executive', 'Administrator', 'Team Lead'].includes(user?.role) || (Array.isArray(userRoles) && userRoles.some((r) => ['Manager', 'Executive', 'Administrator', 'Team Lead'].includes(r))));

  let securityScopeTitle = 'Security Scope: User — Authorized Records';
  let securityScopeDescription = 'Restricted strictly to your directly assigned records and authorized hierarchy scope.';
  let SecurityIcon = UserCheck;
  let scopeBadgeColor = '#2563eb';
  let scopeBadgeBg = '#eff6ff';

  if (isSuperAdminRole) {
    securityScopeTitle = 'Security Scope: Super Admin (Organization-wide)';
    securityScopeDescription = 'Full organizational clearance. Export includes records across all departments and workspaces.';
    SecurityIcon = Crown;
    scopeBadgeColor = '#b45309';
    scopeBadgeBg = '#fef3c7';
  } else if (isManagerRole) {
    securityScopeTitle = 'Security Scope: Manager — Self + Subordinate Hierarchy';
    securityScopeDescription = 'Restricted strictly to your own assigned records and your direct/indirect subordinate hierarchy.';
    SecurityIcon = ShieldCheck;
    scopeBadgeColor = '#047857';
    scopeBadgeBg = '#ecfdf5';
  }

  // Dynamic Excel Columns Included
  const activeColumns =
    exportScope === 'active_report'
      ? (MIS_REPORT_COLUMNS[activeReportId] || STANDARD_TICKET_COLUMNS)
      : STANDARD_TICKET_COLUMNS;

  // Dynamic Download Button Text
  let downloadButtonLabel = 'Download MIS Workbook (.xlsx)';
  if (exportScope === 'filtered_tickets') {
    downloadButtonLabel = 'Download Filtered Tickets (.xlsx)';
  } else if (exportScope === 'all') {
    downloadButtonLabel = 'Download Authorized Tickets (.xlsx)';
  }

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
          borderRadius: '20px',
          width: '100%',
          maxWidth: '860px',
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.3)',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          animation: 'slideUp 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(to right, #ffffff, #f8fafc)',
            flexWrap: 'wrap',
            gap: '12px',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                backgroundColor: '#eff6ff',
                color: '#2563eb',
                border: '1.5px solid #bfdbfe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 3px 10px rgba(37, 99, 235, 0.12)',
                flexShrink: 0,
              }}
            >
              <Download size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h2
                  style={{
                    margin: 0,
                    fontSize: '1.15rem',
                    fontWeight: 800,
                    color: '#0f172a',
                    letterSpacing: '-0.01em',
                  }}
                >
                  Export Complaints to Excel
                </h2>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '2px 8px',
                    borderRadius: '999px',
                    backgroundColor: '#eff6ff',
                    color: '#2563eb',
                    border: '1px solid #bfdbfe',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                  }}
                >
                  .xlsx Only
                </span>
              </div>
              <p style={{ margin: '1px 0 0 0', fontSize: '0.78rem', color: '#64748b' }}>
                Export active MIS report calculations or hierarchy-scoped complaint tickets to an .xlsx workbook.
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
                gap: '5px',
                padding: '6px 12px',
                borderRadius: '8px',
                backgroundColor: activeView === 'history' ? '#eff6ff' : '#f8fafc',
                color: activeView === 'history' ? '#2563eb' : '#475569',
                border: `1px solid ${activeView === 'history' ? '#bfdbfe' : '#e2e8f0'}`,
                fontWeight: 700,
                fontSize: '0.78rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <History size={13} />
              <span>{activeView === 'history' ? 'Back to Export' : 'Export History'}</span>
            </button>

            {/* Separator */}
            <div style={{ width: '1px', height: '20px', backgroundColor: '#e2e8f0', margin: '0 2px' }} />

            {/* Dedicated Close Button */}
            <button
              type="button"
              onClick={onClose}
              id="btn-close-complaint-export-modal"
              style={{
                width: '32px',
                height: '32px',
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
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div
          style={{
            padding: '20px 24px',
            backgroundColor: '#f8fafc',
            overflowY: 'auto',
            flex: '1 1 auto',
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {/* Status Alert */}
          {statusMessage && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                backgroundColor: statusMessage.type === 'success' ? '#ecfdf5' : '#fef2f2',
                color: statusMessage.type === 'success' ? '#065f46' : '#991b1b',
                border: `1px solid ${statusMessage.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
                fontSize: '0.82rem',
                fontWeight: 600,
              }}
            >
              {statusMessage.type === 'success' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {activeView === 'history' ? (
            /* History View */
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '14px',
                border: '1px solid #e2e8f0',
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '0.94rem', fontWeight: 800, color: '#0f172a' }}>
                    Complaint Export Audit History
                  </h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.76rem', color: '#64748b' }}>
                    Log of Excel (.xlsx) complaint exports requested by users within authorized hierarchy.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={loadHistory}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '5px 10px',
                    borderRadius: '6px',
                    backgroundColor: '#f1f5f9',
                    border: '1px solid #e2e8f0',
                    color: '#475569',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <RefreshCw size={12} className={historyLoading ? 'animate-spin' : ''} />
                  <span>Refresh</span>
                </button>
              </div>

              {historyLoading ? (
                <div style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
                  <RefreshCw size={22} className="animate-spin" style={{ margin: '0 auto 6px auto', color: '#2563eb' }} />
                  <div style={{ fontSize: '0.82rem' }}>Loading export history...</div>
                </div>
              ) : historyData.length === 0 ? (
                <div
                  style={{
                    padding: '36px',
                    textAlign: 'center',
                    color: '#94a3b8',
                    backgroundColor: '#f8fafc',
                    borderRadius: '10px',
                    fontSize: '0.82rem',
                  }}
                >
                  No Complaint Excel exports logged yet.
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <th style={{ padding: '8px 12px', textAlign: 'left', color: '#475569', fontWeight: 700 }}>Timestamp</th>
                        <th style={{ padding: '8px 12px', textAlign: 'left', color: '#475569', fontWeight: 700 }}>Action</th>
                        <th style={{ padding: '8px 12px', textAlign: 'left', color: '#475569', fontWeight: 700 }}>Exported By</th>
                        <th style={{ padding: '8px 12px', textAlign: 'left', color: '#475569', fontWeight: 700 }}>Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyData.map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '8px 12px', color: '#64748b', whiteSpace: 'nowrap' }}>
                            {item.timestamp ? new Date(item.timestamp).toLocaleString() : '—'}
                          </td>
                          <td style={{ padding: '8px 12px' }}>
                            <span
                              style={{
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                backgroundColor: '#eff6ff',
                                color: '#2563eb',
                              }}
                            >
                              {item.action}
                            </span>
                          </td>
                          <td style={{ padding: '8px 12px', fontWeight: 600, color: '#1e293b' }}>
                            {item.userName || item.user || 'User'}
                          </td>
                          <td style={{ padding: '8px 12px', color: '#334155' }}>
                            {item.details || 'Excel (.xlsx) Complaint records exported'}
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
              {/* Dynamic Security & Scope Banner */}
              <div
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '14px',
                  border: '1px solid #e2e8f0',
                  padding: '14px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '8px',
                      backgroundColor: scopeBadgeBg,
                      color: scopeBadgeColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <SecurityIcon size={16} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#0f172a' }}>
                      {securityScopeTitle}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      {securityScopeDescription}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    padding: '3px 8px',
                    borderRadius: '6px',
                    backgroundColor: '#eff6ff',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: '#2563eb',
                    border: '1px solid #bfdbfe',
                  }}
                >
                  Active MIS: {activeReportId}
                </div>
              </div>

              {/* 3 Existing Export Options */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '12px',
                }}
              >
                {/* Option 1: Current MIS Report Dataset */}
                <div
                  onClick={() => setExportScope('active_report')}
                  style={{
                    backgroundColor: exportScope === 'active_report' ? '#eff6ff' : '#ffffff',
                    borderRadius: '14px',
                    border: `2px solid ${exportScope === 'active_report' ? '#2563eb' : '#e2e8f0'}`,
                    padding: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                      <BarChart3 size={16} color={exportScope === 'active_report' ? '#2563eb' : '#64748b'} />
                      <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a' }}>
                        Current MIS Report Dataset
                      </span>
                    </div>
                    <input
                      type="radio"
                      name="complaintExportScope"
                      checked={exportScope === 'active_report'}
                      onChange={() => setExportScope('active_report')}
                      style={{ accentColor: '#2563eb' }}
                    />
                  </div>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b', lineHeight: 1.4 }}>
                    Exports calculated statistics, breakdown tables and audit metrics for the active report: <strong>{activeReportTitle}</strong>.
                  </p>
                </div>

                {/* Option 2: Filtered Tickets List */}
                <div
                  onClick={() => setExportScope('filtered_tickets')}
                  style={{
                    backgroundColor: exportScope === 'filtered_tickets' ? '#eff6ff' : '#ffffff',
                    borderRadius: '14px',
                    border: `2px solid ${exportScope === 'filtered_tickets' ? '#2563eb' : '#e2e8f0'}`,
                    padding: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                      <Filter size={16} color={exportScope === 'filtered_tickets' ? '#2563eb' : '#64748b'} />
                      <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a' }}>
                        Filtered Tickets List
                      </span>
                    </div>
                    <input
                      type="radio"
                      name="complaintExportScope"
                      checked={exportScope === 'filtered_tickets'}
                      onChange={() => setExportScope('filtered_tickets')}
                      style={{ accentColor: '#2563eb' }}
                    />
                  </div>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b', lineHeight: 1.4 }}>
                    Exports complaint tickets matching all currently applied filters.
                  </p>
                </div>

                {/* Option 3: All Authorized Tickets */}
                <div
                  onClick={() => setExportScope('all')}
                  style={{
                    backgroundColor: exportScope === 'all' ? '#eff6ff' : '#ffffff',
                    borderRadius: '14px',
                    border: `2px solid ${exportScope === 'all' ? '#2563eb' : '#e2e8f0'}`,
                    padding: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                      <Layers size={16} color={exportScope === 'all' ? '#2563eb' : '#64748b'} />
                      <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a' }}>
                        All Authorized Tickets
                      </span>
                    </div>
                    <input
                      type="radio"
                      name="complaintExportScope"
                      checked={exportScope === 'all'}
                      onChange={() => setExportScope('all')}
                      style={{ accentColor: '#2563eb' }}
                    />
                  </div>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b', lineHeight: 1.4 }}>
                    Exports all complaint tickets within your authorized workspace and hierarchy scope, without applying the current report filters.
                  </p>
                </div>
              </div>

              {/* Dynamic Excel Columns Included */}
              <div
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '14px',
                  border: '1px solid #e2e8f0',
                  padding: '16px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a' }}>
                    Excel Columns Included ({activeColumns.length} fields)
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                    {exportScope === 'active_report' ? `Calculated from [${activeReportId}]` : 'Raw Complaint Record Fields'}
                  </span>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                    gap: '6px',
                  }}
                >
                  {activeColumns.map((field, fIdx) => (
                    <div
                      key={fIdx}
                      style={{
                        padding: '5px 8px',
                        borderRadius: '6px',
                        backgroundColor: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        color: '#334155',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                      title={field}
                    >
                      <CheckCircle2 size={12} color="#2563eb" style={{ flexShrink: 0 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{field}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '2px' }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    backgroundColor: '#f1f5f9',
                    color: '#475569',
                    border: '1px solid #e2e8f0',
                    fontWeight: 700,
                    fontSize: '0.8rem',
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
                    gap: '6px',
                    padding: '8px 20px',
                    borderRadius: '8px',
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: exportLoading ? 'not-allowed' : 'pointer',
                    boxShadow: '0 3px 10px rgba(37, 99, 235, 0.25)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {exportLoading ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Generating Excel File...</span>
                    </>
                  ) : (
                    <>
                      <Download size={14} />
                      <span>{downloadButtonLabel}</span>
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

export default ComplaintExportModal;
