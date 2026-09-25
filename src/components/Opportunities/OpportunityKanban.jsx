import React, { useState } from 'react';
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
  Percent,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
} from 'lucide-react';

export const OpportunityKanban = () => {
  const {
    kanbanColumns,
    updateOpportunityStage,
    openEditModal,
    openDeleteModal,
    openCreateModal,
  } = useOpportunities();

  const [draggedOppId, setDraggedOppId] = useState(null);
  const [dragOverStage, setDragOverStage] = useState(null);

  const stageThemes = {
    Qualification: {
      color: '#2563eb',
      bgLight: '#eff6ff',
      borderColor: '#bfdbfe',
      barColor: '#3b82f6',
    },
    Proposal: {
      color: '#6366f1',
      bgLight: '#eef2ff',
      borderColor: '#c7d2fe',
      barColor: '#6366f1',
    },
    Negotiation: {
      color: '#d97706',
      bgLight: '#fffbeb',
      borderColor: '#fde68a',
      barColor: '#f59e0b',
    },
    Won: {
      color: '#059669',
      bgLight: '#ecfdf5',
      borderColor: '#a7f3d0',
      barColor: '#10b981',
    },
    Lost: {
      color: '#dc2626',
      bgLight: '#fef2f2',
      borderColor: '#fecaca',
      barColor: '#ef4444',
    },
  };

  const handleDragStart = (e, oppId) => {
    e.dataTransfer.setData('text/plain', oppId);
    setDraggedOppId(oppId);
  };

  const handleDragOver = (e, stage) => {
    e.preventDefault();
    if (dragOverStage !== stage) {
      setDragOverStage(stage);
    }
  };

  const handleDragLeave = () => {
    setDragOverStage(null);
  };

  const handleDrop = async (e, targetStage) => {
    e.preventDefault();
    setDragOverStage(null);
    const oppId = e.dataTransfer.getData('text/plain') || draggedOppId;
    if (oppId && targetStage) {
      await updateOpportunityStage(oppId, targetStage);
    }
    setDraggedOppId(null);
  };

  const formatAmount = (num) => {
    if (!num && num !== 0) return '₹0';
    return `₹${Number(num).toLocaleString('en-IN')}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    const isOverdue = date < new Date() && date.toDateString() !== new Date().toDateString();

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: isOverdue ? '#dc2626' : 'var(--text-muted)' }}>
        <Calendar size={12} />
        <span style={{ fontSize: '0.75rem', fontWeight: isOverdue ? 600 : 400 }}>
          {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>
      </div>
    );
  };

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'High':
        return { color: '#dc2626', bg: '#fef2f2', border: '#fee2e2' };
      case 'Medium':
        return { color: '#d97706', bg: '#fffbeb', border: '#fef3c7' };
      case 'Low':
        return { color: '#64748b', bg: '#f1f5f9', border: '#e2e8f0' };
      default:
        return { color: '#64748b', bg: '#f1f5f9', border: '#e2e8f0' };
    }
  };

  return (
    <div className="kanban-board-container" style={{ overflowX: 'auto', paddingBottom: '16px' }}>
      <div
        className="kanban-board"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${STAGES.length}, minmax(280px, 1fr))`,
          gap: '16px',
          alignItems: 'start',
          minWidth: `${STAGES.length * 290}px`,
        }}
      >
        {STAGES.map((stageName, stageIdx) => {
          const colData = kanbanColumns[stageName] || { count: 0, totalValue: 0, deals: [] };
          const theme = stageThemes[stageName] || stageThemes.Qualification;
          const isOver = dragOverStage === stageName;

          return (
            <div
              key={stageName}
              className={`kanban-column ${isOver ? 'drag-over' : ''}`}
              onDragOver={(e) => handleDragOver(e, stageName)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, stageName)}
              style={{
                background: isOver ? theme.bgLight : '#ffffff',
                border: `1px solid ${isOver ? theme.color : 'var(--border-color)'}`,
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: isOver ? `0 0 0 2px ${theme.color}40` : '0 1px 3px rgba(0,0,0,0.03)',
                transition: 'all 0.15s ease',
                maxHeight: 'calc(100vh - 280px)',
                minHeight: '400px',
              }}
            >
              {/* Column Header */}
              <div
                className="kanban-column-header"
                style={{
                  padding: '14px 16px',
                  borderBottom: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderTop: `3px solid ${theme.color}`,
                  borderTopLeftRadius: '11px',
                  borderTopRightRadius: '11px',
                  background: '#f8fafc',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                      {stageName}
                    </span>
                    <span
                      style={{
                        background: theme.bgLight,
                        color: theme.color,
                        border: `1px solid ${theme.borderColor}`,
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: '999px',
                      }}
                    >
                      {colData.count}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 600, color: theme.color, marginTop: '2px' }}>
                    {formatAmount(colData.totalValue)}
                  </div>
                </div>

                <button
                  type="button"
                  className="btn-icon btn-sm"
                  onClick={openCreateModal}
                  title={`Add Opportunity to ${stageName}`}
                  style={{ padding: '4px' }}
                >
                  <Plus size={14} />
                </button>
              </div>

              {/* Cards Container */}
              <div
                className="kanban-cards-list"
                style={{
                  padding: '12px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  flex: 1,
                }}
              >
                {colData.deals.length === 0 ? (
                  <div
                    style={{
                      padding: '30px 10px',
                      textAlign: 'center',
                      color: 'var(--text-muted)',
                      fontSize: '0.8rem',
                      border: '1px dashed var(--border-color)',
                      borderRadius: '8px',
                      background: '#f8fafc',
                    }}
                  >
                    No deals in {stageName}
                  </div>
                ) : (
                  colData.deals.map((opp) => {
                    const pStyle = getPriorityStyle(opp.priority);
                    const prob = opp.probability !== undefined ? opp.probability : 20;

                    return (
                      <div
                        key={opp._id}
                        className="kanban-card"
                        draggable
                        onDragStart={(e) => handleDragStart(e, opp._id)}
                        style={{
                          background: '#ffffff',
                          border: '1px solid var(--border-color)',
                          borderRadius: '10px',
                          padding: '14px',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                          cursor: 'grab',
                          transition: 'transform 0.15s, box-shadow 0.15s, border-color 0.15s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.08)';
                          e.currentTarget.style.borderColor = '#cbd5e1';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'none';
                          e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)';
                          e.currentTarget.style.borderColor = 'var(--border-color)';
                        }}
                      >
                        {/* Header: Priority and Value */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span
                            style={{
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: pStyle.bg,
                              color: pStyle.color,
                              border: `1px solid ${pStyle.border}`,
                            }}
                          >
                            {opp.priority || 'Medium'}
                          </span>

                          <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#059669' }}>
                            {formatAmount(opp.amount)}
                          </div>
                        </div>

                        {/* Title */}
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: '0.88rem',
                            color: 'var(--text-primary)',
                            lineHeight: 1.3,
                            marginBottom: '4px',
                          }}
                        >
                          {opp.name}
                        </div>

                        {/* Company */}
                        {opp.company && (
                          <div
                            style={{
                              fontSize: '0.78rem',
                              color: 'var(--text-secondary)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              marginBottom: '6px',
                            }}
                          >
                            <Building size={12} color="#64748b" />
                            <span>{opp.company}</span>
                          </div>
                        )}

                        {/* Related Lead */}
                        {opp.relatedLeadName && (
                          <div
                            style={{
                              fontSize: '0.72rem',
                              color: '#6366f1',
                              background: '#eef2ff',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              marginBottom: '8px',
                              maxWidth: '100%',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            <Link size={10} />
                            <span>Lead: {opp.relatedLeadName}</span>
                          </div>
                        )}

                        {/* Probability Progress */}
                        <div style={{ marginBottom: '10px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '3px' }}>
                            <span>Probability</span>
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{prob}%</span>
                          </div>
                          <div
                            style={{
                              width: '100%',
                              height: '4px',
                              background: '#f1f5f9',
                              borderRadius: '999px',
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                width: `${prob}%`,
                                height: '100%',
                                background: theme.barColor,
                                borderRadius: '999px',
                                transition: 'width 0.3s ease',
                              }}
                            />
                          </div>
                        </div>

                        {/* Footer: Assignee & Date & Actions */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            paddingTop: '8px',
                            borderTop: '1px solid var(--border-subtle)',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div
                              style={{
                                width: '22px',
                                height: '22px',
                                borderRadius: '50%',
                                background: '#eff6ff',
                                color: '#2563eb',
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                              title={`Assigned to ${opp.assignedTo}`}
                            >
                              {opp.assignedTo ? opp.assignedTo.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {opp.assignedTo || 'Unassigned'}
                            </span>
                          </div>

                          {opp.expectedCloseDate && formatDate(opp.expectedCloseDate)}

                          <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                            {/* Quick Stage Shifters */}
                            {stageIdx > 0 && (
                              <button
                                type="button"
                                className="btn-icon btn-sm"
                                onClick={() => updateOpportunityStage(opp._id, STAGES[stageIdx - 1])}
                                title={`Move back to ${STAGES[stageIdx - 1]}`}
                                style={{ padding: '2px 4px' }}
                              >
                                <ChevronLeft size={13} />
                              </button>
                            )}
                            {stageIdx < STAGES.length - 1 && (
                              <button
                                type="button"
                                className="btn-icon btn-sm"
                                onClick={() => updateOpportunityStage(opp._id, STAGES[stageIdx + 1])}
                                title={`Advance to ${STAGES[stageIdx + 1]}`}
                                style={{ padding: '2px 4px' }}
                              >
                                <ChevronRight size={13} />
                              </button>
                            )}

                            <button
                              type="button"
                              className="btn-icon btn-sm"
                              onClick={() => openEditModal(opp)}
                              title="Edit Opportunity"
                              style={{ padding: '2px 4px' }}
                            >
                              <Edit2 size={12} />
                            </button>
                            <button
                              type="button"
                              className="btn-icon btn-sm text-danger"
                              onClick={() => openDeleteModal(opp)}
                              title="Delete Opportunity"
                              style={{ padding: '2px 4px' }}
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
