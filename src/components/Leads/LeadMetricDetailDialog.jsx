import React, { useEffect, useMemo } from 'react';
import {
  Target,
  CheckCircle2,
  Clock,
  TrendingUp,
  X,
  Plus,
  Edit2,
  Trash2,
  ArrowRight,
  Building,
  Mail,
  Phone,
  Calendar,
} from 'lucide-react';
import { useLeads } from '../../context/LeadContext';

export const LeadMetricDetailDialog = ({
  open,
  onClose,
  metricType = 'total', // 'total' | 'qualified' | 'contacted' | 'converted'
  onEditLead,
  onConvertLead,
  onDeleteLead,
  onCreateLead,
}) => {
  const { leads: allLeads, stats, updateLeadStatus } = useLeads();

  // Lock body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      document.body.classList.add('modal-open');
    } else {
      document.body.style.overflow = 'unset';
      document.body.classList.remove('modal-open');
    }
    return () => {
      document.body.style.overflow = 'unset';
      document.body.classList.remove('modal-open');
    };
  }, [open]);

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
      case 'contacted':
        return {
          title: 'In Contact & Active Discussions',
          subtitle: 'Prospects currently undergoing initial outreach, demo presentations, or follow-ups.',
          icon: Clock,
          primaryColor: '#d97706',
          bgLight: '#fffbeb',
          borderColor: '#fde68a',
          badgeText: 'Active Outreach',
          emptyMessage: 'No leads currently in contacted stage.',
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
          if (status === 'Qualified' && onConvertLead) {
            onClose();
            onConvertLead(lead);
          } else {
            updateLeadStatus(lead._id, nextStatusMap[status] || 'New');
          }
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

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'High':
        return (
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#dc2626', background: '#fef2f2', padding: '2px 8px', borderRadius: '6px', border: '1px solid #fee2e2' }}>
            High
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
      } else if (metricType === 'contacted') {
        return lead.status === 'Contacted';
      } else if (metricType === 'converted') {
        return lead.status === 'Converted';
      }
      return true;
    });
  }, [allLeads, metricType]);

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
          maxWidth: '1200px',
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
                  {stats?.total ?? allLeads.length}
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
                  {stats?.qualified ?? allLeads.filter((l) => l.status === 'Qualified').length}
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
                  {stats?.contacted ?? allLeads.filter((l) => l.status === 'Contacted').length}
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
                  {stats?.converted ?? allLeads.filter((l) => l.status === 'Converted').length}
                </div>
              </div>
            </div>
          </div>

          {/* Leads Table with Dedicated Smooth Scroll */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '18px',
              border: '1px solid #e2e8f0',
              overflow: 'hidden',
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
                              {lead.status === 'Qualified' && onConvertLead && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    onClose();
                                    onConvertLead(lead);
                                  }}
                                  title="Convert to Deal / Project"
                                  style={{
                                    padding: '4px 8px',
                                    borderRadius: '6px',
                                    border: 'none',
                                    backgroundColor: '#059669',
                                    color: '#ffffff',
                                    fontSize: '0.72rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                  }}
                                >
                                  <span>Convert</span>
                                  <ArrowRight size={11} />
                                </button>
                              )}

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
                Showing all <strong>{filteredLeads.length}</strong> prospects on scroll
              </span>
            </div>
          </div>
        </div>

        {/* Dialog Footer */}
        <div
          style={{
            padding: '14px 24px',
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

          <div style={{ display: 'flex', gap: '10px' }}>
            {onCreateLead && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onCreateLead();
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
                <span>Add New Lead</span>
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
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
