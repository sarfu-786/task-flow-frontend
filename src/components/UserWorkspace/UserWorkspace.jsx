import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTasks } from '../../context/TaskContext';
import { useUserManagement } from '../../context/UserContext';
import { useLeads } from '../../context/LeadContext';
import { useOpportunities } from '../../context/OpportunityContext';
import { useComplaints } from '../../context/ComplaintContext';
import { useProjects } from '../../context/ProjectContext';
import { useSubscription } from '../../context/SubscriptionContext';
import { MetricCard } from '../ManagerDashboard/MetricCard';
import {
  CheckCircle2,
  Clock,
  ListTodo,
  Briefcase,
  Calendar,
  Search,
  Send,
  X,
  Shield,
  PlayCircle,
  ExternalLink,
  ArrowRight,
  TrendingUp,
  Bell,
  Sparkles,
  Users,
  Target,
  DollarSign,
  Percent,
  Plus,
  LifeBuoy,
  FolderKanban,
  AlertTriangle,
  Layers,
  Award,
  Eye,
  Edit2,
  Trash2,
} from 'lucide-react';

// Helper to get all user IDs that are subordinate to (under) the current user in hierarchy
const getSubordinateUserIds = (user, allUsers) => {
  if (!user || !allUsers || !Array.isArray(allUsers)) return new Set();
  const userIdStr = (user._id ? user._id.toString() : (user.id ? user.id.toString() : '')).trim();
  const userNameStr = (user.name || '').toLowerCase().trim();

  const subordinateIds = new Set();
  if (!userIdStr && !userNameStr) return subordinateIds;

  const queue = [userIdStr];
  const processed = new Set([userIdStr]);

  while (queue.length > 0) {
    const currentParentId = queue.shift();
    const parentUser = allUsers.find((u) => u && (u._id || u.id) && (u._id || u.id).toString() === currentParentId);
    const parentName = (parentUser?.name || (currentParentId === userIdStr ? userNameStr : '')).toLowerCase().trim();

    for (const u of allUsers) {
      if (!u) continue;
      const uIdStr = (u._id || u.id || '').toString();
      if (!uIdStr || uIdStr === userIdStr || processed.has(uIdStr)) continue;

      const repIdStr = u.reportsTo ? (u.reportsTo._id ? u.reportsTo._id.toString() : u.reportsTo.toString()) : '';
      const repNameStr = (u.reportsToName || '').toLowerCase().trim();
      const createdByStr = u.createdBy ? (u.createdBy._id ? u.createdBy._id.toString() : u.createdBy.toString()) : '';

      const isDirectReport =
        (currentParentId && repIdStr === currentParentId) ||
        (parentName && repNameStr && (repNameStr.includes(parentName) || parentName.includes(repNameStr)));

      const isCreatedByParent = currentParentId && createdByStr === currentParentId;

      if (isDirectReport || isCreatedByParent) {
        subordinateIds.add(uIdStr);
        processed.add(uIdStr);
        queue.push(uIdStr);
      }
    }
  }

  return subordinateIds;
};

