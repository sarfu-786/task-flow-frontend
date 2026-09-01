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
  ListTodo,
  Eye,
  Upload,
  Camera,
} from 'lucide-react';

export const UserSection = () => {
  const { user: currentUser } = useAuth();
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
    department: 'Engineering',
    password: '',
    avatar: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalServerError, setModalServerError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (modalMode === 'edit' && selectedUser) {
      setFormData({
        name: selectedUser.name || '',
        email: selectedUser.email || '',
        username: selectedUser.username || '',
        role: selectedUser.role || 'User',
        department: selectedUser.department || 'Operations',
        password: '',
        avatar: selectedUser.avatar || '',
      });
    } else {
      setFormData({
        name: '',
        email: '',
        username: '',
        role: 'User',
        department: 'Operations',
        password: '',
        avatar: '',
      });
    }
    setFormErrors({});
    setModalServerError('');
  }, [modalMode, selectedUser, isUserModalOpen]);

  const validateForm = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Full name is required';
    if (!formData.email.trim()) {
      errs.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errs.email = 'Please provide a valid email';
    }
    if (!formData.username.trim()) errs.username = 'Username is required';
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
      case 'Manager':
        return (
          <span
            style={{
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.75rem',
              fontWeight: 600,
              background: '#eff6ff',
              color: '#1d4ed8',
              border: '1px solid #bfdbfe',
            }}
          >
            Manager
          </span>
        );
      case 'Executive':
      case 'Administrator':
        return (
          <span
            style={{
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.75rem',
              fontWeight: 600,
              background: '#f5f3ff',
              color: '#6d28d9',
              border: '1px solid #ddd6fe',
            }}
          >
            {role}
          </span>
        );
      default:
        return (
          <span
            style={{
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.75rem',
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

  const startEntry = (currentPage - 1) * itemsPerPage + 1;
  const endEntry = Math.min(currentPage * itemsPerPage, totalUsers);

  return (
    <div>
      {/* Top Section Header with Add User Button */}
      <div
        className="section-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <h2 className="section-title">User Management</h2>
          <p className="section-subtitle">
            Manage organization members, account details, and inspect completed & pending workloads
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={openCreateModal}
          id="btn-add-new-user"
        >
          <UserPlus size={18} />
          <span>Add New User</span>
        </button>
      </div>

      {error && (
        <div className="alert alert-danger">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Logged in User Summary Card */}
      {currentUser && (
        <div className="user-profile-card" style={{ marginBottom: '24px' }}>
          {currentUser.avatar ? (
            <img src={currentUser.avatar} alt={currentUser.name} className="user-avatar-large" />
          ) : (
            <div
              className="user-avatar-large"
              style={{
                background: '#3b82f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
              }}
            >
              <UserCheck size={48} />
            </div>
          )}

          <div className="user-details-main">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <h3 className="user-name-large">{currentUser.name}</h3>
              {getRoleBadge(currentUser.role)}
            </div>

            <div className="user-info-grid">
              <div className="info-item">
                <span className="info-item-label">Username</span>
                <span className="info-item-value">@{currentUser.username}</span>
              </div>
              <div className="info-item">
                <span className="info-item-label">Email Address</span>
                <span className="info-item-value">{currentUser.email}</span>
              </div>
              <div className="info-item">
                <span className="info-item-label">Department</span>
                <span className="info-item-value">{currentUser.department || 'Operations'}</span>
              </div>
              <div className="info-item">
                <span className="info-item-label">Total Users in System</span>
                <span className="info-item-value" style={{ color: '#38bdf8' }}>
                  {totalUsers} Members
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Users Table Container */}
      <div className="task-container-box">
        {/* Search & Filter Toolbar */}
        <div className="task-nav-toolbar">
          <div className="search-wrapper-top">
            <Search className="search-icon-inside" />
            <input
              type="text"
              className="search-input-top"
              placeholder="Search users by name, username, email, or department..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              id="user-search-input"
            />
          </div>

          <div className="task-filters-row">
            <div className="filters-group-center">
              <label style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>
                Filter by Role:
              </label>
              <select
                className="select-filter"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                id="filter-user-role"
              >
                <option value="all">All Roles</option>
                <option value="Manager">Manager</option>
                <option value="Executive">Executive</option>
                <option value="Administrator">Administrator</option>
                <option value="User">User</option>
              </select>
            </div>

            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Total Records: <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{totalUsers}</span>
            </div>
          </div>
        </div>

        {/* User Records Table with 1-Click Completed & Pending Work */}
        <div className="table-responsive">
          <table className="task-table">
            <thead>
              <tr>
                <th style={{ width: '50px', textAlign: 'center' }}>Sr No.</th>
                <th>Member Name</th>
                <th>Department & Role</th>
                <th style={{ textAlign: 'center' }}>Completed Work</th>
                <th style={{ textAlign: 'center' }}>Pending Work</th>
                <th style={{ width: '130px' }}>Joined Date</th>
                <th style={{ width: '150px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '48px' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                        color: 'var(--text-muted)',
                      }}
                    >
                      <RefreshCw size={20} className="animate-spin" />
                      <span>Loading user records...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                    <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                      No user records found
                    </p>
                    <p style={{ fontSize: '0.85rem' }}>
                      {search || roleFilter !== 'all'
                        ? 'Try adjusting your search query or role filter.'
                        : 'Click "Add New User" to register a team member.'}
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((userItem, index) => {
                  const serialNumber = (currentPage - 1) * itemsPerPage + index + 1;
                  const dateStr = userItem.createdAt
                    ? new Date(userItem.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : '—';

                  const userName = (userItem.name || '').trim().toLowerCase();
                  const userUsername = (userItem.username || '').trim().toLowerCase();
                  const userId = (userItem._id || '').toString();

                  const memberTasks = tasks.filter((t) => {
                    if (!t) return false;
                    const taskAssigned = (t.assignedTo || '').trim().toLowerCase();
                    const taskUserId = t.user ? (t.user._id ? t.user._id.toString() : t.user.toString()) : '';

                    return (
                      taskAssigned === userName ||
                      taskAssigned === userUsername ||
                      (taskUserId && taskUserId === userId) ||
                      (userName === 'aarav sharma' && taskAssigned === 'sarah jenkins')
                    );
                  });
                  const userCompleted = memberTasks.filter((t) => t.status === 'Completed').length;
                  const userPending = memberTasks.filter((t) => t.status !== 'Completed').length;

                  return (
                    <tr key={userItem._id}>
                      {/* Sr. No */}
                      <td style={{ textAlign: 'center' }}>
                        <span className="sr-no-badge">{serialNumber}</span>
                      </td>

                      {/* Name & Avatar */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {userItem.avatar ? (
                            <img
                              src={userItem.avatar}
                              alt={userItem.name}
                              style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '50%',
                                objectFit: 'cover',
                                border: '1px solid var(--border-color)',
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '50%',
                                background: '#3b82f6',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#fff',
                                fontWeight: 700,
                                fontSize: '0.85rem',
                              }}
                            >
                              {userItem.name.charAt(0)}
                            </div>
                          )}
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                              {userItem.name}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {userItem.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Department & Role */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                            {userItem.department || 'Operations'}
                          </span>
                          {getRoleBadge(userItem.role)}
                        </div>
                      </td>

                      {/* Completed Work (1-Click Openable) */}
                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="badge-status badge-status-completed"
                          onClick={() => openUserWork(userItem, 'Completed')}
                          title={`Click to open ${userItem.name}'s completed tasks`}
                          style={{ cursor: 'pointer', padding: '5px 10px' }}
                        >
                          <CheckCircle2 size={12} />
                          <span>{userCompleted} Done</span>
                        </button>
                      </td>

                      {/* Pending Work (1-Click Openable) */}
                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="badge-status badge-status-progress"
                          onClick={() => openUserWork(userItem, 'To Do')}
                          title={`Click to open ${userItem.name}'s pending tasks`}
                          style={{ cursor: 'pointer', padding: '5px 10px' }}
                        >
                          <Clock size={12} />
                          <span>{userPending} Pending</span>
                        </button>
                      </td>

                      {/* Joined Date */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', fontSize: '0.85rem' }}>
                          <Calendar size={13} />
                          <span>{dateStr}</span>
                        </div>
                      </td>

                      {/* Actions (Inspect, Edit & Remove) */}
                      <td style={{ textAlign: 'right' }}>
                        <div className="task-actions-cell" style={{ justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            className="btn-icon"
                            onClick={() => openUserWork(userItem, 'all')}
                            title="Inspect User Workload"
                          >
                            <Eye size={14} />
                          </button>

                          <button
                            type="button"
                            className="btn-action-update"
                            onClick={() => openEditModal(userItem)}
                            title="Edit / Update User"
                            id={`btn-edit-user-${userItem._id}`}
                          >
                            <Edit2 size={13} />
                            <span>Edit</span>
                          </button>

                          <button
                            type="button"
                            className="btn-action-delete"
                            onClick={() => openDeleteModal(userItem)}
                            title="Remove User"
                            id={`btn-delete-user-${userItem._id}`}
                            disabled={currentUser && currentUser.id === userItem._id}
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

        {/* User Pagination */}
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
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {modalMode === 'edit' ? 'Update User Details' : 'Add New User'}
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
                  <div className="alert alert-danger">
                    <AlertCircle size={18} />
                    <span>{modalServerError}</span>
                  </div>
                )}

                {/* Profile Photo Upload from Device */}
                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label className="form-label">Profile Photo (from Device)</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '6px' }}>
                    {formData.avatar ? (
                      <img
                        src={formData.avatar}
                        alt="Profile Preview"
                        style={{
                          width: '56px',
                          height: '56px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: '2px solid var(--border-color)',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '56px',
                          height: '56px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#ffffff',
                          fontWeight: 700,
                          fontSize: '1.2rem',
                          border: '2px solid var(--border-color)',
                        }}
                      >
                        {formData.name ? formData.name.charAt(0).toUpperCase() : <Camera size={22} />}
                      </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label
                        className="btn btn-secondary"
                        style={{
                          cursor: 'pointer',
                          padding: '6px 14px',
                          fontSize: '0.8rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          width: 'fit-content',
                        }}
                      >
                        <Upload size={14} />
                        <span>Choose Image from Device</span>
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                const img = new Image();
                                img.onload = () => {
                                  const canvas = document.createElement('canvas');
                                  const MAX_DIM = 280;
                                  let width = img.width;
                                  let height = img.height;
                                  if (width > height) {
                                    if (width > MAX_DIM) {
                                      height = Math.round((height * MAX_DIM) / width);
                                      width = MAX_DIM;
                                    }
                                  } else {
                                    if (height > MAX_DIM) {
                                      width = Math.round((width * MAX_DIM) / height);
                                      height = MAX_DIM;
                                    }
                                  }
                                  canvas.width = width;
                                  canvas.height = height;
                                  const ctx = canvas.getContext('2d');
                                  ctx.drawImage(img, 0, 0, width, height);
                                  const compressedBase64 = canvas.toDataURL('image/jpeg', 0.85);
                                  setFormData((prev) => ({ ...prev, avatar: compressedBase64 }));
                                };
                                img.src = event.target.result;
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
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            textAlign: 'left',
                            padding: '0',
                            fontWeight: 500,
                          }}
                        >
                          Remove Image
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Full Name */}
                <div className="form-group">
                  <label className="form-label" htmlFor="user-fullname">
                    Full Name <span className="required">*</span>
                  </label>
                  <input
                    id="user-fullname"
                    type="text"
                    className="form-control"
                    placeholder="e.g. Aarav Sharma"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      if (formErrors.name) setFormErrors({ ...formErrors, name: '' });
                    }}
                  />
                  {formErrors.name && <span className="form-error-msg">{formErrors.name}</span>}
                </div>

                {/* Email Address */}
                <div className="form-group">
                  <label className="form-label" htmlFor="user-email">
                    Email Address <span className="required">*</span>
                  </label>
                  <input
                    id="user-email"
                    type="email"
                    className="form-control"
                    placeholder="e.g. aarav.sharma@taskflow.com"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value });
                      if (formErrors.email) setFormErrors({ ...formErrors, email: '' });
                    }}
                  />
                  {formErrors.email && <span className="form-error-msg">{formErrors.email}</span>}
                </div>

                {/* Username */}
                <div className="form-group">
                  <label className="form-label" htmlFor="user-username">
                    Username <span className="required">*</span>
                  </label>
                  <input
                    id="user-username"
                    type="text"
                    className="form-control"
                    placeholder="e.g. aarav"
                    value={formData.username}
                    onChange={(e) => {
                      setFormData({ ...formData, username: e.target.value });
                      if (formErrors.username) setFormErrors({ ...formErrors, username: '' });
                    }}
                  />
                  {formErrors.username && (
                    <span className="form-error-msg">{formErrors.username}</span>
                  )}
                </div>

                {/* Role */}
                <div className="form-group">
                  <label className="form-label" htmlFor="user-role">
                    Role
                  </label>
                  <select
                    id="user-role"
                    className="form-control select-filter"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  >
                    <option value="User">User</option>
                    <option value="Executive">Executive</option>
                    <option value="Manager">Manager</option>
                    <option value="Administrator">Administrator</option>
                  </select>
                </div>

                {/* Department */}
                <div className="form-group">
                  <label className="form-label" htmlFor="user-dept">
                    Department
                  </label>
                  <input
                    id="user-dept"
                    type="text"
                    className="form-control"
                    placeholder="e.g. Project Operations, Backend Engineering"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  />
                </div>

                {/* Password (Optional for Edit) */}
                <div className="form-group">
                  <label className="form-label" htmlFor="user-password">
                    Password {modalMode === 'edit' ? '(Leave blank to keep current)' : ''}
                  </label>
                  <input
                    id="user-password"
                    type="password"
                    className="form-control"
                    placeholder={modalMode === 'edit' ? '••••••••' : 'Enter password (min 4 chars)'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
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
                      <Save size={16} />
                      <span>Update User</span>
                    </>
                  ) : (
                    <>
                      <UserPlus size={16} />
                      <span>Create User</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Remove User Confirmation Dialog */}
      {isDeleteModalOpen && userToDelete && (
        <div className="modal-backdrop" onClick={closeDeleteModal}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '440px' }}
          >
            <div className="modal-header" style={{ borderBottomColor: 'rgba(239, 68, 68, 0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
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
                  Remove User
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
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', lineHeight: 1.6 }}>
                Are you sure you want to remove user{' '}
                <strong style={{ color: 'var(--text-primary)' }}>{userToDelete.name}</strong> (@{userToDelete.username})?
              </p>
              <div
                style={{
                  padding: '12px 16px',
                  background: '#f8fafc',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  fontSize: '0.85rem',
                  color: 'var(--text-muted)',
                }}
              >
                <div>Email: {userToDelete.email}</div>
                <div>Role: {userToDelete.role}</div>
                <div>Department: {userToDelete.department}</div>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#dc2626', marginTop: '12px' }}>
                This user account will be permanently removed from the system.
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
                {isDeleting ? (
                  <span>Removing...</span>
                ) : (
                  <>
                    <Trash2 size={16} />
                    <span>Remove User</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
