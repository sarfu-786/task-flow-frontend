import React, { useState, useEffect } from 'react';
import {
  X,
  Users,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  ListTodo,
  Eye,
  Edit2,
  Trash2,
  ShieldCheck,
  Target,
  AlertCircle,
  AlertTriangle,
  Briefcase,
  Save,
  Lock,
  Mail,
  User,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useUserManagement } from '../../context/UserContext';
import { useTasks } from '../../context/TaskContext';

// Helper to get all subordinate user IDs for a given user in the organizational hierarchy
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

export const EmployeeDrilldownModal = ({
  isOpen,
  onClose,
  initialDepartmentFilter = 'all',
  roleFilter = 'all',
  modalTitle = 'User Details & Team Directory',
  onSelectUserForWork,
  onOpenUserWork,
}) => {
  const { user: currentUser, isSuperAdmin, isManager } = useAuth();
  const { users, updateUser, deleteUser } = useUserManagement();
  const { tasks } = useTasks();

  const [departmentFilter, setDepartmentFilter] = useState(initialDepartmentFilter);
  const [employeeSearch, setEmployeeSearch] = useState('');

  // Edit User State
  const [editingUser, setEditingUser] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    username: '',
    role: 'User',
    department: 'Operations',
    reportsTo: '',
    reportsToName: '',
    password: '',
  });
  const [editFormErrors, setEditFormErrors] = useState({});
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Delete User State
  const [deletingUser, setDeletingUser] = useState(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setDepartmentFilter(initialDepartmentFilter);
      setEmployeeSearch('');
      setEditingUser(null);
      setDeletingUser(null);
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
  }, [isOpen, initialDepartmentFilter]);

  const handleStartEdit = (member) => {
    setEditingUser(member);
    setEditFormData({
      name: member.name || '',
      email: member.email || '',
      username: member.username || '',
      role: member.role || (Array.isArray(member.roles) && member.roles[0]) || 'User',
      department: member.department || 'Operations',
      reportsTo: member.reportsTo ? (member.reportsTo._id || member.reportsTo) : '',
      reportsToName: member.reportsToName || '',
      password: '',
    });
    setEditFormErrors({});
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!editFormData.name.trim()) errors.name = 'Name is required';
    if (!editFormData.email.trim()) errors.email = 'Email is required';
    if (!editFormData.username.trim()) errors.username = 'Username is required';
    if (editFormData.password && editFormData.password.length < 4) {
      errors.password = 'Password must be at least 4 characters';
    }
    if (Object.keys(errors).length > 0) {
      setEditFormErrors(errors);
      return;
    }

    setIsSubmittingEdit(true);
    const payload = {
      name: editFormData.name.trim(),
      email: editFormData.email.trim(),
      username: editFormData.username.trim(),
      role: editFormData.role,
      roles: [editFormData.role],
      department: editFormData.department,
      reportsTo: editFormData.reportsTo || null,
      reportsToName: editFormData.reportsToName || '',
    };
    if (editFormData.password) {
      payload.password = editFormData.password;
    }

    await updateUser(editingUser._id, payload);
    setIsSubmittingEdit(false);
    setEditingUser(null);
  };

  const handleStartDelete = (member) => {
    setDeletingUser(member);
  };

  const handleConfirmDelete = async () => {
    if (!deletingUser) return;
    setIsDeletingUser(true);
    await deleteUser(deletingUser._id);
    setIsDeletingUser(false);
    setDeletingUser(null);
  };

  if (!isOpen) return null;

  // Active Approved Users
  const activeUsers = users.filter((u) => u && u.status !== 'Rejected' && u.status !== 'Pending');

  // Role-Based Scoping:
  // 1. Super Admin: sees entire company personnel.
  // 2. Manager: sees only users reporting under this manager (plus manager themselves).
  // 3. User: sees only their own subordinate team members (or themselves if no subordinates).
  let scopedUsers = activeUsers;
  if (!isSuperAdmin && currentUser) {
    const currentUserId = (currentUser._id || currentUser.id || '').toString();
    const currentUserName = (currentUser.name || '').toLowerCase().trim();
    const subIds = getSubordinateUserIds(currentUser, activeUsers);

    scopedUsers = activeUsers.filter((u) => {
      const uId = (u._id || u.id || '').toString();
      const repId = (u.reportsTo ? (u.reportsTo._id ? u.reportsTo._id.toString() : u.reportsTo.toString()) : '').trim();
      const repName = (u.reportsToName || '').toLowerCase().trim();

      const isSelf = uId === currentUserId;
      const isSubordinate = subIds.has(uId);
      const isDirectReport = (currentUserId && repId === currentUserId) || (currentUserName && repName.includes(currentUserName));

      return isSelf || isSubordinate || isDirectReport;
    });
  }

  // Filter based on roleFilter prop
  let baseUsers = scopedUsers;
  if (roleFilter === 'managers') {
    baseUsers = scopedUsers.filter((u) => {
      const roles = Array.isArray(u.roles) && u.roles.length > 0 ? u.roles : [u.role || 'User'];
      return roles.some((r) => ['Manager', 'Executive', 'Administrator', 'Super Admin'].includes(r));
    });
  } else if (roleFilter === 'sales') {
    baseUsers = scopedUsers.filter((u) => {
      const roles = Array.isArray(u.roles) && u.roles.length > 0 ? u.roles : [u.role || 'User'];
      return roles.includes('Sales Coordinator') || u.role === 'Sales Coordinator';
    });
  } else if (roleFilter === 'service') {
    baseUsers = scopedUsers.filter((u) => {
      const roles = Array.isArray(u.roles) && u.roles.length > 0 ? u.roles : [u.role || 'User'];
      return roles.includes('Service Coordinator') || u.role === 'Service Coordinator';
    });
  } else if (roleFilter === 'regular') {
    baseUsers = scopedUsers.filter((u) => {
      const roles = Array.isArray(u.roles) && u.roles.length > 0 ? u.roles : [u.role || 'User'];
      return roles.includes('User') || roles.length === 0 || u.role === 'User';
    });
  }

  // Extract unique departments
  const allDepartments = Array.from(
    new Set(baseUsers.map((u) => u.department || 'Operations').filter(Boolean))
  );

  // Filtered employees list by department and search
  let filtered = [...baseUsers];
  if (departmentFilter !== 'all') {
    filtered = filtered.filter((u) => (u.department || 'Operations') === departmentFilter);
  }
  if (employeeSearch.trim()) {
    const q = employeeSearch.trim().toLowerCase();
    filtered = filtered.filter(
      (u) =>
        (u.name || '').toLowerCase().includes(q) ||
        (u.username || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.department || '').toLowerCase().includes(q)
    );
  }

  const handleOpenWork = (member) => {
    onClose();
    if (onSelectUserForWork) {
      onSelectUserForWork(member);
    } else if (onOpenUserWork) {
      onOpenUserWork(member, 'all');
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '960px', width: '95%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
      >
        {/* Header */}
        <div className="modal-header" style={{ padding: '18px 24px', flexShrink: 0 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h3 className="modal-title" style={{ fontSize: '1.3rem', color: 'var(--text-primary)' }}>
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
                {filtered.length} User{filtered.length === 1 ? '' : 's'}
              </span>
            </div>
          </div>

          <button type="button" className="btn-icon" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ padding: '20px 24px', gap: '16px', flex: '1 1 auto', minHeight: 0, overflowY: 'auto' }}>
          {/* Controls Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
              paddingBottom: '12px',
              borderBottom: '1px solid var(--border-color)',
            }}
          >
            {/* Search input */}
            <div style={{ position: 'relative', flex: 1, minWidth: '220px', maxWidth: '400px' }}>
              <input
                type="text"
                className="form-control"
                placeholder="Search users by name, email, department..."
                value={employeeSearch}
                onChange={(e) => setEmployeeSearch(e.target.value)}
                style={{ padding: '7px 12px', fontSize: '0.85rem' }}
              />
            </div>

            {/* Department Filter Bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Building2 size={15} color="#64748b" />
              <select
                className="select-filter"
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                style={{ padding: '6px 12px', fontSize: '0.825rem' }}
              >
                <option value="all">All Departments ({baseUsers.length})</option>
                {allDepartments.map((dept) => {
                  const count = baseUsers.filter((u) => (u.department || 'Operations') === dept).length;
                  return (
                    <option key={dept} value={dept}>
                      {dept} ({count})
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Employee Table */}
          <div className="table-responsive" style={{ maxHeight: '480px', overflowY: 'auto' }}>
            <table className="task-table">
              <thead>
                <tr>
                  <th style={{ width: '60px', textAlign: 'center' }}>SR NO.</th>
                  <th>USER INFO</th>
                  <th>ASSIGNED ROLES</th>
                  <th>DEPARTMENT</th>
                  <th style={{ textAlign: 'center' }}>WORKLOAD STATUS</th>
                  <th style={{ width: '130px', textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                        No users found
                      </p>
                      <p style={{ fontSize: '0.85rem' }}>
                        No active user team members registered in this category.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((member, idx) => {
                    const memberName = (member.name || '').trim().toLowerCase();
                    const memberUsername = (member.username || '').trim().toLowerCase();
                    const memberId = (member._id || '').toString();

                    const memberTasks = tasks.filter((t) => {
                      if (!t) return false;
                      const taskAssigned = (t.assignedTo || '').trim().toLowerCase();
                      const taskUserId = t.user ? (t.user._id ? t.user._id.toString() : t.user.toString()) : '';

                      return (
                        taskAssigned === memberName ||
                        taskAssigned === memberUsername ||
                        (taskUserId && taskUserId === memberId) ||
                        (memberName === 'aarav sharma' && taskAssigned === 'sarah jenkins')
                      );
                    });
                    const userCompleted = memberTasks.filter((t) => t.status === 'Completed').length;
                    const userInProgress = memberTasks.filter((t) => t.status === 'In Progress').length;
                    const userPending = memberTasks.filter((t) => t.status === 'To Do' || !t.status).length;

                    const mRoles = Array.isArray(member.roles) && member.roles.length > 0 ? member.roles : [member.role || 'User'];

                    return (
                      <tr key={member._id}>
                        <td style={{ textAlign: 'center' }}>
                          <span className="sr-no-badge">{idx + 1}</span>
                        </td>

                        {/* Employee Info */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {member.avatar ? (
                              <img
                                src={member.avatar}
                                alt={member.name}
                                style={{
                                  width: '38px',
                                  height: '38px',
                                  borderRadius: '50%',
                                  objectFit: 'cover',
                                  border: '1.5px solid var(--border-color)',
                                }}
                              />
                            ) : (
                              <div
                                style={{
                                  width: '38px',
                                  height: '38px',
                                  borderRadius: '50%',
                                  background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: '#fff',
                                  fontWeight: 700,
                                  fontSize: '0.9rem',
                                }}
                              >
                                {member.name ? member.name.charAt(0).toUpperCase() : 'U'}
                              </div>
                            )}
                            <div>
                              <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.925rem' }}>
                                {member.name}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                                {member.email}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Roles */}
                        <td>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {mRoles.map((r, ri) => (
                              <span
                                key={ri}
                                className="badge-official"
                                style={{
                                  background: r === 'Super Admin' ? '#fef3c7' : r === 'Manager' ? '#eff6ff' : r === 'Sales Coordinator' ? '#eff6ff' : r === 'Service Coordinator' ? '#fef2f2' : '#f8fafc',
                                  color: r === 'Super Admin' ? '#b45309' : r === 'Manager' ? '#1d4ed8' : r === 'Sales Coordinator' ? '#1d4ed8' : r === 'Service Coordinator' ? '#b91c1c' : '#334155',
                                  borderColor: r === 'Super Admin' ? '#fde68a' : r === 'Manager' ? '#bfdbfe' : r === 'Sales Coordinator' ? '#bfdbfe' : r === 'Service Coordinator' ? '#fecaca' : '#e2e8f0',
                                  fontSize: '0.72rem',
                                }}
                              >
                                {r}
                              </span>
                            ))}
                          </div>
                        </td>

                        {/* Department */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                            <Building2 size={14} color="#64748b" />
                            <span>{member.department || 'Operations'}</span>
                          </div>
                        </td>

                        {/* Workload Status */}
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            <span
                              style={{
                                fontSize: '0.75rem',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                background: '#ecfdf5',
                                color: '#047857',
                                border: '1px solid #a7f3d0',
                                fontWeight: 600,
                              }}
                              title={`${userCompleted} Completed Tasks`}
                            >
                              {userCompleted} Done
                            </span>
                            <span
                              style={{
                                fontSize: '0.75rem',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                background: '#fffbeb',
                                color: '#b45309',
                                border: '1px solid #fde68a',
                                fontWeight: 600,
                              }}
                              title={`${userInProgress} In Progress Tasks`}
                            >
                              {userInProgress} Active
                            </span>
                            <span
                              style={{
                                fontSize: '0.75rem',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                background: '#f1f5f9',
                                color: '#475569',
                                border: '1px solid #cbd5e1',
                                fontWeight: 600,
                              }}
                              title={`${userPending} Pending Tasks`}
                            >
                              {userPending} To Do
                            </span>
                          </div>
                        </td>

                        {/* Action Icons: View, Edit, Delete (Only signs) */}
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                            <button
                              type="button"
                              className="btn-icon"
                              onClick={() => handleOpenWork(member)}
                              title={`View tasks and workload for ${member.name}`}
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              type="button"
                              className="btn-action-update"
                              onClick={() => handleStartEdit(member)}
                              title={`Edit user ${member.name}`}
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              type="button"
                              className="btn-action-delete"
                              onClick={() => handleStartDelete(member)}
                              title={`Delete user ${member.name}`}
                            >
                              <Trash2 size={14} />
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
        </div>

        {/* Edit User Modal Dialog */}
        {editingUser && (
          <div className="modal-backdrop" onClick={() => setEditingUser(null)} style={{ zIndex: 1100 }}>
            <div
              className="modal-content"
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: '520px', width: '90%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
            >
              <div className="modal-header" style={{ flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Edit2 size={18} color="#2563eb" />
                  <h3 className="modal-title">Edit User Details</h3>
                </div>
                <button type="button" className="btn-icon" onClick={() => setEditingUser(null)} aria-label="Close dialog">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', flex: '1 1 auto', minHeight: 0, overflow: 'hidden' }}>
                <div className="modal-body custom-scrollbar" style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '20px 24px', overflowY: 'auto', flex: '1 1 auto', minHeight: 0 }}>
                  <div className="form-group">
                    <label className="form-label">Full Name <span style={{ color: '#ef4444' }}>*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      value={editFormData.name}
                      onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    />
                    {editFormErrors.name && <span className="form-error-msg">{editFormErrors.name}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email Address <span style={{ color: '#ef4444' }}>*</span></label>
                    <input
                      type="email"
                      className="form-control"
                      value={editFormData.email}
                      onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    />
                    {editFormErrors.email && <span className="form-error-msg">{editFormErrors.email}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Username <span style={{ color: '#ef4444' }}>*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      value={editFormData.username}
                      onChange={(e) => setEditFormData({ ...editFormData, username: e.target.value })}
                    />
                    {editFormErrors.username && <span className="form-error-msg">{editFormErrors.username}</span>}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="form-group">
                      <label className="form-label">Role <span style={{ color: '#ef4444' }}>*</span></label>
                      <select
                        className="form-control select-filter"
                        value={editFormData.role}
                        onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                      >
                        <option value="User">User</option>
                        <option value="Manager">Manager</option>
                        <option value="Executive">Executive</option>
                        <option value="Administrator">Administrator</option>
                        <option value="Super Admin">Super Admin</option>
                        <option value="Sales Coordinator">Sales Coordinator</option>
                        <option value="Service Coordinator">Service Coordinator</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Department <span style={{ color: '#ef4444' }}>*</span></label>
                      <select
                        className="form-control select-filter"
                        value={editFormData.department}
                        onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}
                      >
                        <option value="Internet Work">Internet Work</option>
                        <option value="Documentation">Documentation</option>
                        <option value="Backend Work">Backend Work</option>
                        <option value="Social Media">Social Media</option>
                        <option value="Operations">Operations</option>
                        <option value="Sales">Sales</option>
                        <option value="Executive Leadership">Executive Leadership</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Reports To (Manager)</label>
                    <select
                      className="form-control select-filter"
                      value={editFormData.reportsTo || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        const mgr = activeUsers.find((u) => (u._id && u._id.toString() === val) || u.name === val);
                        setEditFormData({
                          ...editFormData,
                          reportsTo: mgr ? mgr._id : val,
                          reportsToName: mgr ? `${mgr.name} (${mgr.role})` : '',
                        });
                      }}
                    >
                      <option value="">Direct to Super Admin (Root)</option>
                      {activeUsers
                        .filter((u) => u._id !== editingUser._id)
                        .map((u) => (
                          <option key={u._id} value={u._id}>
                            {u.name} ({u.role} — {u.department || 'Operations'})
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">New Password (leave blank to keep current)</label>
                    <input
                      type="password"
                      className="form-control"
                      placeholder="••••••••"
                      value={editFormData.password}
                      onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                    />
                    {editFormErrors.password && <span className="form-error-msg">{editFormErrors.password}</span>}
                  </div>
                </div>

                <div className="modal-footer" style={{ flexShrink: 0 }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setEditingUser(null)}
                    disabled={isSubmittingEdit}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={isSubmittingEdit}>
                    {isSubmittingEdit ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete User Confirmation Modal Dialog */}
        {deletingUser && (
          <div className="modal-backdrop" onClick={() => setDeletingUser(null)} style={{ zIndex: 1100 }}>
            <div
              className="modal-content"
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: '420px', width: '90%' }}
            >
              <div className="modal-header" style={{ borderBottomColor: '#fee2e2' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertTriangle size={20} color="#dc2626" />
                  <h3 className="modal-title" style={{ color: '#dc2626' }}>Delete User</h3>
                </div>
                <button type="button" className="btn-icon" onClick={() => setDeletingUser(null)} aria-label="Close dialog">
                  <X size={18} />
                </button>
              </div>

              <div className="modal-body">
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  Are you sure you want to delete user <strong style={{ color: 'var(--text-primary)' }}>{deletingUser.name}</strong> ({deletingUser.email})?
                </p>
                <p style={{ margin: '8px 0 0', fontSize: '0.78rem', color: '#dc2626' }}>
                  This action is permanent and will remove their access and hierarchy links.
                </p>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setDeletingUser(null)}
                  disabled={isDeletingUser}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleConfirmDelete}
                  disabled={isDeletingUser}
                >
                  {isDeletingUser ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeDrilldownModal;