export const UserWorkspace = ({ setActiveSection }) => {
  const { user, userRoles, isSalesCoordinator, isServiceCoordinator, isManager } = useAuth();
  const { isModuleActive } = useSubscription();
  const {
    tasks,
    loading,
    completeTask,
    updateStatus,
    notifications,
    unreadCount,
    openViewModal,
    openEditModal,
    openDeleteModal,
  } = useTasks();
  const { users } = useUserManagement();
  const { leads, stats: leadStats, openCreateModal: openCreateLeadModal } = useLeads();
  const { opportunities, stats: oppStats } = useOpportunities();
  const { complaints, stats: complaintStats, openCreateModal: openCreateComplaintModal } = useComplaints();
  const { projects, stats: projectStats, openCreateModal: openCreateProjectModal } = useProjects();

  // Active section popup modal state: null | 'all' | 'To Do' | 'In Progress' | 'Completed'
  const [activeModalSection, setActiveModalSection] = useState(null);
  const [modalSearch, setModalSearch] = useState('');
  const [modalTypeFilter, setModalTypeFilter] = useState('all');

  // Subordinates calculation (all recursive lower users in hierarchy)
  const currentUserIdStr = (user?._id || user?.id || '').toString();
  const subordinateIds = getSubordinateUserIds(user, users);
  const mySubordinates = (users || []).filter((u) => {
    if (!u) return false;
    const uId = (u._id || u.id || '').toString();
    return subordinateIds.has(uId);
  });
  const subordinateNames = mySubordinates.map((u) => (u.name || '').toLowerCase().trim());
  const subordinateUsernames = mySubordinates.map((u) => (u.username || '').toLowerCase().trim());
  const subordinateIdList = Array.from(subordinateIds);

  // Task Completion Modal State
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
  const [taskToComplete, setTaskToComplete] = useState(null);
  const [completionRemark, setCompletionRemark] = useState('');
  const [isSubmittingCompletion, setIsSubmittingCompletion] = useState(false);
  const [successToast, setSuccessToast] = useState('');

  // Filter tasks: own tasks + assigned subordinate tasks
  const userIdentifier = (user?.name || '').toLowerCase().trim();
  const userUsername = (user?.username || '').toLowerCase().trim();
  const userId = (user?._id || user?.id || '').toString();

  const safeTasks = Array.isArray(tasks) ? tasks : [];
  const safeNotifications = Array.isArray(notifications) ? notifications : [];

  const myTasks = safeTasks.filter((t) => {
    if (!t) return false;
    const tAssigned = (t.assignedTo || '').toLowerCase().trim();
    const tUser = t.user ? (t.user._id ? t.user._id.toString() : t.user.toString()) : '';
    const tAssignedBy = (t.assignedBy || '').toLowerCase().trim();
    const isSelf =
      (userIdentifier && tAssigned === userIdentifier) ||
      (userUsername && tAssigned === userUsername) ||
      (userId && tUser === userId) ||
      tAssigned === 'current user';
    const isSubordinate =
      subordinateNames.includes(tAssigned) ||
      subordinateUsernames.includes(tAssigned) ||
      subordinateIdList.includes(tUser);
    const isAssignedBySelfOrSub =
      (userIdentifier && tAssignedBy.includes(userIdentifier)) ||
      (userUsername && tAssignedBy.includes(userUsername)) ||
      subordinateNames.some((n) => tAssignedBy.includes(n));
    return isSelf || isSubordinate || isAssignedBySelfOrSub;
  });

  // Self & Subordinates Metrics
  const totalMyTasks = myTasks.length;
  const completedTasks = myTasks.filter((t) => t && t.status === 'Completed');
  const inProgressTasks = myTasks.filter((t) => t && t.status === 'In Progress');
  const todoTasks = myTasks.filter((t) => t && t.status === 'To Do');

  const completionPercentage =
    totalMyTasks > 0 ? Math.round((completedTasks.length / totalMyTasks) * 100) : 0;

  // Filter complaints: own + subordinate complaints
  const safeComplaints = Array.isArray(complaints) ? complaints : [];
  const myComplaints = safeComplaints.filter((c) => {
    if (!c) return false;
    const cAssigned = (c.assignedTo?.name || c.assignedToName || c.assignedTo || '').toLowerCase().trim();
    const cAssignedId = (c.assignedTo?._id || c.assignedTo?.id || c.assignedTo || '').toString();
    const cCreatedById = (c.createdBy?._id || c.createdBy?.id || c.createdBy || '').toString();
    const isSelf =
      (userIdentifier && cAssigned === userIdentifier) ||
      (userId && cAssignedId === userId) ||
      (userId && cCreatedById === userId);
    const isSubordinate =
      subordinateNames.includes(cAssigned) ||
      subordinateIdList.includes(cAssignedId) ||
      subordinateIdList.includes(cCreatedById);
    return isSelf || isSubordinate;
  });

  // Filter projects: own + subordinate projects
  const safeProjects = Array.isArray(projects) ? projects : [];
  const myProjects = safeProjects.filter((p) => {
    if (!p) return false;
    const pMgr = (p.manager?.name || p.managerName || p.manager || '').toLowerCase().trim();
    const pMgrId = (p.manager?._id || p.manager?.id || p.manager || '').toString();
    const pCreatedById = (p.createdBy?._id || p.createdBy?.id || p.createdBy || '').toString();
    const isMember = (p.teamMembers || []).some((m) => {
      const mName = (m.user?.name || m.name || m.userName || '').toLowerCase().trim();
      const mId = (m.user?._id || m.user?.id || m.userId || m.user || '').toString();
      return (
        (userIdentifier && mName === userIdentifier) ||
        (userId && mId === userId) ||
        subordinateNames.includes(mName) ||
        subordinateIdList.includes(mId)
      );
    });
    const isSelf =
      (userIdentifier && pMgr === userIdentifier) ||
      (userId && pMgrId === userId) ||
      (userId && pCreatedById === userId);
    const isSubordinate =
      subordinateNames.includes(pMgr) ||
      subordinateIdList.includes(pMgrId) ||
      subordinateIdList.includes(pCreatedById);
    return isSelf || isSubordinate || isMember;
  });

  // Check for latest task assignment notification for this user
  const latestAssignmentNotif = safeNotifications.find(
    (n) => n && (n.type === 'task_assigned' || (n.assignedBy && n.forRole !== 'Manager') || n.forRole === 'User')
  );

  // Open specific detail section popup
  const openSectionModal = (sectionKey) => {
    setActiveModalSection(sectionKey);
    setModalSearch('');
    setModalTypeFilter('all');
  };

  const closeSectionModal = () => {
    setActiveModalSection(null);
    setModalSearch('');
    setModalTypeFilter('all');
  };

  // Filter tasks inside the active modal popup
  const getModalTasks = () => {
    if (!activeModalSection) return [];

    let list = myTasks;
    if (activeModalSection !== 'all') {
      list = list.filter((t) => t.status === activeModalSection);
    }

    return list.filter((t) => {
      const matchesSearch =
        modalSearch.trim() === '' ||
        t.description.toLowerCase().includes(modalSearch.toLowerCase()) ||
        (t.remark && t.remark.toLowerCase().includes(modalSearch.toLowerCase())) ||
        (t.assignedBy && t.assignedBy.toLowerCase().includes(modalSearch.toLowerCase()));
      const matchesType = modalTypeFilter === 'all' || t.taskType === modalTypeFilter;

      return matchesSearch && matchesType;
    });
  };

  // Open Completion Modal
  const openCompletionModal = (task) => {
    setTaskToComplete(task);
    setCompletionRemark('');
    setIsCompletionModalOpen(true);
  };

  const closeCompletionModal = () => {
    setIsCompletionModalOpen(false);
    setTaskToComplete(null);
    setCompletionRemark('');
  };

  // Submit Task Completion & Send Message to Manager
  const handleSubmitCompletion = async (e) => {
    e.preventDefault();
    if (!taskToComplete) return;

    setIsSubmittingCompletion(true);
    const remarkToSend =
      completionRemark.trim() || 'Work completed successfully and ready for manager review.';
    const res = await completeTask(taskToComplete._id, remarkToSend);
    setIsSubmittingCompletion(false);

    if (res.success) {
      closeCompletionModal();
      setSuccessToast(
        `Great job! Task marked as completed and completion report sent directly to ${taskToComplete.assignedBy || 'Assigner'}.`
      );
      setTimeout(() => setSuccessToast(''), 5000);
    }
  };

  // Quick Start Task
  const handleStartTask = async (task) => {
    await updateStatus(task._id, 'In Progress');
    setSuccessToast(`Task status updated to In Progress.`);
    setTimeout(() => setSuccessToast(''), 4000);
  };

  const getTaskTypeBadgeColor = (type) => {
    switch (type) {
      case 'internet work':
        return { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' };
      case 'documentation':
        return { bg: '#ecfdf5', color: '#047857', border: '#a7f3d0' };
      case 'social media':
        return { bg: '#fdf2f8', color: '#be185d', border: '#fbcfe8' };
      case 'backend work':
        return { bg: '#f5f3ff', color: '#6d28d9', border: '#ddd6fe' };
      case 'sells':
      case 'sales':
        return { bg: '#fef3c7', color: '#b45309', border: '#fde68a' };
      default:
        return { bg: '#f1f5f9', color: '#475569', border: '#cbd5e1' };
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'High':
        return (
          <span
            style={{
              fontSize: '0.72rem',
              padding: '2px 8px',
              borderRadius: '9999px',
              background: '#fef2f2',
              color: '#dc2626',
              border: '1px solid #fecaca',
              fontWeight: 600,
            }}
          >
            High Priority
          </span>
        );
      case 'Medium':
        return (
          <span
            style={{
              fontSize: '0.72rem',
              padding: '2px 8px',
              borderRadius: '9999px',
              background: '#fffbeb',
              color: '#b45309',
              border: '1px solid #fde68a',
              fontWeight: 600,
            }}
          >
            Medium Priority
          </span>
        );
      default:
        return (
          <span
            style={{
              fontSize: '0.72rem',
              padding: '2px 8px',
              borderRadius: '9999px',
              background: '#f1f5f9',
              color: '#475569',
              border: '1px solid #cbd5e1',
              fontWeight: 600,
            }}
          >
            Low Priority
          </span>
        );
    }
  };

  const modalTasksList = getModalTasks();

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Toast Notification */}
      {successToast && (
        <div
          style={{
            padding: '12px 18px',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.3))',
            border: '1px solid #10b981',
            borderRadius: '10px',
            color: '#a7f3d0',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)',
            animation: 'fadeIn 0.3s ease',
          }}
        >
          <CheckCircle2 size={18} color="#10b981" />
          <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{successToast}</span>
        </div>
      )}

      {/* Header with Title and Multi-Role Badges */}
      <div
        className="section-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '4px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <h2 className="section-title" style={{ margin: 0 }}>MY WORKSPACE</h2>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {(userRoles || [user?.role || 'User']).map((r) => (
                <span
                  key={r}
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '999px',
                    background: r.includes('Manager')
                      ? '#eff6ff'
                      : r.includes('Sales')
                      ? '#fef3c7'
                      : r.includes('Service')
                      ? '#ecfdf5'
                      : '#f1f5f9',
                    color: r.includes('Manager')
                      ? '#1d4ed8'
                      : r.includes('Sales')
                      ? '#b45309'
                      : r.includes('Service')
                      ? '#047857'
                      : '#475569',
                    border: `1px solid ${
                      r.includes('Manager')
                        ? '#bfdbfe'
                        : r.includes('Sales')
                        ? '#fde68a'
                        : r.includes('Service')
                        ? '#a7f3d0'
                        : '#e2e8f0'
                    }`,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Award size={11} />
                  <span>{r}</span>
                </span>
              ))}
            </div>
          </div>
          <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '0.84rem' }}>
            Logged in as <strong>{user?.name}</strong> • Unified dashboard tailored to your active roles & assigned modules.
          </p>
        </div>
      </div>

      {/* HORIZONTAL TASK ASSIGNMENT ALERT BANNER */}
      {latestAssignmentNotif && (
        <div
          style={{
            background: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: '12px',
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: '#dbeafe',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Bell size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.92rem' }}>
                  {latestAssignmentNotif.assignedBy || 'Manager'} assigned you a task
                </span>
                <span
                  style={{
                    fontSize: '0.7rem',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: '#dbeafe',
                    color: '#1d4ed8',
                    fontWeight: 600,
                  }}
                >
                  INBOX MESSAGE
                </span>
              </div>
              <p style={{ margin: '2px 0 0 0', color: 'var(--text-secondary)', fontSize: '0.84rem' }}>
                {latestAssignmentNotif.taskDescription || latestAssignmentNotif.message} •{' '}
                <span style={{ color: 'var(--text-muted)' }}>{latestAssignmentNotif.remark}</span>
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => openSectionModal('To Do')}
              style={{
                padding: '6px 14px',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>View in To Do</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* STRICTLY HORIZONTAL ASSIGNMENTS ROW BAR */}
      <div
        className="card"
        style={{
          background: '#ffffff',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '20px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Work Breakdown & Task Categories:
          </span>

          {/* Completion Progress Metric */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Overall Progress: <strong style={{ color: '#059669' }}>{completionPercentage}%</strong> ({completedTasks.length}/{totalMyTasks} completed)
            </span>
          </div>
        </div>

        {/* 4 Curved Interactive Metric Cards Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '16px',
          }}
        >
          <MetricCard
            title="Total Assigned Work"
            value={totalMyTasks}
            subtitle="All personal active tasks"
            icon={Briefcase}
            color="#2563eb"
            bgLight="#eff6ff"
            isClickable={true}
            onClick={() => openSectionModal('all')}
          />

          <MetricCard
            title="Completed"
            value={completedTasks.length}
            subtitle="Successfully finished"
            icon={CheckCircle2}
            color="#059669"
            bgLight="#ecfdf5"
            isClickable={true}
            onClick={() => openSectionModal('Completed')}
          />

          <MetricCard
            title="In Progress"
            value={inProgressTasks.length}
            subtitle="Currently executing"
            icon={Clock}
            color="#d97706"
            bgLight="#fffbeb"
            isClickable={true}
            onClick={() => openSectionModal('In Progress')}
          />

          <MetricCard
            title="To Do"
            value={todoTasks.length}
            subtitle="Awaiting action"
            icon={ListTodo}
            color="#7c3aed"
            bgLight="#f5f3ff"
            isClickable={true}
            onClick={() => openSectionModal('To Do')}
          />
        </div>
      </div>

      {/* DEDICATED SECTION POP-UP MODAL (Opens only when user clicks a specific detail) */}
      {activeModalSection !== null && (
        <div className="modal-backdrop" onClick={closeSectionModal}>
          <div
            className="modal-content user-section-modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '850px',
              width: '100%',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              animation: 'modalSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            {/* Modal Header */}
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    padding: '8px',
                    borderRadius: '10px',
                    background:
                      activeModalSection === 'Completed'
                        ? '#ecfdf5'
                        : activeModalSection === 'In Progress'
                        ? '#fffbeb'
                        : activeModalSection === 'To Do'
                        ? '#f5f3ff'
                        : '#eff6ff',
                    color:
                      activeModalSection === 'Completed'
                        ? '#059669'
                        : activeModalSection === 'In Progress'
                        ? '#d97706'
                        : activeModalSection === 'To Do'
                        ? '#7c3aed'
                        : '#2563eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {activeModalSection === 'Completed' && <CheckCircle2 size={22} />}
                  {activeModalSection === 'In Progress' && <Clock size={22} />}
                  {activeModalSection === 'To Do' && <ListTodo size={22} />}
                  {activeModalSection === 'all' && <Briefcase size={22} />}
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <h3 className="modal-title" style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.15rem' }}>
                      {activeModalSection === 'Completed' && 'Completed Tasks'}
                      {activeModalSection === 'In Progress' && 'In Progress Tasks'}
                      {activeModalSection === 'To Do' && 'To Do Tasks'}
                      {activeModalSection === 'all' && 'All Assigned Tasks'}
                    </h3>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '999px',
                        background: '#f1f5f9',
                        color: 'var(--text-primary)',
                        border: '1px solid #e2e8f0',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {modalTasksList.length} task(s)
                    </span>
                  </div>
                </div>
              </div>

              <button type="button" className="btn-icon" onClick={closeSectionModal} title="Close">
                <X size={20} />
              </button>
            </div>

            {/* Modal Filter Toolbar - Responsive Stack on Mobile */}
            <div className="user-modal-filter-toolbar">
              <div className="user-modal-search-box">
                <Search
                  size={15}
                  style={{
                    position: 'absolute',
                    left: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#64748b',
                    pointerEvents: 'none',
                  }}
                />
                <input
                  type="text"
                  className="form-control"
                  placeholder="Filter tasks in this section..."
                  value={modalSearch}
                  onChange={(e) => setModalSearch(e.target.value)}
                  style={{ paddingLeft: '32px', fontSize: '0.85rem', height: '38px', width: '100%' }}
                />
              </div>

              <div className="user-modal-select-box">
                <select
                  className="form-control select-filter"
                  value={modalTypeFilter}
                  onChange={(e) => setModalTypeFilter(e.target.value)}
                  style={{ fontSize: '0.85rem', width: '100%', height: '38px' }}
                  aria-label="Filter by task type"
                >
                  <option value="all">All Task Types</option>
                  <option value="internet work">Internet Work</option>
                  <option value="documentation">Documentation</option>
                  <option value="social media">Social Media</option>
                  <option value="backend work">Backend Work</option>
                  <option value="sells">Sells</option>
                </select>
              </div>
            </div>

            {/* Modal Task List Body */}
            <div
              className="modal-body user-modal-task-body"
              style={{
                padding: '16px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                overflowY: 'auto',
              }}
            >
              {modalTasksList.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '48px 16px',
                    color: 'var(--text-muted)',
                  }}
                >
                  <Briefcase size={38} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
                  <h4 style={{ color: 'var(--text-primary)', fontSize: '0.95rem', marginBottom: '4px' }}>
                    No Tasks in this section
                  </h4>
                  <p style={{ fontSize: '0.82rem', margin: 0 }}>
                    {modalSearch || modalTypeFilter !== 'all'
                      ? 'No tasks match your filter criteria.'
                      : `You currently have 0 tasks in "${activeModalSection}".`}
                  </p>
                </div>
              ) : (
                modalTasksList.map((task) => {
                  const typeStyle = getTaskTypeBadgeColor(task.taskType);
                  const isTaskCompleted = task.status === 'Completed';

                  let formattedDate = 'No date';
                  if (task.expectedDate) {
                    const d = new Date(task.expectedDate);
                    formattedDate = d.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    });
                  }

                  return (
                    <div
                      key={task._id}
                      className="user-task-modal-card"
                      style={{
                        background: isTaskCompleted
                          ? '#f0fdf4'
                          : '#ffffff',
                        border: isTaskCompleted
                          ? '1px solid #bbf7d0'
                          : '1px solid #e2e8f0',
                        borderRadius: '12px',
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                        boxShadow: 'var(--shadow-sm)',
                        boxSizing: 'border-box',
                        width: '100%',
                        overflow: 'hidden',
                      }}
                    >
                      {/* Top Badges & Status Row */}
                      <div className="user-task-badges-row">
                        <div className="user-task-badges-left">
                          <span
                            style={{
                              fontSize: '0.72rem',
                              textTransform: 'uppercase',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '4px',
                              background: typeStyle.bg,
                              color: typeStyle.color,
                              border: `1px solid ${typeStyle.border}`,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {task.taskType}
                          </span>

                          {getPriorityBadge(task.priority)}

                          <span
                            style={{
                              fontSize: '0.72rem',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              background: '#eff6ff',
                              color: '#1d4ed8',
                              border: '1px solid #bfdbfe',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            <Shield size={11} />
                            <span>Assigned by: {task.assignedBy || 'Manager'}</span>
                          </span>
                        </div>

                        <div className="user-task-badges-right">
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
                            <Calendar size={13} />
                            <span>Due: {formattedDate}</span>
                          </span>

                          <span
                            className="user-task-status-badge"
                            style={{
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              padding: '2px 10px',
                              borderRadius: '999px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              whiteSpace: 'nowrap',
                              flexShrink: 0,
                              background:
                                task.status === 'Completed'
                                  ? '#ecfdf5'
                                  : task.status === 'In Progress'
                                  ? '#fffbeb'
                                  : '#f5f3ff',
                              color:
                                task.status === 'Completed'
                                  ? '#047857'
                                  : task.status === 'In Progress'
                                  ? '#b45309'
                                  : '#6d28d9',
                              border: `1px solid ${
                                task.status === 'Completed'
                                  ? '#a7f3d0'
                                  : task.status === 'In Progress'
                                  ? '#fde68a'
                                  : '#ddd6fe'
                              }`,
                            }}
                          >
                            <span
                              style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                background:
                                  task.status === 'Completed'
                                    ? '#059669'
                                    : task.status === 'In Progress'
                                    ? '#d97706'
                                    : '#7c3aed',
                                display: 'inline-block',
                              }}
                            />
                            <span>{task.status}</span>
                          </span>
                        </div>
                      </div>

                      {/* Description */}
                      <p
                        style={{
                          color: 'var(--text-primary)',
                          fontSize: '0.92rem',
                          fontWeight: 600,
                          margin: '2px 0',
                          lineHeight: 1.45,
                          wordBreak: 'break-word',
                          overflowWrap: 'break-word',
                        }}
                      >
                        {task.description}
                      </p>

                      {/* Manager Instructions */}
                      {task.remark && (
                        <div
                          style={{
                            background: '#f8fafc',
                            padding: '8px 12px',
                            borderRadius: '6px',
                            border: '1px solid #e2e8f0',
                            borderLeft: '3px solid #2563eb',
                            fontSize: '0.8rem',
                            color: 'var(--text-secondary)',
                            wordBreak: 'break-word',
                            overflowWrap: 'break-word',
                          }}
                        >
                          <span style={{ fontWeight: 600, color: '#1d4ed8', display: 'block', fontSize: '0.72rem' }}>
                            Manager Instructions:
                          </span>
                          {task.remark}
                        </div>
                      )}

                      {/* User Completion Note */}
                      {task.completionRemark && (
                        <div
                          style={{
                            background: '#f0fdf4',
                            padding: '8px 12px',
                            borderRadius: '6px',
                            border: '1px solid #bbf7d0',
                            borderLeft: '3px solid #059669',
                            fontSize: '0.8rem',
                            color: 'var(--text-secondary)',
                            wordBreak: 'break-word',
                            overflowWrap: 'break-word',
                          }}
                        >
                          <span style={{ fontWeight: 600, color: '#047857', display: 'block', fontSize: '0.72rem' }}>
                            Your Completion Note (Sent to Manager):
                          </span>
                          "{task.completionRemark}"
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div
                        className="user-task-actions-row"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: '8px',
                          marginTop: '4px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          {task.status === 'To Do' && (
                            <button
                              className="btn btn-secondary user-task-action-btn"
                              onClick={() => handleStartTask(task)}
                              style={{
                                fontSize: '0.8rem',
                                padding: '7px 12px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                background: '#fffbeb',
                                borderColor: '#fde68a',
                                color: '#b45309',
                              }}
                            >
                              <PlayCircle size={15} />
                              <span>Start Task (In Progress)</span>
                            </button>
                          )}

                          {task.status !== 'Completed' && (
                            <button
                              className="btn btn-primary user-task-action-btn"
                              onClick={() => openCompletionModal(task)}
                              style={{
                                fontSize: '0.8rem',
                                padding: '7px 14px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                background: 'linear-gradient(135deg, #10b981, #059669)',
                                borderColor: '#059669',
                              }}
                            >
                              <CheckCircle2 size={15} />
                              <span>Complete & Add Remark</span>
                            </button>
                          )}

                          {isTaskCompleted && (
                            <span style={{ color: '#059669', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 0' }}>
                              <CheckCircle2 size={15} />
                              <span>Completed & Notified</span>
                            </span>
                          )}
                        </div>

                        {/* View, Edit, Delete icon signs only */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <button
                            type="button"
                            onClick={() => openViewModal(task)}
                            title="View Details"
                            style={{
                              width: '30px',
                              height: '30px',
                              borderRadius: '6px',
                              border: '1px solid #bfdbfe',
                              backgroundColor: '#eff6ff',
                              color: '#2563eb',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.15s ease',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#dbeafe';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = '#eff6ff';
                            }}
                          >
                            <Eye size={15} />
                          </button>

                          <button
                            type="button"
                            onClick={() => openEditModal(task)}
                            title="Edit Task"
                            style={{
                              width: '30px',
                              height: '30px',
                              borderRadius: '6px',
                              border: '1px solid #e2e8f0',
                              backgroundColor: '#f8fafc',
                              color: '#475569',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.15s ease',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#f1f5f9';
                              e.currentTarget.style.color = '#0f172a';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = '#f8fafc';
                              e.currentTarget.style.color = '#475569';
                            }}
                          >
                            <Edit2 size={15} />
                          </button>

                          <button
                            type="button"
                            onClick={() => openDeleteModal(task)}
                            title="Delete Task"
                            style={{
                              width: '30px',
                              height: '30px',
                              borderRadius: '6px',
                              border: '1px solid #fecaca',
                              backgroundColor: '#fef2f2',
                              color: '#dc2626',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.15s ease',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#fee2e2';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = '#fef2f2';
                            }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Task Completion Modal */}
      {isCompletionModalOpen && taskToComplete && (
        <div className="modal-backdrop" style={{ zIndex: 1300 }}>
          <div
            className="modal-content"
            style={{ maxWidth: '520px', width: '100%', animation: 'modalSlideUp 0.25s ease' }}
          >
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    padding: '8px',
                    borderRadius: '8px',
                    background: '#ecfdf5',
                    color: '#059669',
                  }}
                >
                  <CheckCircle2 size={22} />
                </div>
                <div>
                  <h3 className="modal-title" style={{ color: 'var(--text-primary)', margin: 0 }}>Complete Task & Report to Assigner</h3>
                </div>
              </div>

              <button
                type="button"
                className="btn-icon"
                onClick={closeCompletionModal}
                disabled={isSubmittingCompletion}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitCompletion}>
              <div className="modal-body">
                {/* Task Preview Card */}
                <div
                  style={{
                    background: '#f8fafc',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    marginBottom: '16px',
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.72rem',
                      textTransform: 'uppercase',
                      color: '#2563eb',
                      fontWeight: 700,
                    }}
                  >
                    {taskToComplete.taskType}
                  </span>
                  <p
                    style={{
                      color: 'var(--text-primary)',
                      fontSize: '0.88rem',
                      fontWeight: 600,
                      margin: '4px 0',
                    }}
                  >
                    {taskToComplete.description}
                  </p>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Assigned by: {taskToComplete.assignedBy || 'Manager'}
                  </span>
                </div>

                {/* Completion Remark Input */}
                <div className="form-group">
                  <label className="form-label" htmlFor="completionRemark">
                    Completion Remark / Report for {taskToComplete.assignedBy ? `Assigner (${taskToComplete.assignedBy})` : 'Assigner'} <span className="required">*</span>
                  </label>
                  <textarea
                    id="completionRemark"
                    className="form-control"
                    rows="4"
                    placeholder="e.g. Work is done, tests are passing, and files have been verified."
                    value={completionRemark}
                    onChange={(e) => setCompletionRemark(e.target.value)}
                    disabled={isSubmittingCompletion}
                    autoFocus
                  />
                  <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                    This completion report will be dispatched directly to {taskToComplete.assignedBy || 'the assigner'}.
                  </span>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeCompletionModal}
                  disabled={isSubmittingCompletion}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    borderColor: '#059669',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                  disabled={isSubmittingCompletion}
                >
                  {isSubmittingCompletion ? (
                    <span>Submitting...</span>
                  ) : (
                    <>
                      <Send size={16} />
                      <span>Submit & Report to Assigner</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
