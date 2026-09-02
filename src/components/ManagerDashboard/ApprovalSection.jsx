import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import { useUserManagement } from '../../context/UserContext';
import { MetricCard } from './MetricCard';
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
  Building,
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
  const { fetchUsers } = useUserManagement();
  const [users, setUsers] = useState([]);
  const [counts, setCounts] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [statusFilter, setStatusFilter] = useState('Pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Drilldown Modal State
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('Pending Registration Approvals');

  // Auto-remove feedback alert after 4 seconds
  useEffect(() => {
    if (feedback.message) {
      const timer = setTimeout(() => setFeedback({ type: '', message: '' }), 4000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  // Lock body scroll when details modal is open
  useEffect(() => {
    if (isDetailsModalOpen) {
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
  }, [isDetailsModalOpen]);

  const fetchApprovals = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.getUserApprovals({
        status: statusFilter,
        search: searchQuery,
      });
      if (res.success) {
        setUsers(res.users || []);
        if (res.counts) setCounts(res.counts);
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to load registration approvals' });
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    fetchApprovals();
  }, [fetchApprovals]);

  const openCardDetails = (status, title) => {
    setStatusFilter(status);
    setModalTitle(title);
    setSearchQuery('');
    setIsDetailsModalOpen(true);
  };

  const closeCardDetails = () => {
    setIsDetailsModalOpen(false);
  };

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
        await fetchApprovals();
        if (fetchUsers) await fetchUsers();
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
        await fetchApprovals();
        if (fetchUsers) await fetchUsers();
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update department' });
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="section-container" style={{ animation: 'fadeIn 0.25s ease' }}>
      {/* Header */}
      <div className="section-header" style={{ marginBottom: '24px' }}>
        <div>
          <h2 className="section-title">Registration Approvals</h2>
        </div>
      </div>

      {/* Global Feedback Alert if open outside modal */}
      {!isDetailsModalOpen && feedback.message && (
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

      {/* Top 3 Interactive Metric Cards matching Manager Dashboard dimensions */}
      <div className="stats-grid">
        {/* Pending Approvals */}
        <MetricCard
          title="Pending Approvals"
          value={counts.pending}
          icon={Clock}
          color="#d97706"
          bgLight="#fffbeb"
          isClickable={true}
          onClick={() => openCardDetails('Pending', 'Pending Registration Approvals')}
        />

        {/* Approved Members */}
        <MetricCard
          title="Approved Members"
          value={counts.approved}
          icon={CheckCircle2}
          color="#059669"
          bgLight="#ecfdf5"
          isClickable={true}
          onClick={() => openCardDetails('Approved', 'Approved Team Members')}
        />

        {/* Total Accounts */}
        <MetricCard
          title="Total Accounts"
          value={counts.total}
          icon={UserCheck}
          color="#2563eb"
          bgLight="#eff6ff"
          isClickable={true}
          onClick={() => openCardDetails('all', 'All Registered Accounts')}
        />
      </div>

      {/* =========================================================================
          INTERACTIVE DRILLDOWN POP-UP MODAL
          ========================================================================= */}
      {isDetailsModalOpen && (
        <div className="modal-backdrop" onClick={closeCardDetails}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '960px', width: '95%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
          >
            {/* Modal Header */}
            <div className="modal-header" style={{ padding: '18px 24px', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h3 className="modal-title" style={{ fontSize: '1.3rem', color: 'var(--text-primary)', margin: 0 }}>
                  {modalTitle}
                </h3>
                <span
                  style={{
                    fontSize: '0.75rem',
                    padding: '3px 10px',
                    borderRadius: 'var(--radius-full)',
                    background: '#eff6ff',
                    color: '#1d4ed8',
                    fontWeight: 700,
                    border: '1px solid #bfdbfe',
                  }}
                >
                  {users.length} {users.length === 1 ? 'Record' : 'Records'}
                </span>
              </div>

              <button
                type="button"
                className="btn-icon"
                onClick={closeCardDetails}
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="modal-body" style={{ padding: '20px 24px', overflowY: 'auto', gap: '16px' }}>
              {/* Feedback Alert Inside Modal */}
              {feedback.message && (
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
                    animation: 'fadeIn 0.2s ease',
                  }}
                >
                  {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                  <span>{feedback.message}</span>
                </div>
              )}

              {/* Search Bar */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                }}
              >
                <div style={{ position: 'relative', width: '100%', maxWidth: '380px' }}>
                  <div
                    style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#94a3b8',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <Search size={15} />
                  </div>
                  <input
                    type="text"
                    className="form-control"
                    style={{ paddingLeft: '36px', borderRadius: '8px', fontSize: '0.85rem' }}
                    placeholder={
                      statusFilter === 'Pending'
                        ? 'Search pending applicants...'
                        : statusFilter === 'Approved'
                        ? 'Search approved members...'
                        : 'Search all accounts...'
                    }
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* Data Table */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                <div className="table-responsive">
                  <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', margin: 0 }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>
                          Sr.
                        </th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>
                          Applicant / User
                        </th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>
                          Email Address
                        </th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>
                          Assigned Department
                        </th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>
                          Registration Date
                        </th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>
                          Status
                        </th>
                        <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {isLoading ? (
                        <tr>
                          <td colSpan={7} style={{ textAlign: 'center', padding: '36px 0', color: '#64748b' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                              <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} />
                              <span>Loading applicant details...</span>
                            </div>
                          </td>
                        </tr>
                      ) : users.length === 0 ? (
                        <tr>
                          <td colSpan={7} style={{ textAlign: 'center', padding: '42px 0', color: '#64748b' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                              <ShieldAlert size={36} color="#94a3b8" />
                              <p style={{ fontWeight: 600, fontSize: '0.95rem', margin: 0, color: '#334155' }}>
                                No applicant records found
                              </p>
                              <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                                {statusFilter === 'Pending'
                                  ? 'No pending registration requests waiting for approval!'
                                  : 'No records matching the filter'}
                              </span>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        users.map((item, index) => {
                          const userStatus = item.status || 'Approved';
                          const isItemLoading = actionLoadingId === item._id;

                          return (
                            <tr
                              key={item._id}
                              className="approval-table-row"
                              style={{
                                borderBottom: '1px solid #f1f5f9',
                                background: userStatus === 'Pending' ? '#fffdfa' : '#ffffff',
                              }}
                            >
                              {/* Sr. No */}
                              <td style={{ padding: '12px 16px', fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
                                {index + 1}
                              </td>

                              {/* User details */}
                              <td style={{ padding: '12px 16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  {item.avatar ? (
                                    <img
                                      src={item.avatar}
                                      alt={item.name}
                                      style={{
                                        width: '36px',
                                        height: '36px',
                                        borderRadius: '50%',
                                        objectFit: 'cover',
                                        border: '1px solid #e2e8f0',
                                      }}
                                    />
                                  ) : (
                                    <div
                                      style={{
                                        width: '36px',
                                        height: '36px',
                                        borderRadius: '50%',
                                        background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
                                        color: '#ffffff',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: 700,
                                        fontSize: '0.875rem',
                                      }}
                                    >
                                      {item.name ? item.name.charAt(0).toUpperCase() : <UserIcon size={16} />}
                                    </div>
                                  )}
                                  <div>
                                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.88rem' }}>
                                      {item.name}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                      @{item.username || 'user'} • {item.role}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* Email */}
                              <td style={{ padding: '12px 16px', fontSize: '0.85rem', color: '#334155' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <Mail size={13} color="#94a3b8" />
                                  <span>{item.email}</span>
                                </div>
                              </td>

                              {/* Department */}
                              <td style={{ padding: '12px 16px' }}>
                                <select
                                  className="form-control approval-dept-select"
                                  style={{
                                    padding: '4px 8px',
                                    fontSize: '0.8rem',
                                    borderRadius: '6px',
                                    width: 'auto',
                                    minWidth: '140px',
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
                              <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: '#64748b' }}>
                                {item.createdAt
                                  ? new Date(item.createdAt).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric',
                                    })
                                  : '—'}
                              </td>

                              {/* Status Badge */}
                              <td style={{ padding: '12px 16px' }}>
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                    padding: '2px 8px',
                                    borderRadius: '999px',
                                    fontSize: '0.75rem',
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
                                  {userStatus === 'Pending' && <Clock size={12} color="#d97706" />}
                                  {userStatus === 'Approved' && <CheckCircle2 size={12} color="#059669" />}
                                  {userStatus === 'Rejected' && <XCircle size={12} color="#e11d48" />}
                                  {userStatus}
                                </span>
                              </td>

                              {/* Actions */}
                              <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                {userStatus === 'Pending' && (
                                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                                    <button
                                      type="button"
                                      className="approval-btn-approve"
                                      onClick={() => handleUpdateStatus(item, 'Approved')}
                                      disabled={isItemLoading}
                                      style={{ padding: '5px 10px', fontSize: '0.78rem' }}
                                    >
                                      <UserCheck size={14} />
                                      <span>Approve</span>
                                    </button>
                                    <button
                                      type="button"
                                      className="approval-btn-reject"
                                      onClick={() => handleUpdateStatus(item, 'Rejected')}
                                      disabled={isItemLoading}
                                      style={{ padding: '5px 10px', fontSize: '0.78rem' }}
                                    >
                                      <UserX size={14} />
                                      <span>Reject</span>
                                    </button>
                                  </div>
                                )}

                                {userStatus === 'Approved' && item.role !== 'Manager' && (
                                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                                    <button
                                      type="button"
                                      className="approval-btn-reject"
                                      onClick={() => handleUpdateStatus(item, 'Rejected')}
                                      disabled={isItemLoading}
                                      style={{ padding: '5px 10px', fontSize: '0.78rem' }}
                                      title="Revoke access"
                                    >
                                      <span>Reject Access</span>
                                    </button>
                                  </div>
                                )}

                                {item.role === 'Manager' && (
                                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>
                                    Manager
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
          </div>
        </div>
      )}
    </div>
  );
};

