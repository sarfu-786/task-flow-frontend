import React from 'react';
import { useComplaints } from '../../context/ComplaintContext';
import {
  AlertCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flame,
  User,
  Building,
  Eye,
  Edit2,
  Trash2,
  Plus,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

export const ComplaintKanban = ({
  onView,
  onEdit,
  onResolve,
  onDelete,
  canDelete,
  onCreate,
}) => {
  const { complaints, updateComplaintStatus, loading } = useComplaints();

  // Kanban Stage Columns definition
  const COLUMNS = [
    {
      id: 'Logged',
      title: 'Logged & Received',
      statuses: ['Logged'],
      color: '#64748b',
      bgLight: '#f8fafc',
      border: '#e2e8f0',
      badgeBg: '#f1f5f9',
      badgeColor: '#475569',
      nextStage: 'In Progress',
      nextStageLabel: 'Start Progress',
    },
    {
      id: 'InProgress',
      title: 'Under Investigation',
      statuses: ['Under Investigation', 'In Progress'],
      color: '#2563eb',
      bgLight: '#eff6ff',
      border: '#bfdbfe',
      badgeBg: '#dbeafe',
      badgeColor: '#1d4ed8',
      nextStage: 'Awaiting Customer',
      nextStageLabel: 'Await Customer',
    },
    {
      id: 'Awaiting',
      title: 'Awaiting Customer',
      statuses: ['Awaiting Customer'],
      color: '#d97706',
      bgLight: '#fffbeb',
      border: '#fde68a',
      badgeBg: '#fef3c7',
      badgeColor: '#b45309',
      nextStage: 'Resolved',
      nextStageLabel: 'Resolve Ticket',
    },
    {
      id: 'Resolved',
      title: 'Resolved & Closed',
      statuses: ['Resolved', 'Closed'],
      color: '#059669',
      bgLight: '#ecfdf5',
      border: '#a7f3d0',
      badgeBg: '#d1fae5',
      badgeColor: '#047857',
      nextStage: null,
      nextStageLabel: null,
    },
  ];

  // Live SLA calculation helper
  const getSlaInfo = (ticket) => {
    const isResolved = ['Resolved', 'Closed'].includes(ticket.status);
    if (isResolved) {
      return {
        text: 'SLA Met',
        color: '#059669',
        bg: '#ecfdf5',
        border: '#a7f3d0',
        icon: <CheckCircle2 size={12} />,
      };
    }
    if (!ticket.slaDeadline) {
      return {
        text: 'Standard SLA',
        color: '#64748b',
        bg: '#f1f5f9',
        border: '#e2e8f0',
        icon: <Clock size={12} />,
      };
    }

    const deadline = new Date(ticket.slaDeadline);
    const now = new Date();
    const diffMs = deadline.getTime() - now.getTime();
    const hours = Math.round(diffMs / (1000 * 60 * 60));

    if (diffMs < 0) {
      return {
        text: `Breached (${Math.abs(hours)}h ago)`,
        color: '#dc2626',
        bg: '#fef2f2',
        border: '#fecaca',
        icon: <AlertTriangle size={12} />,
      };
    } else if (hours <= 4) {
      return {
        text: `At Risk (${hours}h left)`,
        color: '#d97706',
        bg: '#fffbeb',
        border: '#fde68a',
        icon: <Flame size={12} />,
      };
    }
    return {
      text: `${hours}h remaining`,
      color: '#2563eb',
      bg: '#eff6ff',
      border: '#bfdbfe',
      icon: <Clock size={12} />,
    };
  };

  // Priority styling
  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'Urgent':
        return { color: '#dc2626', bg: '#fef2f2', border: '#fee2e2', glow: '0 0 8px rgba(220, 38, 38, 0.2)' };
      case 'High':
        return { color: '#ea580c', bg: '#fff7ed', border: '#ffedd5', glow: 'none' };
      case 'Medium':
        return { color: '#d97706', bg: '#fffbeb', border: '#fef3c7', glow: 'none' };
      default:
        return { color: '#059669', bg: '#ecfdf5', border: '#d1fae5', glow: 'none' };
    }
  };

  // Category styling
  const getCategoryStyle = (cat) => {
    switch (cat) {
      case 'Technical Glitch':
        return { bg: '#eff6ff', color: '#1d4ed8' };
      case 'Product Defect':
        return { bg: '#fef2f2', color: '#b91c1c' };
      case 'Service Delay':
        return { bg: '#fffbeb', color: '#b45309' };
      case 'Billing Query':
        return { bg: '#f5f3ff', color: '#6d28d9' };
      case 'Hardware Fault':
        return { bg: '#fff7ed', color: '#c2410c' };
      default:
        return { bg: '#f1f5f9', color: '#475569' };
    }
  };

  const getInitials = (name = 'C') => {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <div
      className="complaint-kanban-board"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '18px',
        alignItems: 'start',
      }}
    >
      {COLUMNS.map((col) => {
        const columnTickets = complaints.filter((t) => col.statuses.includes(t.status));

        return (
          <div
            key={col.id}
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: 'calc(100vh - 280px)',
              minHeight: '400px',
            }}
          >
            {/* Column Header */}
            <div
              style={{
                padding: '14px 16px',
                borderBottom: '1px solid #f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: col.bgLight,
                borderRadius: '16px 16px 0 0',
                borderTop: `3px solid ${col.color}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 800, fontSize: '0.92rem', color: '#0f172a' }}>
                  {col.title}
                </span>
                <span
                  style={{
                    background: col.badgeBg,
                    color: col.badgeColor,
                    fontSize: '0.74rem',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '999px',
                  }}
                >
                  {columnTickets.length}
                </span>
              </div>

              {col.id === 'Logged' && (
                <button
                  type="button"
                  onClick={onCreate}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    padding: '3px 8px',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    color: '#dc2626',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                  title="Log Ticket into this stage"
                >
                  <Plus size={12} />
                  <span>Add</span>
                </button>
              )}
            </div>

            {/* Cards Scrollable Body */}
            <div
              style={{
                padding: '12px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                flex: 1,
              }}
            >
              {columnTickets.length === 0 ? (
                <div
                  style={{
                    padding: '32px 16px',
                    textAlign: 'center',
                    color: '#94a3b8',
                    fontSize: '0.82rem',
                    border: '1.5px dashed #e2e8f0',
                    borderRadius: '12px',
                    margin: '8px 0',
                  }}
                >
                  No tickets in this stage
                </div>
              ) : (
                columnTickets.map((ticket) => {
                  const sla = getSlaInfo(ticket);
                  const pStyle = getPriorityStyle(ticket.priority);
                  const cStyle = getCategoryStyle(ticket.category);
                  const isResolved = ['Resolved', 'Closed'].includes(ticket.status);

                  return (
                    <div
                      key={ticket._id}
                      onClick={() => onView(ticket)}
                      style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        padding: '14px',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                      }}
                      className="kanban-ticket-card"
                    >
                      {/* Card Header */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '6px',
                        }}
                      >
                        <span
                          style={{
                            fontFamily: 'monospace',
                            fontSize: '0.76rem',
                            fontWeight: 700,
                            color: '#475569',
                            background: '#f1f5f9',
                            padding: '2px 6px',
                            borderRadius: '4px',
                          }}
                        >
                          {ticket.ticketNumber}
                        </span>

                        <span
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '999px',
                            background: pStyle.bg,
                            color: pStyle.color,
                            border: `1px solid ${pStyle.border}`,
                            boxShadow: pStyle.glow,
                          }}
                        >
                          {ticket.priority}
                        </span>
                      </div>

                      {/* Subject & Category */}
                      <div>
                        <div
                          style={{
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            color: cStyle.color,
                            background: cStyle.bg,
                            display: 'inline-block',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            marginBottom: '4px',
                          }}
                        >
                          {ticket.category}
                        </div>
                        <h4
                          style={{
                            fontSize: '0.88rem',
                            fontWeight: 700,
                            color: '#0f172a',
                            margin: 0,
                            lineHeight: 1.3,
                          }}
                        >
                          {ticket.subject}
                        </h4>
                      </div>

                      {/* Customer Info */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '0.78rem',
                          color: '#475569',
                        }}
                      >
                        <div
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '6px',
                            background: '#eff6ff',
                            color: '#2563eb',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.7rem',
                            fontWeight: 800,
                            flexShrink: 0,
                          }}
                        >
                          {getInitials(ticket.customerName)}
                        </div>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <span style={{ fontWeight: 600, color: '#1e293b' }}>{ticket.customerName}</span>
                          {ticket.organization && (
                            <span style={{ color: '#94a3b8', fontSize: '0.72rem' }}> • {ticket.organization}</span>
                          )}
                        </div>
                      </div>

                      {/* SLA Live Pill */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '4px 8px',
                          background: sla.bg,
                          border: `1px solid ${sla.border}`,
                          borderRadius: '6px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          color: sla.color,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          {sla.icon}
                          <span>{sla.text}</span>
                        </div>
                        <span style={{ fontSize: '0.68rem', color: '#64748b' }}>
                          {ticket.slaHours || 24}h SLA
                        </span>
                      </div>

                      {/* Card Footer: Assignee & Action Buttons */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          paddingTop: '8px',
                          borderTop: '1px solid #f1f5f9',
                          marginTop: '2px',
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Assignee */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: '#64748b' }}>
                          <User size={12} />
                          <span style={{ maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {ticket.assignedToName || 'Unassigned'}
                          </span>
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {/* Move to next stage button if available */}
                          {col.nextStage && (
                            <button
                              type="button"
                              onClick={async () => {
                                if (col.nextStage === 'Resolved') {
                                  onResolve(ticket);
                                } else {
                                  await updateComplaintStatus(ticket._id, col.nextStage);
                                }
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px',
                                background: '#eff6ff',
                                border: '1px solid #bfdbfe',
                                color: '#1d4ed8',
                                padding: '3px 6px',
                                borderRadius: '6px',
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                              title={`Advance to ${col.nextStage}`}
                            >
                              <span>Advance</span>
                              <ChevronRight size={11} />
                            </button>
                          )}

                          {/* Quick Resolve button if not resolved */}
                          {!isResolved && !col.nextStage && (
                            <button
                              type="button"
                              onClick={() => onResolve(ticket)}
                              style={{
                                background: '#ecfdf5',
                                border: '1px solid #a7f3d0',
                                color: '#059669',
                                padding: '3px 6px',
                                borderRadius: '6px',
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                              title="Resolve Ticket"
                            >
                              Resolve
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => onEdit(ticket)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#64748b',
                              cursor: 'pointer',
                              padding: '3px',
                            }}
                            title="Edit"
                          >
                            <Edit2 size={13} />
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
  );
};
