import React, { useEffect, useState } from 'react';
import { useProjects } from '../../context/ProjectContext';
import { useAuth } from '../../context/AuthContext';
import {
  X,
  FolderKanban,
  Building,
  User,
  Calendar,
  DollarSign,
  CheckCircle2,
  Clock,
  Edit2,
  Trash2,
  ListTodo,
  Users,
  FileText,
  Tag,
  Check,
  AlertTriangle,
  Layers,
  ArrowRight,
  ShieldAlert,
  Bug,
  Plus,
  MessageSquare,
  History,
  Send,
  Download,
  CheckSquare,
  Sparkles,
  Paperclip,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';

export const ProjectDetailModal = ({
  isOpen,
  onClose,
  project,
  onEdit,
  onOpenTaskModal,
  onOpenIssueModal,
  onOpenRiskModal,
  onOpenTimesheetModal,
  onDelete,
}) => {
  const {
    updateProjectStatus,
    toggleMilestone,
    addComment,
    approveTimesheet,
    rejectTimesheet,
    selectedProject,
  } = useProjects();
  const { isSuperAdmin, isManager, user: currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState('overview');
  const [newComment, setNewComment] = useState('');
  const [commenting, setCommenting] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);

  const currentProj = (selectedProject && selectedProject._id === project?._id) ? selectedProject : project;

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setActiveTab('overview');
    }
  }, [isOpen, project?._id]);

  if (!isOpen || !currentProj) return null;

  const milestones = Array.isArray(currentProj.milestones) ? currentProj.milestones : [];
  const completedMilestones = milestones.filter((m) => m.status === 'Completed' || m.isCompleted).length;
  const progressPercent =
    milestones.length > 0
      ? Math.round((completedMilestones / milestones.length) * 100)
      : currentProj.progress || 0;

  const tasks = Array.isArray(currentProj.tasks) ? currentProj.tasks : [];
  const issues = Array.isArray(currentProj.issues) ? currentProj.issues : [];
  const risks = Array.isArray(currentProj.risks) ? currentProj.risks : [];
  const timesheets = Array.isArray(currentProj.timesheets) ? currentProj.timesheets : [];
  const comments = Array.isArray(currentProj.comments) ? currentProj.comments : [];
  const activityHistory = Array.isArray(currentProj.activityHistory) ? currentProj.activityHistory : [];
  const teamMembers = Array.isArray(currentProj.teamMembers) ? currentProj.teamMembers : [];
  const phases = Array.isArray(currentProj.phases) ? currentProj.phases : [];

  const handleStatusChange = async (newStatus) => {
    try {
      setStatusUpdating(true);
      await updateProjectStatus(currentProj._id, newStatus);
    } catch (err) {
      console.error('Status update failed:', err);
    } finally {
      setStatusUpdating(false);
    }
  };

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      setCommenting(true);
      await addComment(currentProj._id, newComment.trim());
      setNewComment('');
    } catch (err) {
      console.error('Comment posting failed:', err);
    } finally {
      setCommenting(false);
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Completed':
      case 'Closed':
        return { bg: '#ecfdf5', color: '#059669', border: '#a7f3d0' };
      case 'Active / In Progress':
      case 'Active':
      case 'In Progress':
        return { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' };
      case 'Approved':
        return { bg: '#eef2ff', color: '#4f46e5', border: '#c7d2fe' };
      case 'Planning':
        return { bg: '#fffbeb', color: '#d97706', border: '#fde68a' };
      case 'On Hold':
        return { bg: '#fff7ed', color: '#ea580c', border: '#fed7aa' };
      case 'Cancelled':
        return { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' };
      default:
        return { bg: '#f8fafc', color: '#475569', border: '#e2e8f0' };
    }
  };

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'Urgent':
      case 'High':
        return { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' };
      case 'Medium':
        return { bg: '#fffbeb', color: '#d97706', border: '#fde68a' };
      default:
        return { bg: '#ecfdf5', color: '#059669', border: '#a7f3d0' };
    }
  };

  const statusStyle = getStatusStyle(currentProj.status);
  const priorityStyle = getPriorityStyle(currentProj.priority);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          maxWidth: '960px',
          width: '100%',
          border: '1.5px solid #e2e8f0',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '92vh',
          margin: '24px 0',
        }}
      >
        {/* Top Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1.5px solid #e2e8f0',
            backgroundColor: '#f8fafc',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #2563eb, #4f46e5)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
                flexShrink: 0,
              }}
            >
              <FolderKanban size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '6px',
                    backgroundColor: '#eff6ff',
                    color: '#2563eb',
                    border: '1px solid #bfdbfe',
                  }}
                >
                  {currentProj.projectId || currentProj.projectCode || 'PRJ'}
                </span>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                  {currentProj.name || currentProj.title}
                </h2>
                <span
                  style={{
                    padding: '2px 10px',
                    fontSize: '11px',
                    fontWeight: 700,
                    borderRadius: '12px',
                    backgroundColor: statusStyle.bg,
                    color: statusStyle.color,
                    border: `1px solid ${statusStyle.border}`,
                  }}
                >
                  {currentProj.status || 'Draft'}
                </span>
                <span
                  style={{
                    padding: '2px 10px',
                    fontSize: '11px',
                    fontWeight: 700,
                    borderRadius: '12px',
                    backgroundColor: priorityStyle.bg,
                    color: priorityStyle.color,
                    border: `1px solid ${priorityStyle.border}`,
                  }}
                >
                  {currentProj.priority || 'Medium'}
                </span>
              </div>
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span>Client: <strong style={{ color: '#1e293b' }}>{currentProj.client || currentProj.clientName || 'Internal'}</strong></span>
                <span>•</span>
                <span>Manager: <strong style={{ color: '#1e293b' }}>{currentProj.managerName || currentProj.projectManager || (typeof currentProj.manager === 'object' ? currentProj.manager?.name : '') || 'Unassigned'}</strong></span>
                <span>•</span>
                <span>Target: <strong style={{ color: '#dc2626' }}>{currentProj.targetDate ? new Date(currentProj.targetDate).toLocaleDateString() : '—'}</strong></span>
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Quick Status Selector */}
            <div style={{ position: 'relative' }}>
              <select
                value={currentProj.status}
                disabled={statusUpdating}
                onChange={(e) => handleStatusChange(e.target.value)}
                style={{
                  height: '38px',
                  padding: '0 32px 0 12px',
                  backgroundColor: '#ffffff',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: '10px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#1e293b',
                  cursor: 'pointer',
                  appearance: 'none',
                  outline: 'none',
                }}
              >
                <option value="Draft">Draft</option>
                <option value="Planning">Planning</option>
                <option value="Approved">Approved</option>
                <option value="Active / In Progress">Active / In Progress</option>
                <option value="On Hold">On Hold</option>
                <option value="Completed">Completed</option>
                <option value="Closed">Closed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
              <ChevronDown size={14} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', pointerEvents: 'none' }} />
            </div>

            {onEdit && (
              <button
                onClick={() => {
                  onClose();
                  onEdit(currentProj);
                }}
                style={{
                  width: '38px',
                  height: '38px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#ffffff',
                  color: '#334155',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: '10px',
                  cursor: 'pointer',
                }}
                title="Edit Project"
              >
                <Edit2 size={16} />
              </button>
            )}

            {onDelete && (isSuperAdmin || isManager) && (
              <button
                onClick={() => {
                  if (window.confirm(`Are you sure you want to delete project ${currentProj.name}?`)) {
                    onDelete(currentProj);
                    onClose();
                  }
                }}
                style={{
                  width: '38px',
                  height: '38px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#ffffff',
                  color: '#dc2626',
                  border: '1.5px solid #fecaca',
                  borderRadius: '10px',
                  cursor: 'pointer',
                }}
                title="Delete Project"
              >
                <Trash2 size={16} />
              </button>
            )}

            <button
              onClick={onClose}
              style={{
                width: '38px',
                height: '38px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'transparent',
                color: '#94a3b8',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Tab Header Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '0 24px',
            borderBottom: '1.5px solid #e2e8f0',
            backgroundColor: '#f8fafc',
            overflowX: 'auto',
            flexShrink: 0,
          }}
        >
          {[
            { id: 'overview', label: '360° Overview', icon: FolderKanban },
            { id: 'phases', label: `Phases & Gates (${phases.length})`, icon: Layers },
            { id: 'tasks', label: `Deliverable Tasks (${tasks.length})`, icon: CheckSquare },
            { id: 'issues', label: `Issues & Bugs (${issues.length})`, icon: Bug },
            { id: 'risks', label: `Risks (${risks.length})`, icon: ShieldAlert },
            { id: 'timesheets', label: `Timesheets (${timesheets.length})`, icon: Clock },
            { id: 'comments', label: `Discussions (${comments.length})`, icon: MessageSquare },
            { id: 'activity', label: 'Audit Trail', icon: History },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '12px 16px',
                  borderBottom: isActive ? '2px solid #2563eb' : '2px solid transparent',
                  backgroundColor: 'transparent',
                  color: isActive ? '#2563eb' : '#64748b',
                  fontWeight: isActive ? 800 : 600,
                  fontSize: '13px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  borderTop: 'none',
                  borderLeft: 'none',
                  borderRight: 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <Icon size={15} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {/* TAB: OVERVIEW */}
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Progress & Quick Stats */}
              <div
                style={{
                  background: 'linear-gradient(135deg, #eff6ff 0%, #e0e7ff 100%)',
                  borderRadius: '16px',
                  padding: '20px 24px',
                  border: '1.5px solid #bfdbfe',
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                }}
              >
                <div style={{ flex: '1 1 260px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', color: '#1e3a8a', marginBottom: '8px' }}>
                    <span>Overall Milestone Progress</span>
                    <span style={{ color: '#2563eb', fontSize: '14px' }}>{progressPercent}%</span>
                  </div>
                  <div style={{ width: '100%', backgroundColor: '#cbd5e1', height: '10px', borderRadius: '5px', overflow: 'hidden' }}>
                    <div
                      style={{
                        backgroundColor: '#2563eb',
                        height: '100%',
                        borderRadius: '5px',
                        width: `${progressPercent}%`,
                        transition: 'width 0.5s ease',
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '24px', borderLeft: '1.5px solid #bfdbfe', paddingLeft: '24px' }}>
                  <div>
                    <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>Budget</span>
                    <p style={{ margin: '2px 0 0 0', fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                      ${(currentProj.budget || 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>Actual Cost</span>
                    <p style={{ margin: '2px 0 0 0', fontSize: '18px', fontWeight: 800, color: '#2563eb' }}>
                      ${(currentProj.actualCost || 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Description */}
              {currentProj.description && (
                <div style={{ backgroundColor: '#f8fafc', borderRadius: '16px', padding: '16px 20px', border: '1.5px solid #e2e8f0' }}>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748b' }}>
                    Project Scope & Objectives
                  </h4>
                  <p style={{ margin: 0, fontSize: '13px', color: '#334155', lineHeight: 1.5 }}>
                    {currentProj.description}
                  </p>
                </div>
              )}

              {/* Grid of Key Info */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '18px' }}>
                {/* Team Roster */}
                <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '20px', border: '1.5px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
                  <h4 style={{ margin: '0 0 14px 0', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Users size={16} style={{ color: '#2563eb' }} /> Team & Governance
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Project Manager:</span>
                      <span style={{ fontWeight: 800, color: '#0f172a' }}>{currentProj.managerName || currentProj.projectManager || (typeof currentProj.manager === 'object' ? currentProj.manager?.name : '') || 'Unassigned'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Project Owner:</span>
                      <span style={{ fontWeight: 800, color: '#0f172a' }}>{currentProj.ownerName || currentProj.projectOwner || (typeof currentProj.owner === 'object' ? currentProj.owner?.name : '') || 'Unassigned'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Department:</span>
                      <span style={{ fontWeight: 800, color: '#0f172a' }}>{currentProj.department || 'Engineering'}</span>
                    </div>
                    <div style={{ paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
                      <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '8px', fontWeight: 800, textTransform: 'uppercase' }}>
                        Assigned Roster ({teamMembers.length})
                      </span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {teamMembers.map((m, idx) => (
                          <span
                            key={idx}
                            style={{
                              padding: '4px 10px',
                              borderRadius: '8px',
                              backgroundColor: '#f1f5f9',
                              color: '#334155',
                              fontSize: '12px',
                              fontWeight: 600,
                            }}
                          >
                            {m.name || m.user} ({m.role || 'Member'})
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Financial Summary */}
                <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '20px', border: '1.5px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
                  <h4 style={{ margin: '0 0 14px 0', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <DollarSign size={16} style={{ color: '#059669' }} /> Commercial & Billing Details
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Billing Type:</span>
                      <span style={{ fontWeight: 800, color: '#0f172a' }}>{currentProj.billingType || 'Fixed Cost'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Billing Method:</span>
                      <span style={{ fontWeight: 800, color: '#0f172a' }}>{currentProj.billingMethod || 'Milestone Based'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Budgeted Hours:</span>
                      <span style={{ fontWeight: 800, color: '#0f172a' }}>{currentProj.budgetedHours || 0} hrs</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Actual Logged Hours:</span>
                      <span style={{ fontWeight: 800, color: '#2563eb' }}>{currentProj.actualHours || 0} hrs</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
                      <span style={{ color: '#64748b' }}>Remaining Budget:</span>
                      <span style={{ fontWeight: 800, color: '#059669' }}>
                        ${((currentProj.budget || 0) - (currentProj.actualCost || 0)).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: PHASES & MILESTONES */}
          {activeTab === 'phases' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              <div>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Layers size={16} style={{ color: '#2563eb' }} /> Delivery Lifecycle Phases
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                  {phases.map((ph, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '14px',
                        backgroundColor: '#f8fafc',
                        borderRadius: '12px',
                        border: '1.5px solid #e2e8f0',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '10px', fontWeight: 800, color: '#2563eb', textTransform: 'uppercase' }}>
                          Phase {ph.order || idx + 1}
                        </span>
                        <span style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, backgroundColor: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' }}>
                          {ph.status || 'Pending'}
                        </span>
                      </div>
                      <h5 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                        {ph.name}
                      </h5>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ borderTop: '1.5px solid #e2e8f0', paddingTop: '20px' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={16} style={{ color: '#059669' }} /> Gate Milestones & Sign-offs
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {milestones.map((m, idx) => {
                    const isDone = m.status === 'Completed' || m.isCompleted;
                    return (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '14px 16px',
                          backgroundColor: '#ffffff',
                          borderRadius: '12px',
                          border: '1.5px solid #e2e8f0',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <button
                            type="button"
                            onClick={() => toggleMilestone(currentProj._id, m._id || idx)}
                            style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              border: isDone ? 'none' : '2px solid #cbd5e1',
                              backgroundColor: isDone ? '#059669' : '#ffffff',
                              color: '#ffffff',
                            }}
                          >
                            <Check size={16} />
                          </button>
                          <div>
                            <h5 style={{ margin: 0, fontSize: '13px', fontWeight: 700, textDecoration: isDone ? 'line-through' : 'none', color: isDone ? '#94a3b8' : '#0f172a' }}>
                              {m.name || m.title}
                            </h5>
                            <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#64748b' }}>
                              Phase: {m.phase || 'General'} • Due: {m.dueDate ? new Date(m.dueDate).toLocaleDateString() : 'TBD'}
                            </p>
                          </div>
                        </div>

                        <span
                          style={{
                            padding: '2px 10px',
                            fontSize: '11px',
                            fontWeight: 700,
                            borderRadius: '12px',
                            backgroundColor: isDone ? '#ecfdf5' : '#fffbeb',
                            color: isDone ? '#059669' : '#d97706',
                            border: `1px solid ${isDone ? '#a7f3d0' : '#fde68a'}`,
                          }}
                        >
                          {m.status || (isDone ? 'Completed' : 'In Progress')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB: TASKS */}
          {activeTab === 'tasks' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h4 style={{ margin: 0, fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748b' }}>
                  Deliverable Task List ({tasks.length})
                </h4>
                {onOpenTaskModal && (
                  <button
                    onClick={() => onOpenTaskModal(currentProj)}
                    style={{
                      height: '38px',
                      padding: '0 16px',
                      backgroundColor: '#2563eb',
                      color: '#ffffff',
                      borderRadius: '10px',
                      fontSize: '12px',
                      fontWeight: 700,
                      border: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                    }}
                  >
                    <Plus size={15} />
                    <span>Add Task</span>
                  </button>
                )}
              </div>

              {tasks.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 24px', backgroundColor: '#f8fafc', borderRadius: '16px', border: '1.5px solid #e2e8f0' }}>
                  <CheckSquare size={36} style={{ margin: '0 auto 8px auto', color: '#cbd5e1' }} />
                  <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>No deliverable tasks added yet.</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto', border: '1.5px solid #e2e8f0', borderRadius: '14px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                    <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1.5px solid #e2e8f0', color: '#475569', textTransform: 'uppercase', fontWeight: 800, fontSize: '11px' }}>
                      <tr>
                        <th style={{ padding: '10px 14px' }}>Task Name</th>
                        <th style={{ padding: '10px 14px' }}>Assignee</th>
                        <th style={{ padding: '10px 14px' }}>Priority</th>
                        <th style={{ padding: '10px 14px' }}>Status</th>
                        <th style={{ padding: '10px 14px' }}>Due Date</th>
                        <th style={{ padding: '10px 14px' }}>Est/Act Hours</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tasks.map((task, idx) => {
                        const prio = getPriorityStyle(task.priority);
                        const stat = getStatusStyle(task.status);
                        return (
                          <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0f172a' }}>
                              {task.taskName || task.title}
                              {task.subtasks && task.subtasks.length > 0 && (
                                <span style={{ marginLeft: '8px', padding: '2px 6px', borderRadius: '6px', backgroundColor: '#f1f5f9', fontSize: '11px', color: '#64748b' }}>
                                  {task.subtasks.filter((s) => s.status === 'Done' || s.status === 'Completed').length}/{task.subtasks.length} subtasks
                                </span>
                              )}
                            </td>
                            <td style={{ padding: '12px 14px', color: '#334155', fontWeight: 600 }}>
                              {task.assignedTo || task.assignee || 'Unassigned'}
                            </td>
                            <td style={{ padding: '12px 14px' }}>
                              <span style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, backgroundColor: prio.bg, color: prio.color, border: `1px solid ${prio.border}` }}>
                                {task.priority || 'Medium'}
                              </span>
                            </td>
                            <td style={{ padding: '12px 14px' }}>
                              <span style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, backgroundColor: stat.bg, color: stat.color, border: `1px solid ${stat.border}` }}>
                                {task.status || 'To Do'}
                              </span>
                            </td>
                            <td style={{ padding: '12px 14px', color: '#64748b' }}>
                              {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '—'}
                            </td>
                            <td style={{ padding: '12px 14px', color: '#334155', fontWeight: 600 }}>
                              {task.estimatedHours || 0}h / {task.actualHours || 0}h
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB: ISSUES */}
          {activeTab === 'issues' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h4 style={{ margin: 0, fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748b' }}>
                  Project Defect & Bug Register ({issues.length})
                </h4>
                {onOpenIssueModal && (
                  <button
                    onClick={() => onOpenIssueModal(currentProj)}
                    style={{
                      height: '38px',
                      padding: '0 16px',
                      backgroundColor: '#dc2626',
                      color: '#ffffff',
                      borderRadius: '10px',
                      fontSize: '12px',
                      fontWeight: 700,
                      border: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                    }}
                  >
                    <Plus size={15} />
                    <span>Log Issue</span>
                  </button>
                )}
              </div>

              {issues.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 24px', backgroundColor: '#f8fafc', borderRadius: '16px', border: '1.5px solid #e2e8f0' }}>
                  <CheckCircle2 size={36} style={{ margin: '0 auto 8px auto', color: '#10b981' }} />
                  <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>No open defects or issues reported.</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto', border: '1.5px solid #e2e8f0', borderRadius: '14px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                    <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1.5px solid #e2e8f0', color: '#475569', textTransform: 'uppercase', fontWeight: 800, fontSize: '11px' }}>
                      <tr>
                        <th style={{ padding: '10px 14px' }}>Title</th>
                        <th style={{ padding: '10px 14px' }}>Severity</th>
                        <th style={{ padding: '10px 14px' }}>Priority</th>
                        <th style={{ padding: '10px 14px' }}>Status</th>
                        <th style={{ padding: '10px 14px' }}>Assigned To</th>
                        <th style={{ padding: '10px 14px' }}>Due Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {issues.map((issue, idx) => {
                        const prio = getPriorityStyle(issue.priority);
                        const stat = getStatusStyle(issue.status);
                        return (
                          <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0f172a' }}>{issue.title}</td>
                            <td style={{ padding: '12px 14px' }}>
                              <span style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
                                {issue.severity || 'Medium'}
                              </span>
                            </td>
                            <td style={{ padding: '12px 14px' }}>
                              <span style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, backgroundColor: prio.bg, color: prio.color, border: `1px solid ${prio.border}` }}>
                                {issue.priority || 'Medium'}
                              </span>
                            </td>
                            <td style={{ padding: '12px 14px' }}>
                              <span style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, backgroundColor: stat.bg, color: stat.color, border: `1px solid ${stat.border}` }}>
                                {issue.status || 'Open'}
                              </span>
                            </td>
                            <td style={{ padding: '12px 14px', color: '#334155', fontWeight: 600 }}>{issue.assignedTo || 'Unassigned'}</td>
                            <td style={{ padding: '12px 14px', color: '#64748b' }}>{issue.dueDate ? new Date(issue.dueDate).toLocaleDateString() : '—'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB: RISKS */}
          {activeTab === 'risks' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h4 style={{ margin: 0, fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748b' }}>
                  Risk Assessment & Mitigation ({risks.length})
                </h4>
                {onOpenRiskModal && (
                  <button
                    onClick={() => onOpenRiskModal(currentProj)}
                    style={{
                      height: '38px',
                      padding: '0 16px',
                      backgroundColor: '#d97706',
                      color: '#ffffff',
                      borderRadius: '10px',
                      fontSize: '12px',
                      fontWeight: 700,
                      border: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                    }}
                  >
                    <Plus size={15} />
                    <span>Register Risk</span>
                  </button>
                )}
              </div>

              {risks.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 24px', backgroundColor: '#f8fafc', borderRadius: '16px', border: '1.5px solid #e2e8f0' }}>
                  <ShieldAlert size={36} style={{ margin: '0 auto 8px auto', color: '#cbd5e1' }} />
                  <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>No project risk threats identified.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {risks.map((risk, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '16px',
                        backgroundColor: '#ffffff',
                        borderRadius: '14px',
                        border: '1.5px solid #e2e8f0',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <h5 style={{ margin: 0, fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>{risk.title}</h5>
                        <span
                          style={{
                            padding: '2px 10px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: 700,
                            backgroundColor: risk.riskLevel === 'Critical' ? '#fef2f2' : '#fffbeb',
                            color: risk.riskLevel === 'Critical' ? '#dc2626' : '#d97706',
                            border: `1px solid ${risk.riskLevel === 'Critical' ? '#fecaca' : '#fde68a'}`,
                          }}
                        >
                          Level: {risk.riskLevel}
                        </span>
                      </div>
                      <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#334155' }}>
                        <strong style={{ color: '#0f172a' }}>Mitigation Strategy:</strong> {risk.mitigationPlan || 'None specified'}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '11px', color: '#64748b' }}>
                        <span>Prob: {risk.probability}</span>
                        <span>•</span>
                        <span>Impact: {risk.impact}</span>
                        <span>•</span>
                        <span>Owner: {risk.owner || 'Unassigned'}</span>
                        <span>•</span>
                        <span>Status: {risk.status || 'Identified'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: TIMESHEETS */}
          {activeTab === 'timesheets' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h4 style={{ margin: 0, fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748b' }}>
                  Timesheet Logs & Work Records ({timesheets.length})
                </h4>
                {onOpenTimesheetModal && (
                  <button
                    onClick={() => onOpenTimesheetModal(currentProj)}
                    style={{
                      height: '38px',
                      padding: '0 16px',
                      backgroundColor: '#2563eb',
                      color: '#ffffff',
                      borderRadius: '10px',
                      fontSize: '12px',
                      fontWeight: 700,
                      border: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                    }}
                  >
                    <Plus size={15} />
                    <span>Log Time</span>
                  </button>
                )}
              </div>

              {timesheets.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 24px', backgroundColor: '#f8fafc', borderRadius: '16px', border: '1.5px solid #e2e8f0' }}>
                  <Clock size={36} style={{ margin: '0 auto 8px auto', color: '#cbd5e1' }} />
                  <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>No time entries recorded for this project yet.</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto', border: '1.5px solid #e2e8f0', borderRadius: '14px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                    <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1.5px solid #e2e8f0', color: '#475569', textTransform: 'uppercase', fontWeight: 800, fontSize: '11px' }}>
                      <tr>
                        <th style={{ padding: '10px 14px' }}>Date</th>
                        <th style={{ padding: '10px 14px' }}>Team Member</th>
                        <th style={{ padding: '10px 14px' }}>Task / Note</th>
                        <th style={{ padding: '10px 14px' }}>Hours</th>
                        <th style={{ padding: '10px 14px' }}>Billing</th>
                        <th style={{ padding: '10px 14px' }}>Status</th>
                        {(isSuperAdmin || isManager) && <th style={{ padding: '10px 14px', textAlign: 'right' }}>Approvals</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {timesheets.map((ts, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0f172a' }}>{ts.date ? new Date(ts.date).toLocaleDateString() : '—'}</td>
                          <td style={{ padding: '12px 14px', color: '#334155', fontWeight: 600 }}>{ts.user}</td>
                          <td style={{ padding: '12px 14px', color: '#64748b', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ts.task || ts.notes || 'General Work'}</td>
                          <td style={{ padding: '12px 14px', fontWeight: 800, color: '#2563eb' }}>{ts.hours} hrs</td>
                          <td style={{ padding: '12px 14px' }}>
                            <span style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, backgroundColor: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' }}>
                              {ts.isBillable !== false ? 'Billable' : 'Non-Billable'}
                            </span>
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <span
                              style={{
                                padding: '2px 8px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: 700,
                                backgroundColor: ts.status === 'Approved' ? '#ecfdf5' : ts.status === 'Rejected' ? '#fef2f2' : '#fffbeb',
                                color: ts.status === 'Approved' ? '#059669' : ts.status === 'Rejected' ? '#dc2626' : '#d97706',
                                border: `1px solid ${ts.status === 'Approved' ? '#a7f3d0' : ts.status === 'Rejected' ? '#fecaca' : '#fde68a'}`,
                              }}
                            >
                              {ts.status || 'Pending'}
                            </span>
                          </td>
                          {(isSuperAdmin || isManager) && (
                            <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                              {ts.status === 'Pending' && (
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                  <button
                                    onClick={() => approveTimesheet(currentProj._id, ts._id || idx)}
                                    style={{ padding: '4px 10px', backgroundColor: '#059669', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => rejectTimesheet(currentProj._id, ts._id || idx)}
                                    style={{ padding: '4px 10px', backgroundColor: '#dc2626', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                                  >
                                    Reject
                                  </button>
                                </div>
                              )}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB: COMMENTS / COLLABORATION */}
          {activeTab === 'comments' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h4 style={{ margin: 0, fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748b' }}>
                Collaboration & Thread Discussions
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '300px', overflowY: 'auto', paddingRight: '4px' }}>
                {comments.length === 0 ? (
                  <p style={{ fontSize: '13px', color: '#94a3b8', padding: '24px 0', textAlign: 'center', fontStyle: 'italic' }}>No discussion notes yet. Start the conversation!</p>
                ) : (
                  comments.map((cm, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '14px 16px',
                        backgroundColor: '#f8fafc',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 800, fontSize: '13px', color: '#2563eb' }}>
                          {cm.user || 'Team Member'}
                        </span>
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                          {cm.createdAt ? new Date(cm.createdAt).toLocaleString() : 'Just now'}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: '13px', color: '#334155', lineHeight: 1.4 }}>
                        {cm.text}
                      </p>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handlePostComment} style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '8px', borderTop: '1px solid #f1f5f9' }}>
                <input
                  type="text"
                  placeholder="Type an update or mention a teammate..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  style={{
                    flex: 1,
                    height: '40px',
                    padding: '0 14px',
                    backgroundColor: '#ffffff',
                    border: '1.5px solid #cbd5e1',
                    borderRadius: '10px',
                    fontSize: '13px',
                    color: '#0f172a',
                    outline: 'none',
                  }}
                />
                <button
                  type="submit"
                  disabled={commenting || !newComment.trim()}
                  style={{
                    height: '40px',
                    padding: '0 18px',
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    borderRadius: '10px',
                    fontSize: '13px',
                    fontWeight: 700,
                    border: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    opacity: commenting || !newComment.trim() ? 0.6 : 1,
                  }}
                >
                  <Send size={15} />
                  <span>Post</span>
                </button>
              </form>
            </div>
          )}

          {/* TAB: AUDIT & ACTIVITY */}
          {activeTab === 'activity' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h4 style={{ margin: 0, fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748b' }}>
                Chronological Audit Trail & State History
              </h4>

              {activityHistory.length === 0 ? (
                <p style={{ fontSize: '13px', color: '#94a3b8', padding: '24px 0', textAlign: 'center', fontStyle: 'italic' }}>No audit log records logged yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {activityHistory.map((act, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px',
                        padding: '12px 14px',
                        backgroundColor: '#f8fafc',
                        borderRadius: '10px',
                        border: '1px solid #e2e8f0',
                        fontSize: '13px',
                      }}
                    >
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#2563eb', marginTop: '6px', flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontWeight: 700, color: '#0f172a' }}>
                          {act.action || 'Project updated'}
                        </p>
                        {act.details && (
                          <p style={{ margin: '3px 0 0 0', color: '#64748b', fontSize: '12px' }}>
                            {act.details}
                          </p>
                        )}
                        <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginTop: '4px' }}>
                          By {act.user || 'System'} • {act.timestamp ? new Date(act.timestamp).toLocaleString() : 'Recent'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1.5px solid #e2e8f0',
            backgroundColor: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>
            Hierarchy Scope Verified • Authorized Workspace Access
          </span>
          <button
            onClick={onClose}
            style={{
              height: '38px',
              padding: '0 18px',
              backgroundColor: '#e2e8f0',
              color: '#334155',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Close Overview
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetailModal;
