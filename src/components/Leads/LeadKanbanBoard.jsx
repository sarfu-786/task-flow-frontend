import React, { useState } from 'react';
import { useLeads } from '../../context/LeadContext';
import {
  Target,
  Building,
  Mail,
  Phone,
  DollarSign,
  TrendingUp,
  User,
  Edit2,
  Trash2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
} from 'lucide-react';

export const LeadKanbanBoard = () => {
  const {
    leads,
    filteredLeads,
    updateLeadStatus,
    openCreateModal,
    openEditModal,
    openConvertModal,
    openDeleteModal,
  } = useLeads();

  const [draggedLeadId, setDraggedLeadId] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);

  const columns = [
    {
      id: 'New',
      title: 'New Inquiries',
      color: '#2563eb',
      bgColor: '#eff6ff',
      borderColor: '#bfdbfe',
      badgeBg: '#dbeafe',
      badgeText: '#1e40af',
    },
    {
      id: 'Contacted',
      title: 'Contacted',
      color: '#d97706',
      bgColor: '#fffbeb',
      borderColor: '#fde68a',
      badgeBg: '#fef3c7',
      badgeText: '#92400e',
    },
    {
      id: 'Qualified',
      title: 'Qualified',
      color: '#059669',
      bgColor: '#ecfdf5',
      borderColor: '#a7f3d0',
      badgeBg: '#d1fae5',
      badgeText: '#065f46',
    },
    {
      id: 'Converted',
      title: 'Won & Converted',
      color: '#7c3aed',
      bgColor: '#f5f3ff',
      borderColor: '#ddd6fe',
      badgeBg: '#ede9fe',
      badgeText: '#5b21b6',
    },
    {
      id: 'Lost',
      title: 'Lost',
      color: '#dc2626',
      bgColor: '#fef2f2',
      borderColor: '#fecaca',
      badgeBg: '#fee2e2',
      badgeText: '#991b1b',
    },
  ];

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'High':
        return (
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#dc2626', background: '#fef2f2', padding: '2px 7px', borderRadius: '6px', border: '1px solid #fee2e2' }}>
            High
          </span>
        );
      case 'Medium':
        return (
          <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#d97706', background: '#fffbeb', padding: '2px 7px', borderRadius: '6px', border: '1px solid #fef3c7' }}>
            Medium
          </span>
        );
      case 'Low':
        return (
          <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b', background: '#f1f5f9', padding: '2px 7px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
            Low
          </span>
        );
      default:
        return null;
    }
  };

  const handleDragStart = (e, leadId) => {
    e.dataTransfer.setData('text/plain', leadId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedLeadId(leadId);
  };

  const handleDragOver = (e, columnId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumn !== columnId) {
      setDragOverColumn(columnId);
    }
  };

  const handleDragLeave = (e, columnId) => {
    if (dragOverColumn === columnId) {
      setDragOverColumn(null);
    }
  };

  const handleDrop = async (e, targetStatus) => {
    e.preventDefault();
    setDragOverColumn(null);
    const leadId = e.dataTransfer.getData('text/plain') || draggedLeadId;
    if (!leadId) return;

    const lead = leads.find((l) => l._id?.toString() === leadId.toString());
    if (lead && lead.status !== targetStatus) {
      if (targetStatus === 'Converted') {
        openConvertModal(lead);
      } else {
        await updateLeadStatus(leadId, targetStatus);
      }
    }
    setDraggedLeadId(null);
  };

  const leadsToDisplay = filteredLeads || leads;

  return (
    <div
      className="lead-kanban-board-container"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '16px',
        alignItems: 'start',
        marginTop: '16px',
        overflowX: 'auto',
        paddingBottom: '16px',
      }}
    >
      {columns.map((col) => {
        const colLeads = leadsToDisplay.filter(
          (l) => (l.status || 'New') === col.id || (col.id === 'New' && !l.status)
        );
        const isHovered = dragOverColumn === col.id;
        const totalValue = colLeads.reduce((acc, l) => acc + (Number(l.dealValue) || 0), 0);

        return (
          <div
            key={col.id}
            className={`kanban-column ${isHovered ? 'kanban-column-hover' : ''}`}
            onDragOver={(e) => handleDragOver(e, col.id)}
            onDragLeave={(e) => handleDragLeave(e, col.id)}
            onDrop={(e) => handleDrop(e, col.id)}
            style={{
              background: '#f8fafc',
              borderRadius: '16px',
              border: `2px solid ${isHovered ? col.color : '#e2e8f0'}`,
              boxShadow: isHovered ? `0 8px 24px rgba(0,0,0,0.08)` : 'var(--shadow-sm)',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              display: 'flex',
              flexDirection: 'column',
              minHeight: '480px',
              maxHeight: 'calc(100vh - 280px)',
              overflow: 'hidden',
            }}
          >
            {/* Column Header */}
            <div
              style={{
                padding: '12px 14px',
                background: col.bgColor,
                borderBottom: `1px solid ${col.borderColor}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: col.color,
                    }}
                  />
                  <h3 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: '#0f172a' }}>
                    {col.title}
                  </h3>
                </div>

                <span
                  style={{
                    background: col.badgeBg,
                    color: col.badgeText,
                    fontWeight: 800,
                    fontSize: '0.74rem',
                    padding: '2px 8px',
                    borderRadius: '999px',
                  }}
                >
                  {colLeads.length}
                </span>
              </div>

              <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 600 }}>
                Pipeline: ${totalValue.toLocaleString()}
              </div>
            </div>

            {/* Column Cards List */}
            <div
              className="custom-scrollbar"
              style={{
                padding: '10px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                overflowY: 'auto',
                flex: 1,
              }}
            >
              {colLeads.length === 0 ? (
                <div
                  style={{
                    padding: '30px 12px',
                    textAlign: 'center',
                    color: '#94a3b8',
                    border: '2px dashed #e2e8f0',
                    borderRadius: '12px',
                    background: '#ffffff',
                    margin: '6px 0',
                  }}
                >
                  <Target size={22} style={{ margin: '0 auto 6px', color: '#cbd5e1' }} />
                  <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>No leads in {col.title}</div>
                  <div style={{ fontSize: '0.7rem', marginTop: '2px' }}>Drag leads here</div>
                </div>
              ) : (
                colLeads.map((lead) => {
                  const isDragging = draggedLeadId === lead._id;
                  const leadScore = lead.leadScore || 50;
                  const scoreColor = leadScore >= 75 ? '#059669' : leadScore >= 45 ? '#d97706' : '#64748b';

                  return (
                    <div
                      key={lead._id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, lead._id)}
                      className={`kanban-card ${isDragging ? 'kanban-card-dragging' : ''}`}
                      style={{
                        background: '#ffffff',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                        padding: '12px',
                        cursor: 'grab',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {/* Name & Priority */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '6px', marginBottom: '6px' }}>
                        <div>
                          <h4 style={{ margin: '0 0 2px 0', fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>
                            {lead.name}
                          </h4>
                          {lead.company && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.76rem', color: '#64748b' }}>
                              <Building size={11} />
                              <span>{lead.company}</span>
                            </div>
                          )}
                        </div>
                        {getPriorityBadge(lead.priority)}
                      </div>

                      {/* Deal Value & Score */}
                      <div
                        style={{
                          background: '#f8fafc',
                          borderRadius: '8px',
                          padding: '6px 8px',
                          margin: '8px 0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: '0.76rem',
                        }}
                      >
                        <div style={{ fontWeight: 800, color: '#1e293b' }}>
                          <span style={{ color: '#059669', marginRight: '2px' }}>{lead.currency === 'INR' ? '₹' : '$'}</span>
                          {(Number(lead.dealValue) || 0).toLocaleString()}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ color: '#64748b', fontSize: '0.7rem' }}>Score:</span>
                          <span style={{ fontWeight: 700, color: scoreColor }}>{leadScore}%</span>
                        </div>
                      </div>

                      {/* Contact items */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '0.74rem', color: '#64748b', marginBottom: '8px' }}>
                        {lead.email && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            <Mail size={11} style={{ flexShrink: 0 }} />
                            <span>{lead.email}</span>
                          </div>
                        )}
                        {lead.phone && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Phone size={11} style={{ flexShrink: 0 }} />
                            <span>{lead.phone}</span>
                          </div>
                        )}
                      </div>

                      {/* Meta Footer */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          borderTop: '1px solid #f1f5f9',
                          paddingTop: '8px',
                          fontSize: '0.72rem',
                          color: '#64748b',
                        }}
                      >
                        <span
                          style={{
                            background: '#f1f5f9',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            fontWeight: 600,
                          }}
                        >
                          {lead.source || 'Website'}
                        </span>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600, color: '#334155' }}>
                          <User size={11} />
                          <span style={{ maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {lead.assignedTo || 'Unassigned'}
                          </span>
                        </div>
                      </div>

                      {/* Action Bar */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginTop: '8px',
                          paddingTop: '6px',
                          borderTop: '1px dashed #f1f5f9',
                        }}
                      >
                        {col.id === 'Qualified' ? (
                          <button
                            type="button"
                            onClick={() => openConvertModal(lead)}
                            style={{
                              background: '#ecfdf5',
                              border: '1px solid #a7f3d0',
                              color: '#047857',
                              borderRadius: '6px',
                              padding: '3px 8px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <Sparkles size={11} />
                            <span>Convert</span>
                          </button>
                        ) : col.id !== 'Converted' && col.id !== 'Lost' ? (
                          <button
                            type="button"
                            onClick={() => {
                              const nextMap = { New: 'Contacted', Contacted: 'Qualified' };
                              updateLeadStatus(lead._id, nextMap[col.id] || 'Qualified');
                            }}
                            style={{
                              background: '#eff6ff',
                              border: '1px solid #bfdbfe',
                              color: '#1d4ed8',
                              borderRadius: '6px',
                              padding: '3px 8px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '3px',
                            }}
                          >
                            <span>Advance</span>
                            <ArrowRight size={11} />
                          </button>
                        ) : (
                          <div />
                        )}

                        <div style={{ display: 'flex', gap: '3px' }}>
                          <button
                            type="button"
                            onClick={() => openEditModal(lead)}
                            title="Edit Lead"
                            style={{
                              background: 'transparent',
                              border: 'none',
                              padding: '3px 5px',
                              color: '#64748b',
                              cursor: 'pointer',
                              borderRadius: '4px',
                            }}
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => openDeleteModal(lead)}
                            title="Delete Lead"
                            style={{
                              background: 'transparent',
                              border: 'none',
                              padding: '3px 5px',
                              color: '#ef4444',
                              cursor: 'pointer',
                              borderRadius: '4px',
                            }}
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

            {/* Quick Add Button */}
            <div style={{ padding: '8px 10px', borderTop: '1px solid #e2e8f0', background: '#ffffff' }}>
              <button
                type="button"
                onClick={openCreateModal}
                style={{
                  width: '100%',
                  background: '#f8fafc',
                  border: '1px dashed #cbd5e1',
                  borderRadius: '8px',
                  padding: '6px',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  color: '#475569',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px',
                }}
              >
                <Plus size={12} />
                <span>Add {col.title} Lead</span>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
