import React from 'react';
import {
  X,
  AlertCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flame,
  User,
  Building,
  Mail,
  Phone,
  Tag,
  Star,
  Shield,
  Edit2,
  Trash2,
  Calendar,
  CheckSquare,
  FileText,
  HelpCircle,
} from 'lucide-react';

export const ComplaintDetailModal = ({
  isOpen,
  onClose,
  complaint,
  onEdit,
  onResolve,
  onDelete,
  canDelete,
}) => {
  if (!isOpen || !complaint) return null;

  const isResolved = ['Resolved', 'Closed'].includes(complaint.status);

  // Format SLA time remaining
  const formatSlaRemaining = (deadlineStr, status) => {
    if (['Resolved', 'Closed'].includes(status)) {
      return { text: 'SLA Met & Delivered', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', icon: <CheckCircle2 size={14} /> };
    }
    if (!deadlineStr) return { text: 'Standard SLA', color: '#64748b', bg: '#f1f5f9', border: '#e2e8f0', icon: <Clock size={14} /> };

    const deadline = new Date(deadlineStr);
    const now = new Date();
    const diffMs = deadline.getTime() - now.getTime();
    const hours = Math.round(diffMs / (1000 * 60 * 60));

    if (diffMs < 0) {
      const overdueHours = Math.abs(hours);
      return {
        text: `SLA Breached (${overdueHours}h Overdue)`,
        color: '#dc2626',
        bg: '#fef2f2',
        border: '#fecaca',
        icon: <AlertTriangle size={14} />,
      };
    } else if (hours <= 4) {
      return {
        text: `At Risk (${hours}h remaining)`,
        color: '#d97706',
        bg: '#fffbeb',
        border: '#fde68a',
        icon: <Clock size={14} />,
      };
    }
    return {
      text: `On Track (${hours}h remaining)`,
      color: '#0284c7',
      bg: '#f0f9ff',
      border: '#bae6fd',
      icon: <Clock size={14} />,
    };
  };

  const slaInfo = formatSlaRemaining(complaint.slaDeadline, complaint.status);

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'Urgent':
        return { bg: '#fef2f2', color: '#dc2626', border: '#fee2e2' };
      case 'High':
        return { bg: '#fff7ed', color: '#ea580c', border: '#ffedd5' };
      case 'Medium':
        return { bg: '#fffbeb', color: '#d97706', border: '#fef3c7' };
      default:
        return { bg: '#f1f5f9', color: '#64748b', border: '#e2e8f0' };
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
      default:
        return { bg: '#f8fafc', color: '#475569', border: '#e2e8f0' };
    }
  };

  const pStyle = getPriorityStyle(complaint.priority);
  const sStyle = getStatusStyle(complaint.status);

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px',
        animation: 'fadeIn 0.2s ease',
      }}
    >
      <div
        className="modal-container-modern"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#ffffff',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 24px 48px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(to right, #f8fafc, #ffffff)',
            borderRadius: '20px 20px 0 0',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '14px',
                background: '#fee2e2',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(220, 38, 38, 0.15)',
              }}
            >
              <AlertCircle size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    background: '#eff6ff',
                    color: '#2563eb',
                    border: '1px solid #bfdbfe',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                  }}
                >
                  {complaint.ticketNumber}
                </span>
                <span
                  style={{
                    background: pStyle.bg,
                    color: pStyle.color,
                    border: `1px solid ${pStyle.border}`,
                    padding: '2px 8px',
                    borderRadius: '999px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                  }}
                >
                  {complaint.priority} Priority
                </span>
                <span
                  style={{
                    background: sStyle.bg,
                    color: sStyle.color,
                    border: `1px solid ${sStyle.border}`,
                    padding: '2px 8px',
                    borderRadius: '999px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                  }}
                >
                  {complaint.status}
                </span>
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '4px 0 0 0' }}>
                {complaint.subject}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#f1f5f9',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748b',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* SLA Live Banner */}
          <div
            style={{
              padding: '12px 18px',
              background: slaInfo.bg,
              border: `1px solid ${slaInfo.border}`,
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: slaInfo.color, fontWeight: 700, fontSize: '0.88rem' }}>
              {slaInfo.icon}
              <span>{slaInfo.text}</span>
            </div>
            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
              Target Window: <strong>{complaint.slaHours || 24} Hours</strong>
            </span>
          </div>

          {/* Customer & Organization Info Card */}
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              padding: '16px 20px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '14px',
            }}
          >
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
                Customer Name
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                {complaint.customerName}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
                Organization
              </div>
              <div style={{ fontSize: '0.92rem', fontWeight: 600, color: '#334155', marginTop: '2px' }}>
                {complaint.organization || 'Direct Customer'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
                Contact Email
              </div>
              <div style={{ fontSize: '0.88rem', color: '#2563eb', marginTop: '2px' }}>
                {complaint.customerEmail || '—'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
                Phone
              </div>
              <div style={{ fontSize: '0.88rem', color: '#334155', marginTop: '2px' }}>
                {complaint.customerPhone || '—'}
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 style={{ fontSize: '0.82rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
              Issue Description
            </h4>
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '14px',
                padding: '16px',
                color: '#1e293b',
                fontSize: '0.92rem',
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
              }}
            >
              {complaint.description}
            </div>
          </div>

          {/* Metadata Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
            <div style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', display: 'block' }}>CATEGORY</span>
              <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>{complaint.category}</span>
            </div>

            <div style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', display: 'block' }}>ASSIGNED TO</span>
              <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#2563eb' }}>
                {complaint.assignedToName || 'Unassigned'}
              </span>
            </div>

            <div style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', display: 'block' }}>CREATED AT</span>
              <span style={{ fontSize: '0.84rem', color: '#475569' }}>
                {complaint.createdAt ? new Date(complaint.createdAt).toLocaleString() : '—'}
              </span>
            </div>
          </div>

          {/* Resolution Details (if resolved) */}
          {isResolved && (
            <div
              style={{
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '16px',
                padding: '18px 20px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <CheckCircle2 size={18} color="#16a34a" />
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#166534' }}>
                  Resolution & Root Cause Analysis
                </h4>
              </div>

              {complaint.resolutionNotes && (
                <div style={{ marginBottom: '10px' }}>
                  <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#15803d', textTransform: 'uppercase' }}>
                    Resolution Notes:
                  </span>
                  <p style={{ margin: '3px 0 0 0', fontSize: '0.88rem', color: '#14532d', lineHeight: 1.5 }}>
                    {complaint.resolutionNotes}
                  </p>
                </div>
              )}

              {complaint.rootCause && (
                <div style={{ marginBottom: '10px' }}>
                  <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#15803d', textTransform: 'uppercase' }}>
                    Root Cause (RCA):
                  </span>
                  <p style={{ margin: '3px 0 0 0', fontSize: '0.88rem', color: '#14532d' }}>
                    {complaint.rootCause}
                  </p>
                </div>
              )}

              {complaint.csatRating && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#15803d' }}>Customer CSAT:</span>
                  <div style={{ display: 'flex', gap: '2px' }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={14}
                        fill={s <= complaint.csatRating ? '#f59e0b' : 'none'}
                        color={s <= complaint.csatRating ? '#f59e0b' : '#cbd5e1'}
                      />
                    ))}
                  </div>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#b45309' }}>
                    {complaint.csatRating}/5 Stars
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid #f1f5f9',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#f8fafc',
            borderRadius: '0 0 20px 20px',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <div>
            {canDelete && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onDelete(complaint);
                }}
                style={{
                  background: 'transparent',
                  border: '1px solid #fecaca',
                  color: '#dc2626',
                  padding: '8px 14px',
                  borderRadius: '999px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s',
                }}
              >
                <Trash2 size={14} />
                <span>Delete</span>
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(complaint);
              }}
              style={{
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                color: '#334155',
                padding: '8px 16px',
                borderRadius: '999px',
                fontSize: '0.84rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Edit2 size={14} />
              <span>Edit Details</span>
            </button>

            {!isResolved && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onResolve(complaint);
                }}
                style={{
                  background: '#16a34a',
                  border: 'none',
                  color: '#ffffff',
                  padding: '8px 18px',
                  borderRadius: '999px',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 12px rgba(22, 163, 74, 0.25)',
                }}
              >
                <CheckCircle2 size={15} />
                <span>Resolve Ticket</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              style={{
                background: '#0f172a',
                border: 'none',
                color: '#ffffff',
                padding: '8px 18px',
                borderRadius: '999px',
                fontSize: '0.84rem',
                fontWeight: 600,
                cursor: 'pointer',
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
