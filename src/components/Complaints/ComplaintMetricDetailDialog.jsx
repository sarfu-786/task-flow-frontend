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
  Search,
  Check,
  Copy,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Sparkles,
  Building,
  User,
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
}) => {
  const { allComplaints, fetchComplaints } = useComplaints();

  // Local state for tickets and filters
  const [localTickets, setLocalTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [copiedId, setCopiedId] = useState(null);
  const [page, setPage] = useState(0);
  const rowsPerPage = 7;

  // Lock body scroll and handle ESC key
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = 'unset';
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [open, onClose]);

  // Sync tickets when dialog opens or allComplaints changes
  useEffect(() => {
    if (!open) return;

    if (allComplaints && allComplaints.length > 0) {
      setLocalTickets(allComplaints);
    } else {
      let isMounted = true;
      const loadTickets = async () => {
        try {
          setLoading(true);
          const res = await complaintApi.getComplaints({ limit: 500 });
          if (res && res.success && isMounted) {
            setLocalTickets(res.complaints || []);
          }
        } catch (e) {
          console.error('Failed to load tickets for metric popup:', e);
        } finally {
          if (isMounted) setLoading(false);
        }
      };
      loadTickets();
      return () => {
        isMounted = false;
      };
    }
    setPage(0);
    setSearch('');
    setCategoryFilter('all');
    setPriorityFilter('all');
  }, [open, allComplaints]);

  const handleCopy = (ticketNumber, e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(ticketNumber);
    setCopiedId(ticketNumber);
    setTimeout(() => setCopiedId(null), 2000);
  };

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
        text: 'Standard 24h',
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
        icon: <Flame size={13} />,
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
          badgeText: '4-Hour Urgent SLA',
          emptyMessage: 'No urgent escalation tickets found.',
        };
      case 'sla_risk':
        return {
          title: 'SLA Breached & At Risk Registry',
          subtitle: 'Live tracking of tickets that have either breached their resolution deadline or are within the 4-hour warning window.',
          icon: Clock,
          primaryColor: '#d97706',
          bgLight: '#fffbeb',
          borderColor: '#fef3c7',
          badgeText: 'SLA Alert Threshold',
          emptyMessage: 'All tickets are currently within safe SLA thresholds!',
        };
      case 'resolved':
        return {
          title: 'Resolved Complaints & Performance Registry',
          subtitle: 'Successfully closed tickets, customer satisfaction ratings, root cause analysis (RCA), and resolution records.',
          icon: CheckCircle2,
          primaryColor: '#059669',
          bgLight: '#ecfdf5',
          borderColor: '#d1fae5',
          badgeText: 'Resolved & SLA Met',
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

  // Filter tickets according to the metricType and local search/filter
  const filteredTickets = useMemo(() => {
    const baseTickets = localTickets.length > 0 ? localTickets : allComplaints;

    return baseTickets.filter((t) => {
      if (!t) return false;
      const isResolved = ['Resolved', 'Closed'].includes(t.status);
      const slaInfo = formatSlaRemaining(t.slaDeadline, t.status);

      // Metric Filter
      if (metricType === 'urgent') {
        if (t.priority !== 'Urgent' || isResolved) return false;
      } else if (metricType === 'sla_risk') {
        if (isResolved || (!slaInfo.isBreached && !slaInfo.isAtRisk)) return false;
      } else if (metricType === 'resolved') {
        if (!isResolved) return false;
      }

      // Dropdown & Search Filters
      if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
      if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;

      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const matchTicket = (t.ticketNumber || '').toLowerCase().includes(q);
        const matchCustomer = (t.customerName || '').toLowerCase().includes(q);
        const matchOrg = (t.organization || '').toLowerCase().includes(q);
        const matchSubject = (t.subject || '').toLowerCase().includes(q);
        const matchAssignee = (t.assignedToName || '').toLowerCase().includes(q);
        const matchCategory = (t.category || '').toLowerCase().includes(q);
        if (!matchTicket && !matchCustomer && !matchOrg && !matchSubject && !matchAssignee && !matchCategory) {
          return false;
        }
      }
      return true;
    });
  }, [localTickets, allComplaints, metricType, categoryFilter, priorityFilter, search]);

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
        return { background: '#ecfdf5', color: '#059669', border: '1px solid #d1fae5', fontWeight: 600 };
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
      case 'Awaiting Customer':
        return { background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a', fontWeight: 700 };
      default:
        return { background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0', fontWeight: 600 };
    }
  };

  if (!open) return null;

  const paginatedTickets = filteredTickets.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  const totalPages = Math.ceil(filteredTickets.length / rowsPerPage) || 1;
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
          maxWidth: '1120px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.3)',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '20px 28px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(to right, #ffffff, #f8fafc)',
            flexShrink: 0,
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
                  {filteredTickets.length} {filteredTickets.length === 1 ? 'ticket' : 'tickets'}
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

        {/* Modal Toolbar: Search & Filters */}
        <div
          style={{
            padding: '14px 28px',
            backgroundColor: '#ffffff',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            flexShrink: 0,
          }}
        >
          {/* Search Box */}
          <div style={{ position: 'relative', flex: '1 1 260px', maxWidth: '380px' }}>
            <Search
              size={15}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94a3b8',
                pointerEvents: 'none',
              }}
            />
            <input
              type="text"
              placeholder="Search in these tickets..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              style={{
                width: '100%',
                padding: '8px 30px 8px 34px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                fontSize: '0.82rem',
                outline: 'none',
                background: '#f8fafc',
              }}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '2px',
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Quick Filters */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(0);
              }}
              style={{
                padding: '7px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.78rem',
                color: '#334155',
                fontWeight: 600,
                background: '#ffffff',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="all">All Categories</option>
              <option value="Technical Glitch">Technical Glitch</option>
              <option value="Product Defect">Product Defect</option>
              <option value="Service Delay">Service Delay</option>
              <option value="Billing Query">Billing Query</option>
              <option value="Hardware Fault">Hardware Fault</option>
              <option value="Account Access">Account Access</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value);
                setPage(0);
              }}
              style={{
                padding: '7px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.78rem',
                color: '#334155',
                fontWeight: 600,
                background: '#ffffff',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="all">All Priorities</option>
              <option value="Urgent">Urgent (4h)</option>
              <option value="High">High (12h)</option>
              <option value="Medium">Medium (24h)</option>
              <option value="Low">Low (48h)</option>
            </select>

            {(search || categoryFilter !== 'all' || priorityFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setCategoryFilter('all');
                  setPriorityFilter('all');
                  setPage(0);
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 10px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: '#f8fafc',
                  color: '#475569',
                  fontSize: '0.76rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <RotateCcw size={12} />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Modal Body: Table Container */}
        <div
          style={{
            padding: '20px 28px',
            backgroundColor: '#f8fafc',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            flex: '1 1 auto',
            minHeight: 0,
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '18px',
              border: '1px solid #e2e8f0',
              overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ overflowX: 'auto', maxHeight: '480px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1.5px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 2 }}>
                    <th style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', width: '120px' }}>
                      Ticket ID
                    </th>
                    <th style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase' }}>
                      Customer & Org
                    </th>
                    <th style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase' }}>
                      Subject & Category
                    </th>
                    <th style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase' }}>
                      Priority
                    </th>
                    <th style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase' }}>
                      Status
                    </th>
                    <th style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase' }}>
                      Live SLA Countdown
                    </th>
                    <th style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase' }}>
                      Assignee
                    </th>
                    <th style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', textAlign: 'right', width: '130px' }}>
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
                          Loading ticket details...
                        </div>
                      </td>
                    </tr>
                  ) : paginatedTickets.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '48px 20px', color: '#64748b' }}>
                        <AlertCircle size={32} color="#94a3b8" style={{ marginBottom: '8px' }} />
                        <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.95rem' }}>
                          {config.emptyMessage}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>
                          No tickets match the selected criteria.
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
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span
                                style={{
                                  display: 'inline-block',
                                  padding: '3px 8px',
                                  borderRadius: '6px',
                                  backgroundColor: '#f1f5f9',
                                  color: '#0f172a',
                                  border: '1px solid #e2e8f0',
                                  fontWeight: 700,
                                  fontSize: '0.76rem',
                                  fontFamily: 'monospace',
                                }}
                              >
                                {ticket.ticketNumber || 'TICK-000'}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => handleCopy(ticket.ticketNumber, e)}
                                title="Copy Ticket ID"
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: copiedId === ticket.ticketNumber ? '#16a34a' : '#94a3b8',
                                  cursor: 'pointer',
                                  padding: '2px',
                                  display: 'flex',
                                }}
                              >
                                {copiedId === ticket.ticketNumber ? <Check size={12} /> : <Copy size={12} />}
                              </button>
                            </div>
                          </td>

                          {/* Customer & Org */}
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.86rem' }}>
                              {ticket.customerName || 'N/A'}
                            </div>
                            <div style={{ fontSize: '0.74rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '1px' }}>
                              <Building size={11} />
                              <span>{ticket.organization || 'Direct Customer'}</span>
                            </div>
                          </td>

                          {/* Subject & Category */}
                          <td style={{ padding: '14px 16px', maxWidth: '240px' }}>
                            <div
                              style={{
                                fontWeight: 700,
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
                                fontWeight: 600,
                                color: '#2563eb',
                                backgroundColor: '#eff6ff',
                                border: '1px solid #bfdbfe',
                                padding: '1px 6px',
                                borderRadius: '4px',
                                marginTop: '2px',
                              }}
                            >
                              {ticket.category || 'General'}
                            </span>
                          </td>

                          {/* Priority */}
                          <td style={{ padding: '14px 16px' }}>
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
                          <td style={{ padding: '14px 16px' }} onClick={(e) => e.stopPropagation()}>
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
                          <td style={{ padding: '14px 16px' }}>
                            <div
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                padding: '3px 8px',
                                borderRadius: '6px',
                                backgroundColor: slaInfo.bgColor,
                                color: slaInfo.color,
                                border: `1px solid ${slaInfo.borderColor}`,
                                fontSize: '0.74rem',
                                fontWeight: 700,
                              }}
                            >
                              {slaInfo.icon}
                              <span>{slaInfo.text}</span>
                            </div>
                          </td>

                          {/* Assignee */}
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <div
                                style={{
                                  width: '22px',
                                  height: '22px',
                                  borderRadius: '50%',
                                  backgroundColor: '#eff6ff',
                                  color: '#2563eb',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '0.7rem',
                                  fontWeight: 700,
                                }}
                              >
                                <User size={12} />
                              </div>
                              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>
                                {ticket.assignedToName || 'Unassigned'}
                              </span>
                            </div>
                          </td>

                          {/* Actions */}
                          <td style={{ padding: '14px 16px', textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '5px' }}>
                              <button
                                type="button"
                                onClick={() => onViewTicket && onViewTicket(ticket)}
                                title="View Ticket Details"
                                style={{
                                  width: '28px',
                                  height: '28px',
                                  borderRadius: '6px',
                                  border: '1px solid #e2e8f0',
                                  backgroundColor: '#ffffff',
                                  color: '#2563eb',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <Eye size={13} />
                              </button>

                              {!isResolved && onResolveTicket && (
                                <button
                                  type="button"
                                  onClick={() => onResolveTicket(ticket)}
                                  title="Resolve Complaint"
                                  style={{
                                    width: '28px',
                                    height: '28px',
                                    borderRadius: '6px',
                                    border: '1px solid #a7f3d0',
                                    backgroundColor: '#ecfdf5',
                                    color: '#059669',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                >
                                  <CheckCircle2 size={13} />
                                </button>
                              )}

                              {onEditTicket && (
                                <button
                                  type="button"
                                  onClick={() => onEditTicket(ticket)}
                                  title="Edit Ticket"
                                  style={{
                                    width: '28px',
                                    height: '28px',
                                    borderRadius: '6px',
                                    border: '1px solid #e2e8f0',
                                    backgroundColor: '#ffffff',
                                    color: '#475569',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                >
                                  <Edit2 size={13} />
                                </button>
                              )}

                              {canDelete && onDeleteTicket && (
                                <button
                                  type="button"
                                  onClick={() => onDeleteTicket(ticket)}
                                  title="Delete Ticket"
                                  style={{
                                    width: '28px',
                                    height: '28px',
                                    borderRadius: '6px',
                                    border: '1px solid #fee2e2',
                                    backgroundColor: '#fef2f2',
                                    color: '#dc2626',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                >
                                  <Trash2 size={13} />
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
                  padding: '12px 20px',
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

        {/* Modal Footer Actions */}
        <div
          style={{
            padding: '16px 28px',
            borderTop: '1px solid #e2e8f0',
            backgroundColor: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Specification Filter: <strong style={{ color: '#0f172a' }}>{config.badgeText}</strong>
            </span>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
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
