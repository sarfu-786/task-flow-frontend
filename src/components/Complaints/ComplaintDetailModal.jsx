import React, { useState } from 'react';
import { useComplaints } from '../../context/ComplaintContext';
import { useAuth } from '../../context/AuthContext';
import { useUserManagement } from '../../context/UserContext';
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
  Send,
  PhoneOutgoing,
  MessageSquare,
  RotateCcw,
  ArrowUpRight,
  Sparkles,
  Link as LinkIcon,
  Search,
  Plus,
  BookOpen,
  History,
  Activity,
  UserCheck,
  Zap,
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
  const {
    assignComplaint,
    escalateComplaint,
    investigateComplaint,
    addActivity,
    closeComplaint,
    reopenComplaint,
    linkComplaint,
  } = useComplaints();
  const { user: currentUser, isSuperAdmin, isManager } = useAuth();
  const { users } = useUserManagement ? useUserManagement() : { users: [] };

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'activities' | 'investigation' | 'resolution' | 'related' | 'audit'

  // Activity Form State
  const [activityType, setActivityType] = useState('Call');
  const [activitySubject, setActivitySubject] = useState('');
  const [activityContent, setActivityContent] = useState('');
  const [activityOutcome, setActivityOutcome] = useState('');
  const [activityFollowUpDate, setActivityFollowUpDate] = useState('');
  const [activityFollowUpTime, setActivityFollowUpTime] = useState('');
  const [submittingActivity, setSubmittingActivity] = useState(false);

  // Investigation & CAPA Form State
  const [investigationNotes, setInvestigationNotes] = useState('');
  const [rootCause, setRootCause] = useState('');
  const [correctiveAction, setCorrectiveAction] = useState('');
  const [preventiveAction, setPreventiveAction] = useState('');
  const [savingInvestigation, setSavingInvestigation] = useState(false);

  // Reassignment Form State
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [reassignUser, setReassignUser] = useState('');
  const [reassignReason, setReassignReason] = useState('');

  // Escalation Form State
  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [escalateReason, setEscalateReason] = useState('');

  // Reopen Form State
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [reopenReason, setReopenReason] = useState('');

  // Knowledge Base Linking State
  const [kbQuery, setKbQuery] = useState('');
  const [linkedKbTitle, setLinkedKbTitle] = useState('');

  // Populate initial investigation state when complaint changes
  React.useEffect(() => {
    if (complaint) {
      setInvestigationNotes(complaint.investigationNotes || '');
      setRootCause(complaint.rootCause || '');
      setCorrectiveAction(complaint.correctiveAction || '');
      setPreventiveAction(complaint.preventiveAction || '');
      setReassignUser(complaint.assignedToName || 'Unassigned');
      setLinkedKbTitle(complaint.knowledgeBaseArticle?.title || '');
    }
  }, [complaint]);

  if (!isOpen || !complaint) return null;

  const isResolved = ['Resolved', 'Closed'].includes(complaint.status);
  const isClosed = complaint.status === 'Closed';

  // Format SLA time remaining
  const formatSlaRemaining = (deadlineStr, status, isPaused) => {
    if (['Resolved', 'Closed'].includes(status)) {
      return { text: 'SLA Met & Delivered', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', icon: <CheckCircle2 size={14} /> };
    }
    if (status === 'Awaiting Customer' || isPaused) {
      return { text: 'SLA Paused (Waiting for Customer)', color: '#6366f1', bg: '#eef2ff', border: '#c7d2fe', icon: <Clock size={14} /> };
    }
    if (!deadlineStr) return { text: 'Standard 24h SLA', color: '#64748b', bg: '#f1f5f9', border: '#e2e8f0', icon: <Clock size={14} /> };

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
        icon: <Flame size={14} />,
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

  const slaInfo = formatSlaRemaining(complaint.slaDeadline, complaint.status, complaint.isPaused);

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
      case 'Escalated':
        return { bg: '#fef2f2', color: '#b91c1c', border: '#fecaca' };
      case 'Awaiting Customer':
        return { bg: '#fffbeb', color: '#b45309', border: '#fde68a' };
      case 'Reopened':
        return { bg: '#faf5ff', color: '#7e22ce', border: '#e9d5ff' };
      default:
        return { bg: '#f8fafc', color: '#475569', border: '#e2e8f0' };
    }
  };

  const pStyle = getPriorityStyle(complaint.priority);
  const sStyle = getStatusStyle(complaint.status);

  // Handle Log Activity
  const handleAddActivity = async (e) => {
    e.preventDefault();
    if (!activityContent.trim()) return;
    try {
      setSubmittingActivity(true);
      await addActivity(complaint._id, {
        type: activityType,
        subject: activitySubject || `${activityType} Logged`,
        content: activityContent,
        outcome: activityOutcome,
        nextFollowUpDate: activityFollowUpDate,
        nextFollowUpTime: activityFollowUpTime,
        nextAction: activityOutcome,
      });
      setActivityContent('');
      setActivitySubject('');
      setActivityOutcome('');
      setActivityFollowUpDate('');
      setActivityFollowUpTime('');
    } catch (err) {
      alert('Failed to log activity: ' + err.message);
    } finally {
      setSubmittingActivity(false);
    }
  };

  // Handle Save Investigation & CAPA
  const handleSaveInvestigation = async () => {
    try {
      setSavingInvestigation(true);
      await investigateComplaint(complaint._id, {
        investigationNotes,
        rootCause,
        correctiveAction,
        preventiveAction,
      });
      alert('Investigation & CAPA details saved successfully.');
    } catch (err) {
      alert('Failed to save investigation details: ' + err.message);
    } finally {
      setSavingInvestigation(false);
    }
  };

  // Handle Reassign
  const handleExecuteReassign = async () => {
    if (!reassignUser || reassignUser === 'Unassigned') {
      alert('Please select a valid user to assign.');
      return;
    }
    const targetUser = (users || []).find((u) => u.name === reassignUser);
    try {
      await assignComplaint(complaint._id, {
        assignedTo: targetUser ? targetUser._id : null,
        assignedToName: reassignUser,
        reason: reassignReason || 'Reassigned via Complaint 360',
      });
      setShowReassignModal(false);
      setReassignReason('');
    } catch (err) {
      alert('Failed to reassign: ' + err.message);
    }
  };

  // Handle Escalate
  const handleExecuteEscalate = async () => {
    try {
      await escalateComplaint(complaint._id, {
        escalationReason: escalateReason || 'Escalated via Complaint 360 Console',
      });
      setShowEscalateModal(false);
      setEscalateReason('');
    } catch (err) {
      alert('Failed to escalate: ' + err.message);
    }
  };

  // Handle Reopen
  const handleExecuteReopen = async () => {
    try {
      await reopenComplaint(complaint._id, {
        reopenReason: reopenReason || 'Customer requested case reopening',
      });
      setShowReopenModal(false);
      setReopenReason('');
    } catch (err) {
      alert('Failed to reopen: ' + err.message);
    }
  };

  // Handle Close Ticket
  const handleExecuteClose = async () => {
    if (window.confirm(`Are you sure you want to mark ticket ${complaint.ticketNumber} as Closed?`)) {
      try {
        await closeComplaint(complaint._id, { closureReason: 'Resolved to Satisfaction' });
      } catch (err) {
        alert('Failed to close ticket: ' + err.message);
      }
    }
  };

  // Handle Link KB Article
  const handleLinkKb = async (title) => {
    try {
      await linkComplaint(complaint._id, {
        kbArticle: { articleId: 'kb_' + Date.now(), title, url: '#', helpful: true },
      });
      setLinkedKbTitle(title);
    } catch (err) {
      alert('Failed to link knowledge article: ' + err.message);
    }
  };

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
          maxWidth: '880px',
          maxHeight: '94vh',
          boxShadow: '0 24px 48px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Modal Header & Quick Meta */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(to right, #f8fafc, #ffffff)',
            borderRadius: '20px 20px 0 0',
            flexShrink: 0,
            flexWrap: 'nowrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
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
                flexShrink: 0,
              }}
            >
              <AlertCircle size={22} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontFamily: 'monospace',
                    background: '#eff6ff',
                    color: '#2563eb',
                    border: '1px solid #bfdbfe',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    flexShrink: 0,
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
                    flexShrink: 0,
                  }}
                >
                  {complaint.priority} Priority
                </span>
                <span
                  style={{
                    background: '#f1f5f9',
                    color: '#475569',
                    border: '1px solid #e2e8f0',
                    padding: '2px 8px',
                    borderRadius: '999px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {complaint.severity || 'Moderate'} Severity
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
                    flexShrink: 0,
                  }}
                >
                  {complaint.status}
                </span>
              </div>
              <h2
                style={{
                  fontSize: '1.2rem',
                  fontWeight: 800,
                  color: '#0f172a',
                  margin: '4px 0 0 0',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '520px',
                }}
                title={complaint.subject}
              >
                {complaint.subject}
              </h2>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <button
              type="button"
              id="btn-close-complaint-detail-modal"
              onClick={onClose}
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                border: 'none',
                backgroundColor: '#f1f5f9',
                color: '#64748b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#fee2e2';
                e.currentTarget.style.color = '#dc2626';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#f1f5f9';
                e.currentTarget.style.color = '#64748b';
              }}
              title="Close"
            >
              <X size={17} />
            </button>
          </div>
        </div>

        {/* Quick SLA Status Strip */}
        <div
          style={{
            padding: '10px 24px',
            background: slaInfo.bg,
            borderBottom: `1px solid ${slaInfo.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: slaInfo.color, fontWeight: 700, fontSize: '0.84rem' }}>
            {slaInfo.icon}
            <span>{slaInfo.text}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '0.78rem', color: '#64748b' }}>
            <span>
              Target: <strong>{complaint.slaHours || 24}h Window</strong>
            </span>
            <span>
              Assignee: <strong style={{ color: '#2563eb' }}>{complaint.assignedToName || 'Unassigned'}</strong>
            </span>
            <span>
              Team: <strong>{complaint.team || 'Support'}</strong>
            </span>
          </div>
        </div>

        {/* 360 Tabs Navigation */}
        <div
          style={{
            padding: '0 24px',
            borderBottom: '1px solid #e2e8f0',
            background: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            overflowX: 'auto',
            flexShrink: 0,
          }}
        >
          {[
            { id: 'overview', label: 'Overview & Details', icon: <FileText size={15} /> },
            { id: 'activities', label: `Activities & Follow-ups (${(complaint.activities || []).length})`, icon: <Activity size={15} /> },
            { id: 'investigation', label: 'Investigation & CAPA', icon: <Search size={15} /> },
            { id: 'resolution', label: 'Resolution & CSAT', icon: <CheckCircle2 size={15} /> },
            { id: 'related', label: 'Related & Knowledge Base', icon: <BookOpen size={15} /> },
            { id: 'audit', label: 'Audit Trail & Assignments', icon: <History size={15} /> },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '12px 14px',
                border: 'none',
                background: 'transparent',
                borderBottom: activeTab === tab.id ? '2px solid #2563eb' : '2px solid transparent',
                color: activeTab === tab.id ? '#2563eb' : '#64748b',
                fontWeight: activeTab === tab.id ? 700 : 500,
                fontSize: '0.82rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Modal Scrollable Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: '1 1 auto', minHeight: 0 }}>
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Customer & Account Info Card */}
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
                    Organization / Account
                  </div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 600, color: '#334155', marginTop: '2px' }}>
                    {complaint.organization || complaint.account || 'Direct Customer'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
                    Email
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

              {/* Description Box */}
              <div>
                <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
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
                  <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>{complaint.subCategory || 'General'}</span>
                </div>

                <div style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', display: 'block' }}>PRODUCT / SERVICE</span>
                  <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>{complaint.productOrService || 'CRM'}</span>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Channel: {complaint.source || 'Portal'}</span>
                </div>

                <div style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', display: 'block' }}>ASSIGNED TO</span>
                  <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#2563eb' }}>
                    {complaint.assignedToName || 'Unassigned'}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Team: {complaint.team || 'Support'}</span>
                </div>

                <div style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', display: 'block' }}>SCHEDULED FOLLOW-UP</span>
                  <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>
                    {complaint.nextFollowUpDate ? new Date(complaint.nextFollowUpDate).toLocaleDateString() : 'None Scheduled'}
                  </span>
                  {complaint.nextFollowUpTime && (
                    <span style={{ fontSize: '0.75rem', color: '#d97706', display: 'block' }}>
                      Time: {complaint.nextFollowUpTime}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ACTIVITIES & FOLLOW-UPS */}
          {activeTab === 'activities' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Form to log communication / follow-up */}
              <form
                onSubmit={handleAddActivity}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '16px',
                  padding: '16px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Plus size={16} color="#2563eb" />
                  <span>Log Activity / Customer Communication</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px' }}>
                  <select
                    value={activityType}
                    onChange={(e) => setActivityType(e.target.value)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.82rem',
                      background: '#ffffff',
                    }}
                  >
                    <option value="Call">Call Log</option>
                    <option value="Email">Email Communication</option>
                    <option value="Note">Internal Note</option>
                    <option value="Task">Action Item</option>
                    <option value="Follow-up">Follow-up Reminder</option>
                    <option value="Customer Communication">Client Meeting</option>
                  </select>

                  <input
                    type="text"
                    placeholder="Activity Subject / Title"
                    value={activitySubject}
                    onChange={(e) => setActivitySubject(e.target.value)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.82rem',
                      background: '#ffffff',
                    }}
                  />

                  <input
                    type="date"
                    placeholder="Next Follow-up Date"
                    value={activityFollowUpDate}
                    onChange={(e) => setActivityFollowUpDate(e.target.value)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.82rem',
                      background: '#ffffff',
                    }}
                  />
                </div>

                <textarea
                  placeholder="Details of discussion, customer statement, or follow-up note..."
                  value={activityContent}
                  onChange={(e) => setActivityContent(e.target.value)}
                  rows={2}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.84rem',
                    background: '#ffffff',
                    resize: 'vertical',
                  }}
                />

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="submit"
                    disabled={submittingActivity || !activityContent.trim()}
                    style={{
                      padding: '7px 16px',
                      borderRadius: '8px',
                      border: 'none',
                      background: '#2563eb',
                      color: '#ffffff',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <Send size={13} />
                    <span>{submittingActivity ? 'Saving...' : 'Post Activity'}</span>
                  </button>
                </div>
              </form>

              {/* Activity Timeline List */}
              <div>
                <h4 style={{ fontSize: '0.8rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '12px' }}>
                  Timeline & Interaction History
                </h4>

                {(!complaint.activities || complaint.activities.length === 0) ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                    No activities recorded on this ticket yet.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {complaint.activities.map((act, idx) => (
                      <div
                        key={act.activityId || idx}
                        style={{
                          padding: '12px 16px',
                          borderRadius: '12px',
                          border: '1px solid #e2e8f0',
                          background: '#ffffff',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span
                              style={{
                                padding: '2px 8px',
                                borderRadius: '6px',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                background: act.type === 'Call' ? '#eff6ff' : act.type === 'Email' ? '#f0fdf4' : '#f8fafc',
                                color: act.type === 'Call' ? '#1d4ed8' : act.type === 'Email' ? '#15803d' : '#475569',
                              }}
                            >
                              {act.type}
                            </span>
                            <strong style={{ fontSize: '0.86rem', color: '#0f172a' }}>{act.subject || 'Activity Log'}</strong>
                          </div>
                          <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                            {act.authorName && `By ${act.authorName} • `}
                            {act.date} {act.time}
                          </span>
                        </div>

                        <p style={{ margin: 0, fontSize: '0.86rem', color: '#334155', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                          {act.content}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: INVESTIGATION & CAPA */}
          {activeTab === 'investigation' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                  Document technical investigation, 5-Why analysis, and CAPA measures.
                </span>
                <button
                  type="button"
                  onClick={handleSaveInvestigation}
                  disabled={savingInvestigation}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#2563eb',
                    color: '#ffffff',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {savingInvestigation ? 'Saving...' : 'Save Investigation & CAPA'}
                </button>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  Investigation Notes & Diagnosis
                </label>
                <textarea
                  rows={3}
                  value={investigationNotes}
                  onChange={(e) => setInvestigationNotes(e.target.value)}
                  placeholder="Record diagnosis steps, logs examined, reproduction conditions..."
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.86rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  Root Cause Analysis (RCA)
                </label>
                <textarea
                  rows={2}
                  value={rootCause}
                  onChange={(e) => setRootCause(e.target.value)}
                  placeholder="State the underlying root cause of this complaint ticket..."
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.86rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Corrective Action (Immediate Fix)
                  </label>
                  <textarea
                    rows={2}
                    value={correctiveAction}
                    onChange={(e) => setCorrectiveAction(e.target.value)}
                    placeholder="Immediate action taken to resolve the customer's problem..."
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.86rem' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Preventive Action (Long-term Prevention)
                  </label>
                  <textarea
                    rows={2}
                    value={preventiveAction}
                    onChange={(e) => setPreventiveAction(e.target.value)}
                    placeholder="Process, monitoring, or architecture updates to prevent reoccurrence..."
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.86rem' }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: RESOLUTION & CSAT */}
          {activeTab === 'resolution' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {isResolved ? (
                <div
                  style={{
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: '16px',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={20} color="#16a34a" />
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#166534' }}>
                      Resolution Summary & Satisfaction Rating
                    </h3>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#15803d', textTransform: 'uppercase' }}>
                      Resolution Code:
                    </span>
                    <p style={{ margin: '2px 0 0', fontSize: '0.9rem', color: '#14532d', fontWeight: 600 }}>
                      {complaint.resolutionCode || 'Bug Fixed'}
                    </p>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#15803d', textTransform: 'uppercase' }}>
                      Resolution Notes:
                    </span>
                    <p style={{ margin: '2px 0 0', fontSize: '0.88rem', color: '#14532d', lineHeight: 1.5 }}>
                      {complaint.resolutionNotes || complaint.resolutionSummary || 'Resolved without extra notes'}
                    </p>
                  </div>

                  {complaint.csatRating && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '6px', borderTop: '1px solid #dcfce7' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#166534' }}>Customer CSAT:</span>
                      <div style={{ display: 'flex', gap: '3px' }}>
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            size={16}
                            fill={s <= complaint.csatRating ? '#f59e0b' : 'none'}
                            color={s <= complaint.csatRating ? '#f59e0b' : '#cbd5e1'}
                          />
                        ))}
                      </div>
                      <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#b45309' }}>
                        {complaint.csatRating}/5 Stars
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '36px 20px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                  <Clock size={36} color="#94a3b8" style={{ margin: '0 auto 10px' }} />
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
                    Complaint is currently {complaint.status}
                  </h4>
                  <p style={{ fontSize: '0.85rem', color: '#64748b', maxWidth: '400px', margin: '0 auto 16px' }}>
                    Once investigation and fixes are complete, click below to mark the ticket as resolved.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onResolve(complaint);
                    }}
                    style={{
                      padding: '9px 20px',
                      borderRadius: '999px',
                      border: 'none',
                      background: '#16a34a',
                      color: '#ffffff',
                      fontWeight: 700,
                      fontSize: '0.86rem',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <CheckCircle2 size={16} />
                    <span>Resolve Ticket Now</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: RELATED & KNOWLEDGE BASE */}
          {activeTab === 'related' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Linked Knowledge Base */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '16px 20px' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <BookOpen size={16} color="#2563eb" />
                  <span>Knowledge Base Integration</span>
                </div>

                {linkedKbTitle ? (
                  <div style={{ padding: '10px 14px', background: '#eff6ff', borderRadius: '10px', border: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <BookOpen size={15} color="#2563eb" />
                      <span style={{ fontSize: '0.86rem', fontWeight: 600, color: '#1e40af' }}>{linkedKbTitle}</span>
                    </div>
                    <span style={{ fontSize: '0.74rem', color: '#059669', fontWeight: 700 }}>Linked to Ticket</span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>
                      Link standard operating procedure or troubleshooting article for this category:
                    </p>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {[
                        'KB-101: Redis Buffer Saturation & Worker Tuning',
                        'KB-204: Okta SSO SAML Certificate Rotation SOP',
                        'KB-318: Tax Master Recalculation & Credit Note Process',
                      ].map((art) => (
                        <button
                          key={art}
                          type="button"
                          onClick={() => handleLinkKb(art)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '8px',
                            border: '1px solid #cbd5e1',
                            background: '#ffffff',
                            color: '#334155',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          + Link {art}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Linked CRM Entities */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                <div style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', display: 'block' }}>LINKED OPPORTUNITY</span>
                  <span style={{ fontSize: '0.86rem', fontWeight: 600, color: '#0f172a' }}>{complaint.linkedOpportunity || 'None'}</span>
                </div>

                <div style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', display: 'block' }}>LINKED PROJECT</span>
                  <span style={{ fontSize: '0.86rem', fontWeight: 600, color: '#0f172a' }}>{complaint.linkedProject || 'None'}</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: AUDIT TRAIL & ASSIGNMENT HISTORY */}
          {activeTab === 'audit' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <h4 style={{ fontSize: '0.8rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Assignment & Reassignment History
                </h4>
                {(!complaint.assignmentHistory || complaint.assignmentHistory.length === 0) ? (
                  <p style={{ fontSize: '0.84rem', color: '#94a3b8' }}>No reassignment records.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {complaint.assignmentHistory.map((h, i) => (
                      <div
                        key={i}
                        style={{
                          padding: '10px 14px',
                          borderRadius: '10px',
                          border: '1px solid #e2e8f0',
                          background: '#f8fafc',
                          fontSize: '0.82rem',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: '6px',
                        }}
                      >
                        <div>
                          <strong>{h.fromUserName}</strong> → <strong style={{ color: '#2563eb' }}>{h.toUserName}</strong>
                          {h.reason && <span style={{ color: '#64748b' }}> ({h.reason})</span>}
                        </div>
                        <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                          By {h.assignedByName || 'System'} on {new Date(h.timestamp).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div
          style={{
            padding: '14px 24px',
            borderTop: '1px solid #f1f5f9',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#f8fafc',
            borderRadius: '0 0 20px 20px',
            flexWrap: 'wrap',
            gap: '10px',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
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
                  padding: '7px 14px',
                  borderRadius: '999px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                <Trash2 size={14} />
                <span>Delete</span>
              </button>
            )}

            {/* Quick Action: Reassign */}
            <button
              type="button"
              onClick={() => setShowReassignModal(true)}
              style={{
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                color: '#334155',
                padding: '7px 14px',
                borderRadius: '999px',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <UserCheck size={14} />
              <span>Reassign</span>
            </button>

            {/* Quick Action: Escalate */}
            {!['Resolved', 'Closed'].includes(complaint.status) && (
              <button
                type="button"
                onClick={() => setShowEscalateModal(true)}
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fee2e2',
                  color: '#dc2626',
                  padding: '7px 14px',
                  borderRadius: '999px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                <Flame size={14} />
                <span>Escalate</span>
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
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
                padding: '7px 16px',
                borderRadius: '999px',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <Edit2 size={14} />
              <span>Edit Details</span>
            </button>

            {/* If Resolved or Closed -> Allow Reopen */}
            {isResolved ? (
              <>
                <button
                  type="button"
                  onClick={() => setShowReopenModal(true)}
                  style={{
                    background: '#7e22ce',
                    border: 'none',
                    color: '#ffffff',
                    padding: '7px 16px',
                    borderRadius: '999px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  <RotateCcw size={14} />
                  <span>Reopen Ticket</span>
                </button>

                {!isClosed && (
                  <button
                    type="button"
                    onClick={handleExecuteClose}
                    style={{
                      background: '#0f172a',
                      border: 'none',
                      color: '#ffffff',
                      padding: '7px 16px',
                      borderRadius: '999px',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Close Case
                  </button>
                )}
              </>
            ) : (
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
                  padding: '7px 18px',
                  borderRadius: '999px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
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
                background: '#f1f5f9',
                border: '1px solid #cbd5e1',
                color: '#334155',
                padding: '7px 16px',
                borderRadius: '999px',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Done
            </button>
          </div>
        </div>

        {/* REASSIGN POPUP DIALOG */}
        {showReassignModal && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10001,
            }}
          >
            <div style={{ background: '#ffffff', borderRadius: '16px', padding: '24px', width: '90%', maxWidth: '420px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>Reassign Complaint Ticket</h3>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  Select Coordinator / User
                </label>
                <select
                  value={reassignUser}
                  onChange={(e) => setReassignUser(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.86rem' }}
                >
                  <option value="Unassigned">Unassigned</option>
                  {(users || []).map((u) => (
                    <option key={u._id} value={u.name}>{u.name} ({u.role || 'Member'})</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  Reassignment Reason
                </label>
                <input
                  type="text"
                  value={reassignReason}
                  onChange={(e) => setReassignReason(e.target.value)}
                  placeholder="e.g. Workload balancing / Category expertise"
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.86rem' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setShowReassignModal(false)}
                  style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', cursor: 'pointer', fontSize: '0.82rem' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteReassign}
                  style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#2563eb', color: '#ffffff', fontWeight: 700, cursor: 'pointer', fontSize: '0.82rem' }}
                >
                  Confirm Reassign
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ESCALATE POPUP DIALOG */}
        {showEscalateModal && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10001,
            }}
          >
            <div style={{ background: '#ffffff', borderRadius: '16px', padding: '24px', width: '90%', maxWidth: '420px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#dc2626' }}>
                <Flame size={20} />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>Escalate Complaint Ticket</h3>
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  Escalation Reason / Justification
                </label>
                <textarea
                  rows={3}
                  value={escalateReason}
                  onChange={(e) => setEscalateReason(e.target.value)}
                  placeholder="e.g. Critical SLA breach risk / Client requested management attention"
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.86rem' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setShowEscalateModal(false)}
                  style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', cursor: 'pointer', fontSize: '0.82rem' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteEscalate}
                  style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#dc2626', color: '#ffffff', fontWeight: 700, cursor: 'pointer', fontSize: '0.82rem' }}
                >
                  Confirm Escalation
                </button>
              </div>
            </div>
          </div>
        )}

        {/* REOPEN POPUP DIALOG */}
        {showReopenModal && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10001,
            }}
          >
            <div style={{ background: '#ffffff', borderRadius: '16px', padding: '24px', width: '90%', maxWidth: '420px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#7e22ce' }}>
                <RotateCcw size={20} />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>Reopen Complaint Ticket</h3>
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  Reopening Reason
                </label>
                <textarea
                  rows={3}
                  value={reopenReason}
                  onChange={(e) => setReopenReason(e.target.value)}
                  placeholder="e.g. Issue reoccurred following recent update..."
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.86rem' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setShowReopenModal(false)}
                  style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', cursor: 'pointer', fontSize: '0.82rem' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteReopen}
                  style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#7e22ce', color: '#ffffff', fontWeight: 700, cursor: 'pointer', fontSize: '0.82rem' }}
                >
                  Confirm Reopen
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComplaintDetailModal;
