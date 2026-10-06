import React, { useState } from 'react';
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
  Check,
  Copy,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Search,
  X,
  Filter,
  RotateCcw,
} from 'lucide-react';

export const ComplaintTable = ({
  onView,
  onEdit,
  onResolve,
  onDelete,
  canDelete,
}) => {
  const {
    complaints,
    allComplaints,
    loading,
    updateComplaintStatus,
    currentPage,
    setCurrentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    setItemsPerPage,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    categoryFilter,
    setCategoryFilter,
    priorityFilter,
    setPriorityFilter,
    slaFilter,
    setSlaFilter,
    metricFilter,
    setMetricFilter,
    resetFilters,
  } = useComplaints();

  const [copiedId, setCopiedId] = useState(null);
  const [activeStatusDropdown, setActiveStatusDropdown] = useState(null);

  const handleCopyTicket = (ticketNumber, e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(ticketNumber);
    setCopiedId(ticketNumber);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Helper to compute live SLA status & badge styling
  const getSlaDetails = (complaint) => {
    const status = complaint.status;
    const isResolved = ['Resolved', 'Closed'].includes(status);

    if (isResolved) {
      return {
        text: 'SLA Met',
        subtext: complaint.resolvedAt
          ? `Resolved on ${new Date(complaint.resolvedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
          : 'Closed on time',
        color: '#059669',
        bgColor: '#ecfdf5',
        borderColor: '#a7f3d0',
        badgeClass: 'sla-met',
        icon: <CheckCircle2 size={13} />,
      };
    }

    if (!complaint.slaDeadline) {
      return {
        text: 'Standard 24h',
        subtext: 'No deadline set',
        color: '#64748b',
        bgColor: '#f1f5f9',
        borderColor: '#e2e8f0',
        badgeClass: 'sla-standard',
        icon: <Clock size={13} />,
      };
    }

    const deadline = new Date(complaint.slaDeadline);
    const now = new Date();
    const diffMs = deadline.getTime() - now.getTime();
    const hoursLeft = Math.round(diffMs / (1000 * 60 * 60));

    if (diffMs < 0) {
      const overdue = Math.abs(hoursLeft);
      return {
        text: `Breached (${overdue}h Overdue)`,
        subtext: `Deadline was ${deadline.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        color: '#dc2626',
        bgColor: '#fef2f2',
        borderColor: '#fecaca',
        badgeClass: 'sla-breached',
        isBreached: true,
        icon: <AlertTriangle size={13} />,
      };
    } else if (hoursLeft <= 4) {
      return {
        text: `At Risk (${hoursLeft}h Left)`,
        subtext: `Target: ${deadline.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        color: '#d97706',
        bgColor: '#fffbeb',
        borderColor: '#fde68a',
        badgeClass: 'sla-at-risk',
        isAtRisk: true,
        icon: <Flame size={13} />,
      };
    }

    return {
      text: `${hoursLeft}h Remaining`,
      subtext: `Deadline: ${deadline.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ${deadline.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      color: '#2563eb',
      bgColor: '#eff6ff',
      borderColor: '#bfdbfe',
      badgeClass: 'sla-on-track',
      isOnTrack: true,
      icon: <Clock size={13} />,
    };
  };

  // Helper for Priority styling
  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'Urgent':
        return {
          label: 'Urgent (4h)',
          color: '#dc2626',
          bg: '#fef2f2',
          border: '#fee2e2',
          dot: '#dc2626',
          glow: '0 0 10px rgba(220, 38, 38, 0.25)',
        };
      case 'High':
        return {
          label: 'High (12h)',
          color: '#ea580c',
          bg: '#fff7ed',
          border: '#ffedd5',
          dot: '#ea580c',
          glow: 'none',
        };
      case 'Medium':
        return {
          label: 'Medium (24h)',
          color: '#d97706',
          bg: '#fffbeb',
          border: '#fef3c7',
          dot: '#d97706',
          glow: 'none',
        };
      case 'Low':
      default:
        return {
          label: 'Low (48h)',
          color: '#059669',
          bg: '#ecfdf5',
          border: '#d1fae5',
          dot: '#059669',
          glow: 'none',
        };
    }
  };

  // Helper for Category styling
  const getCategoryBadge = (cat) => {
    switch (cat) {
      case 'Technical Glitch':
        return { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' };
      case 'Product Defect':
        return { bg: '#fef2f2', color: '#b91c1c', border: '#fecaca' };
      case 'Service Delay':
        return { bg: '#fffbeb', color: '#b45309', border: '#fde68a' };
      case 'Billing Query':
        return { bg: '#f5f3ff', color: '#6d28d9', border: '#ddd6fe' };
      case 'Hardware Fault':
        return { bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' };
      case 'Account Access':
        return { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' };
      default:
        return { bg: '#f1f5f9', color: '#475569', border: '#e2e8f0' };
    }
  };

  // Helper for Status badge styling
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Logged':
        return { bg: '#f8fafc', color: '#475569', border: '#e2e8f0', dot: '#94a3b8' };
      case 'Under Investigation':
        return { bg: '#eef2ff', color: '#4338ca', border: '#c7d2fe', dot: '#6366f1' };
      case 'In Progress':
        return { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe', dot: '#2563eb' };
      case 'Awaiting Customer':
        return { bg: '#fffbeb', color: '#b45309', border: '#fde68a', dot: '#f59e0b' };
      case 'Resolved':
        return { bg: '#ecfdf5', color: '#047857', border: '#a7f3d0', dot: '#10b981' };
      case 'Closed':
        return { bg: '#f1f5f9', color: '#334155', border: '#cbd5e1', dot: '#64748b' };
      default:
        return { bg: '#f8fafc', color: '#475569', border: '#e2e8f0', dot: '#94a3b8' };
    }
  };

  // Avatar initials and background generator
  const getAvatarInfo = (name = 'Customer') => {
    const initials = name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();

    const charCode = name.charCodeAt(0) || 65;
    const colors = [
      'linear-gradient(135deg, #3b82f6, #1d4ed8)',
      'linear-gradient(135deg, #10b981, #059669)',
      'linear-gradient(135deg, #8b5cf6, #6d28d9)',
      'linear-gradient(135deg, #f59e0b, #d97706)',
      'linear-gradient(135deg, #ec4899, #be185d)',
      'linear-gradient(135deg, #06b6d4, #0e7490)',
    ];
    const bg = colors[charCode % colors.length];

    return { initials, bg };
  };

  // Active Metric Title info
  const getMetricHeaderInfo = () => {
    switch (metricFilter) {
      case 'urgent':
        return {
          title: 'Urgent Escalations',
          subtitle: 'Complaints flagged with 4-hour urgent SLA response window',
          icon: <Flame size={18} color="#dc2626" />,
          color: '#dc2626',
          bg: '#fee2e2',
          border: '#fecaca',
        };
      case 'sla_risk':
        return {
          title: 'SLA Breached & At Risk Tickets',
          subtitle: 'Active tickets exceeding deadline or within 4-hour countdown',
          icon: <Clock size={18} color="#d97706" />,
          color: '#d97706',
          bg: '#fef3c7',
          border: '#fde68a',
        };
      case 'resolved':
        return {
          title: 'Resolved & Closed Cases',
          subtitle: 'Tickets successfully finalized with root-cause analysis',
          icon: <CheckCircle2 size={18} color="#059669" />,
          color: '#059669',
          bg: '#ecfdf5',
          border: '#a7f3d0',
        };
      case 'total':
      default:
        return {
          title: 'All Complaints Table',
          subtitle: 'Complete organizational complaint registry and SLA tracking',
          icon: <AlertCircle size={18} color="#2563eb" />,
          color: '#2563eb',
          bg: '#eff6ff',
          border: '#bfdbfe',
        };
    }
  };

  const metricInfo = getMetricHeaderInfo();
  const isAnyFilterActive =
    metricFilter !== 'total' ||
    search.trim() !== '' ||
    statusFilter !== 'all' ||
    categoryFilter !== 'all' ||
    priorityFilter !== 'all' ||
    slaFilter !== 'all';

  return (
    <div
      className="card-official"
      style={{
        padding: '0',
        background: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
        height: '100%',
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Table Toolbar Header & Filters */}
      <div
        style={{
          padding: '10px 16px',
          borderBottom: '1px solid #e2e8f0',
          background: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          flexShrink: 0,
        }}
      >
        {/* Active Metric / Div Info Banner */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                background: metricInfo.bg,
                border: `1px solid ${metricInfo.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {metricInfo.icon}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h2 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: '#0f172a' }}>
                  {metricInfo.title}
                </h2>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '1px 8px',
                    borderRadius: '999px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    background: metricInfo.bg,
                    color: metricInfo.color,
                    border: `1px solid ${metricInfo.border}`,
                  }}
                >
                  {totalItems} {totalItems === 1 ? 'ticket' : 'tickets'}
                </span>
              </div>
              <p style={{ margin: '1px 0 0', fontSize: '0.74rem', color: '#64748b' }}>
                {metricInfo.subtitle}
              </p>
            </div>
          </div>

          {/* Quick Action / Reset */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {isAnyFilterActive && (
              <button
                type="button"
                onClick={resetFilters}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '5px 10px',
                  borderRadius: '7px',
                  border: '1px solid #cbd5e1',
                  background: '#f8fafc',
                  color: '#475569',
                  fontSize: '0.76rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                title="Reset all filters and search"
              >
                <RotateCcw size={12} />
                <span>Show All Records</span>
              </button>
            )}
          </div>
        </div>

        {/* Search & Filter Controls Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          {/* Search Input */}
          <div
            style={{
              position: 'relative',
              flex: '1 1 220px',
              maxWidth: '360px',
              minWidth: '180px',
            }}
          >
            <Search
              size={14}
              style={{
                position: 'absolute',
                left: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94a3b8',
                pointerEvents: 'none',
              }}
            />
            <input
              type="text"
              placeholder="Search by ticket #, customer, subject, assignee..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                width: '100%',
                padding: '6px 28px 6px 30px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.8rem',
                color: '#0f172a',
                outline: 'none',
                background: '#f8fafc',
                transition: 'all 0.15s ease',
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
                  display: 'flex',
                }}
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Filter Dropdowns */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                padding: '5px 10px',
                borderRadius: '8px',
                border: categoryFilter !== 'all' ? '1px solid #93c5fd' : '1px solid #cbd5e1',
                background: categoryFilter !== 'all' ? '#eff6ff' : '#ffffff',
                color: categoryFilter !== 'all' ? '#1d4ed8' : '#334155',
                fontSize: '0.78rem',
                fontWeight: 600,
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

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                padding: '5px 10px',
                borderRadius: '8px',
                border: priorityFilter !== 'all' ? '1px solid #93c5fd' : '1px solid #cbd5e1',
                background: priorityFilter !== 'all' ? '#eff6ff' : '#ffffff',
                color: priorityFilter !== 'all' ? '#1d4ed8' : '#334155',
                fontSize: '0.78rem',
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="all">All Priorities</option>
              <option value="Urgent">Urgent (4h SLA)</option>
              <option value="High">High (12h SLA)</option>
              <option value="Medium">Medium (24h SLA)</option>
              <option value="Low">Low (48h SLA)</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                padding: '5px 10px',
                borderRadius: '8px',
                border: statusFilter !== 'all' ? '1px solid #93c5fd' : '1px solid #cbd5e1',
                background: statusFilter !== 'all' ? '#eff6ff' : '#ffffff',
                color: statusFilter !== 'all' ? '#1d4ed8' : '#334155',
                fontSize: '0.78rem',
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="all">All Statuses</option>
              <option value="Logged">Logged</option>
              <option value="Under Investigation">Under Investigation</option>
              <option value="In Progress">In Progress</option>
              <option value="Awaiting Customer">Awaiting Customer</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>

            {/* SLA Filter */}
            <select
              value={slaFilter}
              onChange={(e) => {
                setSlaFilter(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                padding: '5px 10px',
                borderRadius: '8px',
                border: slaFilter !== 'all' ? '1px solid #93c5fd' : '1px solid #cbd5e1',
                background: slaFilter !== 'all' ? '#eff6ff' : '#ffffff',
                color: slaFilter !== 'all' ? '#1d4ed8' : '#334155',
                fontSize: '0.78rem',
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="all">All SLA Timers</option>
              <option value="On Track">On Track</option>
              <option value="At Risk">At Risk</option>
              <option value="Breached">Breached</option>
              <option value="Met">Met SLA</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {loading && complaints.length === 0 ? (
        <div className="crm-loading-container" style={{ padding: '40px 20px', textAlign: 'center', flex: 1 }}>
          <div className="spinner-official" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#1e293b' }}>Loading Complaint Registry...</h3>
          <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Synchronizing real-time SLA metrics & customer tickets.</p>
        </div>
      ) : complaints.length === 0 ? (
        /* Empty State */
        <div
          style={{
            padding: '40px 20px',
            textAlign: 'center',
            background: '#ffffff',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '16px',
              background: '#fef2f2',
              color: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px',
              boxShadow: '0 6px 14px rgba(220, 38, 38, 0.08)',
            }}
          >
            <AlertCircle size={28} />
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}>
            No Complaints Found
          </h3>
          <p style={{ fontSize: '0.84rem', color: '#64748b', maxWidth: '420px', margin: '0 auto 16px' }}>
            {isAnyFilterActive
              ? `No complaints match the selected "${metricInfo.title}" filter or current search criteria.`
              : 'No customer complaints have been logged in the system yet.'}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            {isAnyFilterActive && (
              <button
                type="button"
                onClick={resetFilters}
                style={{
                  padding: '7px 15px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#334155',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <RotateCcw size={14} />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Actual Table Data with Internal Scrolling */
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            overflowX: 'auto',
            width: '100%',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <table
            className="table-official"
            style={{
              width: '100%',
              borderCollapse: 'separate',
              borderSpacing: '0',
              textAlign: 'left',
            }}
          >
            <thead>
              <tr
                style={{
                  background: '#f8fafc',
                  position: 'sticky',
                  top: 0,
                  zIndex: 10,
                  boxShadow: '0 1px 0 #e2e8f0',
                }}
              >
                <th style={{ position: 'sticky', top: 0, background: '#f8fafc', padding: '10px 14px', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', zIndex: 10 }}>
                  Ticket ID
                </th>
                <th style={{ position: 'sticky', top: 0, background: '#f8fafc', padding: '10px 14px', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', zIndex: 10 }}>
                  Customer & Org
                </th>
                <th style={{ position: 'sticky', top: 0, background: '#f8fafc', padding: '10px 14px', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', zIndex: 10 }}>
                  Subject & Category
                </th>
                <th style={{ position: 'sticky', top: 0, background: '#f8fafc', padding: '10px 14px', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', zIndex: 10 }}>
                  Priority
                </th>
                <th style={{ position: 'sticky', top: 0, background: '#f8fafc', padding: '10px 14px', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', zIndex: 10 }}>
                  Live SLA Countdown
                </th>
                <th style={{ position: 'sticky', top: 0, background: '#f8fafc', padding: '10px 14px', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', zIndex: 10 }}>
                  Assignee
                </th>
                <th style={{ position: 'sticky', top: 0, background: '#f8fafc', padding: '10px 14px', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', zIndex: 10 }}>
                  Status
                </th>
                <th
                  style={{
                    position: 'sticky',
                    top: 0,
                    background: '#f8fafc',
                    padding: '10px 14px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    textAlign: 'right',
                    zIndex: 10,
                  }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {complaints.map((item) => {
                const sla = getSlaDetails(item);
                const pBadge = getPriorityBadge(item.priority);
                const cBadge = getCategoryBadge(item.category);
                const sBadge = getStatusBadge(item.status);
                const avatar = getAvatarInfo(item.customerName || 'Customer');
                const isResolved = ['Resolved', 'Closed'].includes(item.status);

                return (
                  <tr
                    key={item._id}
                    style={{
                      borderBottom: '1px solid #f1f5f9',
                      transition: 'background-color 0.15s ease',
                      cursor: 'pointer',
                    }}
                    className="table-row-hover"
                    onClick={() => onView(item)}
                  >
                    {/* Ticket Number */}
                    <td style={{ padding: '10px 14px', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span
                          style={{
                            fontFamily: 'monospace',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            color: '#0f172a',
                            background: '#f1f5f9',
                            padding: '2px 7px',
                            borderRadius: '5px',
                            border: '1px solid #e2e8f0',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          {item.ticketNumber}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleCopyTicket(item.ticketNumber, e)}
                          title="Copy Ticket ID"
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: copiedId === item.ticketNumber ? '#16a34a' : '#94a3b8',
                            cursor: 'pointer',
                            padding: '2px',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                        >
                          {copiedId === item.ticketNumber ? <Check size={12} /> : <Copy size={12} />}
                        </button>
                      </div>
                    </td>

                    {/* Customer & Organization */}
                    <td style={{ padding: '10px 14px', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div
                          style={{
                            width: '30px',
                            height: '30px',
                            borderRadius: '8px',
                            background: avatar.bg,
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.74rem',
                            flexShrink: 0,
                            boxShadow: '0 2px 5px rgba(0,0,0,0.08)',
                          }}
                        >
                          {avatar.initials}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.84rem' }}>
                            {item.customerName}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '1px' }}>
                            <Building size={10} />
                            <span>{item.organization || 'Direct Customer'}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Subject & Category */}
                    <td style={{ padding: '10px 14px', verticalAlign: 'middle', maxWidth: '260px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '2px' }}>
                        <span
                          style={{
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            padding: '1px 5px',
                            borderRadius: '4px',
                            background: cBadge.bg,
                            color: cBadge.color,
                            border: `1px solid ${cBadge.border}`,
                          }}
                        >
                          {item.category}
                        </span>
                      </div>
                      <div
                        style={{
                          fontWeight: 700,
                          color: '#1e293b',
                          fontSize: '0.82rem',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={item.subject}
                      >
                        {item.subject}
                      </div>
                    </td>

                    {/* Priority */}
                    <td style={{ padding: '10px 14px', verticalAlign: 'middle' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '999px',
                          background: pBadge.bg,
                          color: pBadge.color,
                          border: `1px solid ${pBadge.border}`,
                          boxShadow: pBadge.glow,
                        }}
                      >
                        <span
                          style={{
                            width: '5px',
                            height: '5px',
                            borderRadius: '50%',
                            background: pBadge.dot,
                          }}
                        />
                        <span>{pBadge.label}</span>
                      </span>
                    </td>

                    {/* Live SLA Countdown */}
                    <td style={{ padding: '10px 14px', verticalAlign: 'middle' }}>
                      <div
                        style={{
                          display: 'inline-flex',
                          flexDirection: 'column',
                          gap: '1px',
                        }}
                      >
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            color: sla.color,
                            background: sla.bgColor,
                            border: `1px solid ${sla.borderColor}`,
                            padding: '2px 7px',
                            borderRadius: '5px',
                          }}
                        >
                          {sla.icon}
                          <span>{sla.text}</span>
                        </span>
                        <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>{sla.subtext}</span>
                      </div>
                    </td>

                    {/* Assignee */}
                    <td style={{ padding: '10px 14px', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <div
                          style={{
                            width: '22px',
                            height: '22px',
                            borderRadius: '50%',
                            background: item.assignedToName && item.assignedToName !== 'Unassigned' ? '#eff6ff' : '#f1f5f9',
                            color: item.assignedToName && item.assignedToName !== 'Unassigned' ? '#2563eb' : '#94a3b8',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            border: '1px solid #e2e8f0',
                          }}
                        >
                          <User size={11} />
                        </div>
                        <span
                          style={{
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            color: item.assignedToName && item.assignedToName !== 'Unassigned' ? '#334155' : '#94a3b8',
                          }}
                        >
                          {item.assignedToName || 'Unassigned'}
                        </span>
                      </div>
                    </td>

                    {/* Status Dropdown / Badge */}
                    <td
                      style={{ padding: '10px 14px', verticalAlign: 'middle', position: 'relative' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div style={{ position: 'relative', display: 'inline-block' }}>
                        <button
                          type="button"
                          onClick={() =>
                            setActiveStatusDropdown(
                              activeStatusDropdown === item._id ? null : item._id
                            )
                          }
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '999px',
                            background: sBadge.bg,
                            color: sBadge.color,
                            border: `1px solid ${sBadge.border}`,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                          title="Click to update status"
                        >
                          <span
                            style={{
                              width: '5px',
                              height: '5px',
                              borderRadius: '50%',
                              background: sBadge.dot,
                            }}
                          />
                          <span>{item.status}</span>
                        </button>

                        {/* Dropdown Menu */}
                        {activeStatusDropdown === item._id && (
                          <div
                            style={{
                              position: 'absolute',
                              top: '100%',
                              left: '0',
                              marginTop: '4px',
                              background: '#ffffff',
                              borderRadius: '12px',
                              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                              border: '1px solid #e2e8f0',
                              padding: '5px',
                              zIndex: 50,
                              minWidth: '150px',
                            }}
                          >
                            {[
                              'Logged',
                              'Under Investigation',
                              'In Progress',
                              'Awaiting Customer',
                              'Resolved',
                              'Closed',
                            ].map((st) => (
                              <button
                                key={st}
                                type="button"
                                onClick={async () => {
                                  setActiveStatusDropdown(null);
                                  if (st === 'Resolved') {
                                    onResolve(item);
                                  } else {
                                    await updateComplaintStatus(item._id, st);
                                  }
                                }}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  width: '100%',
                                  padding: '5px 8px',
                                  border: 'none',
                                  background: item.status === st ? '#f1f5f9' : 'transparent',
                                  color: item.status === st ? '#2563eb' : '#334155',
                                  fontWeight: item.status === st ? 700 : 500,
                                  fontSize: '0.76rem',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  textAlign: 'left',
                                }}
                              >
                                <span>{st}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Actions Column */}
                    <td
                      style={{ padding: '10px 14px', verticalAlign: 'middle', textAlign: 'right' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          justifyContent: 'flex-end',
                        }}
                      >
                        {/* View Details */}
                        <button
                          type="button"
                          onClick={() => onView(item)}
                          className="btn-icon-action"
                          title="View Full Ticket Details"
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '7px',
                            border: '1px solid #e2e8f0',
                            background: '#ffffff',
                            color: '#2563eb',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <Eye size={13} />
                        </button>

                        {/* Edit Ticket */}
                        <button
                          type="button"
                          onClick={() => onEdit(item)}
                          className="btn-icon-action"
                          title="Edit Complaint"
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '7px',
                            border: '1px solid #e2e8f0',
                            background: '#ffffff',
                            color: '#475569',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <Edit2 size={13} />
                        </button>

                        {/* Quick Resolve Button if not yet resolved */}
                        {!isResolved && (
                          <button
                            type="button"
                            onClick={() => onResolve(item)}
                            className="btn-icon-action"
                            title="Resolve & Log RCA"
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '7px',
                              border: '1px solid #a7f3d0',
                              background: '#ecfdf5',
                              color: '#059669',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <CheckCircle2 size={13} />
                          </button>
                        )}

                        {/* Delete Ticket (Super Admin) */}
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => onDelete(item)}
                            className="btn-icon-action"
                            title="Delete Ticket"
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '7px',
                              border: '1px solid #fee2e2',
                              background: '#fef2f2',
                              color: '#dc2626',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
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
      <div
        style={{
          padding: '8px 16px',
          background: '#f8fafc',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
          flexShrink: 0,
        }}
      >
        <div style={{ fontSize: '0.78rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span>
            Showing <strong>{complaints.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</strong> to{' '}
            <strong>{Math.min(currentPage * itemsPerPage, totalItems || complaints.length)}</strong> of{' '}
            <strong>{totalItems || complaints.length}</strong> Complaints
          </span>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>Per page:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              style={{
                padding: '2px 5px',
                borderRadius: '5px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                fontSize: '0.74rem',
                color: '#334155',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                border: '1px solid #e2e8f0',
                background: '#ffffff',
                color: currentPage <= 1 ? '#cbd5e1' : '#334155',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
              }}
            >
              <ChevronLeft size={14} />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setCurrentPage(num)}
                style={{
                  minWidth: '28px',
                  height: '28px',
                  padding: '0 6px',
                  borderRadius: '6px',
                  border: num === currentPage ? '1px solid #2563eb' : '1px solid #e2e8f0',
                  background: num === currentPage ? '#2563eb' : '#ffffff',
                  color: num === currentPage ? '#ffffff' : '#334155',
                  fontWeight: num === currentPage ? 700 : 500,
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                }}
              >
                {num}
              </button>
            ))}

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                border: '1px solid #e2e8f0',
                background: '#ffffff',
                color: currentPage >= totalPages ? '#cbd5e1' : '#334155',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
              }}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComplaintTable;
