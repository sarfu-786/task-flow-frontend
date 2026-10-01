import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import { useUserManagement } from '../../context/UserContext';
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

  // Modal State
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

  // Open drilldown modal for a specific category
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
        if (fetchUsers) await fetchUsers();
        if (fetchPendingApprovalsCount) await fetchPendingApprovalsCount();
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update department' });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Dynamic modal title helper
  const getModalTitle = () => {
    switch (modalCategory) {
      case 'Pending':
        return 'Pending Registration Requests';
      case 'Approved':
        return 'Approved Members Roster';
      case 'Rejected':
        return 'Rejected Registration Requests';
      case 'all':
      default:
        return 'All Registration Records';
    }
  };

  return (
    <div className="section-container" style={{ animation: 'fadeIn 0.25s ease' }}>
      {/* Header */}
      <div className="section-header" style={{ marginBottom: '24px' }}>
        <div>
          <h2 className="section-title">Registration Approvals</h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Review pending employee sign-ups, assign working departments, and grant official system access. Click any card below to view and manage records in a pop-up drilldown.
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

      {/* 4 MetricCard Divs (Identical to other sections across the app) */}
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
      {/* POP-UP DRILLDOWN MODAL */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '1060px',
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
            {/* Modal Header */}
            <div
              className="modal-header"
              style={{
                padding: '18px 24px',
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
                    width: '40px',
                    height: '40px',
                    borderRadius: '12px',
                    background:
                      modalCategory === 'Pending'
                        ? '#fffbeb'
                        : modalCategory === 'Approved'
                        ? '#ecfdf5'
                        : modalCategory === 'Rejected'
                        ? '#fff1f2'
                        : '#eff6ff',
                    color:
                      modalCategory === 'Pending'
                        ? '#d97706'
                        : modalCategory === 'Approved'
                        ? '#059669'
                        : modalCategory === 'Rejected'
                        ? '#dc2626'
                        : '#2563eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid currentColor',
                  }}
                >
                  {modalCategory === 'Pending' && <Clock size={20} />}
                  {modalCategory === 'Approved' && <CheckCircle2 size={20} />}
                  {modalCategory === 'Rejected' && <UserX size={20} />}
                  {modalCategory === 'all' && <UserCheck size={20} />}
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                      {getModalTitle()}
                    </h3>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '999px',
                        background: '#e2e8f0',
                        color: '#334155',
                      }}
                    >
                      {modalUsers.length} {modalUsers.length === 1 ? 'Record' : 'Records'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                    Super Admin Security & Access Permission Control
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => fetchModalData()}
                  className="btn btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '5px' }}
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
                padding: '20px 24px',
                flex: '1 1 auto',
                minHeight: 0,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              {/* Feedback Alert inside Modal */}
              {feedback.message && (
                <div
                  style={{
                    background: feedback.type === 'success' ? '#ecfdf5' : '#fef2f2',
                    border: `1px solid ${feedback.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
                    borderRadius: '10px',
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: feedback.type === 'success' ? '#047857' : '#b91c1c',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                  }}
                >
                  {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                  <span>{feedback.message}</span>
                </div>
              )}

              {/* Toolbar: Category Switcher Tabs & Search Filter */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px',
                  padding: '12px 14px',
                  background: '#f8fafc',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                }}
              >
                {/* Switcher Tabs inside pop-up */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setModalCategory('Pending')}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      background: modalCategory === 'Pending' ? '#d97706' : '#ffffff',
                      color: modalCategory === 'Pending' ? '#ffffff' : '#475569',
                      boxShadow: modalCategory === 'Pending' ? '0 2px 6px rgba(217, 119, 6, 0.3)' : '0 1px 2px rgba(0,0,0,0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <Clock size={13} />
                    <span>Pending ({counts.pending})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setModalCategory('Approved')}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      background: modalCategory === 'Approved' ? '#059669' : '#ffffff',
                      color: modalCategory === 'Approved' ? '#ffffff' : '#475569',
                      boxShadow: modalCategory === 'Approved' ? '0 2px 6px rgba(5, 150, 105, 0.3)' : '0 1px 2px rgba(0,0,0,0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <CheckCircle2 size={13} />
                    <span>Approved ({counts.approved})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setModalCategory('Rejected')}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      background: modalCategory === 'Rejected' ? '#dc2626' : '#ffffff',
                      color: modalCategory === 'Rejected' ? '#ffffff' : '#475569',
                      boxShadow: modalCategory === 'Rejected' ? '0 2px 6px rgba(220, 38, 38, 0.3)' : '0 1px 2px rgba(0,0,0,0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <UserX size={13} />
                    <span>Rejected ({counts.rejected})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setModalCategory('all')}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      background: modalCategory === 'all' ? '#2563eb' : '#ffffff',
                      color: modalCategory === 'all' ? '#ffffff' : '#475569',
                      boxShadow: modalCategory === 'all' ? '0 2px 6px rgba(37, 99, 235, 0.3)' : '0 1px 2px rgba(0,0,0,0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <UserCheck size={13} />
                    <span>All Accounts ({counts.total})</span>
                  </button>
                </div>

                {/* Modal Search Input */}
                <div style={{ position: 'relative', width: '100%', maxWidth: '280px' }}>
                  <div
                    style={{
                      position: 'absolute',
                      left: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#94a3b8',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <Search size={14} />
                  </div>
                  <input
                    type="text"
                    className="form-control"
                    style={{ paddingLeft: '32px', borderRadius: '8px', fontSize: '0.82rem', height: '34px' }}
                    placeholder="Search by name, email, or dept..."
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
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Data Table Container */}
              <div
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  background: '#ffffff',
                }}
              >
                <div className="table-responsive" style={{ overflowX: 'auto' }}>
                  <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', margin: 0 }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '0.78rem', fontWeight: 700, color: '#475569', width: '50px' }}>
                          Sr.
                        </th>
                        <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '0.78rem', fontWeight: 700, color: '#475569' }}>
                          Applicant / User
                        </th>
                        <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '0.78rem', fontWeight: 700, color: '#475569' }}>
                          Email Address
                        </th>
                        <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '0.78rem', fontWeight: 700, color: '#475569' }}>
                          Assigned Department
                        </th>
                        <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '0.78rem', fontWeight: 700, color: '#475569' }}>
                          Registration Date
                        </th>
                        <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '0.78rem', fontWeight: 700, color: '#475569' }}>
                          Status
                        </th>
                        <th style={{ padding: '10px 14px', textAlign: 'center', fontSize: '0.78rem', fontWeight: 700, color: '#475569' }}>
                          Super Admin Approval Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {isModalLoading ? (
                        <tr>
                          <td colSpan={7} style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                              <RefreshCw size={16} className="spin" />
                              <span>Loading registration records...</span>
                            </div>
                          </td>
                        </tr>
                      ) : modalUsers.length === 0 ? (
                        <tr>
                          <td colSpan={7} style={{ textAlign: 'center', padding: '48px 0', color: '#64748b' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                              <ShieldAlert size={36} color="#94a3b8" />
                              <p style={{ fontWeight: 700, fontSize: '0.95rem', margin: 0, color: '#334155' }}>
                                No registration records found
                              </p>
                              <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                                {modalCategory === 'Pending'
                                  ? 'No pending registration requests waiting for Super Admin approval! All caught up.'
                                  : modalCategory === 'Approved'
                                  ? 'No approved members matching current filters.'
                                  : modalCategory === 'Rejected'
                                  ? 'No rejected registration requests in archive.'
                                  : 'No records match your search criteria.'}
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
                              <td style={{ padding: '10px 14px', fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>
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
                                      }}
                                    >
                                      {item.name ? item.name.charAt(0).toUpperCase() : <UserIcon size={14} />}
                                    </div>
                                  )}
                                  <div>
                                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.85rem' }}>
                                      {item.name}
                                    </div>
                                    <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                                      @{item.username || 'user'} • {item.role}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* Email */}
                              <td style={{ padding: '10px 14px', fontSize: '0.82rem', color: '#334155', maxWidth: '220px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <Mail size={13} color="#94a3b8" style={{ flexShrink: 0 }} />
                                  <span style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{item.email}</span>
                                </div>
                              </td>

                              {/* Department */}
                              <td style={{ padding: '10px 14px' }}>
                                <select
                                  className="form-control"
                                  style={{
                                    padding: '4px 8px',
                                    fontSize: '0.78rem',
                                    borderRadius: '6px',
                                    width: 'auto',
                                    minWidth: '135px',
                                    background: '#f8fafc',
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
                              <td style={{ padding: '10px 14px', fontSize: '0.78rem', color: '#64748b' }}>
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
                                    fontSize: '0.72rem',
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
                                  }}
                                >
                                  {userStatus === 'Pending' && <Clock size={11} color="#d97706" />}
                                  {userStatus === 'Approved' && <CheckCircle2 size={11} color="#059669" />}
                                  {userStatus === 'Rejected' && <XCircle size={11} color="#dc2626" />}
                                  {userStatus}
                                </span>
                              </td>

                              {/* Actions */}
                              <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                                {userStatus === 'Pending' && (
                                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateStatus(item, 'Approved')}
                                      disabled={isItemLoading}
                                      style={{
                                        padding: '5px 10px',
                                        fontSize: '0.76rem',
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
                                      <UserCheck size={13} />
                                      <span>Approve</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateStatus(item, 'Rejected')}
                                      disabled={isItemLoading}
                                      style={{
                                        padding: '5px 10px',
                                        fontSize: '0.76rem',
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
                                      <UserX size={13} />
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
                                        padding: '4px 9px',
                                        fontSize: '0.74rem',
                                        background: '#ffffff',
                                        color: '#dc2626',
                                        border: '1px solid #fecaca',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                      }}
                                      title="Revoke access"
                                    >
                                      <span>Reject Access</span>
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
                                        padding: '4px 9px',
                                        fontSize: '0.74rem',
                                        background: '#059669',
                                        color: '#ffffff',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                      }}
                                      title="Re-approve access"
                                    >
                                      <span>Re-Approve</span>
                                    </button>
                                  </div>
                                )}

                                {item.role === 'Super Admin' && (
                                  <span style={{ fontSize: '0.74rem', color: '#94a3b8', fontStyle: 'italic' }}>
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
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: '12px 24px',
                borderTop: '1px solid var(--border-color, #e2e8f0)',
                background: '#f8fafc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexShrink: 0,
              }}
            >
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                Showing <strong>{modalUsers.length}</strong> {modalUsers.length === 1 ? 'applicant' : 'applicants'}
              </div>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={closeModal}
                style={{ padding: '6px 16px', fontSize: '0.82rem' }}
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
