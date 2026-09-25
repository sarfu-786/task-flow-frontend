import React from 'react';
import { useOpportunities, STAGES } from '../../context/OpportunityContext';
import {
  Building,
  DollarSign,
  Calendar,
  User as UserIcon,
  Link,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

export const OpportunityTable = () => {
  const {
    filteredOpportunities,
    paginatedOpportunities,
    currentPage,
    setCurrentPage,
    totalPages,
    itemsPerPage,
    loading,
    updateOpportunityStage,
    openEditModal,
    openDeleteModal,
    openCreateModal,
  } = useOpportunities();

  const getStageBadge = (opp) => {
    const stage = opp.stage || 'Qualification';
    const stageConfig = {
      Qualification: { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe', dot: '#2563eb' },
      Proposal: { bg: '#eef2ff', color: '#4338ca', border: '#c7d2fe', dot: '#6366f1' },
      Negotiation: { bg: '#fffbeb', color: '#b45309', border: '#fde68a', dot: '#d97706' },
      Won: { bg: '#ecfdf5', color: '#047857', border: '#a7f3d0', dot: '#059669' },
      Lost: { bg: '#fef2f2', color: '#b91c1c', border: '#fecaca', dot: '#dc2626' },
    };

    const nextStageMap = {
      Qualification: 'Proposal',
      Proposal: 'Negotiation',
      Negotiation: 'Won',
      Won: 'Qualification',
      Lost: 'Qualification',
    };

    const config = stageConfig[stage] || stageConfig.Qualification;

    return (
      <button
        type="button"
        onClick={() => updateOpportunityStage(opp._id, nextStageMap[stage] || 'Qualification')}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 10px',
          borderRadius: '999px',
          fontSize: '0.75rem',
          fontWeight: 600,
          background: config.bg,
          color: config.color,
          border: `1px solid ${config.border}`,
          cursor: 'pointer',
        }}
        title={`Click to advance stage to ${nextStageMap[stage]}`}
      >
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: config.dot }} />
        <span>{stage}</span>
      </button>
    );
  };

  const formatAmount = (num) => {
    if (!num && num !== 0) return '₹0';
    return `₹${Number(num).toLocaleString('en-IN')}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'High':
        return (
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#dc2626', background: '#fef2f2', padding: '2px 8px', borderRadius: '6px', border: '1px solid #fee2e2' }}>
            High
          </span>
        );
      case 'Medium':
        return (
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#d97706', background: '#fffbeb', padding: '2px 8px', borderRadius: '6px', border: '1px solid #fef3c7' }}>
            Medium
          </span>
        );
      case 'Low':
        return (
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', background: '#f1f5f9', padding: '2px 8px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
            Low
          </span>
        );
      default:
        return <span>{priority}</span>;
    }
  };

  return (
    <div
      className="table-container"
      style={{
        background: '#ffffff',
        borderRadius: '12px',
        border: '1px solid var(--border-color)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        overflow: 'hidden',
      }}
    >
      {loading ? (
        <div style={{ padding: '60px 20px', textAlign: 'center' }}>
          <div className="spinner-lg" style={{ margin: '0 auto 12px' }} />
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading Opportunities...</p>
        </div>
      ) : filteredOpportunities.length === 0 ? (
        <div style={{ padding: '60px 20px', textAlign: 'center' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              background: '#f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748b',
              margin: '0 auto 14px',
            }}
          >
            <TrendingUp size={24} />
          </div>
          <h4 style={{ margin: '0 0 6px', color: 'var(--text-primary)' }}>No Opportunities Found</h4>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Create an opportunity or convert a qualified lead to start building your revenue pipeline.
          </p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '50px', textAlign: 'center' }}>Sr.</th>
                <th>Opportunity / Deal</th>
                <th>Related Lead</th>
                <th>Amount (₹)</th>
                <th>Stage</th>
                <th>Probability</th>
                <th>Close Date</th>
                <th>Priority</th>
                <th>Owner</th>
                <th style={{ textAlign: 'right', minWidth: '90px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedOpportunities.map((opp, idx) => {
                const srNo = (currentPage - 1) * itemsPerPage + idx + 1;
                const prob = opp.probability !== undefined ? opp.probability : 20;

                return (
                  <tr key={opp._id || idx}>
                    {/* Sr No */}
                    <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--text-muted)' }}>
                      {srNo}
                    </td>

                    {/* Deal Name & Company */}
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                        {opp.name}
                      </div>
                      {opp.company && (
                        <div
                          style={{
                            fontSize: '0.78rem',
                            color: 'var(--text-secondary)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            marginTop: '2px',
                          }}
                        >
                          <Building size={12} color="#64748b" />
                          <span>{opp.company}</span>
                        </div>
                      )}
                    </td>

                    {/* Related Lead */}
                    <td>
                      {opp.relatedLeadName ? (
                        <span
                          style={{
                            fontSize: '0.75rem',
                            color: '#6366f1',
                            background: '#eef2ff',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <Link size={11} />
                          <span>{opp.relatedLeadName}</span>
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</span>
                      )}
                    </td>

                    {/* Amount */}
                    <td>
                      <div style={{ fontWeight: 800, color: '#059669', fontSize: '0.95rem' }}>
                        {formatAmount(opp.amount)}
                      </div>
                    </td>

                    {/* Stage */}
                    <td>{getStageBadge(opp)}</td>

                    {/* Probability */}
                    <td>
                      <div style={{ minWidth: '70px' }}>
                        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '3px' }}>
                          {prob}%
                        </div>
                        <div style={{ width: '100%', height: '4px', background: '#f1f5f9', borderRadius: '999px', overflow: 'hidden' }}>
                          <div style={{ width: `${prob}%`, height: '100%', background: '#2563eb', borderRadius: '999px' }} />
                        </div>
                      </div>
                    </td>

                    {/* Expected Close Date */}
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={12} color="#64748b" />
                        <span>{formatDate(opp.expectedCloseDate)}</span>
                      </div>
                    </td>

                    {/* Priority */}
                    <td>{getPriorityBadge(opp.priority)}</td>

                    {/* Owner */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: '#eff6ff',
                            color: '#2563eb',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {opp.assignedTo ? opp.assignedTo.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {opp.assignedTo || 'Unassigned'}
                        </span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          type="button"
                          className="btn-icon btn-sm"
                          onClick={() => openEditModal(opp)}
                          title="Edit Opportunity"
                          style={{ padding: '6px' }}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          type="button"
                          className="btn-icon btn-sm text-danger"
                          onClick={() => openDeleteModal(opp)}
                          title="Delete Opportunity"
                          style={{ padding: '6px' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Footer */}
      {filteredOpportunities.length > 0 && (
        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Showing <strong>{(currentPage - 1) * itemsPerPage + 1}</strong> to{' '}
            <strong>{Math.min(currentPage * itemsPerPage, filteredOpportunities.length)}</strong> of{' '}
            <strong>{filteredOpportunities.length}</strong> opportunities
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              style={{ padding: '5px 8px' }}
            >
              <ChevronLeft size={14} />
            </button>

            <span style={{ fontSize: '0.82rem', fontWeight: 600, padding: '0 8px' }}>
              Page {currentPage} of {totalPages}
            </span>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              style={{ padding: '5px 8px' }}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
