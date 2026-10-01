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
} from 'lucide-react';

export const ProjectDetailModal = ({
  isOpen,
  onClose,
  project,
  onEdit,
  onOpenMilestones,
  onDelete,
}) => {
  const { toggleMilestone } = useProjects();
  const { isSuperAdmin, isManager } = useAuth();
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'milestones' | 'team'

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
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
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setActiveTab('overview');
    }
  }, [isOpen, project?._id]);

  if (!isOpen || !project) return null;

  const milestones = Array.isArray(project.milestones) ? project.milestones : [];
  const completedMilestones = milestones.filter((m) => m.isCompleted).length;
  const progressPercent =
    milestones.length > 0
      ? Math.round((completedMilestones / milestones.length) * 100)
      : project.progress || 0;

  const teamMembers = Array.isArray(project.teamMembers) ? project.teamMembers : [];

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Completed':
        return { bg: '#ecfdf5', color: '#047857', border: '#a7f3d0', dot: '#10b981' };
      case 'In Progress':
        return { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe', dot: '#3b82f6' };
      case 'Under Review':
        return { bg: '#f5f3ff', color: '#6d28d9', border: '#ddd6fe', dot: '#8b5cf6' };
      case 'Planning':
        return { bg: '#fffbeb', color: '#b45309', border: '#fde68a', dot: '#f59e0b' };
      case 'On Hold':
        return { bg: '#fef2f2', color: '#b91c1c', border: '#fecaca', dot: '#ef4444' };
      default:
        return { bg: '#f8fafc', color: '#475569', border: '#e2e8f0', dot: '#94a3b8' };
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'Urgent':
        return { bg: '#fef2f2', color: '#dc2626', border: '#fee2e2' };
      case 'High':
        return { bg: '#fff7ed', color: '#ea580c', border: '#ffedd5' };
      case 'Medium':
        return { bg: '#fffbeb', color: '#d97706', border: '#fef3c7' };
      default:
        return { bg: '#f0fdf4', color: '#16a34a', border: '#dcfce7' };
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getDeadlineStatus = (targetDateStr, status) => {
    if (status === 'Completed') {
      return { text: 'Delivered', color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' };
    }
    if (!targetDateStr) return null;
    const target = new Date(targetDateStr);
    const now = new Date();
    const diffDays = Math.ceil((target - now) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        text: `Overdue by ${Math.abs(diffDays)}d`,
        color: '#dc2626',
        bg: '#fef2f2',
        border: '#fee2e2',
      };
    } else if (diffDays === 0) {
      return { text: 'Due Today', color: '#d97706', bg: '#fffbeb', border: '#fef3c7' };
    } else if (diffDays <= 7) {
      return {
        text: `${diffDays}d remaining`,
        color: '#d97706',
        bg: '#fffbeb',
        border: '#fef3c7',
      };
    } else {
      return {
        text: `${diffDays}d remaining`,
        color: '#475569',
        bg: '#f1f5f9',
        border: '#e2e8f0',
      };
    }
  };

  const sBadge = getStatusBadge(project.status);
  const pBadge = getPriorityBadge(project.priority);
  const deadlineInfo = getDeadlineStatus(project.targetDate, project.status);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.68)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px',
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '820px',
          maxHeight: '92vh',
          boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.35)',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          animation: 'slideUp 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(to right, #ffffff, #f8fafc)',
            flexShrink: 0,
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '14px',
                backgroundColor: '#f0fdf4',
                color: '#059669',
                border: '1.5px solid #dcfce7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(5, 150, 105, 0.12)',
                flexShrink: 0,
              }}
            >
              <FolderKanban size={22} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: '#0f172a',
                    backgroundColor: '#f1f5f9',
                    border: '1px solid #e2e8f0',
                    padding: '2px 8px',
                    borderRadius: '6px',
                  }}
                >
                  {project.projectCode || 'PRJ-000'}
                </span>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '2px 8px',
                    borderRadius: '999px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    backgroundColor: sBadge.bg,
                    color: sBadge.color,
                    border: `1px solid ${sBadge.border}`,
                  }}
                >
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: sBadge.dot,
                    }}
                  />
                  {project.status || 'Planning'}
                </span>
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: '999px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    backgroundColor: pBadge.bg,
                    color: pBadge.color,
                    border: `1px solid ${pBadge.border}`,
                  }}
                >
                  {project.priority || 'Medium'}
                </span>
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: '999px',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    backgroundColor: '#f8fafc',
                    color: '#64748b',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  {project.category || 'Web Application'}
                </span>
              </div>
              <h2
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  color: '#0f172a',
                  margin: '4px 0 0 0',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {project.name}
              </h2>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                width: '34px',
                height: '34px',
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
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '0 24px',
            borderBottom: '1px solid #e2e8f0',
            backgroundColor: '#ffffff',
            gap: '8px',
            flexShrink: 0,
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            style={{
              padding: '12px 14px',
              border: 'none',
              background: 'none',
              borderBottom: activeTab === 'overview' ? '2.5px solid #2563eb' : '2.5px solid transparent',
              color: activeTab === 'overview' ? '#2563eb' : '#64748b',
              fontWeight: 700,
              fontSize: '0.84rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
            }}
          >
            <FolderKanban size={14} />
            <span>Overview & Specifications</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('milestones')}
            style={{
              padding: '12px 14px',
              border: 'none',
              background: 'none',
              borderBottom: activeTab === 'milestones' ? '2.5px solid #059669' : '2.5px solid transparent',
              color: activeTab === 'milestones' ? '#059669' : '#64748b',
              fontWeight: 700,
              fontSize: '0.84rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
            }}
          >
            <ListTodo size={14} />
            <span>Milestones & Deliverables ({completedMilestones}/{milestones.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('team')}
            style={{
              padding: '12px 14px',
              border: 'none',
              background: 'none',
              borderBottom: activeTab === 'team' ? '2.5px solid #7c3aed' : '2.5px solid transparent',
              color: activeTab === 'team' ? '#7c3aed' : '#64748b',
              fontWeight: 700,
              fontSize: '0.84rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
            }}
          >
            <Users size={14} />
            <span>Assigned Team ({teamMembers.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div
          style={{
            padding: '24px',
            overflowY: 'auto',
            flex: '1 1 auto',
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          {/* Top Key Metrics Strip */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
              gap: '12px',
            }}
          >
            {/* Client */}
            <div
              style={{
                padding: '12px 14px',
                borderRadius: '14px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '0.74rem', fontWeight: 600 }}>
                <Building size={13} color="#2563eb" />
                <span>Client / Account</span>
              </div>
              <div style={{ fontSize: '0.94rem', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
                {project.clientName || 'N/A'}
              </div>
            </div>

            {/* Manager */}
            <div
              style={{
                padding: '12px 14px',
                borderRadius: '14px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '0.74rem', fontWeight: 600 }}>
                <User size={13} color="#059669" />
                <span>Project Manager</span>
              </div>
              <div style={{ fontSize: '0.94rem', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
                {project.managerName || 'Unassigned'}
              </div>
            </div>

            {/* Expected Completion / Deadline */}
            <div
              style={{
                padding: '12px 14px',
                borderRadius: '14px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#64748b', fontSize: '0.74rem', fontWeight: 600 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={13} color="#d97706" />
                  <span>Target Deadline</span>
                </div>
                {deadlineInfo && (
                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      color: deadlineInfo.color,
                      backgroundColor: deadlineInfo.bg,
                      border: `1px solid ${deadlineInfo.border}`,
                      padding: '1px 6px',
                      borderRadius: '999px',
                    }}
                  >
                    {deadlineInfo.text}
                  </span>
                )}
              </div>
              <div style={{ fontSize: '0.94rem', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
                {formatDate(project.targetDate)}
              </div>
            </div>

            {/* Budget */}
            <div
              style={{
                padding: '12px 14px',
                borderRadius: '14px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '0.74rem', fontWeight: 600 }}>
                <DollarSign size={13} color="#7c3aed" />
                <span>Total Budget</span>
              </div>
              <div style={{ fontSize: '0.94rem', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
                {project.currency === 'INR' ? '₹' : '$'}
                {Number(project.budget || 0).toLocaleString()}
              </div>
            </div>
          </div>

          {/* Progress Bar Card */}
          <div
            style={{
              padding: '16px 18px',
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.86rem', fontWeight: 700, color: '#0f172a' }}>
                  Deliverables Completion Status
                </span>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '999px',
                    backgroundColor: progressPercent === 100 ? '#ecfdf5' : '#eff6ff',
                    color: progressPercent === 100 ? '#059669' : '#2563eb',
                  }}
                >
                  {completedMilestones} of {milestones.length} Milestones Complete
                </span>
              </div>
              <span style={{ fontSize: '1rem', fontWeight: 800, color: progressPercent === 100 ? '#059669' : '#2563eb' }}>
                {progressPercent}%
              </span>
            </div>

            <div
              style={{
                width: '100%',
                height: '10px',
                borderRadius: '999px',
                backgroundColor: '#f1f5f9',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${progressPercent}%`,
                  height: '100%',
                  background:
                    progressPercent === 100
                      ? 'linear-gradient(90deg, #059669, #10b981)'
                      : 'linear-gradient(90deg, #2563eb, #3b82f6)',
                  borderRadius: '999px',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          </div>

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Scope & Description */}
              <div
                style={{
                  padding: '18px',
                  borderRadius: '16px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <FileText size={16} color="#475569" />
                  <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700, color: '#0f172a' }}>
                    Project Scope & Description
                  </h4>
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: '0.88rem',
                    color: project.description ? '#334155' : '#94a3b8',
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {project.description || 'No detailed scope description provided for this project.'}
                </p>
              </div>

              {/* Schedule & Metadata Details */}
              <div
                style={{
                  padding: '18px',
                  borderRadius: '16px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '16px',
                }}
              >
                <div>
                  <span style={{ fontSize: '0.74rem', fontWeight: 600, color: '#64748b' }}>Start Date:</span>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                    {formatDate(project.startDate)}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.74rem', fontWeight: 600, color: '#64748b' }}>Expected Completion Date:</span>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                    {formatDate(project.targetDate)}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.74rem', fontWeight: 600, color: '#64748b' }}>Category & Delivery Domain:</span>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                    {project.category || 'Web Application'}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.74rem', fontWeight: 600, color: '#64748b' }}>Registered On:</span>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                    {formatDate(project.createdAt)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MILESTONES & DELIVERABLES */}
          {activeTab === 'milestones' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569' }}>
                  Project Milestones & Deliverable Checklist:
                </span>
                <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
                  Click any milestone to toggle completion status
                </span>
              </div>

              {milestones.length === 0 ? (
                <div
                  style={{
                    padding: '36px 20px',
                    textAlign: 'center',
                    backgroundColor: '#f8fafc',
                    borderRadius: '16px',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <ListTodo size={28} color="#94a3b8" style={{ margin: '0 auto 8px' }} />
                  <p style={{ margin: 0, fontSize: '0.86rem', color: '#64748b' }}>
                    No milestones defined for this project.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {milestones.map((m, idx) => (
                    <div
                      key={idx}
                      onClick={() => toggleMilestone(project._id, idx)}
                      style={{
                        padding: '14px 16px',
                        borderRadius: '12px',
                        border: `1.5px solid ${m.isCompleted ? '#a7f3d0' : '#e2e8f0'}`,
                        backgroundColor: m.isCompleted ? '#f0fdf4' : '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        gap: '12px',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#059669';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = m.isCompleted ? '#a7f3d0' : '#e2e8f0';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '6px',
                            border: `2px solid ${m.isCompleted ? '#16a34a' : '#cbd5e1'}`,
                            backgroundColor: m.isCompleted ? '#16a34a' : '#ffffff',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          {m.isCompleted && <Check size={16} strokeWidth={3} />}
                        </div>
                        <div>
                          <div
                            style={{
                              fontSize: '0.88rem',
                              fontWeight: 600,
                              color: m.isCompleted ? '#059669' : '#0f172a',
                              textDecoration: m.isCompleted ? 'line-through' : 'none',
                            }}
                          >
                            {m.title}
                          </div>
                          {m.completedAt && (
                            <div style={{ fontSize: '0.72rem', color: '#16a34a', marginTop: '2px' }}>
                              Completed on {new Date(m.completedAt).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>

                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '3px 10px',
                          borderRadius: '999px',
                          backgroundColor: m.isCompleted ? '#dcfce7' : '#f1f5f9',
                          color: m.isCompleted ? '#15803d' : '#64748b',
                        }}
                      >
                        {m.isCompleted ? 'Completed' : 'Pending'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ASSIGNED TEAM */}
          {activeTab === 'team' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700, color: '#0f172a' }}>
                  Project Lead & Team Roster
                </h4>
              </div>

              {/* Manager Card */}
              <div
                style={{
                  padding: '14px 16px',
                  borderRadius: '14px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '50%',
                      backgroundColor: '#eff6ff',
                      color: '#2563eb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '0.88rem',
                    }}
                  >
                    {project.managerName ? project.managerName.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>
                      {project.managerName || 'Unassigned'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      Project Manager / Owner
                    </div>
                  </div>
                </div>

                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: '999px',
                    backgroundColor: '#eff6ff',
                    color: '#2563eb',
                    border: '1px solid #bfdbfe',
                  }}
                >
                  Lead Manager
                </span>
              </div>

              {/* Team Members List */}
              {teamMembers.length === 0 ? (
                <div
                  style={{
                    padding: '28px 16px',
                    textAlign: 'center',
                    backgroundColor: '#ffffff',
                    borderRadius: '14px',
                    border: '1px dashed #cbd5e1',
                  }}
                >
                  <p style={{ margin: 0, fontSize: '0.84rem', color: '#64748b' }}>
                    No additional team members assigned. Deliverables are directly managed by{' '}
                    <strong>{project.managerName || 'the assigned manager'}</strong>.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '10px' }}>
                  {teamMembers.map((member, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '12px',
                        backgroundColor: '#ffffff',
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                      }}
                    >
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          backgroundColor: '#f1f5f9',
                          color: '#475569',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          flexShrink: 0,
                        }}
                      >
                        {member.name ? member.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {member.name || 'Team Member'}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                          {member.role || 'Contributor'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid #f1f5f9',
            backgroundColor: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {onOpenMilestones && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenMilestones(project);
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  borderRadius: '10px',
                  border: '1px solid #a7f3d0',
                  backgroundColor: '#ecfdf5',
                  color: '#059669',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <ListTodo size={14} />
                <span>Manage Milestones</span>
              </button>
            )}

            {(isSuperAdmin || isManager) && onDelete && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onDelete(project);
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  borderRadius: '10px',
                  border: '1px solid #fee2e2',
                  backgroundColor: '#fef2f2',
                  color: '#dc2626',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <Trash2 size={14} />
                <span>Delete</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '9px 22px',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.86rem',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1d4ed8')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#2563eb')}
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetailModal;
