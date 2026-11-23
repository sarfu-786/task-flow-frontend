import React from 'react';
import { useOpportunities, STAGES, normalizeStage } from '../../context/OpportunityContext';
import { useProjects } from '../../context/ProjectContext';
import {
  Building,
  Calendar,
  Link as LinkIcon,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Search,
  RotateCcw,
  Rocket,
  Lock,
  CheckCircle2,
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
    search,
    setSearch,
    stageFilter,
    setStageFilter,
    priorityFilter,
    setPriorityFilter,
    updateOpportunityStage,
    openEditModal,
    openDeleteModal,
    openCreateModal,
    openLostReasonModal,
  } = useOpportunities();

  const {
    projects = [],
    openCreateModal: openCreateProjectModal,
    openDetailModal: openProjectDetailModal,
  } = useProjects ? useProjects() : {};

  const findLinkedProject = (opp) => {
    if (!Array.isArray(projects) || projects.length === 0 || !opp) return null;
    const oppRef = (opp.opportunityId || '').toLowerCase();
    const leadRef = (opp.originalLeadId || '').toLowerCase();
    const expectedName = `${opp.company || opp.name || ''} - delivery project`.toLowerCase().trim();

    return (
      projects.find((p) => {
        const desc = (p.description || '').toLowerCase();
        const pName = (p.name || p.title || '').toLowerCase().trim();
        const pOppId = (p.opportunityId || '').toLowerCase().trim();
        const pLeadId = (p.leadId || '').toLowerCase().trim();
        return (
          (oppRef && (pOppId === oppRef || desc.includes(oppRef))) ||
          (leadRef && (pLeadId === leadRef || desc.includes(leadRef))) ||
          (expectedName.length > 20 && pName === expectedName)
        );
      }) || null
    );
  };

  const handleStartProject = (opp) => {
    if (!openCreateProjectModal) return;
    const dealName = opp.company || opp.name || opp.opportunityName || 'Client';
    const contact = opp.contactPerson || opp.relatedLeadName || opp.contactName || '';
    const contactInfo = [opp.phone, opp.email].filter(Boolean).join(' / ');
    const refParts = [
      opp.opportunityId ? `Deal ${opp.opportunityId}` : '',
      opp.originalLeadId ? `Lead ${opp.originalLeadId}` : '',
    ]
      .filter(Boolean)
      .join(' • ');

    openCreateProjectModal({
      name: `${dealName} - Delivery Project`,
      client: opp.company || contact || 'Client',
      leadId: opp.originalLeadId || opp.leadId || '',
      opportunityId: opp.opportunityId || (opp._id ? opp._id.toString() : ''),
      budget: Number(opp.amount || opp.dealValue || 0),
      currency: 'INR',
      priority: opp.priority || 'Medium',
      status: 'Planning',
      description: `Initiated from Won Opportunity${refParts ? ` (${refParts})` : ''}.${contact ? ` Primary Contact: ${contact}${contactInfo ? ` (${contactInfo})` : ''}.` : ''}${opp.notes ? ` Notes: ${opp.notes}` : ''}`,
    });
  };

  const STAGE_SHORT_LABELS = {
    'New Opportunity': 'New Deal',
    Contacted: 'Contacted',
    'Requirement Understanding': 'Requirements',
    'Proposal / Quotation': 'Proposal',
    Negotiation: 'Negotiation',
    Won: 'Won 🏆',
    Lost: 'Lost',
  };

  const getStageColor = (stage) => {
    const s = normalizeStage ? normalizeStage(stage) : stage;
    const map = {
      'New Opportunity': { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
      Contacted: { bg: '#f0f9ff', color: '#0284c7', border: '#bae6fd' },
      'Requirement Understanding': { bg: '#eef2ff', color: '#4338ca', border: '#c7d2fe' },
      'Proposal / Quotation': { bg: '#f5f3ff', color: '#6d28d9', border: '#ddd6fe' },
      Negotiation: { bg: '#fffbeb', color: '#b45309', border: '#fde68a' },
      Won: { bg: '#ecfdf5', color: '#047857', border: '#a7f3d0' },
      Lost: { bg: '#fef2f2', color: '#b91c1c', border: '#fecaca' },
    };
    return map[s] || map['New Opportunity'];
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

  const formatAmount = (amount) => {
    if (!amount && amount !== 0) return '₹0';
    return `₹${Number(amount).toLocaleString('en-IN')}`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return '—';
    }
  };

  const isAnyFilterActive =
    Boolean(search?.trim()) || stageFilter !== 'all' || priorityFilter !== 'all';

  const handleResetFilters = () => {
    if (setSearch) setSearch('');
    if (setStageFilter) setStageFilter('all');
    if (setPriorityFilter) setPriorityFilter('all');
    setCurrentPage(1);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', background: '#ffffff' }}>
      {/* Compact Filter Toolbar (Matching Leads Table Standard) */}
      <div
        style={{
          padding: '10px 14px',
          borderBottom: '1px solid #e2e8f0',
          background: '#f8fafc',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ position: 'relative', width: '175px', flexShrink: 0 }}>
          <Search
            size={13}
            color="#94a3b8"
            style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            placeholder="Search deals..."
            value={search || ''}
            onChange={(e) => setSearch && setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '5px 8px 5px 28px',
              borderRadius: '7px',
              border: '1px solid #cbd5e1',
              fontSize: '0.78rem',
              backgroundColor: '#ffffff',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <select
          value={stageFilter || 'all'}
          onChange={(e) => setStageFilter && setStageFilter(e.target.value)}
          style={{
            padding: '5px 8px',
            borderRadius: '6px',
            border: stageFilter !== 'all' ? '1px solid #c4b5fd' : '1px solid #cbd5e1',
            backgroundColor: stageFilter !== 'all' ? '#f5f3ff' : '#ffffff',
            color: stageFilter !== 'all' ? '#6d28d9' : '#334155',
            fontSize: '0.74rem',
            fontWeight: 600,
            cursor: 'pointer',
            maxWidth: '128px',
          }}
        >
          <option value="all">All Stages</option>
          {(STAGES || []).map((st) => (
            <option key={st} value={st}>
              {STAGE_SHORT_LABELS[st] || st}
            </option>
          ))}
        </select>

        <select
          value={priorityFilter || 'all'}
          onChange={(e) => setPriorityFilter && setPriorityFilter(e.target.value)}
          style={{
            padding: '5px 8px',
            borderRadius: '6px',
            border: priorityFilter !== 'all' ? '1px solid #c4b5fd' : '1px solid #cbd5e1',
            backgroundColor: priorityFilter !== 'all' ? '#f5f3ff' : '#ffffff',
            color: priorityFilter !== 'all' ? '#6d28d9' : '#334155',
            fontSize: '0.74rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <option value="all">All Priorities</option>
          <option value="Urgent">Urgent</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>

        {isAnyFilterActive && (
          <button
            type="button"
            onClick={handleResetFilters}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '5px 9px',
              borderRadius: '6px',
              border: '1px solid #fecaca',
              background: '#fef2f2',
              color: '#dc2626',
              fontSize: '0.74rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <RotateCcw size={11} />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Table Container */}
      <div style={{ width: '100%', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
          <thead>
            <tr
              style={{
                background: '#f8fafc',
                borderBottom: '1.5px solid #e2e8f0',
                textAlign: 'left',
              }}
            >
              <th style={{ padding: '11px 14px', fontSize: '0.71rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Opportunity / Deal
              </th>
              <th style={{ padding: '11px 14px', fontSize: '0.71rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Contact
              </th>
              <th style={{ padding: '11px 14px', fontSize: '0.71rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
                Lead ID
              </th>
              <th style={{ padding: '11px 14px', fontSize: '0.71rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
                Amount (₹)
              </th>
              <th style={{ padding: '11px 14px', fontSize: '0.71rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Stage
              </th>
              <th style={{ padding: '11px 14px', fontSize: '0.71rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
                Close Date
              </th>
              <th style={{ padding: '11px 14px', fontSize: '0.71rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Owner
              </th>
              <th style={{ padding: '11px 14px', fontSize: '0.71rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'center' }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {loading && paginatedOpportunities.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '44px 16px', color: '#64748b' }}>
                  Loading opportunities...
                </td>
              </tr>
            ) : paginatedOpportunities.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '44px 16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <TrendingUp size={34} color="#94a3b8" />
                    <div style={{ fontWeight: 700, color: '#334155', fontSize: '0.92rem' }}>
                      No opportunities found
                    </div>
                    <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b' }}>
                      Convert a qualified lead or create a direct deal to track your revenue pipeline.
                    </p>
                    <button
                      type="button"
                      onClick={openCreateModal}
                      style={{
                        marginTop: '6px',
                        padding: '7px 14px',
                        borderRadius: '8px',
                        border: 'none',
                        background: '#7c3aed',
                        color: '#ffffff',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                      }}
                    >
                      + Create Opportunity
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedOpportunities.map((opp) => {
                const currentStage = normalizeStage ? normalizeStage(opp.stage) : opp.stage || 'New Opportunity';
                const stageStyle = getStageColor(currentStage);
                const priorityStyle = getPriorityBadge(opp.priority || 'Medium');
                const prob = Number(opp.probability || 0);
                const isWon = currentStage === 'Won';
                const isLost = currentStage === 'Lost';
                const isClosedDeal = isWon || isLost;
                const linkedProject = isWon ? findLinkedProject(opp) : null;

                return (
                  <tr
                    key={opp._id}
                    style={{
                      borderBottom: '1px solid #f1f5f9',
                      background: isWon ? '#f0fdf4' : isLost ? '#fef2f2' : '#ffffff',
                      transition: 'background 0.15s ease',
                    }}
                  >
                    {/* 1. Deal & Company */}
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.86rem' }}>
                        {opp.name || opp.opportunityName || opp.title || 'Untitled Deal'}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.74rem', color: '#64748b', marginTop: '2px' }}>
                        <Building size={11} />
                        <span>{opp.company || 'Enterprise Account'}</span>
                      </div>
                    </td>

                    {/* 2. Contact */}
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.84rem' }}>
                        {opp.contactPerson || opp.relatedLeadName || opp.contactName || '—'}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '1px' }}>
                        {opp.phone || opp.email || 'No contact info'}
                      </div>
                    </td>

                    {/* 3. Related Lead ID */}
                    <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                      {opp.originalLeadId ? (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            background: '#eef2ff',
                            color: '#4338ca',
                            border: '1px solid #c7d2fe',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          <LinkIcon size={11} />
                          <span>{opp.originalLeadId}</span>
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>Direct</span>
                      )}
                    </td>

                    {/* 4. Amount & Probability */}
                    <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                      <div style={{ fontWeight: 800, color: '#059669', fontSize: '0.88rem' }}>
                        {formatAmount(opp.amount)}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                        <div style={{ width: '48px', height: '4px', borderRadius: '999px', background: '#e2e8f0', overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${Math.min(100, prob)}%`,
                              height: '100%',
                              background: prob >= 80 ? '#10b981' : prob >= 40 ? '#2563eb' : '#94a3b8',
                            }}
                          />
                        </div>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b' }}>
                          {prob}%
                        </span>
                      </div>
                    </td>

                    {/* 5. Stage (Locked Badge for Won/Lost; Inline Selector for Active Deals) */}
                    <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                      {isClosedDeal ? (
                        <span
                          title={isWon ? 'Deal Won & Locked' : 'Deal Lost & Locked'}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '4px 10px',
                            borderRadius: '999px',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            backgroundColor: stageStyle.bg,
                            color: stageStyle.color,
                            border: `1px solid ${stageStyle.border}`,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          <Lock size={11} />
                          <span>{STAGE_SHORT_LABELS[currentStage] || currentStage}</span>
                        </span>
                      ) : (
                        <select
                          value={currentStage}
                          onChange={(e) => {
                            const targetStage = e.target.value;
                            if (targetStage === 'Lost') {
                              openLostReasonModal(opp);
                            } else {
                              updateOpportunityStage(opp._id, targetStage);
                            }
                          }}
                          style={{
                            padding: '4px 8px',
                            borderRadius: '999px',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            backgroundColor: stageStyle.bg,
                            color: stageStyle.color,
                            border: `1px solid ${stageStyle.border}`,
                            cursor: 'pointer',
                            outline: 'none',
                            maxWidth: '125px',
                          }}
                        >
                          {(STAGES || []).map((st) => (
                            <option key={st} value={st} style={{ background: '#ffffff', color: '#0f172a' }}>
                              {STAGE_SHORT_LABELS[st] || st}
                            </option>
                          ))}
                        </select>
                      )}
                      {opp.lostReason && isLost && (
                        <div style={{ fontSize: '0.68rem', color: '#dc2626', fontWeight: 600, marginTop: '3px' }}>
                          Reason: {opp.lostReason}
                        </div>
                      )}
                    </td>

                    {/* 6. Close Date & Priority */}
                    <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', color: '#334155', fontWeight: 600 }}>
                        <Calendar size={12} color="#64748b" />
                        <span>{formatDate(opp.expectedCloseDate)}</span>
                      </div>
                      <span
                        style={{
                          display: 'inline-block',
                          marginTop: '3px',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          background: priorityStyle.bg,
                          color: priorityStyle.color,
                          border: `1px solid ${priorityStyle.border}`,
                        }}
                      >
                        {opp.priority || 'Medium'}
                      </span>
                    </td>

                    {/* 7. Owner */}
                    <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <div
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: '#eff6ff',
                            color: '#1d4ed8',
                            border: '1px solid #bfdbfe',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.7rem',
                            fontWeight: 800,
                          }}
                        >
                          {(opp.assignedTo || 'U').charAt(0).toUpperCase()}
                        </div>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#1e293b' }}>
                          {opp.assignedTo || 'Unassigned'}
                        </span>
                      </div>
                    </td>

                    {/* 8. Actions (Won -> Start Project Handoff; Lost -> Locked; Open -> Edit/Delete) */}
                    <td style={{ padding: '12px 14px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      {isWon ? (
                        linkedProject ? (
                          <button
                            type="button"
                            onClick={() => openProjectDetailModal && openProjectDetailModal(linkedProject)}
                            title={`Open Project: ${linkedProject.name || linkedProject.title}`}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              padding: '5px 10px',
                              borderRadius: '7px',
                              background: '#ecfdf5',
                              border: '1px solid #a7f3d0',
                              color: '#047857',
                              fontSize: '0.74rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            <CheckCircle2 size={13} />
                            <span>Project Live</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleStartProject(opp)}
                            title="Launch Project in Projects Management pre-filled with this Won Deal"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              padding: '5px 10px',
                              borderRadius: '7px',
                              background: '#2563eb',
                              border: 'none',
                              color: '#ffffff',
                              fontSize: '0.74rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              whiteSpace: 'nowrap',
                              boxShadow: '0 2px 6px rgba(37, 99, 235, 0.22)',
                            }}
                          >
                            <Rocket size={13} />
                            <span>Start Project</span>
                          </button>
                        )
                      ) : isLost ? (
                        <span
                          title="Closed Lost deals are archived and read-only"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            background: '#f1f5f9',
                            color: '#64748b',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                          }}
                        >
                          <Lock size={11} />
                          <span>Closed</span>
                        </span>
                      ) : (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                          <button
                            type="button"
                            onClick={() => openEditModal(opp)}
                            title="Edit Opportunity"
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
                            }}
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => openDeleteModal(opp)}
                            title="Delete Opportunity"
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
                            }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {filteredOpportunities.length > 0 && (
        <div
          style={{
            padding: '10px 14px',
            borderTop: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px',
            fontSize: '0.78rem',
            color: '#64748b',
          }}
        >
          <div>
            Showing{' '}
            <strong style={{ color: '#0f172a' }}>
              {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredOpportunities.length)}
            </strong>{' '}
            of <strong style={{ color: '#0f172a' }}>{filteredOpportunities.length}</strong> opportunities
          </div>
          {totalPages > 1 && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                style={{
                  padding: '4px 8px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  opacity: currentPage === 1 ? 0.5 : 1,
                }}
              >
                <ChevronLeft size={14} />
              </button>
              <span style={{ fontWeight: 700, color: '#0f172a' }}>
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                style={{
                  padding: '4px 8px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  opacity: currentPage === totalPages ? 0.5 : 1,
                }}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
