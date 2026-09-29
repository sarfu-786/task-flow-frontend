import React, { useState, useEffect } from 'react';
import { useLeads } from '../../context/LeadContext';
import { useAuth } from '../../context/AuthContext';
import {
  X,
  PhoneCall,
  PhoneOutgoing,
  PhoneIncoming,
  Calendar,
  Clock,
  User,
  Building,
  Mail,
  Phone,
  DollarSign,
  Tag,
  Flag,
  Share2,
  Briefcase,
  FileText,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Plus,
  TrendingUp,
  ExternalLink,
  Shield,
  Layers,
  History,
  Clock3,
  Check,
  RotateCcw,
  Trash2,
  Edit2,
} from 'lucide-react';
import { LeadOpportunitySection } from './LeadOpportunitySection';

export const LeadDetailModal = () => {
  const {
    isLeadDetailModalOpen,
    leadForDetail,
    leadDetailTab,
    closeLeadDetailModal,
    openEditModal,
    openAddCallModal,
    openScheduleFollowUpModal,
    openQualifyModal,
    openConvertModal,
    openDeleteModal,
    updateLeadStatus,
    updateFollowUp,
  } = useLeads();

  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState(leadDetailTab || 'info'); // 'info' | 'calls' | 'followups' | 'timeline' | 'opportunity'
  const [statusUpdating, setStatusUpdating] = useState(false);

  useEffect(() => {
    if (leadDetailTab) {
      setActiveTab(leadDetailTab);
    }
  }, [leadDetailTab, leadForDetail]);

  if (!isLeadDetailModalOpen || !leadForDetail) return null;

  const lead = leadForDetail;
  const isConverted = lead.status === 'Converted' || !!lead.opportunityId || !!lead.convertedOpportunityId;
  const canConvert = !isConverted && (lead.status === 'Qualified' || lead.status === 'Interested');
  const canQualify = !isConverted && lead.status !== 'Qualified' && lead.status !== 'Lost' && lead.status !== 'Invalid';

  const handleStatusChange = async (newStatus) => {
    if (newStatus === lead.status) return;
    setStatusUpdating(true);
    try {
      await updateLeadStatus(lead._id || lead.leadId, newStatus);
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleFollowUpStatusToggle = async (followUpId, newStatus) => {
    try {
      await updateFollowUp(lead._id || lead.leadId, followUpId, { status: newStatus });
    } catch (err) {
      console.error('Failed to toggle follow-up status:', err);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Converted':
        return { bg: '#f5f3ff', color: '#7c3aed', border: '#ddd6fe' };
      case 'Qualified':
        return { bg: '#ecfdf5', color: '#059669', border: '#a7f3d0' };
      case 'Interested':
        return { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' };
      case 'Follow-Up':
        return { bg: '#fffbeb', color: '#d97706', border: '#fde68a' };
      case 'Contacted':
        return { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' };
      case 'Not Interested':
      case 'Invalid':
      case 'Lost':
        return { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' };
      default:
        return { bg: '#f8fafc', color: '#475569', border: '#e2e8f0' };
    }
  };

  const badgeStyle = getStatusBadge(lead.status);
  const callLogs = Array.isArray(lead.callLogs) ? [...lead.callLogs] : [];
  const followups = Array.isArray(lead.followups) ? [...lead.followups] : [];
  const timeline = Array.isArray(lead.timeline) ? [...lead.timeline] : [];

  return (
    <div className="modal-backdrop active" onClick={closeLeadDetailModal} style={{ zIndex: 1100 }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '850px',
          width: '95%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          padding: 0,
        }}
      >
        {/* Top Header Card */}
        <div
          style={{
            padding: '20px 24px 16px',
            borderBottom: '1px solid #e2e8f0',
            background: '#f8fafc',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    padding: '2px 10px',
                    borderRadius: '6px',
                    background: '#eff6ff',
                    color: '#2563eb',
                    border: '1px solid #bfdbfe',
                  }}
                >
                  {lead.leadId || 'LD-001'}
                </span>
                <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#1e293b' }}>
                  {lead.company || lead.name || lead.contactPerson}
                </h2>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: '999px',
                    background: badgeStyle.bg,
                    color: badgeStyle.color,
                    border: `1px solid ${badgeStyle.border}`,
                  }}
                >
                  {lead.status || 'New'}
                </span>
                {lead.priority && (
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: '6px',
                      background: lead.priority === 'Urgent' || lead.priority === 'High' ? '#fef2f2' : '#f1f5f9',
                      color: lead.priority === 'Urgent' || lead.priority === 'High' ? '#dc2626' : '#64748b',
                      border: lead.priority === 'Urgent' || lead.priority === 'High' ? '1px solid #fecaca' : '1px solid #e2e8f0',
                    }}
                  >
                    {lead.priority} Priority
                  </span>
                )}
              </div>
              <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                Contact: <strong style={{ color: '#334155' }}>{lead.contactPerson || lead.name}</strong>
                {lead.mobileNumber || lead.phone ? ` • 📞 ${lead.mobileNumber || lead.phone}` : ''}
                {lead.email ? ` • ✉️ ${lead.email}` : ''}
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                className="btn-icon"
                onClick={closeLeadDetailModal}
                aria-label="Close modal"
                style={{ background: '#ffffff', border: '1px solid #cbd5e1' }}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* If already converted, show banner with Opportunity ID */}
          {isConverted && (
            <div
              style={{
                marginTop: '12px',
                padding: '10px 16px',
                borderRadius: '8px',
                background: '#f5f3ff',
                border: '1px solid #ddd6fe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={18} color="#7c3aed" />
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#5b21b6' }}>
                  This Lead has been converted to Opportunity{' '}
                  <span style={{ textDecoration: 'underline' }}>{lead.opportunityId || 'OP-001'}</span>.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('opportunity')}
                style={{
                  padding: '4px 12px',
                  borderRadius: '6px',
                  background: '#7c3aed',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span>View Opportunity Details</span>
                <ExternalLink size={12} />
              </button>
            </div>
          )}

          {/* Action Toolbar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '10px',
              marginTop: '16px',
              paddingTop: '12px',
              borderTop: '1px solid #e2e8f0',
            }}
          >
            {/* Quick Status Switcher */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569' }}>Change Status:</span>
              <select
                className="form-control select-filter"
                style={{ fontSize: '0.8rem', padding: '4px 10px', height: 'auto', minWidth: '130px' }}
                value={lead.status || 'New'}
                disabled={statusUpdating || isConverted}
                onChange={(e) => handleStatusChange(e.target.value)}
              >
                <option value="New">New</option>
                <option value="Contacted">Contacted</option>
                <option value="Follow-Up">Follow-Up</option>
                <option value="Qualified">Qualified</option>
                <option value="Interested">Interested</option>
                <option value="Converted" disabled={!isConverted}>Converted</option>
                <option value="Not Interested">Not Interested</option>
                <option value="Invalid">Invalid</option>
              </select>
            </div>

            {/* Main Action Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => openAddCallModal(lead)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  background: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  color: '#1d4ed8',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                <PhoneCall size={14} />
                <span>Add Call Log</span>
              </button>

              <button
                type="button"
                onClick={() => openScheduleFollowUpModal(lead)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  background: '#fffbeb',
                  border: '1px solid #fde68a',
                  color: '#b45309',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                <Clock3 size={14} />
                <span>Schedule Follow-Up</span>
              </button>

              <button
                type="button"
                onClick={() => openEditModal(lead)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  color: '#334155',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                <Edit2 size={14} />
                <span>Edit Lead</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  closeLeadDetailModal();
                  openDeleteModal(lead);
                }}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#dc2626',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                <Trash2 size={14} />
                <span>Delete</span>
              </button>

              {/* Qualify Lead Button */}
              {canQualify && (
                <button
                  type="button"
                  id="btn-qualify-lead"
                  onClick={() => openQualifyModal(lead)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    background: '#ecfdf5',
                    border: '1px solid #a7f3d0',
                    color: '#059669',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  <CheckCircle2 size={14} />
                  <span>Qualify Lead</span>
                </button>
              )}

              {/* Convert to Opportunity Button */}
              {canConvert ? (
                <button
                  type="button"
                  id="btn-convert-lead"
                  onClick={() => openConvertModal(lead)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    background: '#059669',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 4px rgba(5, 150, 105, 0.25)',
                  }}
                >
                  <Sparkles size={14} />
                  <span>Convert to Opportunity</span>
                </button>
              ) : isConverted ? (
                <span
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    background: '#ede9fe',
                    color: '#6d28d9',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Check size={14} />
                  <span>Converted ({lead.opportunityId || 'OP-001'})</span>
                </span>
              ) : (
                <button
                  type="button"
                  disabled
                  title="Lead can only be converted when status is Qualified or Interested"
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    background: '#f1f5f9',
                    border: '1px solid #e2e8f0',
                    color: '#94a3b8',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  <Sparkles size={14} />
                  <span>Convert to Opportunity</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 5 Tab Navigation Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 24px',
            borderBottom: '1px solid #e2e8f0',
            background: '#ffffff',
            overflowX: 'auto',
            flexShrink: 0,
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('info')}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'info' ? '#eff6ff' : 'transparent',
              color: activeTab === 'info' ? '#2563eb' : '#64748b',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap',
            }}
          >
            <User size={14} />
            <span>Lead Information</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('calls')}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'calls' ? '#eff6ff' : 'transparent',
              color: activeTab === 'calls' ? '#2563eb' : '#64748b',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap',
            }}
          >
            <PhoneCall size={14} />
            <span>Communication History ({callLogs.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('followups')}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'followups' ? '#eff6ff' : 'transparent',
              color: activeTab === 'followups' ? '#2563eb' : '#64748b',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap',
            }}
          >
            <Clock3 size={14} />
            <span>Follow-Ups ({followups.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('timeline')}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'timeline' ? '#eff6ff' : 'transparent',
              color: activeTab === 'timeline' ? '#2563eb' : '#64748b',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap',
            }}
          >
            <History size={14} />
            <span>Timeline Journey ({timeline.length})</span>
          </button>

          {isConverted && (
            <button
              type="button"
              onClick={() => setActiveTab('opportunity')}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'opportunity' ? '#f5f3ff' : 'transparent',
                color: activeTab === 'opportunity' ? '#7c3aed' : '#64748b',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap',
              }}
            >
              <Sparkles size={14} />
              <span>Opportunity Linkage ({lead.opportunityId || 'OP-001'})</span>
            </button>
          )}
        </div>

        {/* Tab Content Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: '1 1 auto', minHeight: 0 }}>
          {/* TAB 1: LEAD INFORMATION */}
          {activeTab === 'info' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '16px',
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '16px',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>LEAD ID</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1e293b', marginTop: '2px' }}>
                    {lead.leadId || 'LD-001'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>COMPANY NAME</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e293b', marginTop: '2px' }}>
                    {lead.company || 'Enterprise Account'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>CONTACT PERSON</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e293b', marginTop: '2px' }}>
                    {lead.contactPerson || lead.name}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>MOBILE NUMBER</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e293b', marginTop: '2px' }}>
                    {lead.mobileNumber || lead.phone || 'N/A'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>EMAIL ADDRESS</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e293b', marginTop: '2px' }}>
                    {lead.email || 'N/A'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>LEAD SOURCE</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e293b', marginTop: '2px' }}>
                    {lead.source || lead.campaign_source || 'Website'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>ESTIMATED DEAL VALUE</div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#059669', marginTop: '2px' }}>
                    ₹{Number(lead.estimatedValue || lead.dealValue || 0).toLocaleString()}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>ASSIGNED SALES USER</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e293b', marginTop: '2px' }}>
                    {lead.assignedSalesUser || lead.assignedTo || 'Unassigned'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>ASSIGNED MANAGER</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e293b', marginTop: '2px' }}>
                    {lead.assignedManagerName || lead.assignedManager || 'Executive Leadership'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>CREATED DATE</div>
                  <div style={{ fontSize: '0.85rem', color: '#334155', marginTop: '2px' }}>
                    {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString('en-GB') : 'N/A'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>LAST CONTACT DATE</div>
                  <div style={{ fontSize: '0.85rem', color: '#334155', marginTop: '2px' }}>
                    {lead.lastContactDate || lead.last_contacted_at
                      ? new Date(lead.lastContactDate || lead.last_contacted_at).toLocaleDateString('en-GB')
                      : 'No calls logged yet'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>NEXT FOLLOW-UP</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: lead.nextFollowUpDate ? '#d97706' : '#64748b', marginTop: '2px' }}>
                    {lead.nextFollowUpDate || lead.next_followup_at
                      ? `${new Date(lead.nextFollowUpDate || lead.next_followup_at).toLocaleDateString('en-GB')}${lead.nextFollowUpTime ? ' • ' + lead.nextFollowUpTime : ''}`
                      : 'Not scheduled'}
                  </div>
                </div>
              </div>

              {/* Requirement Card */}
              {lead.requirement && (
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#334155', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Briefcase size={14} color="#2563eb" />
                    <span>CUSTOMER REQUIREMENT</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.88rem', color: '#475569', lineHeight: 1.5 }}>
                    {lead.requirement}
                  </p>
                </div>
              )}

              {/* Remarks / Notes Card */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#334155', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FileText size={14} color="#2563eb" />
                  <span>REMARKS & CONTEXT</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.88rem', color: '#475569', lineHeight: 1.5 }}>
                  {lead.remarks || lead.notes || 'No remarks added yet.'}
                </p>
              </div>

              {/* Opportunity Workflow Section (Only for Converted Leads) */}
              {isConverted && (
                <LeadOpportunitySection lead={lead} />
              )}
            </div>
          )}

          {/* TAB 2: COMMUNICATION HISTORY / CALL LOGS */}
          {activeTab === 'calls' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#1e293b' }}>
                    Complete Communication History
                  </h4>
                  <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#64748b' }}>
                    All telephonic, video, and direct sales interactions recorded in chronological sequence.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => openAddCallModal(lead)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    background: '#2563eb',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Plus size={14} />
                  <span>Add Call Log</span>
                </button>
              </div>

              {callLogs.length === 0 ? (
                <div style={{ padding: '36px', textAlign: 'center', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                  <PhoneCall size={32} color="#94a3b8" style={{ marginBottom: '8px' }} />
                  <p style={{ margin: 0, fontWeight: 700, color: '#475569' }}>No call interactions recorded yet.</p>
                  <p style={{ margin: '4px 0 12px', fontSize: '0.8rem', color: '#94a3b8' }}>Click "Add Call Log" to log your first client call attempt.</p>
                  <button
                    type="button"
                    onClick={() => openAddCallModal(lead)}
                    className="btn btn-primary"
                    style={{ fontSize: '0.8rem', padding: '6px 14px' }}
                  >
                    Add First Call Log
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {callLogs.map((call, idx) => {
                    const isOutgoing = call.callType !== 'Incoming';
                    const isConnected = call.callStatus === 'Connected Successfully' || call.callStatus === 'Call Received';

                    return (
                      <div
                        key={call.activityId || idx}
                        style={{
                          background: '#ffffff',
                          border: '1px solid #e2e8f0',
                          borderRadius: '12px',
                          padding: '16px',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                background: isConnected ? '#ecfdf5' : '#eff6ff',
                                color: isConnected ? '#059669' : '#2563eb',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              {isOutgoing ? <PhoneOutgoing size={16} /> : <PhoneIncoming size={16} />}
                            </div>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '1px 6px', borderRadius: '4px', background: '#f1f5f9', color: '#475569' }}>
                                  {call.activityId || `ACT-${idx + 1001}`}
                                </span>
                                <strong style={{ fontSize: '0.9rem', color: '#1e293b' }}>
                                  {call.callType || 'Outgoing'} Call — {call.callStatus}
                                </strong>
                              </div>
                              <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                                Sales User: <strong>{call.salesUser || lead.assignedTo || 'Sales Rep'}</strong> • {call.date || (call.timestamp ? new Date(call.timestamp).toLocaleDateString('en-GB') : 'Logged Call')}{call.time ? ` at ${call.time}` : ''}
                                {call.duration || call.callDuration || call.duration_seconds
                                  ? ` • Duration: ${call.duration || call.callDuration || `${call.duration_seconds}s`}`
                                  : ''}
                              </span>
                            </div>
                          </div>

                          {/* Outcome badge */}
                          {call.callOutcome && (
                            <span
                              style={{
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                padding: '2px 8px',
                                borderRadius: '6px',
                                background: call.callOutcome === 'Interested' ? '#f0fdf4' : call.callOutcome === 'Qualified' ? '#ecfdf5' : '#f8fafc',
                                color: call.callOutcome === 'Interested' ? '#16a34a' : call.callOutcome === 'Qualified' ? '#059669' : '#475569',
                                border: '1px solid #e2e8f0',
                              }}
                            >
                              Outcome: {call.callOutcome}
                            </span>
                          )}
                        </div>

                        {/* Client response quote */}
                        {call.leadResponse && (
                          <div
                            style={{
                              marginTop: '12px',
                              padding: '8px 12px',
                              borderRadius: '8px',
                              background: '#f8fafc',
                              borderLeft: '3px solid #2563eb',
                              fontSize: '0.84rem',
                              fontStyle: 'italic',
                              color: '#334155',
                            }}
                          >
                            "{call.leadResponse}"
                          </div>
                        )}

                        {/* Remarks */}
                        {call.remarks && (
                          <div style={{ marginTop: '8px', fontSize: '0.83rem', color: '#475569' }}>
                            <strong>Remarks:</strong> {call.remarks}
                          </div>
                        )}

                        {/* Next Action & Follow-up */}
                        {(call.nextAction || call.nextFollowUpDate) && (
                          <div
                            style={{
                              marginTop: '10px',
                              paddingTop: '8px',
                              borderTop: '1px dashed #e2e8f0',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              fontSize: '0.78rem',
                              color: '#64748b',
                              flexWrap: 'wrap',
                              gap: '6px',
                            }}
                          >
                            {call.nextAction && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <ArrowRight size={12} color="#2563eb" />
                                <span>Next Action: <strong style={{ color: '#1e293b' }}>{call.nextAction}</strong></span>
                              </div>
                            )}

                            {call.nextFollowUpDate && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Calendar size={12} color="#d97706" />
                                <span>Follow-Up: <strong style={{ color: '#b45309' }}>{call.nextFollowUpDate}{call.nextFollowUpTime ? ` ${call.nextFollowUpTime}` : ''}</strong></span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: FOLLOW-UPS */}
          {activeTab === 'followups' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#1e293b' }}>
                    Scheduled Follow-Ups
                  </h4>
                  <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#64748b' }}>
                    Track pending and completed customer follow-ups and callbacks.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => openScheduleFollowUpModal(lead)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    background: '#d97706',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Plus size={14} />
                  <span>Schedule Follow-Up</span>
                </button>
              </div>

              {followups.length === 0 ? (
                <div style={{ padding: '36px', textAlign: 'center', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                  <Clock3 size={32} color="#94a3b8" style={{ marginBottom: '8px' }} />
                  <p style={{ margin: 0, fontWeight: 700, color: '#475569' }}>No follow-ups scheduled for this lead.</p>
                  <button
                    type="button"
                    onClick={() => openScheduleFollowUpModal(lead)}
                    className="btn btn-primary"
                    style={{ fontSize: '0.8rem', padding: '6px 14px', marginTop: '10px' }}
                  >
                    Schedule Follow-Up
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {followups.map((flw, idx) => {
                    const isPending = flw.status === 'Pending';
                    const isDone = flw.status === 'Completed';

                    return (
                      <div
                        key={flw.followUpId || idx}
                        style={{
                          background: isPending ? '#ffffff' : '#f8fafc',
                          border: isPending ? '1px solid #fde68a' : '1px solid #e2e8f0',
                          borderRadius: '10px',
                          padding: '14px',
                          boxShadow: isPending ? '0 2px 4px rgba(217, 119, 6, 0.08)' : 'none',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span
                                style={{
                                  fontSize: '0.72rem',
                                  fontWeight: 800,
                                  padding: '2px 8px',
                                  borderRadius: '6px',
                                  background: isDone ? '#ecfdf5' : isPending ? '#fffbeb' : '#f1f5f9',
                                  color: isDone ? '#059669' : isPending ? '#b45309' : '#64748b',
                                  border: isDone ? '1px solid #a7f3d0' : isPending ? '1px solid #fde68a' : '1px solid #e2e8f0',
                                }}
                              >
                                {flw.status || 'Pending'}
                              </span>
                              <strong style={{ fontSize: '0.88rem', color: '#1e293b' }}>
                                {flw.reason || 'Follow-Up Callback'}
                              </strong>
                            </div>
                            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>
                              Scheduled Date:{' '}
                              <strong style={{ color: '#1e293b' }}>
                                {flw.followUpDate ? new Date(flw.followUpDate).toLocaleDateString('en-GB') : 'N/A'}
                                {flw.followUpTime ? ` at ${flw.followUpTime}` : ''}
                              </strong>{' '}
                              • Assigned to: {flw.assignedTo || lead.assignedTo}
                            </div>
                          </div>

                          {/* 1-click status actions */}
                          {isPending && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <button
                                type="button"
                                onClick={() => handleFollowUpStatusToggle(flw.followUpId, 'Completed')}
                                style={{
                                  padding: '4px 10px',
                                  borderRadius: '6px',
                                  background: '#ecfdf5',
                                  color: '#059669',
                                  border: '1px solid #a7f3d0',
                                  fontSize: '0.74rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '3px',
                                }}
                              >
                                <Check size={12} />
                                <span>Mark Completed</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleFollowUpStatusToggle(flw.followUpId, 'Rescheduled')}
                                style={{
                                  padding: '4px 10px',
                                  borderRadius: '6px',
                                  background: '#eff6ff',
                                  color: '#2563eb',
                                  border: '1px solid #bfdbfe',
                                  fontSize: '0.74rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '3px',
                                }}
                              >
                                <RotateCcw size={12} />
                                <span>Reschedule</span>
                              </button>
                            </div>
                          )}
                        </div>

                        {flw.remarks && (
                          <div style={{ marginTop: '8px', fontSize: '0.8rem', color: '#475569' }}>
                            <strong>Remarks:</strong> {flw.remarks}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: VISUAL TIMELINE JOURNEY */}
          {activeTab === 'timeline' && (
            <div>
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#1e293b' }}>
                  Chronological Lead Activity Timeline
                </h4>
                <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#64748b' }}>
                  Trace the complete journey from initial acquisition through every call attempt, follow-up, and opportunity conversion.
                </p>
              </div>

              {timeline.length === 0 ? (
                <div style={{ padding: '36px', textAlign: 'center', background: '#f8fafc', borderRadius: '12px' }}>
                  <History size={32} color="#94a3b8" style={{ marginBottom: '8px' }} />
                  <p style={{ margin: 0, color: '#64748b' }}>No timeline events recorded yet.</p>
                </div>
              ) : (
                <div style={{ position: 'relative', paddingLeft: '28px' }}>
                  {/* Vertical timeline line */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '8px',
                      bottom: '8px',
                      left: '11px',
                      width: '2px',
                      background: '#cbd5e1',
                    }}
                  />

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {timeline.map((evt, idx) => {
                      const isConvertEvt = evt.eventType === 'CONVERTED_TO_OPPORTUNITY';
                      const isCallEvt = evt.eventType === 'CALL_LOGGED';
                      const isFollowUpEvt = evt.eventType === 'FOLLOWUP_SCHEDULED' || evt.eventType === 'FOLLOWUP_UPDATED';

                      return (
                        <div key={evt.eventId || idx} style={{ position: 'relative' }}>
                          {/* Dot */}
                          <div
                            style={{
                              position: 'absolute',
                              left: '-28px',
                              top: '2px',
                              width: '20px',
                              height: '20px',
                              borderRadius: '50%',
                              background: isConvertEvt ? '#7c3aed' : isCallEvt ? '#2563eb' : isFollowUpEvt ? '#d97706' : '#059669',
                              border: '3px solid #ffffff',
                              boxShadow: '0 0 0 2px #e2e8f0',
                            }}
                          />

                          <div
                            style={{
                              background: isConvertEvt ? '#f5f3ff' : '#ffffff',
                              border: isConvertEvt ? '1px solid #ddd6fe' : '1px solid #e2e8f0',
                              borderRadius: '10px',
                              padding: '12px 16px',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                              <strong style={{ fontSize: '0.88rem', color: isConvertEvt ? '#6d28d9' : '#1e293b' }}>
                                {evt.title || evt.eventType}
                              </strong>
                              <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                                {evt.timestamp ? new Date(evt.timestamp).toLocaleString('en-GB') : ''}
                              </span>
                            </div>
                            {evt.description && (
                              <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#475569', lineHeight: 1.4 }}>
                                {evt.description}
                              </p>
                            )}
                            <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '6px' }}>
                              Recorded by: <strong>{evt.author || 'System'}</strong>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: OPPORTUNITY WORKFLOW SECTION */}
          {activeTab === 'opportunity' && isConverted && (
            <div>
              <LeadOpportunitySection lead={lead} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
