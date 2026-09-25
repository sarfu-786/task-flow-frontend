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
  Mail,
  Phone,
  Eye,
  Edit2,
  Trash2,
  Sparkles,
  Calendar,
  Check,
  MoreVertical,
} from 'lucide-react';

export const ComplaintCards = ({
  onView,
  onEdit,
  onResolve,
  onDelete,
  canDelete,
  onCreate,
}) => {
  const { complaints, loading } = useComplaints();

  // Helper for SLA calculation and visual bar percentage
  const getSlaMetrics = (ticket) => {
    const isResolved = ['Resolved', 'Closed'].includes(ticket.status);
    const totalHours = ticket.slaHours || 24;

    if (isResolved) {
      return {
        text: 'SLA Met & Resolved',
        subtext: ticket.resolvedAt ? `Resolved ${new Date(ticket.resolvedAt).toLocaleDateString()}` : 'Completed',
        color: '#059669',
        bg: '#ecfdf5',
        border: '#a7f3d0',
        progressColor: '#10b981',
        percentElapsed: 100,
        isResolved: true,
        icon: <CheckCircle2 size={14} />,
      };
    }

    if (!ticket.slaDeadline) {
      return {
        text: 'Standard SLA',
        subtext: `${totalHours}h Target`,
        color: '#64748b',
        bg: '#f1f5f9',
        border: '#e2e8f0',
        progressColor: '#94a3b8',
        percentElapsed: 0,
        icon: <Clock size={14} />,
      };
    }

    const created = ticket.createdAt ? new Date(ticket.createdAt) : new Date();
    const deadline = new Date(ticket.slaDeadline);
    const now = new Date();

    const totalWindowMs = deadline.getTime() - created.getTime();
    const elapsedMs = now.getTime() - created.getTime();
    const remainingMs = deadline.getTime() - now.getTime();
    const hoursLeft = Math.round(remainingMs / (1000 * 60 * 60));

    let percent = totalWindowMs > 0 ? Math.min(100, Math.max(0, (elapsedMs / totalWindowMs) * 100)) : 50;

    if (remainingMs < 0) {
      const overdue = Math.abs(hoursLeft);
      return {
        text: `SLA Breached (${overdue}h Overdue)`,
        subtext: `Target missed on ${deadline.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        color: '#dc2626',
        bg: '#fef2f2',
        border: '#fecaca',
        progressColor: '#dc2626',
        percentElapsed: 100,
        isBreached: true,
        icon: <AlertTriangle size={14} />,
      };
    } else if (hoursLeft <= 4) {
      return {
        text: `At Risk (${hoursLeft}h remaining)`,
        subtext: `Target: ${deadline.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        color: '#d97706',
        bg: '#fffbeb',
        border: '#fde68a',
        progressColor: '#f59e0b',
        percentElapsed: percent,
        isAtRisk: true,
        icon: <Flame size={14} />,
      };
    }

    return {
      text: `On Track (${hoursLeft}h left)`,
      subtext: `Target: ${deadline.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      color: '#2563eb',
      bg: '#eff6ff',
      border: '#bfdbfe',
      progressColor: '#3b82f6',
      percentElapsed: percent,
      icon: <Clock size={14} />,
    };
  };

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'Urgent':
        return { color: '#dc2626', bg: '#fef2f2', border: '#fee2e2' };
      case 'High':
        return { color: '#ea580c', bg: '#fff7ed', border: '#ffedd5' };
      case 'Medium':
        return { color: '#d97706', bg: '#fffbeb', border: '#fef3c7' };
      default:
        return { color: '#059669', bg: '#ecfdf5', border: '#d1fae5' };
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Resolved':
      case 'Closed':
        return { bg: '#ecfdf5', color: '#047857', border: '#a7f3d0' };
      case 'In Progress':
      case 'Under Investigation':
        return { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' };
      case 'Awaiting Customer':
        return { bg: '#fffbeb', color: '#b45309', border: '#fde68a' };
      default:
        return { bg: '#f8fafc', color: '#475569', border: '#e2e8f0' };
    }
  };

  const getInitials = (name = 'Customer') => {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  if (complaints.length === 0) {
    return (
      <div
        className="card-official"
        style={{
          padding: '48px 24px',
          textAlign: 'center',
          background: '#ffffff',
          borderRadius: '20px',
          border: '1px solid #e2e8f0',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '20px',
            background: '#fef2f2',
            color: '#dc2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}
        >
          <AlertCircle size={32} />
        </div>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
          No Complaints In View
        </h3>
        <p style={{ fontSize: '0.88rem', color: '#64748b', margin: '0 auto 20px', maxWidth: '400px' }}>
          No customer complaints found matching your active filters.
        </p>
        <button
          type="button"
          className="btn-official-primary"
          onClick={onCreate}
          style={{
            background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Sparkles size={16} />
          <span>Log New Complaint</span>
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '20px',
      }}
    >
      {complaints.map((ticket) => {
        const sla = getSlaMetrics(ticket);
        const pStyle = getPriorityStyle(ticket.priority);
        const sStyle = getStatusStyle(ticket.status);
        const isResolved = ['Resolved', 'Closed'].includes(ticket.status);

        return (
          <div
            key={ticket._id}
            onClick={() => onView(ticket)}
            style={{
              background: '#ffffff',
              borderRadius: '18px',
              border: '1px solid #e2e8f0',
              padding: '20px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
              cursor: 'pointer',
              transition: 'all 0.24s cubic-bezier(0.34, 1.56, 0.64, 1)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              position: 'relative',
              overflow: 'hidden',
            }}
            className="complaint-grid-card"
          >
            {/* Top Accent Strip */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: sla.progressColor,
              }}
            />

            {/* Card Header: Ticket #, Category & Status */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    color: '#0f172a',
                    background: '#f1f5f9',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  {ticket.ticketNumber}
                </span>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '999px',
                    background: pStyle.bg,
                    color: pStyle.color,
                    border: `1px solid ${pStyle.border}`,
                  }}
                >
                  {ticket.priority}
                </span>
              </div>

              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '999px',
                  background: sStyle.bg,
                  color: sStyle.color,
                  border: `1px solid ${sStyle.border}`,
                }}
              >
                {ticket.status}
              </span>
            </div>

            {/* Subject & Category Tag */}
            <div>
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: '#2563eb',
                  background: '#eff6ff',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  display: 'inline-block',
                  marginBottom: '6px',
                }}
              >
                {ticket.category}
              </span>
              <h3
                style={{
                  fontSize: '1rem',
                  fontWeight: 800,
                  color: '#0f172a',
                  margin: '0 0 6px 0',
                  lineHeight: 1.3,
                }}
              >
                {ticket.subject}
              </h3>
              {ticket.description && (
                <p
                  style={{
                    fontSize: '0.82rem',
                    color: '#64748b',
                    margin: 0,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {ticket.description}
                </p>
              )}
            </div>

            {/* SLA Progress Gauge */}
            <div
              style={{
                background: sla.bg,
                border: `1px solid ${sla.border}`,
                borderRadius: '12px',
                padding: '10px 12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: 700, color: sla.color }}>
                  {sla.icon}
                  <span>{sla.text}</span>
                </div>
                <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>
                  {ticket.slaHours || 24}h Window
                </span>
              </div>

              {/* Progress Bar */}
              <div
                style={{
                  width: '100%',
                  height: '6px',
                  background: 'rgba(0, 0, 0, 0.06)',
                  borderRadius: '999px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${sla.percentElapsed}%`,
                    height: '100%',
                    background: sla.progressColor,
                    borderRadius: '999px',
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>
            </div>

            {/* Customer Details Box */}
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #f1f5f9',
                borderRadius: '12px',
                padding: '10px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '0.76rem',
                  flexShrink: 0,
                }}
              >
                {getInitials(ticket.customerName)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {ticket.customerName}
                </div>
                <div style={{ fontSize: '0.74rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Building size={11} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {ticket.organization || 'Direct Customer'}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer: Assignee & Quick Actions */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '10px',
                borderTop: '1px solid #f1f5f9',
                marginTop: 'auto',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.76rem', color: '#64748b' }}>
                <User size={12} />
                <span style={{ fontWeight: 600 }}>{ticket.assignedToName || 'Unassigned'}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => onView(ticket)}
                  style={{
                    background: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    color: '#2563eb',
                    borderRadius: '8px',
                    padding: '5px 10px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                  title="View Details"
                >
                  <Eye size={13} />
                  <span>View</span>
                </button>

                {!isResolved && (
                  <button
                    type="button"
                    onClick={() => onResolve(ticket)}
                    style={{
                      background: '#ecfdf5',
                      border: '1px solid #a7f3d0',
                      color: '#059669',
                      borderRadius: '8px',
                      padding: '5px 10px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                    title="Resolve Ticket"
                  >
                    <CheckCircle2 size={13} />
                    <span>Resolve</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => onEdit(ticket)}
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    color: '#475569',
                    borderRadius: '8px',
                    width: '30px',
                    height: '30px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                  title="Edit Ticket"
                >
                  <Edit2 size={13} />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
