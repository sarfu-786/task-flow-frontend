import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useUserManagement } from '../context/UserContext';
import { useTasks } from '../context/TaskContext';
import { UserWorkModal } from './ManagerDashboard/UserWorkModal';
import {
  Users,
  UserPlus,
  Search,
  Edit2,
  Trash2,
  Mail,
  Shield,
  Briefcase,
  Calendar,
  X,
  Save,
  AlertCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  RefreshCw,
  CheckCircle2,
  Clock,
  Eye,
  Upload,
  Camera,
  Crown,
} from 'lucide-react';

export const UserSection = () => {
  const { user: currentUser, updateUserProfile } = useAuth();
  const { tasks } = useTasks();
  const {
    users,
    paginatedUsers,
    totalUsers,
    totalPages,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    loading,
    error,
    search,
    setSearch,
    roleFilter,
    setRoleFilter,
    createUser,
    updateUser,
    deleteUser,
    isUserModalOpen,
    modalMode,
    selectedUser,
    openCreateModal,
    openEditModal,
    closeUserModal,
    isDeleteModalOpen,
    userToDelete,
    openDeleteModal,
    closeDeleteModal,
  } = useUserManagement();

  // User Work Modal State (1-Click Drilldown)
  const [selectedUserForWork, setSelectedUserForWork] = useState(null);
  const [userWorkFilter, setUserWorkFilter] = useState('all');
  const [isWorkModalOpen, setIsWorkModalOpen] = useState(false);

  const openUserWork = (targetUser, filter = 'all') => {
    setSelectedUserForWork(targetUser);
    setUserWorkFilter(filter);
    setIsWorkModalOpen(true);
  };

  const closeUserWork = () => {
    setIsWorkModalOpen(false);
    setSelectedUserForWork(null);
  };

  // Form state for Add/Edit user
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    role: 'User',
    department: 'Operations',
    reportsTo: '',
    reportsToName: '',
    password: '',
    avatar: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalServerError, setModalServerError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const isSuperAdmin = currentUser && currentUser.role === 'Super Admin';
  const isManager = currentUser && ['Manager', 'Executive', 'Administrator'].includes(currentUser.role);

  useEffect(() => {
    if (modalMode === 'edit' && selectedUser) {
      setFormData({
        name: selectedUser.name || '',
        email: selectedUser.email || '',
        username: selectedUser.username || '',
        role: selectedUser.role || 'User',
        department: selectedUser.department || 'Operations',
        reportsTo: selectedUser.reportsTo || '',
        reportsToName: selectedUser.reportsToName || '',
        password: '',
        avatar: selectedUser.avatar || '',
      });
    } else {
      const defaultReportsTo = isSuperAdmin
        ? ''
        : (currentUser?._id ? currentUser._id.toString() : (currentUser?.id || ''));
      const defaultReportsToName = isSuperAdmin
        ? ''
        : (currentUser?.name ? `${currentUser.name} (${currentUser.role || 'User'})` : '');

      setFormData({
        name: '',
        email: '',
        username: '',
        role: 'User',
        department: currentUser?.department || 'Operations',
        reportsTo: defaultReportsTo,
        reportsToName: defaultReportsToName,
        password: '',
        avatar: '',
      });
    }
    setFormErrors({});
    setModalServerError('');
  }, [modalMode, selectedUser, isUserModalOpen, currentUser, isManager, isSuperAdmin]);

  const validateForm = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Full name is required';
    if (!formData.email.trim()) {
      errs.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errs.email = 'Please provide a valid email';
    }
    if (!formData.username.trim()) errs.username = 'Username is required';
    if (modalMode === 'create' && !formData.password.trim()) {
      errs.password = 'Initial password is required';
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setModalServerError('');

    if (!validateForm()) return;

    setIsSubmitting(true);
    let res;
    if (modalMode === 'edit' && selectedUser) {
      res = await updateUser(selectedUser._id, formData);
      if (res.success && res.user && currentUser && (currentUser._id === selectedUser._id || currentUser.id === selectedUser._id)) {
        updateUserProfile(res.user);
      }
    } else {
      res = await createUser(formData);
    }
    setIsSubmitting(false);

    if (!res.success) {
      setModalServerError(res.message || 'Operation failed');
    }
  };

  // Prevent background scrolling when modal is active
  useEffect(() => {
    if (isUserModalOpen || isDeleteModalOpen || isWorkModalOpen) {
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
  }, [isUserModalOpen, isDeleteModalOpen, isWorkModalOpen]);

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    await deleteUser(userToDelete._id);
    setIsDeleting(false);
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'Super Admin':
        return (
          <span
            style={{
              padding: '3px 8px',
              borderRadius: '999px',
              fontSize: '0.72rem',
              fontWeight: 700,
              background: '#fef3c7',
              color: '#b45309',
              border: '1px solid #fde68a',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Crown size={11} color="#d97706" />
            Super Admin
          </span>
        );
      case 'Manager':
      case 'Executive':
      case 'Administrator':
        return (
          <span
            style={{
              padding: '3px 8px',
              borderRadius: '999px',
              fontSize: '0.72rem',
              fontWeight: 600,
              background: '#eff6ff',
              color: '#1d4ed8',
              border: '1px solid #bfdbfe',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Shield size={11} color="#2563eb" />
            {role}
          </span>
        );
      default:
        return (
          <span
            style={{
              padding: '3px 8px',
              borderRadius: '999px',
              fontSize: '0.72rem',
              fontWeight: 600,
              background: '#ecfdf5',
              color: '#047857',
              border: '1px solid #a7f3d0',
            }}
          >
            User
          </span>
        );
    }
  };

  const startEntry = totalUsers > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
  const endEntry = Math.min(currentPage * itemsPerPage, totalUsers);

  let rawManagerOptions = [];
  if (isSuperAdmin) {
    // Super Admin can set the user to report to ANY active user in the organization
    rawManagerOptions = users.filter(
      (u) =>
        u.status !== 'Rejected' &&
        u.status !== 'Pending' &&
        (!selectedUser || ((selectedUser._id || selectedUser.id) !== (u._id || u.id)))
    );
  } else if (isManager) {
    // Manager can assign subordinates to report to the Manager himself OR to any user who is under that manager in their branch
    const currentUserIdStr = currentUser ? (currentUser._id || currentUser.id || '').toString() : '';

    const subordinatesUnderManager = users.filter((u) => {
      if (!u || u.status === 'Rejected' || u.status === 'Pending') return false;
      if (u.role === 'Super Admin') return false; // Exclude senior Super Admin
      const uIdStr = (u._id || u.id || '').toString();
      if (uIdStr === currentUserIdStr) return false;
      if (selectedUser && ((selectedUser._id || selectedUser.id || '').toString() === uIdStr)) return false;
      return true;
    });

    rawManagerOptions = currentUser ? [currentUser, ...subordinatesUnderManager] : subordinatesUnderManager;
  } else {
    // Regular User: newly created users report directly to themselves
    rawManagerOptions = currentUser ? [currentUser] : [];
  }
  const managerOptions = rawManagerOptions;

  return (
    <div className="employee-management-page">
      {/* Top Header */}
      <div
        className="section-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '14px',
          marginBottom: '18px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users className="text-primary" size={24} />
            <h2 className="section-title" style={{ margin: 0, fontSize: '1.4rem' }}>
              User Management
            </h2>
          </div>
        </div>

        <button
          className="btn btn-primary"
          onClick={openCreateModal}
          id="btn-add-new-employee"
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <UserPlus size={16} />
          <span>Add User</span>
        </button>
      </div>

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '16px' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Main Table Container */}
      <div className="task-container-box">
        {/* Search & Role Filter Bar */}
        <div className="task-nav-toolbar">
          <div className="search-wrapper-top">
            <Search className="search-icon-inside" />
            <input
              type="text"
              className="search-input-top"
              placeholder="Search by user name, email, role, or department..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              id="employee-search-input"
            />
          </div>

          <div className="task-filters-row">
            <div className="filters-group-center">
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                Role:
              </label>
              <select
                className="select-filter"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                id="filter-employee-role"
              >
                <option value="all">All Roles</option>
                <option value="Super Admin">Super Admin</option>
                <option value="Manager">Manager</option>
                <option value="User">User</option>
              </select>
            </div>

            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Total: <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{totalUsers}</span>
            </div>
          </div>
        </div>

        {/* User Table */}
        <div className="table-responsive">
          <table className="task-table">
            <thead>
              <tr>
                <th style={{ width: '50px', textAlign: 'center' }}>Sr. No</th>
                <th>User Name & Email</th>
                <th>Role & Department</th>
                <th>Reports To (Manager)</th>
                <th style={{ textAlign: 'center' }}>Completed</th>
                <th style={{ textAlign: 'center' }}>Pending</th>
                <th style={{ width: '140px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--text-muted)' }}>
                      <RefreshCw size={18} className="animate-spin" />
                      <span>Loading users...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                      No users found
                    </p>
                    <p style={{ fontSize: '0.85rem', margin: 0 }}>
                      {search || roleFilter !== 'all'
                        ? 'Try adjusting your search query or filter.'
                        : 'Click "Add User" to create the first record.'}
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((emp, index) => {
                  const serialNumber = (currentPage - 1) * itemsPerPage + index + 1;
                  const empName = (emp.name || '').trim().toLowerCase();
                  const empUsername = (emp.username || '').trim().toLowerCase();
                  const empId = (emp._id || '').toString();

                  const memberTasks = tasks.filter((t) => {
                    if (!t) return false;
                    const taskAssigned = (t.assignedTo || '').trim().toLowerCase();
                    const taskUserId = t.user ? (t.user._id ? t.user._id.toString() : t.user.toString()) : '';
                    return taskAssigned === empName || taskAssigned === empUsername || (taskUserId && taskUserId === empId);
                  });

                  const completedCount = memberTasks.filter((t) => t.status === 'Completed').length;
                  const pendingCount = memberTasks.filter((t) => t.status !== 'Completed').length;
                  const isSuper = emp.role === 'Super Admin';

                  return (
                    <tr key={emp._id}>
                      {/* Sr. No */}
                      <td style={{ textAlign: 'center' }}>
                        <span className="sr-no-badge">{serialNumber}</span>
                      </td>

                      {/* Name & Avatar */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {emp.avatar ? (
                            <img
                              src={emp.avatar}
                              alt={emp.name}
                              style={{
                                width: '34px',
                                height: '34px',
                                borderRadius: '50%',
                                objectFit: 'cover',
                                border: '1px solid var(--border-color)',
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                width: '34px',
                                height: '34px',
                                borderRadius: '50%',
                                background: isSuper ? '#f59e0b' : emp.role === 'Manager' ? '#2563eb' : '#059669',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#ffffff',
                                fontWeight: 700,
                                fontSize: '0.82rem',
                              }}
                            >
                              {emp.name ? emp.name.charAt(0).toUpperCase() : 'U'}
                            </div>
                          )}
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span>{emp.name}</span>
                              {isSuper && <Crown size={12} color="#d97706" />}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {emp.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role & Department */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          {getRoleBadge(emp.role)}
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                            {emp.department || 'Operations'}
                          </span>
                        </div>
                      </td>

                      {/* Reports To (Superior) */}
                      <td>
                        <span
                          style={{
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            color: emp.reportsToName ? '#334155' : '#059669',
                            background: '#f8fafc',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            border: '1px solid #e2e8f0',
                            display: 'inline-block',
                          }}
                        >
                          {emp.reportsToName || (isSuper ? '— (Super Admin Root)' : 'Direct to Super Admin')}
                        </span>
                      </td>

                      {/* Completed Tasks Pill */}
                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="badge-status badge-status-completed"
                          onClick={() => openUserWork(emp, 'Completed')}
                          title={`Click to view ${emp.name}'s completed tasks`}
                          style={{ cursor: 'pointer', padding: '3px 8px', fontSize: '0.75rem' }}
                        >
                          <CheckCircle2 size={12} />
                          <span>{completedCount} Done</span>
                        </button>
                      </td>

                      {/* Pending Tasks Pill */}
                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="badge-status badge-status-progress"
                          onClick={() => openUserWork(emp, 'To Do')}
                          title={`Click to view ${emp.name}'s pending tasks`}
                          style={{ cursor: 'pointer', padding: '3px 8px', fontSize: '0.75rem' }}
                        >
                          <Clock size={12} />
                          <span>{pendingCount} Pending</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: 'right' }}>
                        <div className="task-actions-cell" style={{ justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            className="btn-icon"
                            onClick={() => openUserWork(emp, 'all')}
                            title="Inspect Workload"
                          >
                            <Eye size={14} />
                          </button>

                          <button
                            type="button"
                            className="btn-action-update"
                            onClick={() => openEditModal(emp)}
                            title="Edit User"
                            id={`btn-edit-employee-${emp._id}`}
                          >
                            <Edit2 size={14} />
                          </button>

                          <button
                            type="button"
                            className="btn-action-delete"
                            onClick={() => openDeleteModal(emp)}
                            title="Remove User"
                            id={`btn-delete-employee-${emp._id}`}
                            disabled={currentUser && (currentUser._id === emp._id || currentUser.id === emp._id)}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalUsers > 0 && (
          <div className="pagination-container">
            <div className="pagination-info">
              Showing <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{startEntry}</span> to{' '}
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{endEntry}</span> of{' '}
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{totalUsers}</span> users
            </div>

            <div className="pagination-controls">
              <button
                className="page-btn"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                aria-label="Previous Page"
              >
                <ChevronLeft size={16} />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  className={`page-btn ${page === currentPage ? 'active' : ''}`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}

              <button
                className="page-btn"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                aria-label="Next Page"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 1-Click User Work Modal */}
      <UserWorkModal
        user={selectedUserForWork}
        initialFilter={userWorkFilter}
        isOpen={isWorkModalOpen}
        onClose={closeUserWork}
      />

      {/* Add / Edit User Modal */}
      {isUserModalOpen && (
        <div className="modal-backdrop" onClick={closeUserModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px' }}>
            <div className="modal-header">
              <h3 className="modal-title">
                {modalMode === 'edit' ? 'Edit User Details' : 'Add New User'}
              </h3>
              <button
                type="button"
                className="btn-icon"
                onClick={closeUserModal}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit}>
              <div className="modal-body">
                {modalServerError && (
                  <div className="alert alert-danger" style={{ marginBottom: '14px' }}>
                    <AlertCircle size={16} />
                    <span>{modalServerError}</span>
                  </div>
                )}

                {/* Profile Photo from Device */}
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label className="form-label">Profile Photo (from Device)</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '4px' }}>
                    {formData.avatar ? (
                      <img
                        src={formData.avatar}
                        alt="Preview"
                        style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: '1px solid var(--border-color)',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#ffffff',
                          fontWeight: 700,
                          fontSize: '1.1rem',
                        }}
                      >
                        {formData.name ? formData.name.charAt(0).toUpperCase() : <Camera size={18} />}
                      </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label
                        className="btn btn-secondary"
                        style={{
                          cursor: 'pointer',
                          padding: '5px 12px',
                          fontSize: '0.78rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          width: 'fit-content',
                        }}
                      >
                        <Upload size={13} />
                        <span>Choose Image</span>
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                setFormData((prev) => ({ ...prev, avatar: event.target.result }));
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>

                      {formData.avatar && (
                        <button
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, avatar: '' }))}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#ef4444',
                            fontSize: '0.72rem',
                            cursor: 'pointer',
                            textAlign: 'left',
                            padding: '0',
                          }}
                        >
                          Remove photo
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Full Name */}
                <div className="form-group">
                  <label className="form-label" htmlFor="emp-name">
                    Full Name <span className="required">*</span>
                  </label>
                  <input
                    id="emp-name"
                    type="text"
                    className="form-control"
                    placeholder="Enter user full name"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      if (formErrors.name) setFormErrors({ ...formErrors, name: '' });
                    }}
                  />
                  {formErrors.name && <span className="form-error-msg">{formErrors.name}</span>}
                </div>

                {/* Email & Username */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="emp-email">
                      Email Address <span className="required">*</span>
                    </label>
                    <input
                      id="emp-email"
                      type="email"
                      className="form-control"
                      placeholder="user@example.com"
                      value={formData.email}
                      onChange={(e) => {
                        setFormData({ ...formData, email: e.target.value });
                        if (formErrors.email) setFormErrors({ ...formErrors, email: '' });
                      }}
                    />
                    {formErrors.email && <span className="form-error-msg">{formErrors.email}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="emp-username">
                      Username <span className="required">*</span>
                    </label>
                    <input
                      id="emp-username"
                      type="text"
                      className="form-control"
                      placeholder="username"
                      value={formData.username}
                      onChange={(e) => {
                        setFormData({ ...formData, username: e.target.value });
                        if (formErrors.username) setFormErrors({ ...formErrors, username: '' });
                      }}
                    />
                    {formErrors.username && <span className="form-error-msg">{formErrors.username}</span>}
                  </div>
                </div>

                {/* Role & Department */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="emp-role">
                      Role
                    </label>
                    <select
                      id="emp-role"
                      className="form-control select-filter"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      disabled={!isSuperAdmin && !isManager}
                    >
                      <option value="User">User</option>
                      {isManager && <option value="Manager">Manager</option>}
                      {isSuperAdmin && <option value="Manager">Manager</option>}
                      {isSuperAdmin && <option value="Super Admin">Super Admin</option>}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="emp-dept">
                      Department
                    </label>
                    <select
                      id="emp-dept"
                      className="form-control select-filter"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    >
                      <option value="Internet Work">Internet Work</option>
                      <option value="Documentation">Documentation</option>
                      <option value="Backend Work">Backend Work</option>
                      <option value="Social Media">Social Media</option>
                      <option value="Sells">Sells</option>
                      <option value="Operations">Operations</option>
                    </select>
                  </div>
                </div>

                {/* Reports To (Manager Selection) */}
                <div className="form-group">
                  <label className="form-label" htmlFor="emp-reports-to">
                    Reports To (Manager / Superior)
                  </label>
                  <select
                    id="emp-reports-to"
                    className="form-control select-filter"
                    value={formData.reportsTo || ''}
                    disabled={!isSuperAdmin && !isManager}
                    onChange={(e) => {
                      const selectedVal = e.target.value;
                      if (!selectedVal) {
                        setFormData({ ...formData, reportsTo: '', reportsToName: '' });
                      } else {
                        const targetMgr = [...managerOptions, currentUser].find(
                          (u) =>
                            (u && u._id && u._id.toString() === selectedVal) ||
                            (u && u.id && u.id.toString() === selectedVal) ||
                            (u && u.name === selectedVal)
                        );
                        setFormData({
                          ...formData,
                          reportsTo: targetMgr?._id || targetMgr?.id || selectedVal,
                          reportsToName: targetMgr ? `${targetMgr.name} (${targetMgr.role || 'User'})` : selectedVal,
                        });
                      }
                    }}
                  >
                    {isSuperAdmin && <option value="">Direct to Super Admin (Root)</option>}
                    {managerOptions.map((u) => {
                      const isCurrentSelf = currentUser && ((currentUser._id && (u._id === currentUser._id || u.id === currentUser._id)) || (currentUser.name === u.name));
                      return (
                        <option key={u._id || u.id || u.name} value={u._id || u.id || u.name}>
                          {u.name} ({u.role || 'User'} — {u.department || 'Operations'}){isCurrentSelf ? ' [You]' : ''}
                        </option>
                      );
                    })}
                  </select>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px', display: 'block' }}>
                    {isSuperAdmin
                      ? 'Selecting a manager attaches this user to their branch in the organizational hierarchy.'
                      : isManager
                      ? 'Select yourself or any team member under your branch that this user will report to.'
                      : 'New users created by you will report directly to you in your personal hierarchy branch.'}
                  </span>
                </div>

                {/* Password (Optional for Edit) */}
                <div className="form-group">
                  <label className="form-label" htmlFor="emp-password">
                    Password
                  </label>
                  <input
                    id="emp-password"
                    type="password"
                    className="form-control"
                    placeholder={modalMode === 'edit' ? '••••••••' : 'Enter initial password (min 4 chars)'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                  {formErrors.password && <span className="form-error-msg">{formErrors.password}</span>}
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeUserModal}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span>Saving...</span>
                  ) : modalMode === 'edit' ? (
                    <>
                      <Save size={15} />
                      <span>Update User</span>
                    </>
                  ) : (
                    <>
                      <UserPlus size={15} />
                      <span>Create User</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Remove User Confirmation Modal */}
      {isDeleteModalOpen && userToDelete && (
        <div className="modal-backdrop" onClick={closeDeleteModal}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '420px' }}
          >
            <div className="modal-header" style={{ borderBottomColor: '#fee2e2' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: '#fef2f2',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#dc2626',
                  }}
                >
                  <AlertTriangle size={18} />
                </div>
                <h3 className="modal-title" style={{ color: '#dc2626' }}>
                  Delete User
                </h3>
              </div>
              <button
                type="button"
                className="btn-icon"
                onClick={closeDeleteModal}
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5, margin: 0 }}>
                Are you sure you want to delete user{' '}
                <strong style={{ color: 'var(--text-primary)' }}>{userToDelete.name}</strong>?
              </p>
              <p style={{ fontSize: '0.78rem', color: '#dc2626', marginTop: '8px', marginBottom: 0 }}>
                This record will be permanently removed and reporting branches will update automatically.
              </p>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={closeDeleteModal}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? <span>Deleting...</span> : <span>Delete</span>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
