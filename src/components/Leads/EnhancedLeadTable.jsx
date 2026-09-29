import React from 'react';
import { useLeads } from '../../context/LeadContext';
import { useUserManagement } from '../../context/UserContext';
import {
  PhoneCall,
  Edit2,
  Trash2,
  Sparkles,
  Clock,
  Eye,
  Plus,
  Search,
  RotateCcw,
  CheckCircle2,
  Calendar,
  User,
  Filter,
  ArrowUpDown,
  Building,
  AlertCircle,
  Tag,
  Shield,
  Layers,
} from 'lucide-react';

export const EnhancedLeadTable = () => {
  const {
    paginatedLeads,
    totalLeads,
    currentPage,
    totalPages,
    setCurrentPage,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    priorityFilter,
    setPriorityFilter,
    sourceFilter,
    setSourceFilter,
    assignedToFilter,
    setAssignedToFilter,
    managerFilter,
    setManagerFilter,
    conversionStatusFilter,
    setConversionStatusFilter,
    followUpDateFilter,
    setFollowUpDateFilter,
    clearAllFilters,
    openCreateModal,
    openEditModal,
    openLeadDetailModal,
    openAddCallModal,
    openScheduleFollowUpModal,
    openQualifyModal,
    openConvertModal,
    openDeleteModal,
  } = useLeads();

  const { users } = useUserManagement();

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Converted':
        return { bg: '#f5f3ff', color: '#7c3aed', border: '#ddd6fe', label: 'Converted' };
      case 'Qualified':
        return { bg: '#ecfdf5', color: '#059669', border: '#a7f3d0', label: 'Qualified' };
      case 'Interested':
        return { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0', label: 'Interested' };
      case 'Follow-Up':
      case 'Follow_Up':
        return { bg: '#fffbeb', color: '#d97706', border: '#fde68a', label: 'Follow-Up' };
      case 'Contacted':
        return { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe', label: 'Contacted' };
      case 'Not Interested':
        return { bg: '#fef2f2', color: '#dc2626', border: '#fecaca', label: 'Not Interested' };
      case 'Invalid':
        return { bg: '#f8fafc', color: '#64748b', border: '#e2e8f0', label: 'Invalid' };
      default:
        return { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe', label: status || 'New' };
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'Urgent':
      case 'High':
        return { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' };
      case 'Medium':
        return { bg: '#fffbeb', color: '#d97706', border: '#fde68a' };
      default:
        return { bg: '#f1f5f9', color: '#64748b', border: '#e2e8f0' };
    }
  };

  const formatCurrency = (val) => {
    if (!val && val !== 0) return '₹0';
    return `₹${Number(val).toLocaleString()}`;
  };

  return (
    <div
      className="enhanced-lead-table-container"
      style={{
        background: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Main Responsive Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
              <th style={{ padding: '12px 14px', width: '90px' }}>LEAD ID</th>
              <th style={{ padding: '12px 14px' }}>COMPANY</th>
              <th style={{ padding: '12px 14px' }}>CONTACT</th>
              <th style={{ padding: '12px 14px' }}>STATUS</th>
              <th style={{ padding: '12px 14px' }}>ASSIGNED TO</th>
              <th style={{ padding: '12px 14px' }}>LAST CONTACT</th>
              <th style={{ padding: '12px 14px' }}>NEXT FOLLOW-UP</th>
              <th style={{ padding: '12px 14px' }}>VALUE</th>
              <th style={{ padding: '12px 14px', textAlign: 'center', minWidth: '220px' }}>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {paginatedLeads.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ padding: '48px 16px', textAlign: 'center', color: '#94a3b8' }}>
                  <AlertCircle size={28} color="#cbd5e1" style={{ marginBottom: '6px' }} />
                  <div style={{ fontWeight: 700, color: '#475569' }}>No leads matching your current criteria.</div>
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="btn btn-secondary"
                    style={{ marginTop: '12px', fontSize: '0.78rem' }}
                  >
                    Reset Filters
                  </button>
                </td>
              </tr>
            ) : (
              paginatedLeads.map((lead) => {
                const statusBadge = getStatusBadge(lead.status);
                const priorityBadge = getPriorityBadge(lead.priority);
                const isConverted = lead.status === 'Converted' || !!lead.opportunityId || !!lead.convertedOpportunityId;
                const canConvert = !isConverted && (lead.status === 'Qualified' || lead.status === 'Interested');
                const canQualify = !isConverted && lead.status !== 'Qualified' && lead.status !== 'Lost' && lead.status !== 'Invalid';

                return (
                  <tr
                    key={lead._id || lead.lead_id || lead.leadId}
                    style={{
                      borderBottom: '1px solid #f1f5f9',
                      background: isConverted ? '#faf5ff' : '#ffffff',
                      transition: 'background 0.15s ease',
                    }}
                  >
                    {/* 1. Lead ID */}
                    <td style={{ padding: '12px 14px' }}>
                      <span
                        style={{
                          fontWeight: 800,
                          fontSize: '0.78rem',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          background: '#eff6ff',
                          color: '#2563eb',
                          border: '1px solid #bfdbfe',
                          display: 'inline-block',
                        }}
                      >
                        {lead.leadId || 'LD-001'}
                      </span>
                    </td>

                    {/* 2. Company */}
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.88rem' }}>
                        {lead.company || 'Enterprise Account'}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                        Source: {lead.source || lead.campaign_source || 'Website'}
                      </div>
                    </td>

                    {/* 3. Contact */}
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontWeight: 600, color: '#1e293b' }}>
                        {lead.contactPerson || lead.name}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                        {lead.mobileNumber || lead.phone || lead.email || 'No phone'}
                      </div>
                    </td>

                    {/* 4. Status */}
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: '6px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            background: statusBadge.bg,
                            color: statusBadge.color,
                            border: `1px solid ${statusBadge.border}`,
                          }}
                        >
                          {statusBadge.label}
                        </span>

                        {lead.priority && (
                          <span
                            style={{
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '0.68rem',
                              fontWeight: 600,
                              background: priorityBadge.bg,
                              color: priorityBadge.color,
                              border: `1px solid ${priorityBadge.border}`,
                            }}
                          >
                            {lead.priority}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 5. Assigned To */}
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ color: '#1e293b', fontWeight: 600, fontSize: '0.82rem' }}>
                        {lead.assignedSalesUser || lead.assignedTo || 'Unassigned'}
                      </div>
                      {lead.assignedManagerName && (
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                          Mgr: {lead.assignedManagerName}
                        </div>
                      )}
                    </td>

                    {/* 6. Last Contact */}
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontSize: '0.78rem', color: lead.lastContactDate ? '#334155' : '#94a3b8' }}>
                        {lead.lastContactDate || lead.last_contacted_at
                          ? new Date(lead.lastContactDate || lead.last_contacted_at).toLocaleDateString('en-GB')
                          : 'Not contacted'}
                      </div>
                      {lead.callLogs && lead.callLogs.length > 0 && (
                        <button
                          type="button"
                          onClick={() => openLeadDetailModal(lead, 'calls')}
                          title="Click to view complete call history, duration, and remarks"
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            margin: '2px 0 0 0',
                            fontSize: '0.68rem',
                            color: '#2563eb',
                            fontWeight: 700,
                            cursor: 'pointer',
                            textDecoration: 'underline',
                            textUnderlineOffset: '2px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                          }}
                        >
                          <span>{lead.callLogs.length} call{lead.callLogs.length > 1 ? 's' : ''} logged</span>
                        </button>
                      )}
                    </td>

                    {/* 7. Next Follow-Up */}
                    <td style={{ padding: '12px 14px' }}>
                      {lead.nextFollowUpDate || lead.next_followup_at ? (
                        <div>
                          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#b45309' }}>
                            {new Date(lead.nextFollowUpDate || lead.next_followup_at).toLocaleDateString('en-GB')}
                          </div>
                          {lead.nextFollowUpTime && (
                            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                              {lead.nextFollowUpTime}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>No follow-up</span>
                      )}
                    </td>

                    {/* 8. Value */}
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontWeight: 800, color: '#059669', fontSize: '0.86rem' }}>
                        {formatCurrency(lead.estimatedValue || lead.dealValue || lead.pipeline_value)}
                      </div>
                    </td>

                    {/* 9. Action: View | Edit | Add Call | Follow-Up | Convert | Delete (Icon-only Signs) */}
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '5px', flexWrap: 'nowrap' }}>
                        {/* 1. View Sign */}
                        <button
                          type="button"
                          onClick={() => openLeadDetailModal(lead)}
                          title="View Lead Details"
                          style={{
                            width: '28px',
                            height: '28px',
                            padding: 0,
                            borderRadius: '6px',
                            background: '#f1f5f9',
                            border: '1px solid #cbd5e1',
                            color: '#334155',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <Eye size={14} />
                        </button>

                        {/* 2. Edit Sign */}
                        <button
                          type="button"
                          onClick={() => openEditModal(lead)}
                          title="Edit Lead"
                          style={{
                            width: '28px',
                            height: '28px',
                            padding: 0,
                            borderRadius: '6px',
                            background: '#ffffff',
                            border: '1px solid #cbd5e1',
                            color: '#475569',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <Edit2 size={13} />
                        </button>

                        {/* 3. Add Call Sign */}
                        <button
                          type="button"
                          onClick={() => openAddCallModal(lead)}
                          title="Record Call / Communication Log"
                          style={{
                            width: '28px',
                            height: '28px',
                            padding: 0,
                            borderRadius: '6px',
                            background: '#eff6ff',
                            border: '1px solid #bfdbfe',
                            color: '#1d4ed8',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <PhoneCall size={13} />
                        </button>

                        {/* 4. Follow-Up Sign */}
                        <button
                          type="button"
                          onClick={() => openScheduleFollowUpModal(lead)}
                          title="Schedule Follow-Up"
                          style={{
                            width: '28px',
                            height: '28px',
                            padding: 0,
                            borderRadius: '6px',
                            background: '#fffbeb',
                            border: '1px solid #fde68a',
                            color: '#b45309',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <Clock size={13} />
                        </button>

                        {/* 5. Convert / Qualify Sign */}
                        {isConverted ? (
                          <span
                            title={`Already Converted to Opportunity (${lead.opportunityId || 'OP-001'})`}
                            style={{
                              width: '28px',
                              height: '28px',
                              padding: 0,
                              borderRadius: '6px',
                              background: '#ede9fe',
                              border: '1px solid #ddd6fe',
                              color: '#6d28d9',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <CheckCircle2 size={14} />
                          </span>
                        ) : canConvert ? (
                          <button
                            type="button"
                            onClick={() => openConvertModal(lead)}
                            title="Convert Qualified Lead to Opportunity"
                            style={{
                              width: '28px',
                              height: '28px',
                              padding: 0,
                              borderRadius: '6px',
                              background: '#059669',
                              border: 'none',
                              color: '#ffffff',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: '0 1px 2px rgba(5, 150, 105, 0.25)',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <Sparkles size={14} />
                          </button>
                        ) : canQualify ? (
                          <button
                            type="button"
                            onClick={() => openQualifyModal(lead)}
                            title="Qualify Lead (Prepare for Opportunity Pipeline)"
                            style={{
                              width: '28px',
                              height: '28px',
                              padding: 0,
                              borderRadius: '6px',
                              background: '#ecfdf5',
                              border: '1px solid #a7f3d0',
                              color: '#059669',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <CheckCircle2 size={13} />
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled
                            title="Convert (Disabled: Lead is marked as Lost)"
                            style={{
                              width: '28px',
                              height: '28px',
                              padding: 0,
                              borderRadius: '6px',
                              background: '#f1f5f9',
                              border: '1px solid #e2e8f0',
                              color: '#94a3b8',
                              cursor: 'not-allowed',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Sparkles size={13} />
                          </button>
                        )}

                        {/* 6. Delete Sign */}
                        <button
                          type="button"
                          onClick={() => openDeleteModal(lead)}
                          title="Delete Lead"
                          style={{
                            width: '28px',
                            height: '28px',
                            padding: 0,
                            borderRadius: '6px',
                            background: '#fef2f2',
                            border: '1px solid #fecaca',
                            color: '#dc2626',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div
        style={{
          padding: '12px 20px',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px',
          background: '#ffffff',
        }}
      >
        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
          Showing <strong>{paginatedLeads.length}</strong> of <strong>{totalLeads}</strong> leads
        </span>

        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              style={{ fontSize: '0.78rem', padding: '4px 10px' }}
            >
              Previous
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setCurrentPage(p)}
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '6px',
                  border: currentPage === p ? 'none' : '1px solid #e2e8f0',
                  background: currentPage === p ? '#2563eb' : '#ffffff',
                  color: currentPage === p ? '#ffffff' : '#334155',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {p}
              </button>
            ))}

            <button
              type="button"
              className="btn btn-secondary"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              style={{ fontSize: '0.78rem', padding: '4px 10px' }}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
