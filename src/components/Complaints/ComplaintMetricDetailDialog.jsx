import React, { useState, useEffect, useMemo } from 'react';
import {
  AlertCircle,
  Flame,
  Clock,
  CheckCircle2,
  AlertTriangle,
  X,
  Eye,
  Edit2,
  Trash2,
  Plus,
} from 'lucide-react';
import { useComplaints } from '../../context/ComplaintContext';
import { complaintApi } from '../../services/api';

export const ComplaintMetricDetailDialog = ({
  open,
  onClose,
  metricType = 'total', // 'total' | 'urgent' | 'sla_risk' | 'resolved'
  onViewTicket,
  onEditTicket,
  onResolveTicket,
  onDeleteTicket,
  canDelete = false,
  onCreateTicket,
}) => {
  const { complaints: contextComplaints } = useComplaints();

  // Local state for tickets inside this popup
  const [allTickets, setAllTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const rowsPerPage = 8;

  // Fetch full tickets for this metric popup whenever dialog opens or metricType changes
  useEffect(() => {
    if (!open) return;

    let isMounted = true;
    const fetchModalTickets = async () => {
      try {
        setLoading(true);
        const res = await complaintApi.getComplaints({ limit: 100 });
        if (res && res.success && isMounted) {
          setAllTickets(res.complaints || []);
        }
      } catch (e) {
        console.error('Failed to load tickets for metric popup:', e);
        if (isMounted && contextComplaints.length > 0) {
          setAllTickets(contextComplaints);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchModalTickets();
    setPage(0);

    return () => {
      isMounted = false;
    };
  }, [open, metricType, contextComplaints]);

  // Format SLA time remaining helper
  const formatSlaRemaining = (deadlineStr, status) => {
    if (['Resolved', 'Closed'].includes(status)) {
      return {
        text: 'SLA Met',
        color: '#059669',
        bgColor: '#ecfdf5',
        borderColor: '#a7f3d0',
        icon: <CheckCircle2 size={13} />,
      };
    }
    if (!deadlineStr) {
      return {
        text: 'Standard SLA',
        color: '#64748b',
        bgColor: '#f1f5f9',
        borderColor: '#e2e8f0',
        icon: <Clock size={13} />,
      };
    }

    const deadline = new Date(deadlineStr);
    const now = new Date();
    const diffMs = deadline.getTime() - now.getTime();
    const hours = Math.round(diffMs / (1000 * 60 * 60));

    if (diffMs < 0) {
      const overdueHours = Math.abs(hours);
      return {
        text: `Breached (${overdueHours}h overdue)`,
        color: '#dc2626',
        bgColor: '#fef2f2',
        borderColor: '#fecaca',
        icon: <AlertTriangle size={13} />,
        isBreached: true,
      };
    } else if (hours <= 4) {
      return {
        text: `At Risk (${hours}h remaining)`,
        color: '#d97706',
        bgColor: '#fffbeb',
        borderColor: '#fde68a',
        icon: <Clock size={13} />,
        isAtRisk: true,
      };
    }
    return {
      text: `${hours}h remaining`,
      color: '#2563eb',
      bgColor: '#eff6ff',
      borderColor: '#bfdbfe',
      icon: <Clock size={13} />,
      isOnTrack: true,
    };
  };

  // Metric configuration details
  const config = useMemo(() => {
    switch (metricType) {
      case 'urgent':
        return {
          title: 'Urgent Escalations & Critical SLA Targets',
          subtitle: 'High-priority customer tickets requiring immediate intervention within the mandatory 4-hour SLA window.',
          icon: Flame,
          primaryColor: '#dc2626',
          bgLight: '#fef2f2',
          borderColor: '#fee2e2',
          badgeText: '4-Hour Emergency SLA',
          emptyMessage: 'No urgent escalation tickets currently pending.',
        };
      case 'sla_risk':
        return {
          title: 'SLA Breached & At Risk Monitor',
          subtitle: 'Live tracking of tickets that have either breached their resolution deadline or are within the 4-hour warning window.',
          icon: Clock,
          primaryColor: '#d97706',
          bgLight: '#fffbeb',
          borderColor: '#fef3c7',
          badgeText: 'Real-time SLA Warning',
          emptyMessage: 'All tickets are currently within safe SLA thresholds!',
        };
      case 'resolved':
        return {
          title: 'Resolved Complaints & SLA Performance Breakdown',
          subtitle: 'Successfully closed tickets, customer satisfaction ratings, root cause analysis (RCA), and resolution timelines.',
          icon: CheckCircle2,
          primaryColor: '#059669',
          bgLight: '#ecfdf5',
          borderColor: '#d1fae5',
          badgeText: 'Resolution & CSAT',
          emptyMessage: 'No resolved complaints found matching the criteria.',
        };
      case 'total':
      default:
        return {
          title: 'Total Complaints Directory & Specifications',
          subtitle: 'Comprehensive breakdown, category analysis, and live directory of all organization service tickets.',
          icon: AlertCircle,
          primaryColor: '#2563eb',
          bgLight: '#eff6ff',
          borderColor: '#dbeafe',
          badgeText: 'Full Ticket Registry',
          emptyMessage: 'No complaints logged in the system.',
        };
    }
  }, [metricType]);

  // Filter tickets according to the metricType
  const filteredTickets = useMemo(() => {
    return allTickets.filter((t) => {
      const isResolved = ['Resolved', 'Closed'].includes(t.status);
      const slaInfo = formatSlaRemaining(t.slaDeadline, t.status);

      if (metricType === 'urgent') {
        return t.priority === 'Urgent';
      } else if (metricType === 'sla_risk') {
        if (isResolved) return false;
        return slaInfo.isBreached || slaInfo.isAtRisk;
      } else if (metricType === 'resolved') {
        return isResolved;
      }
      return true;
    });
  }, [allTickets, metricType]);

  // Priority badge styling
  const getPriorityChipStyle = (priority) => {
    switch (priority) {
      case 'Urgent':
        return { background: '#fef2f2', color: '#dc2626', border: '1px solid #fee2e2', fontWeight: 700 };
      case 'High':
        return { background: '#fff7ed', color: '#ea580c', border: '1px solid #ffedd5', fontWeight: 700 };
      case 'Medium':
        return { background: '#fffbeb', color: '#d97706', border: '1px solid #fef3c7', fontWeight: 700 };
      default:
        return { background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', fontWeight: 600 };
    }
  };

  // Status badge styling
  const getStatusChipStyle = (status) => {
    switch (status) {
      case 'Resolved':
      case 'Closed':
        return { background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', fontWeight: 700 };
      case 'In Progress':
      case 'Under Investigation':
        return { background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', fontWeight: 700 };
      default:
        return { background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0', fontWeight: 600 };
    }
  };

  if (!open) return null;

  const paginatedTickets = filteredTickets.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  const totalPages = Math.ceil(filteredTickets.length / rowsPerPage);

  const IconComponent = config.icon;

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
        zIndex: 9999,
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
          maxWidth: '1100px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.3)',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* MUI Dialog Header */}
        <div
          style={{
            padding: '20px 28px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(to right, #ffffff, #f8fafc)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '14px',
                backgroundColor: config.bgLight,
                color: config.primaryColor,
                border: `1.5px solid ${config.borderColor}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 4px 12px ${config.primaryColor}20`,
                flexShrink: 0,
              }}
            >
              <IconComponent size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h2
                  style={{
                    margin: 0,
                    fontSize: '1.25rem',
                    fontWeight: 800,
                    color: '#0f172a',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {config.title}
                </h2>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '3px 10px',
                    borderRadius: '999px',
                    backgroundColor: config.bgLight,
                    color: config.primaryColor,
                    border: `1px solid ${config.borderColor}`,
                    fontSize: '0.72rem',
                    fontWeight: 700,
                  }}
                >
                  {config.badgeText}
                </span>
              </div>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.84rem', color: '#64748b' }}>
                {config.subtitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
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
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#e2e8f0';
              e.currentTarget.style.color = '#0f172a';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#f1f5f9';
              e.currentTarget.style.color = '#64748b';
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* MUI Dialog Body Container */}
        <div
          style={{
            padding: '24px 28px',
            backgroundColor: '#f8fafc',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
            flex: 1,
          }}
        >
          {/* Tickets Specification Material Table */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '18px',
              border: '1px solid #e2e8f0',
              overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ overflowX: 'auto', maxHeight: '520px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1.5px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 2 }}>
                    <th style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.76rem', fontWeight: 700, textTransform: 'uppercase', width: '110px' }}>
                      Ticket ID
                    </th>
                    <th style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.76rem', fontWeight: 700, textTransform: 'uppercase' }}>
                      Customer & Org
                    </th>
                    <th style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.76rem', fontWeight: 700, textTransform: 'uppercase' }}>
                      Subject & Category
                    </th>
                    <th style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.76rem', fontWeight: 700, textTransform: 'uppercase' }}>
                      Priority
                    </th>
                    <th style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.76rem', fontWeight: 700, textTransform: 'uppercase' }}>
                      Status
                    </th>
                    <th style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.76rem', fontWeight: 700, textTransform: 'uppercase' }}>
                      SLA Status
                    </th>
                    <th style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.76rem', fontWeight: 700, textTransform: 'uppercase' }}>
                      Coordinator
                    </th>
                    <th style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.76rem', fontWeight: 700, textTransform: 'uppercase', textAlign: 'center', width: '130px' }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                        <div style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>
                          <Clock size={24} color={config.primaryColor} />
                        </div>
                        <div style={{ marginTop: '8px', fontWeight: 600, fontSize: '0.86rem' }}>
                          Loading specifications...
                        </div>
                      </td>
                    </tr>
                  ) : paginatedTickets.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                        <AlertCircle size={32} color="#94a3b8" style={{ marginBottom: '8px' }} />
                        <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.95rem' }}>
                          {config.emptyMessage}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '3px' }}>
                          No tickets available for this specification.
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedTickets.map((ticket) => {
                      const slaInfo = formatSlaRemaining(ticket.slaDeadline, ticket.status);
                      const isResolved = ['Resolved', 'Closed'].includes(ticket.status);

                      return (
                        <tr
                          key={ticket._id}
                          style={{
                            borderBottom: '1px solid #f1f5f9',
                            transition: 'background 0.15s ease',
                            cursor: 'pointer',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                          onClick={() => {
                            if (onViewTicket) onViewTicket(ticket);
                          }}
                        >
                          {/* Ticket Number */}
                          <td style={{ padding: '12px 16px' }}>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '3px 8px',
                                borderRadius: '6px',
                                backgroundColor: '#eff6ff',
                                color: '#2563eb',
                                border: '1px solid #bfdbfe',
                                fontWeight: 700,
                                fontSize: '0.74rem',
                              }}
                            >
                              {ticket.ticketNumber || 'TICK-000'}
                            </span>
                          </td>

                          {/* Customer & Org */}
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.86rem' }}>
                              {ticket.customerName || 'N/A'}
                            </div>
                            <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                              {ticket.organization || 'Direct Customer'}
                            </div>
                          </td>

                          {/* Subject & Category */}
                          <td style={{ padding: '12px 16px', maxWidth: '220px' }}>
                            <div
                              style={{
                                fontWeight: 600,
                                color: '#1e293b',
                                fontSize: '0.84rem',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                              title={ticket.subject}
                            >
                              {ticket.subject}
                            </div>
                            <span
                              style={{
                                display: 'inline-block',
                                fontSize: '0.7rem',
                                color: '#475569',
                                backgroundColor: '#f1f5f9',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                marginTop: '2px',
                              }}
                            >
                              {ticket.category || 'General'}
                            </span>
                          </td>

                          {/* Priority */}
                          <td style={{ padding: '12px 16px' }}>
                            <span
                              style={{
                                ...getPriorityChipStyle(ticket.priority),
                                display: 'inline-block',
                                padding: '3px 9px',
                                borderRadius: '999px',
                                fontSize: '0.72rem',
                              }}
                            >
                              {ticket.priority || 'Medium'}
                            </span>
                          </td>

                          {/* Status */}
                          <td style={{ padding: '12px 16px' }} onClick={(e) => e.stopPropagation()}>
                            <span
                              style={{
                                ...getStatusChipStyle(ticket.status),
                                display: 'inline-block',
                                padding: '3px 9px',
                                borderRadius: '999px',
                                fontSize: '0.72rem',
                              }}
                            >
                              {ticket.status || 'Logged'}
                            </span>
                          </td>

                          {/* SLA Status */}
                          <td style={{ padding: '12px 16px' }}>
                            <div
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                padding: '3px 8px',
                                borderRadius: '999px',
                                backgroundColor: slaInfo.bgColor,
                                color: slaInfo.color,
                                border: `1px solid ${slaInfo.borderColor}`,
                                fontSize: '0.72rem',
                                fontWeight: 700,
                              }}
                            >
                              {slaInfo.icon}
                              <span>{slaInfo.text}</span>
                            </div>
                          </td>

                          {/* Coordinator */}
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <div
                                style={{
                                  width: '24px',
                                  height: '24px',
                                  borderRadius: '50%',
                                  backgroundColor: '#dbeafe',
                                  color: '#1d4ed8',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '0.7rem',
                                  fontWeight: 700,
                                }}
                              >
                                {(ticket.assignedToName || 'U').charAt(0).toUpperCase()}
                              </div>
                              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>
                                {ticket.assignedToName || 'Unassigned'}
                              </span>
                            </div>
                          </td>

                          {/* Actions */}
                          <td style={{ padding: '12px 16px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                              <button
                                type="button"
                                onClick={() => onViewTicket && onViewTicket(ticket)}
                                title="View Ticket Details"
                                style={{
                                  padding: '5px',
                                  borderRadius: '6px',
                                  border: 'none',
                                  backgroundColor: '#eff6ff',
                                  color: '#2563eb',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <Eye size={14} />
                              </button>

                              {!isResolved && onResolveTicket && (
                                <button
                                  type="button"
                                  onClick={() => onResolveTicket(ticket)}
                                  title="Resolve & RCA"
                                  style={{
                                    padding: '5px',
                                    borderRadius: '6px',
                                    border: 'none',
                                    backgroundColor: '#ecfdf5',
                                    color: '#059669',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                >
                                  <CheckCircle2 size={14} />
                                </button>
                              )}

                              {onEditTicket && (
                                <button
                                  type="button"
                                  onClick={() => onEditTicket(ticket)}
                                  title="Edit Ticket"
                                  style={{
                                    padding: '5px',
                                    borderRadius: '6px',
                                    border: 'none',
                                    backgroundColor: '#f1f5f9',
                                    color: '#475569',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                >
                                  <Edit2 size={14} />
                                </button>
                              )}

                              {canDelete && onDeleteTicket && (
                                <button
                                  type="button"
                                  onClick={() => onDeleteTicket(ticket)}
                                  title="Delete Ticket"
                                  style={{
                                    padding: '5px',
                                    borderRadius: '6px',
                                    border: 'none',
                                    backgroundColor: '#fef2f2',
                                    color: '#dc2626',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div
                style={{
                  padding: '10px 18px',
                  borderTop: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: '#f8fafc',
                }}
              >
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  Showing {page * rowsPerPage + 1} to{' '}
                  {Math.min((page + 1) * rowsPerPage, filteredTickets.length)} of {filteredTickets.length} tickets
                </span>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    type="button"
                    disabled={page === 0}
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      backgroundColor: '#ffffff',
                      color: '#334155',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: page === 0 ? 'not-allowed' : 'pointer',
                      opacity: page === 0 ? 0.5 : 1,
                    }}
                  >
                    Previous
                  </button>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>
                    Page {page + 1} of {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      backgroundColor: '#ffffff',
                      color: '#334155',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer',
                      opacity: page >= totalPages - 1 ? 0.5 : 1,
                    }}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* MUI Dialog Footer Actions */}
        <div
          style={{
            padding: '16px 28px',
            borderTop: '1px solid #e2e8f0',
            backgroundColor: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Specification Type: <strong style={{ color: '#0f172a' }}>{config.badgeText}</strong>
            </span>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            {onCreateTicket && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onCreateTicket();
                }}
                style={{
                  padding: '9px 18px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: config.primaryColor,
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.86rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: `0 4px 12px ${config.primaryColor}30`,
                  transition: 'all 0.15s ease',
                }}
              >
                <Plus size={16} />
                <span>Log New Complaint</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '9px 20px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                color: '#475569',
                fontWeight: 600,
                fontSize: '0.86rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#94a3b8';
                e.currentTarget.style.backgroundColor = '#f8fafc';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#cbd5e1';
                e.currentTarget.style.backgroundColor = '#ffffff';
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComplaintMetricDetailDialog;
