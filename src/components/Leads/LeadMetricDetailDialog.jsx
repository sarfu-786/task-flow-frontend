import React, { useEffect, useMemo, useState } from 'react';
import {
  Target,
  CheckCircle2,
  Clock,
  TrendingUp,
  X,
  Edit2,
  Trash2,
  Building,
  Mail,
  Phone,
  Calendar,
  PhoneCall,
  PhoneOutgoing,
  PhoneIncoming,
  CheckCheck,
  Clock3,
  FileText,
  Eye,
  MessageSquare,
  Search,
  User,
  ExternalLink,
} from 'lucide-react';
import { useLeads } from '../../context/LeadContext';

export const LeadMetricDetailDialog = ({
  open,
  onClose,
  metricType = 'total', // 'total' | 'qualified' | 'calls' | 'contacted' | 'converted'
  onEditLead,
  onConvertLead,
  onDeleteLead,
}) => {
  const {
    leads: allLeads,
    stats,
    updateLeadStatus,
    openLeadDetailModal,
    openAddCallModal,
    openEditModal,
  } = useLeads();

  const [searchTerm, setSearchTerm] = useState('');

  // Lock body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      document.body.classList.add('modal-open');
      setSearchTerm('');
    } else {
      document.body.style.overflow = 'unset';
      document.body.classList.remove('modal-open');
    }
    return () => {
      document.body.style.overflow = 'unset';
      document.body.classList.remove('modal-open');
    };
  }, [open]);

  const isCallsView = metricType === 'calls' || metricType === 'contacted';

  // Aggregate all call logs across all leads
  const allCallLogs = useMemo(() => {
    const logs = [];
    allLeads.forEach((lead) => {
      if (Array.isArray(lead.callLogs)) {
        lead.callLogs.forEach((call, cIdx) => {
          const callDate = call.date || call.callDate || (call.timestamp ? new Date(call.timestamp).toISOString().split('T')[0] : '');
          const callTime = call.time || call.callTime || (call.timestamp ? new Date(call.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '');
          const callStatus = call.callStatus || call.status || 'Connected Successfully';
          const disposition = call.callOutcome || call.disposition || call.outcome || 'Interested';
          const duration = call.duration || call.callDuration || '';
          const nextFollowUpDate = call.nextFollowUpDate || call.followUpDate || '';
          const nextFollowUpTime = call.nextFollowUpTime || call.followUpTime || '';
          const remarks = call.remarks || call.notes || call.leadResponse || '';
          const performedBy = call.salesUser || call.performedBy || call.agentName || lead.assignedSalesUser || lead.assignedTo || 'Sales Agent';

          logs.push({
            id: call.activityId || call._id || `${lead._id}-call-${cIdx}`,
            activityId: call.activityId || `ACT-${cIdx + 1001}`,
            date: callDate,
            time: callTime,
            callType: call.callType || 'Outgoing',
            callStatus,
            duration,
            callOutcome: disposition,
            disposition,
            leadResponse: call.leadResponse || '',
            remarks,
            nextAction: call.nextAction || '',
            nextFollowUpDate,
            nextFollowUpTime,
            salesUser: performedBy,
            performedBy,
            timestamp: call.timestamp || call.date || new Date(),
            lead,
            leadId: lead.leadId || lead.lead_id || 'LD-001',
            leadName: lead.name || lead.contactPerson || 'Lead Prospect',
            leadCompany: lead.company || '',
            leadPhone: lead.phone || lead.mobileNumber || '',
            leadEmail: lead.email || '',
            leadStatus: lead.status || 'New',
            leadPriority: lead.priority || 'Medium',
            dealValue: lead.estimatedValue || lead.dealValue || 0,
          });
        });
      }
    });
    return logs.sort((a, b) => new Date(b.timestamp || b.date || 0) - new Date(a.timestamp || a.date || 0));
  }, [allLeads]);

  // Dialog configuration based on metricType
  const config = useMemo(() => {
    switch (metricType) {
      case 'qualified':
        return {
          title: 'Qualified Leads Directory',
          subtitle: 'High-intent prospects verified and ready for conversion into active deals & opportunities.',
          icon: CheckCircle2,
          primaryColor: '#059669',
          bgLight: '#ecfdf5',
          borderColor: '#a7f3d0',
          badgeText: 'Ready for Conversion',
          emptyMessage: 'No qualified leads found matching your criteria.',
        };
      case 'calls':
      case 'contacted':
        return {
          title: 'Call Activity & Communication Logs',
          subtitle: 'Comprehensive register of phone interaction history, call statuses, durations, and outreach outcomes.',
          icon: PhoneOutgoing,
          primaryColor: '#d97706',
          bgLight: '#fffbeb',
          borderColor: '#fde68a',
          badgeText: 'Call Logs & Outreach',
          emptyMessage: 'No call interaction logs recorded yet.',
        };
      case 'converted':
        return {
          title: 'Converted Deals & Won Opportunities',
          subtitle: 'Successful leads that converted into active pipeline projects and signed contracts.',
          icon: TrendingUp,
          primaryColor: '#7c3aed',
          bgLight: '#f5f3ff',
          borderColor: '#ddd6fe',
          badgeText: 'Won Deals',
          emptyMessage: 'No converted leads found.',
        };
      case 'total':
      default:
        return {
          title: 'Total Leads Directory & Registry',
          subtitle: 'Comprehensive register of all organization leads, inquiries, and customer prospects.',
          icon: Target,
          primaryColor: '#2563eb',
          bgLight: '#eff6ff',
          borderColor: '#bfdbfe',
          badgeText: 'Full Lead Registry',
          emptyMessage: 'No leads registered in the system.',
        };
    }
  }, [metricType]);

  // Status badge styling
  const getStatusBadge = (lead) => {
    const status = lead.status || 'New';
    const statusConfig = {
      New: { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe', dot: '#2563eb' },
      Contacted: { bg: '#fff7ed', color: '#c2410c', border: '#ffedd5', dot: '#ea580c' },
      Qualified: { bg: '#ecfdf5', color: '#047857', border: '#a7f3d0', dot: '#059669' },
      Converted: { bg: '#f5f3ff', color: '#6d28d9', border: '#ddd6fe', dot: '#7c3aed' },
      Lost: { bg: '#fef2f2', color: '#b91c1c', border: '#fecaca', dot: '#dc2626' },
    };

    const nextStatusMap = {
      New: 'Contacted',
      Contacted: 'Qualified',
      Qualified: 'Converted',
      Converted: 'New',
      Lost: 'New',
    };

    const c = statusConfig[status] || statusConfig.New;

    return (
      <button
        type="button"
        className="crm-badge-status"
        onClick={(e) => {
          e.stopPropagation();
          updateLeadStatus(lead._id, nextStatusMap[status] || 'New');
        }}
        style={{
          background: c.bg,
          color: c.color,
          border: `1px solid ${c.border}`,
          borderRadius: '999px',
          padding: '3px 10px',
          fontSize: '0.74rem',
          fontWeight: 700,
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
        }}
        title={`Status: ${status}. Click to advance.`}
      >
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: c.dot,
          }}
        />
        <span>{status}</span>
      </button>
    );
  };

  const getCallStatusBadge = (callStatus) => {
    switch (callStatus) {
      case 'Connected Successfully':
        return { bg: '#ecfdf5', color: '#059669', border: '#a7f3d0', dot: '#10b981', label: 'Connected' };
      case 'Call Back Requested':
        return { bg: '#fffbeb', color: '#d97706', border: '#fde68a', dot: '#f59e0b', label: 'Callback Requested' };
      case 'No Answer':
        return { bg: '#f1f5f9', color: '#64748b', border: '#e2e8f0', dot: '#94a3b8', label: 'No Answer' };
      case 'Busy':
        return { bg: '#fef2f2', color: '#dc2626', border: '#fecaca', dot: '#ef4444', label: 'Busy' };
      case 'Switched Off':
        return { bg: '#f8fafc', color: '#475569', border: '#cbd5e1', dot: '#64748b', label: 'Switched Off' };
      case 'Number Not Reachable':
        return { bg: '#fef2f2', color: '#b91c1c', border: '#fecaca', dot: '#dc2626', label: 'Not Reachable' };
      default:
        return { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe', dot: '#3b82f6', label: callStatus || 'Logged' };
    }
  };

  const getCallOutcomeBadge = (outcome) => {
    switch (outcome) {
      case 'Interested':
        return { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' };
      case 'Qualified':
        return { bg: '#ecfdf5', color: '#059669', border: '#a7f3d0' };
      case 'Meeting Requested':
      case 'Proposal Requested':
        return { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' };
      case 'Call Later':
      case 'Need More Information':
        return { bg: '#fffbeb', color: '#d97706', border: '#fde68a' };
      case 'Not Interested':
      case 'Not Qualified':
        return { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' };
      default:
        return { bg: '#f8fafc', color: '#64748b', border: '#e2e8f0' };
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'High':
      case 'Urgent':
        return (
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#dc2626', background: '#fef2f2', padding: '2px 8px', borderRadius: '6px', border: '1px solid #fee2e2' }}>
            {priority}
          </span>
        );
      case 'Medium':
        return (
          <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#d97706', background: '#fffbeb', padding: '2px 8px', borderRadius: '6px', border: '1px solid #fef3c7' }}>
            Medium
          </span>
        );
      case 'Low':
        return (
          <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b', background: '#f1f5f9', padding: '2px 8px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
            Low
          </span>
        );
      default:
        return <span style={{ fontSize: '0.72rem' }}>{priority || '—'}</span>;
    }
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

  // Filter leads based on metricType
  const filteredLeads = useMemo(() => {
    return allLeads.filter((lead) => {
      if (metricType === 'qualified') {
        return lead.status === 'Qualified';
      } else if (metricType === 'converted') {
        return lead.status === 'Converted';
      }
      return true;
    });
  }, [allLeads, metricType]);

  // Filter calls by search term
  const filteredCalls = useMemo(() => {
    if (!searchTerm.trim()) return allCallLogs;
    const q = searchTerm.toLowerCase().trim();
    return allCallLogs.filter(
      (c) =>
        c.leadName.toLowerCase().includes(q) ||
        c.leadCompany.toLowerCase().includes(q) ||
        c.leadId.toLowerCase().includes(q) ||
        c.leadPhone.toLowerCase().includes(q) ||
        c.salesUser.toLowerCase().includes(q) ||
        c.callStatus.toLowerCase().includes(q) ||
        c.callOutcome.toLowerCase().includes(q) ||
        c.leadResponse.toLowerCase().includes(q) ||
        c.remarks.toLowerCase().includes(q)
    );
  }, [allCallLogs, searchTerm]);

  if (!open) return null;

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
        zIndex: 1000,
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
          maxWidth: '1240px',
          height: '92vh',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.3)',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Dialog Header */}
        <div
          style={{
            padding: '18px 24px',
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

        {/* Dialog Body */}
        <div
          style={{
            padding: '16px 20px',
            backgroundColor: '#f8fafc',
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            flex: '1 1 auto',
            minHeight: 0,
          }}
        >
          {/* KPI Summary Banner */}
          {isCallsView ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '12px',
              }}
            >
              {/* Card 1: Total Call Attempts */}
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: '14px',
                  backgroundColor: '#ffffff',
                  border: '1.5px solid #fef3c7',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    backgroundColor: '#fffbeb',
                    color: '#d97706',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <PhoneOutgoing size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                    Total Calls
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#d97706', lineHeight: 1.1 }}>
                    {allCallLogs.length}
                  </div>
                </div>
              </div>

              {/* Card 2: Connected Calls */}
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: '14px',
                  backgroundColor: '#ffffff',
                  border: '1.5px solid #d1fae5',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    backgroundColor: '#ecfdf5',
                    color: '#059669',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CheckCheck size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                    Connected
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#059669', lineHeight: 1.1 }}>
                    {allCallLogs.filter((c) => c.callStatus === 'Connected Successfully').length}
                  </div>
                </div>
              </div>

              {/* Card 3: Callbacks Requested */}
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: '14px',
                  backgroundColor: '#ffffff',
                  border: '1.5px solid #fed7aa',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    backgroundColor: '#fff7ed',
                    color: '#ea580c',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <PhoneCall size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                    Callbacks
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ea580c', lineHeight: 1.1 }}>
                    {allCallLogs.filter((c) => c.callStatus === 'Call Back Requested' || c.callOutcome === 'Call Later').length}
                  </div>
                </div>
              </div>

              {/* Card 4: Interested & Qualified Outcomes */}
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: '14px',
                  backgroundColor: '#ffffff',
                  border: '1.5px solid #bfdbfe',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    backgroundColor: '#eff6ff',
                    color: '#2563eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                    Interested / Won
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#2563eb', lineHeight: 1.1 }}>
                    {allCallLogs.filter((c) => c.callOutcome === 'Interested' || c.callOutcome === 'Qualified' || c.callOutcome === 'Meeting Requested').length}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '12px',
              }}
            >
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: '14px',
                  backgroundColor: '#ffffff',
                  border: '1.5px solid #dbeafe',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    backgroundColor: '#eff6ff',
                    color: '#2563eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Target size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                    Total Leads
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#2563eb', lineHeight: 1.1 }}>
                    {allLeads.length}
                  </div>
                </div>
              </div>

              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: '14px',
                  backgroundColor: '#ffffff',
                  border: '1.5px solid #d1fae5',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    backgroundColor: '#ecfdf5',
                    color: '#059669',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                    Qualified
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#059669', lineHeight: 1.1 }}>
                    {allLeads.filter((l) => l.status === 'Qualified').length}
                  </div>
                </div>
              </div>

              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: '14px',
                  backgroundColor: '#ffffff',
                  border: '1.5px solid #fef3c7',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    backgroundColor: '#fffbeb',
                    color: '#d97706',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Clock size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                    In Contact
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#d97706', lineHeight: 1.1 }}>
                    {allLeads.filter((l) => l.status === 'Contacted').length}
                  </div>
                </div>
              </div>

              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: '14px',
                  backgroundColor: '#ffffff',
                  border: '1.5px solid #ddd6fe',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    backgroundColor: '#f5f3ff',
                    color: '#7c3aed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <TrendingUp size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                    Converted
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#7c3aed', lineHeight: 1.1 }}>
                    {allLeads.filter((l) => l.status === 'Converted').length}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Search bar for Call Logs */}
          {isCallsView && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: '#ffffff',
                padding: '8px 14px',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
              }}
            >
              <Search size={16} color="#94a3b8" />
              <input
                type="text"
                placeholder="Search call logs by lead name, phone, agent, status, or remarks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  border: 'none',
                  outline: 'none',
                  width: '100%',
                  fontSize: '0.84rem',
                  color: '#1e293b',
                  background: 'transparent',
                }}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8' }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          )}

          {/* Main Table Container */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
              display: 'flex',
              flexDirection: 'column',
              flex: '1 1 auto',
            }}
          >
            <div
              style={{
                overflowX: 'auto',
                overflowY: 'auto',
                width: '100%',
                maxHeight: '520px',
                scrollbarWidth: 'thin',
              }}
            >
              {isCallsView ? (
                /* CALL LOGS TABLE */
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '1050px' }}>
                  <thead>
                    <tr
                      style={{
                        backgroundColor: '#f8fafc',
                        borderBottom: '1.5px solid #e2e8f0',
                        position: 'sticky',
                        top: 0,
                        zIndex: 10,
                        boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                      }}
                    >
                      <th style={{ padding: '12px 14px', color: '#64748b', fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', width: '40px', textAlign: 'center' }}>
                        #
                      </th>
                      <th style={{ padding: '12px 14px', color: '#64748b', fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                        Call Date
                      </th>
                      <th style={{ padding: '12px 14px', color: '#64748b', fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                        Call Time
                      </th>
                      <th style={{ padding: '12px 14px', color: '#64748b', fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', minWidth: '150px' }}>
                        Lead / Prospect
                      </th>
                      <th style={{ padding: '12px 14px', color: '#64748b', fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                        Call Status
                      </th>
                      <th style={{ padding: '12px 14px', color: '#64748b', fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                        Disposition
                      </th>
                      <th style={{ padding: '12px 14px', color: '#64748b', fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                        Call Duration
                      </th>
                      <th style={{ padding: '12px 14px', color: '#64748b', fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                        Next Follow-up Date
                      </th>
                      <th style={{ padding: '12px 14px', color: '#64748b', fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                        Next Follow-up Time
                      </th>
                      <th style={{ padding: '12px 14px', color: '#64748b', fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', minWidth: '180px' }}>
                        Remarks
                      </th>
                      <th style={{ padding: '12px 14px', color: '#64748b', fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                        Performed By
                      </th>
                      <th style={{ padding: '12px 14px', color: '#64748b', fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', textAlign: 'right', minWidth: '85px' }}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCalls.length === 0 ? (
                      <tr>
                        <td colSpan="12" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                          <PhoneCall size={32} color="#94a3b8" style={{ marginBottom: '8px' }} />
                          <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.95rem' }}>
                            {searchTerm ? 'No call logs matching your search query.' : config.emptyMessage}
                          </div>
                          <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#94a3b8' }}>
                            Use the "Record Call" action on any lead to log telephone outreach and client feedback.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredCalls.map((call, index) => {
                        const serialNumber = index + 1;
                        const statusBadge = getCallStatusBadge(call.callStatus);
                        const outcomeBadge = getCallOutcomeBadge(call.disposition || call.callOutcome);

                        return (
                          <tr
                            key={call.id || index}
                            style={{
                              borderBottom: '1px solid #f1f5f9',
                              transition: 'background 0.15s ease',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                          >
                            {/* Sr. No */}
                            <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                              <span
                                style={{
                                  display: 'inline-block',
                                  minWidth: '22px',
                                  padding: '2px 6px',
                                  borderRadius: '6px',
                                  backgroundColor: '#f1f5f9',
                                  color: '#64748b',
                                  fontWeight: 700,
                                  fontSize: '0.72rem',
                                  textAlign: 'center',
                                }}
                              >
                                {serialNumber}
                              </span>
                            </td>

                            {/* Call Date */}
                            <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <Calendar size={13} color="#d97706" />
                                <span>{formatDate(call.date)}</span>
                              </div>
                            </td>

                            {/* Call Time */}
                            <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <Clock3 size={12} color="#64748b" />
                                  {call.time || '—'}
                                </span>
                                {call.callType && (
                                  <span
                                    style={{
                                      fontSize: '0.66rem',
                                      fontWeight: 700,
                                      padding: '1px 5px',
                                      borderRadius: '4px',
                                      backgroundColor: call.callType === 'Incoming' ? '#ecfdf5' : '#eff6ff',
                                      color: call.callType === 'Incoming' ? '#059669' : '#2563eb',
                                      border: `1px solid ${call.callType === 'Incoming' ? '#a7f3d0' : '#bfdbfe'}`,
                                    }}
                                  >
                                    {call.callType}
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Lead / Prospect */}
                            <td style={{ padding: '12px 14px' }}>
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span
                                    style={{
                                      fontSize: '0.7rem',
                                      fontWeight: 800,
                                      padding: '1px 5px',
                                      borderRadius: '4px',
                                      backgroundColor: '#eff6ff',
                                      color: '#2563eb',
                                      border: '1px solid #bfdbfe',
                                    }}
                                  >
                                    {call.leadId}
                                  </span>
                                  <strong style={{ fontSize: '0.84rem', color: '#0f172a' }}>{call.leadName}</strong>
                                </div>
                                {call.leadCompany && (
                                  <div style={{ fontSize: '0.74rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                    <Building size={11} />
                                    <span>{call.leadCompany}</span>
                                  </div>
                                )}
                                {call.leadPhone && (
                                  <div style={{ fontSize: '0.72rem', color: '#059669', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '1px' }}>
                                    <Phone size={10} />
                                    <span>{call.leadPhone}</span>
                                  </div>
                                )}
                              </div>
                            </td>

                            {/* Call Status */}
                            <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                  padding: '3px 9px',
                                  borderRadius: '999px',
                                  backgroundColor: statusBadge.bg,
                                  color: statusBadge.color,
                                  border: `1px solid ${statusBadge.border}`,
                                  fontSize: '0.73rem',
                                  fontWeight: 700,
                                }}
                              >
                                <span
                                  style={{
                                    width: '6px',
                                    height: '6px',
                                    borderRadius: '50%',
                                    backgroundColor: statusBadge.dot,
                                  }}
                                />
                                <span>{statusBadge.label}</span>
                              </span>
                            </td>

                            {/* Disposition */}
                            <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                              <span
                                style={{
                                  display: 'inline-block',
                                  padding: '2px 8px',
                                  borderRadius: '6px',
                                  backgroundColor: outcomeBadge.bg,
                                  color: outcomeBadge.color,
                                  border: `1px solid ${outcomeBadge.border}`,
                                  fontSize: '0.74rem',
                                  fontWeight: 700,
                                }}
                              >
                                {call.disposition || call.callOutcome || 'Interested'}
                              </span>
                            </td>

                            {/* Call Duration */}
                            <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                              <span
                                style={{
                                  fontSize: '0.78rem',
                                  fontWeight: call.duration ? 700 : 400,
                                  color: call.duration ? '#0f172a' : '#94a3b8',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  backgroundColor: call.duration ? '#f8fafc' : 'transparent',
                                  padding: call.duration ? '2px 6px' : '0',
                                  borderRadius: '4px',
                                  border: call.duration ? '1px solid #e2e8f0' : 'none',
                                }}
                              >
                                {call.duration || '—'}
                              </span>
                            </td>

                            {/* Next Follow-up Date */}
                            <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                              <span
                                style={{
                                  fontSize: '0.78rem',
                                  color: call.nextFollowUpDate ? '#1e293b' : '#94a3b8',
                                  fontWeight: call.nextFollowUpDate ? 600 : 400,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                              >
                                {call.nextFollowUpDate ? (
                                  <>
                                    <Calendar size={12} color="#059669" />
                                    {formatDate(call.nextFollowUpDate)}
                                  </>
                                ) : (
                                  '—'
                                )}
                              </span>
                            </td>

                            {/* Next Follow-up Time */}
                            <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                              <span
                                style={{
                                  fontSize: '0.78rem',
                                  color: call.nextFollowUpTime ? '#334155' : '#94a3b8',
                                  fontWeight: call.nextFollowUpTime ? 600 : 400,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                              >
                                {call.nextFollowUpTime ? (
                                  <>
                                    <Clock3 size={11} color="#64748b" />
                                    {call.nextFollowUpTime}
                                  </>
                                ) : (
                                  '—'
                                )}
                              </span>
                            </td>

                            {/* Remarks */}
                            <td style={{ padding: '12px 14px', minWidth: '180px', maxWidth: '260px' }}>
                              <div style={{ fontSize: '0.78rem', color: '#334155', lineHeight: 1.35 }}>
                                {call.leadResponse && (
                                  <div style={{ fontStyle: 'italic', color: '#0f172a', marginBottom: '2px', fontWeight: 500 }}>
                                    "{call.leadResponse}"
                                  </div>
                                )}
                                {call.remarks && (
                                  <div style={{ color: '#475569', fontSize: '0.74rem' }}>
                                    {call.remarks}
                                  </div>
                                )}
                                {call.nextAction && (
                                  <div style={{ color: '#d97706', fontWeight: 600, fontSize: '0.72rem', marginTop: '2px' }}>
                                    Next: {call.nextAction}
                                  </div>
                                )}
                                {!call.leadResponse && !call.remarks && !call.nextAction && (
                                  <span style={{ color: '#94a3b8' }}>—</span>
                                )}
                              </div>
                            </td>

                            {/* Performed By */}
                            <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <div
                                  style={{
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: '50%',
                                    backgroundColor: '#fffbeb',
                                    color: '#d97706',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                    border: '1px solid #fde68a',
                                  }}
                                >
                                  {(call.performedBy || call.salesUser || 'A').charAt(0).toUpperCase()}
                                </div>
                                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>
                                  {call.performedBy || call.salesUser}
                                </span>
                              </div>
                            </td>

                            {/* Actions */}
                            <td style={{ padding: '12px 14px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    onClose();
                                    openLeadDetailModal(call.lead);
                                  }}
                                  title="View Lead Details & Full History"
                                  style={{
                                    padding: '5px 8px',
                                    borderRadius: '6px',
                                    border: '1px solid #e2e8f0',
                                    backgroundColor: '#ffffff',
                                    color: '#475569',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '3px',
                                    fontSize: '0.72rem',
                                    fontWeight: 600,
                                  }}
                                >
                                  <Eye size={12} />
                                  <span>View</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    onClose();
                                    openAddCallModal(call.lead);
                                  }}
                                  title="Log Follow-up Call"
                                  style={{
                                    padding: '5px 8px',
                                    borderRadius: '6px',
                                    border: 'none',
                                    backgroundColor: '#fffbeb',
                                    color: '#d97706',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '3px',
                                    fontSize: '0.72rem',
                                    fontWeight: 700,
                                  }}
                                >
                                  <PhoneCall size={12} />
                                  <span>Call</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              ) : (
                /* STANDARD LEADS DIRECTORY TABLE */
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr
                      style={{
                        backgroundColor: '#f8fafc',
                        borderBottom: '1.5px solid #e2e8f0',
                        position: 'sticky',
                        top: 0,
                        zIndex: 10,
                        boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                      }}
                    >
                      <th style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.76rem', fontWeight: 700, textTransform: 'uppercase', width: '55px', textAlign: 'center', backgroundColor: '#f8fafc' }}>
                        #
                      </th>
                      <th style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.76rem', fontWeight: 700, textTransform: 'uppercase', backgroundColor: '#f8fafc' }}>
                        Lead / Contact
                      </th>
                      <th style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.76rem', fontWeight: 700, textTransform: 'uppercase', backgroundColor: '#f8fafc' }}>
                        Contact Info
                      </th>
                      <th style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.76rem', fontWeight: 700, textTransform: 'uppercase', backgroundColor: '#f8fafc' }}>
                        Source
                      </th>
                      <th style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.76rem', fontWeight: 700, textTransform: 'uppercase', backgroundColor: '#f8fafc' }}>
                        Status
                      </th>
                      <th style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.76rem', fontWeight: 700, textTransform: 'uppercase', backgroundColor: '#f8fafc' }}>
                        Priority
                      </th>
                      <th style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.76rem', fontWeight: 700, textTransform: 'uppercase', backgroundColor: '#f8fafc' }}>
                        Assigned To
                      </th>
                      <th style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.76rem', fontWeight: 700, textTransform: 'uppercase', backgroundColor: '#f8fafc' }}>
                        Created Date
                      </th>
                      <th style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.76rem', fontWeight: 700, textTransform: 'uppercase', textAlign: 'right', minWidth: '130px', backgroundColor: '#f8fafc' }}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeads.length === 0 ? (
                      <tr>
                        <td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                          <Target size={32} color="#94a3b8" style={{ marginBottom: '8px' }} />
                          <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.95rem' }}>
                            {config.emptyMessage}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredLeads.map((lead, index) => {
                        const serialNumber = index + 1;

                        return (
                          <tr
                            key={lead._id}
                            style={{
                              borderBottom: '1px solid #f1f5f9',
                              transition: 'background 0.15s ease',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                          >
                            {/* Sr. No */}
                            <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                              <span
                                style={{
                                  display: 'inline-block',
                                  minWidth: '22px',
                                  padding: '2px 6px',
                                  borderRadius: '6px',
                                  backgroundColor: '#f1f5f9',
                                  color: '#64748b',
                                  fontWeight: 700,
                                  fontSize: '0.74rem',
                                  textAlign: 'center',
                                }}
                              >
                                {serialNumber}
                              </span>
                            </td>

                            {/* Lead / Contact */}
                            <td style={{ padding: '12px 16px' }}>
                              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                <div
                                  style={{
                                    width: '34px',
                                    height: '34px',
                                    borderRadius: '10px',
                                    backgroundColor: '#eff6ff',
                                    color: '#2563eb',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 700,
                                    fontSize: '0.82rem',
                                    flexShrink: 0,
                                    border: '1px solid #bfdbfe',
                                  }}
                                >
                                  {(lead.name || 'L').charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.88rem' }}>
                                    {lead.name}
                                  </div>
                                  {lead.company && (
                                    <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '1px' }}>
                                      <Building size={11} />
                                      <span>{lead.company}</span>
                                    </div>
                                  )}
                                  <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#059669', marginTop: '1px' }}>
                                    Deal: {lead.currency === 'INR' ? '₹' : '$'}{(Number(lead.dealValue) || 0).toLocaleString()}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Contact Info */}
                            <td style={{ padding: '12px 16px' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '0.78rem' }}>
                                {lead.email && (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#334155' }}>
                                    <Mail size={12} color="#94a3b8" />
                                    <span>{lead.email}</span>
                                  </div>
                                )}
                                {lead.phone && (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#334155' }}>
                                    <Phone size={12} color="#94a3b8" />
                                    <span>{lead.phone}</span>
                                  </div>
                                )}
                                {!lead.email && !lead.phone && <span style={{ color: '#94a3b8' }}>—</span>}
                              </div>
                            </td>

                            {/* Source */}
                            <td style={{ padding: '12px 16px' }}>
                              <span
                                style={{
                                  display: 'inline-block',
                                  padding: '2px 8px',
                                  borderRadius: '6px',
                                  backgroundColor: '#f8fafc',
                                  border: '1px solid #e2e8f0',
                                  color: '#475569',
                                  fontSize: '0.74rem',
                                  fontWeight: 600,
                                }}
                              >
                                {lead.source || 'Website'}
                              </span>
                            </td>

                            {/* Status */}
                            <td style={{ padding: '12px 16px' }}>
                              {getStatusBadge(lead)}
                            </td>

                            {/* Priority */}
                            <td style={{ padding: '12px 16px' }}>
                              {getPriorityBadge(lead.priority)}
                            </td>

                            {/* Assigned To */}
                            <td style={{ padding: '12px 16px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <div
                                  style={{
                                    width: '22px',
                                    height: '22px',
                                    borderRadius: '50%',
                                    backgroundColor: '#f1f5f9',
                                    color: '#475569',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.68rem',
                                    fontWeight: 700,
                                  }}
                                >
                                  {(lead.assignedTo || 'U').charAt(0).toUpperCase()}
                                </div>
                                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>
                                  {lead.assignedTo || 'Unassigned'}
                                </span>
                              </div>
                            </td>

                            {/* Created Date */}
                            <td style={{ padding: '12px 16px' }}>
                              <div style={{ fontSize: '0.76rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Calendar size={12} />
                                <span>{formatDate(lead.createdAt)}</span>
                              </div>
                            </td>

                            {/* Actions */}
                            <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                                {onEditLead && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onClose();
                                      onEditLead(lead);
                                    }}
                                    title="Edit Lead"
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
                                    <Edit2 size={13} />
                                  </button>
                                )}

                                {onDeleteLead && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onClose();
                                      onDeleteLead(lead);
                                    }}
                                    title="Delete Lead"
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
              )}
            </div>

            {/* Total Footer Status */}
            <div
              style={{
                padding: '10px 18px',
                borderTop: '1px solid #e2e8f0',
                backgroundColor: '#f8fafc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                {isCallsView
                  ? `Showing all ${filteredCalls.length} call logs across organization leads`
                  : `Showing all ${filteredLeads.length} prospects on scroll`}
              </span>
            </div>
          </div>
        </div>

        {/* Dialog Footer */}
        <div
          style={{
            padding: '12px 24px',
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
              Metric View: <strong style={{ color: '#0f172a' }}>{config.badgeText}</strong>
            </span>
          </div>

          <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}>
            {isCallsView
              ? `${filteredCalls.length} ${filteredCalls.length === 1 ? 'call log' : 'call logs'}`
              : `${filteredLeads.length} ${filteredLeads.length === 1 ? 'prospect' : 'prospects'}`}
          </span>
        </div>
      </div>
    </div>
  );
};

export default LeadMetricDetailDialog;
