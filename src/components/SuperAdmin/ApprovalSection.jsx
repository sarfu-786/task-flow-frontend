import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import { useUserManagement } from '../../context/UserContext';
import { socketService } from '../../services/socket';
import { MetricCard } from '../ManagerDashboard/MetricCard';
import {
  UserCheck,
  UserX,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  RefreshCw,
  ShieldAlert,
  Mail,
  User as UserIcon,
  X,
} from 'lucide-react';

const DEPARTMENT_OPTIONS = [
  'Internet Work',
  'Documentation',
  'Backend',
  'Social Media',
];

export const ApprovalSection = () => {
  const { fetchUsers, fetchPendingApprovalsCount } = useUserManagement();
  const [counts, setCounts] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [isCountsLoading, setIsCountsLoading] = useState(true);

  // Pop-up Drilldown Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalCategory, setModalCategory] = useState('Pending'); // 'Pending' | 'Approved' | 'Rejected' | 'all'
  const [modalSearchQuery, setModalSearchQuery] = useState('');
  const [modalUsers, setModalUsers] = useState([]);
  const [isModalLoading, setIsModalLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Auto-remove feedback alert after 4 seconds
  useEffect(() => {
    if (feedback.message) {
      const timer = setTimeout(() => setFeedback({ type: '', message: '' }), 4000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isModalOpen) {
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
  }, [isModalOpen]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isModalOpen) {
        setIsModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

  // Fetch summary counts for the dashboard cards
  const fetchCounts = useCallback(async () => {
    setIsCountsLoading(true);
    try {
      const res = await api.getUserApprovals({ status: 'all' });
      if (res.success && res.counts) {
        setCounts(res.counts);
      }
    } catch (err) {
      console.error('Failed to fetch approval counts:', err);
    } finally {
      setIsCountsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  // Socket listener for real-time approval synchronization
  useEffect(() => {
    const handleUpdated = () => {
      fetchCounts();
      if (fetchPendingApprovalsCount) fetchPendingApprovalsCount();
      if (isModalOpen) fetchModalData(true);
    };

    const cleanupApprovals = socketService.on('approvals:updated', handleUpdated);
    const cleanupUsers = socketService.on('users:updated', handleUpdated);

    return () => {
      if (cleanupApprovals) cleanupApprovals();
      if (cleanupUsers) cleanupUsers();
    };
  }, [fetchCounts, fetchPendingApprovalsCount, isModalOpen]);

  // Fetch modal users based on active category & search
  const fetchModalData = useCallback(async (silent = false) => {
    if (!silent) setIsModalLoading(true);
    try {
      const res = await api.getUserApprovals({
        status: modalCategory,
        search: modalSearchQuery,
      });
      if (res.success) {
        setModalUsers(res.users || []);
        if (res.counts) setCounts(res.counts);
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to load registration records',
      });
    } finally {
      if (!silent) setIsModalLoading(false);
    }
  }, [modalCategory, modalSearchQuery]);

  useEffect(() => {
    if (isModalOpen) {
      fetchModalData();
    }
  }, [isModalOpen, fetchModalData]);

  // Open drilldown modal for a specific clicked div
  const openModal = (category) => {
    setModalCategory(category);
    setModalSearchQuery('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalSearchQuery('');
  };

  // Status update handler (Approve / Reject)
  const handleUpdateStatus = async (user, newStatus, customDept = null) => {
    setActionLoadingId(user._id);
    try {
      const payload = { status: newStatus };
      if (customDept) payload.department = customDept;

      const res = await api.updateUserApproval(user._id, payload);
      if (res.success) {
        setFeedback({
          type: 'success',
          message: `User "${user.name}" has been ${newStatus.toLowerCase()} successfully!`,
        });
        await fetchModalData(true);
        await fetchCounts();
        if (fetchUsers) await fetchUsers();
        if (fetchPendingApprovalsCount) await fetchPendingApprovalsCount();
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || `Failed to ${newStatus.toLowerCase()} user registration`,
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Department change handler
  const handleDeptChange = async (user, newDept) => {
    setActionLoadingId(user._id);
    try {
      const res = await api.updateUserApproval(user._id, {
        status: user.status || 'Approved',
        department: newDept,
      });
      if (res.success) {
        setFeedback({
          type: 'success',
          message: `Department for "${user.name}" updated to "${newDept}"`,
        });
        await fetchModalData(true);
        await fetchCounts();
        if (fetchUsers) await fetchUsers();
        if (fetchPendingApprovalsCount) await fetchPendingApprovalsCount();
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update department' });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Dynamic modal configuration based ONLY on clicked category
  const modalConfig = {
    Pending: {
      title: 'Pending Approvals',
      subtitle: 'New user sign-ups waiting for review and department assignment',
      color: '#d97706',
      bgLight: '#fffbeb',
      badgeBg: '#fef3c7',
      badgeText: '#92400e',
      icon: Clock,
      emptyText: 'No pending registration requests waiting for review! All caught up.',
    },
    Approved: {
      title: 'Approved Members',
      subtitle: 'Active verified accounts with granted system access',
      color: '#059669',
      bgLight: '#ecfdf5',
      badgeBg: '#ecfdf5',
      badgeText: '#065f46',
      icon: CheckCircle2,
      emptyText: 'No approved members found matching current search criteria.',
    },
    Rejected: {
      title: 'Rejected Requests',
      subtitle: 'Denied registration requests archived in system',
      color: '#dc2626',
      bgLight: '#fff1f2',
      badgeBg: '#fff1f2',
      badgeText: '#9f1239',
      icon: UserX,
      emptyText: 'No rejected registration requests in archive.',
    },
    all: {
      title: 'All Registrations',
      subtitle: 'Complete database roster of all employee registration requests',
      color: '#2563eb',
      bgLight: '#eff6ff',
      badgeBg: '#eff6ff',
      badgeText: '#1d4ed8',
      icon: UserCheck,
      emptyText: 'No registration records match your search criteria.',
    },
  }[modalCategory] || {
    title: 'Registration Records',
    subtitle: 'Manage user access and departments',
    color: '#2563eb',
    bgLight: '#eff6ff',
    badgeBg: '#eff6ff',
    badgeText: '#1d4ed8',
    icon: UserCheck,
    emptyText: 'No records found.',
  };

  const ModalIcon = modalConfig.icon;

  return (
    <div className="section-container" style={{ animation: 'fadeIn 0.25s ease' }}>
      {/* Header */}
      <div className="section-header" style={{ marginBottom: '24px' }}>
        <div>
          <h2 className="section-title">Registration Approvals</h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Review pending employee sign-ups, assign working departments, and grant official system access. Click any card below to view and manage related records in a pop-up.
          </p>
        </div>
      </div>

      {/* Global Feedback Alert */}
      {feedback.message && !isModalOpen && (
        <div
          style={{
            background: feedback.type === 'success' ? '#ecfdf5' : '#fef2f2',
            border: `1px solid ${feedback.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
            borderRadius: '12px',
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: feedback.type === 'success' ? '#047857' : '#b91c1c',
            fontSize: '0.9rem',
            fontWeight: 500,
            marginBottom: '20px',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* 4 Clickable Metric Card Divs - Clicking any div opens ONLY related info in pop-up */}
      <div
        className="stats-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        {/* Card 1: Pending Approvals */}
        <MetricCard
          title="Pending Approvals"
          value={counts.pending}
          subtitle="Awaiting Super Admin review"
          icon={Clock}
          color="#d97706"
          bgLight="#fffbeb"
          isClickable={true}
          onClick={() => openModal('Pending')}
        />

        {/* Card 2: Approved Members */}
        <MetricCard
          title="Approved Members"
          value={counts.approved}
          subtitle="Active verified accounts"
          icon={CheckCircle2}
          color="#059669"
          bgLight="#ecfdf5"
          isClickable={true}
          onClick={() => openModal('Approved')}
        />

        {/* Card 3: Rejected Requests */}
        <MetricCard
          title="Rejected Requests"
          value={counts.rejected}
          subtitle="Denied access requests"
          icon={UserX}
          color="#dc2626"
          bgLight="#fef2f2"
          isClickable={true}
          onClick={() => openModal('Rejected')}
        />

        {/* Card 4: All Registrations */}
        <MetricCard
          title="All Registrations"
          value={counts.total}
          subtitle="Complete accounts archive"
          icon={UserCheck}
          color="#2563eb"
          bgLight="#eff6ff"
          isClickable={true}
          onClick={() => openModal('all')}
        />
      </div>

      {/* ========================================================================= */}
      {/* CLEAN POP-UP MODAL (Shows ONLY the clicked category info, with scrollable div) */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '1000px',
              width: '95%',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              background: '#ffffff',
              borderRadius: '20px',
              border: '1px solid var(--border-color, #cbd5e1)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
          >
            {/* Modal Header: Specific to clicked category only */}
            <div
              className="modal-header"
              style={{
                padding: '16px 22px',
                borderBottom: '1px solid var(--border-color, #e2e8f0)',
                background: '#f8fafc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexShrink: 0,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: modalConfig.bgLight,
                    color: modalConfig.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: `1px solid ${modalConfig.color}40`,
                    flexShrink: 0,
                  }}
                >
                  <ModalIcon size={20} />
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.18rem', fontWeight: 800, color: '#0f172a' }}>
                      {modalConfig.title}
                    </h3>
                    <span
                      style={{
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '999px',
                        background: modalConfig.badgeBg,
                        color: modalConfig.badgeText,
                      }}
                    >
                      {modalUsers.length} {modalUsers.length === 1 ? 'Record' : 'Records'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '1px' }}>
                    {modalConfig.subtitle}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => fetchModalData()}
                  className="btn btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '5px', borderRadius: '8px' }}
                  title="Refresh records"
                >
                  <RefreshCw size={13} className={isModalLoading ? 'spin' : ''} />
                  <span>Refresh</span>
                </button>

                <button
                  type="button"
                  className="btn-icon"
                  onClick={closeModal}
                  aria-label="Close modal"
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#f1f5f9',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#64748b',
                  }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div
              style={{
                padding: '16px 22px',
                flex: '1 1 auto',
                minHeight: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                overflow: 'hidden',
              }}
            >
              {/* Feedback Alert inside Modal */}
              {feedback.message && (
                <div
                  style={{
                    background: feedback.type === 'success' ? '#ecfdf5' : '#fef2f2',
                    border: `1px solid ${feedback.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
                    borderRadius: '10px',
                    padding: '9px 13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: feedback.type === 'success' ? '#047857' : '#b91c1c',
                    fontSize: '0.84rem',
                    fontWeight: 600,
                  }}
                >
                  {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                  <span>{feedback.message}</span>
                </div>
              )}

              {/* Search Filter Bar */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <div style={{ position: 'relative', width: '100%', maxWidth: '320px' }}>
                  <Search
                    size={14}
                    style={{
                      position: 'absolute',
                      left: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#94a3b8',
                    }}
                  />
                  <input
                    type="text"
                    className="form-control"
                    style={{
                      paddingLeft: '32px',
                      paddingRight: modalSearchQuery ? '28px' : '10px',
                      borderRadius: '8px',
                      fontSize: '0.82rem',
                      height: '34px',
                      background: '#f8fafc',
                      border: '1px solid #cbd5e1',
                    }}
                    placeholder={`Search ${modalConfig.title.toLowerCase()}...`}
                    value={modalSearchQuery}
                    onChange={(e) => setModalSearchQuery(e.target.value)}
                  />
                  {modalSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setModalSearchQuery('')}
                      style={{
                        position: 'absolute',
                        right: '8px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#94a3b8',
                        cursor: 'pointer',
                        padding: '2px',
                      }}
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  Showing <strong>{modalUsers.length}</strong> records
                </span>
              </div>

              {/* SCROLLABLE DATA TABLE CONTAINER (Scrollable div for large data) */}
              <div
                className="approval-scroll-container custom-scrollbar"
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  flex: '1 1 auto',
                  maxHeight: 'calc(90vh - 240px)',
                  minHeight: '200px',
                  overflowY: 'auto',
                  overflowX: 'auto',
                  background: '#ffffff',
                }}
              >
                <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', margin: 0, minWidth: '720px' }}>
                  <thead
                    style={{
                      position: 'sticky',
                      top: 0,
                      zIndex: 4,
                      background: '#f8fafc',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
                    }}
                  >
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '0.76rem', fontWeight: 700, color: '#475569', width: '45px' }}>
                        Sr.
                      </th>
                      <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '0.76rem', fontWeight: 700, color: '#475569' }}>
                        Applicant / User
                      </th>
                      <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '0.76rem', fontWeight: 700, color: '#475569' }}>
                        Email Address
                      </th>
                      <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '0.76rem', fontWeight: 700, color: '#475569' }}>
                        Assigned Department
                      </th>
                      <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '0.76rem', fontWeight: 700, color: '#475569' }}>
                        Registration Date
                      </th>
                      <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '0.76rem', fontWeight: 700, color: '#475569' }}>
                        Status
                      </th>
                      <th style={{ padding: '10px 14px', textAlign: 'center', fontSize: '0.76rem', fontWeight: 700, color: '#475569', minWidth: '160px' }}>
                        Super Admin Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {isModalLoading ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '0.84rem' }}>
                            <RefreshCw size={15} className="spin" />
                            <span>Loading records...</span>
                          </div>
                        </td>
                      </tr>
                    ) : modalUsers.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '48px 0', color: '#64748b' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                            <ShieldAlert size={34} color="#94a3b8" />
                            <p style={{ fontWeight: 700, fontSize: '0.92rem', margin: 0, color: '#334155' }}>
                              No records found
                            </p>
                            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                              {modalConfig.emptyText}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      modalUsers.map((item, index) => {
                        const userStatus = item.status || 'Approved';
                        const isItemLoading = actionLoadingId === item._id;

                        return (
                          <tr
                            key={item._id}
                            style={{
                              borderBottom: '1px solid #f1f5f9',
                              background: userStatus === 'Pending' ? '#fffdfa' : '#ffffff',
                            }}
                          >
                            {/* Sr. */}
                            <td style={{ padding: '10px 14px', fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
                              {index + 1}
                            </td>

                            {/* User details */}
                            <td style={{ padding: '10px 14px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                {item.avatar ? (
                                  <img
                                    src={item.avatar}
                                    alt={item.name}
                                    style={{
                                      width: '32px',
                                      height: '32px',
                                      borderRadius: '50%',
                                      objectFit: 'cover',
                                      border: '1px solid #e2e8f0',
                                    }}
                                  />
                                ) : (
                                  <div
                                    style={{
                                      width: '32px',
                                      height: '32px',
                                      borderRadius: '50%',
                                      background:
                                        userStatus === 'Pending'
                                          ? '#d97706'
                                          : userStatus === 'Rejected'
                                          ? '#dc2626'
                                          : 'linear-gradient(135deg, #4f46e5, #6366f1)',
                                      color: '#ffffff',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontWeight: 700,
                                      fontSize: '0.8rem',
                                      flexShrink: 0,
                                    }}
                                  >
                                    {item.name ? item.name.charAt(0).toUpperCase() : <UserIcon size={14} />}
                                  </div>
                                )}
                                <div>
                                  <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.84rem' }}>
                                    {item.name}
                                  </div>
                                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                                    @{item.username || 'user'} • {item.role || 'User'}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Email */}
                            <td style={{ padding: '10px 14px', fontSize: '0.8rem', color: '#334155' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Mail size={13} color="#94a3b8" style={{ flexShrink: 0 }} />
                                <span style={{ wordBreak: 'break-word' }}>{item.email}</span>
                              </div>
                            </td>

                            {/* Department Dropdown */}
                            <td style={{ padding: '10px 14px' }}>
                              <select
                                className="form-control"
                                style={{
                                  padding: '4px 8px',
                                  fontSize: '0.76rem',
                                  borderRadius: '6px',
                                  width: 'auto',
                                  minWidth: '130px',
                                  background: '#f8fafc',
                                  border: '1px solid #cbd5e1',
                                }}
                                value={item.department || 'Internet Work'}
                                onChange={(e) => handleDeptChange(item, e.target.value)}
                                disabled={isItemLoading}
                              >
                                {DEPARTMENT_OPTIONS.map((dept) => (
                                  <option key={dept} value={dept}>
                                    {dept}
                                  </option>
                                ))}
                              </select>
                            </td>

                            {/* Joined Date */}
                            <td style={{ padding: '10px 14px', fontSize: '0.76rem', color: '#64748b' }}>
                              {item.createdAt
                                ? new Date(item.createdAt).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                  })
                                : '—'}
                            </td>

                            {/* Status Badge */}
                            <td style={{ padding: '10px 14px' }}>
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '2px 8px',
                                  borderRadius: '999px',
                                  fontSize: '0.7rem',
                                  fontWeight: 700,
                                  background:
                                    userStatus === 'Pending'
                                      ? '#fef3c7'
                                      : userStatus === 'Approved'
                                      ? '#ecfdf5'
                                      : '#fff1f2',
                                  color:
                                    userStatus === 'Pending'
                                      ? '#92400e'
                                      : userStatus === 'Approved'
                                      ? '#065f46'
                                      : '#9f1239',
                                  border: `1px solid ${
                                    userStatus === 'Pending'
                                      ? '#fde68a'
                                      : userStatus === 'Approved'
                                      ? '#a7f3d0'
                                      : '#fecaca'
                                  }`,
                                }}
                              >
                                {userStatus === 'Pending' && <Clock size={11} color="#d97706" />}
                                {userStatus === 'Approved' && <CheckCircle2 size={11} color="#059669" />}
                                {userStatus === 'Rejected' && <XCircle size={11} color="#dc2626" />}
                                {userStatus}
                              </span>
                            </td>

                            {/* Actions relevant ONLY to this status */}
                            <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                              {userStatus === 'Pending' && (
                                <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateStatus(item, 'Approved')}
                                    disabled={isItemLoading}
                                    style={{
                                      padding: '4px 10px',
                                      fontSize: '0.74rem',
                                      fontWeight: 700,
                                      background: '#059669',
                                      color: '#ffffff',
                                      border: 'none',
                                      borderRadius: '6px',
                                      cursor: 'pointer',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      boxShadow: '0 2px 4px rgba(5, 150, 105, 0.2)',
                                    }}
                                  >
                                    <UserCheck size={12} />
                                    <span>Approve</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateStatus(item, 'Rejected')}
                                    disabled={isItemLoading}
                                    style={{
                                      padding: '4px 10px',
                                      fontSize: '0.74rem',
                                      fontWeight: 600,
                                      background: '#ffffff',
                                      color: '#dc2626',
                                      border: '1px solid #fecaca',
                                      borderRadius: '6px',
                                      cursor: 'pointer',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                    }}
                                  >
                                    <UserX size={12} />
                                    <span>Reject</span>
                                  </button>
                                </div>
                              )}

                              {userStatus === 'Approved' && item.role !== 'Super Admin' && (
                                <div style={{ display: 'flex', justifyContent: 'center' }}>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateStatus(item, 'Rejected')}
                                    disabled={isItemLoading}
                                    style={{
                                      padding: '4px 10px',
                                      fontSize: '0.72rem',
                                      background: '#ffffff',
                                      color: '#dc2626',
                                      border: '1px solid #fecaca',
                                      borderRadius: '6px',
                                      cursor: 'pointer',
                                      fontWeight: 600,
                                    }}
                                    title="Revoke access"
                                  >
                                    <span>Revoke Access</span>
                                  </button>
                                </div>
                              )}

                              {userStatus === 'Rejected' && item.role !== 'Super Admin' && (
                                <div style={{ display: 'flex', justifyContent: 'center' }}>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateStatus(item, 'Approved')}
                                    disabled={isItemLoading}
                                    style={{
                                      padding: '4px 10px',
                                      fontSize: '0.72rem',
                                      background: '#059669',
                                      color: '#ffffff',
                                      border: 'none',
                                      borderRadius: '6px',
                                      cursor: 'pointer',
                                      fontWeight: 700,
                                    }}
                                    title="Re-approve access"
                                  >
                                    <span>Re-Approve</span>
                                  </button>
                                </div>
                              )}

                              {item.role === 'Super Admin' && (
                                <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontStyle: 'italic', fontWeight: 600 }}>
                                  Super Admin
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: '12px 22px',
                borderTop: '1px solid var(--border-color, #e2e8f0)',
                background: '#f8fafc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexShrink: 0,
              }}
            >
              <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                Showing <strong>{modalUsers.length}</strong> {modalUsers.length === 1 ? 'record' : 'records'}
              </div>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={closeModal}
                style={{ padding: '6px 16px', fontSize: '0.8rem', borderRadius: '8px' }}
              >
                Close Pop-up
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApprovalSection;
