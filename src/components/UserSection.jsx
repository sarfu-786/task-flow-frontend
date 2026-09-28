import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useUserManagement } from '../context/UserContext';
import { useTasks } from '../context/TaskContext';
import { MetricCard } from './ManagerDashboard/MetricCard';
import { UserWorkModal } from './ManagerDashboard/UserWorkModal';
import { EmployeeDrilldownModal } from './ManagerDashboard/EmployeeDrilldownModal';
import { ManagerTasksDrilldownModal } from './ManagerDashboard/ManagerTasksDrilldownModal';
import { SuperiorDetailModal } from './ManagerDashboard/SuperiorDetailModal';
import { UserDetailModal } from './UserManagement/UserDetailModal';
import { RoleDeptModal } from './UserManagement/RoleDeptModal';
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
  ListTodo,
  Layers,
  Sparkles,
} from 'lucide-react';

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

export const UserSection = () => {
  const { user: currentUser, isSuperAdmin, isManager, updateUserProfile } = useAuth();
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

  // 1. User Work Modal State (1-Click Drilldown)
  const [selectedUserForWork, setSelectedUserForWork] = useState(null);
  const [userWorkFilter, setUserWorkFilter] = useState('all');
  const [isWorkModalOpen, setIsWorkModalOpen] = useState(false);

  // 2. User Detail Modal State (Popup Reference on clicking user row/name)
  const [selectedUserForDetail, setSelectedUserForDetail] = useState(null);
  const [isUserDetailModalOpen, setIsUserDetailModalOpen] = useState(false);

  // 3. Superior / Manager Detail Modal State (Popup Reference on clicking manager field)
  const [selectedSuperiorName, setSelectedSuperiorName] = useState('');
  const [isSuperiorModalOpen, setIsSuperiorModalOpen] = useState(false);

  // 4. Role & Department Detail Modal State (Popup Reference on clicking role/dept field)
  const [selectedRoleForModal, setSelectedRoleForModal] = useState('User');
  const [selectedDeptForModal, setSelectedDeptForModal] = useState('Operations');
  const [isRoleDeptModalOpen, setIsRoleDeptModalOpen] = useState(false);

  // 5. Employee Directory Drilldown Modal State (Popup Reference on clicking Total Users top card)
  const [isEmployeeDirectoryOpen, setIsEmployeeDirectoryOpen] = useState(false);
  const [employeeDirectoryRoleFilter, setEmployeeDirectoryRoleFilter] = useState('all');
  const [employeeDirectoryTitle, setEmployeeDirectoryTitle] = useState('All Organization Personnel Directory');

  // 6. Organization Tasks Overview Modal State (Popup Reference on clicking Total Assigned Work / Completed / Pending top cards)
  const [isTasksOverviewOpen, setIsTasksOverviewOpen] = useState(false);
  const [tasksOverviewFilter, setTasksOverviewFilter] = useState('all');
  const [tasksOverviewTitle, setTasksOverviewTitle] = useState('All Assigned Organization Tasks');

  // Handlers for Drilldown Popups
  const openUserWork = (targetUser, filter = 'all') => {
    setSelectedUserForWork(targetUser);
    setUserWorkFilter(filter);
    setIsWorkModalOpen(true);
  };

  const closeUserWork = () => {
    setIsWorkModalOpen(false);
    setSelectedUserForWork(null);
  };

  const openUserDetail = (targetUser) => {
    setSelectedUserForDetail(targetUser);
    setIsUserDetailModalOpen(true);
  };

  const closeUserDetail = () => {
    setIsUserDetailModalOpen(false);
    setSelectedUserForDetail(null);
  };

  const openSuperiorDetail = (mgrName) => {
    setSelectedSuperiorName(mgrName || 'Super Admin');
    setIsSuperiorModalOpen(true);
  };

  const closeSuperiorDetail = () => {
    setIsSuperiorModalOpen(false);
    setSelectedSuperiorName('');
  };

  const openRoleDeptDetail = (role, dept) => {
    setSelectedRoleForModal(role || 'User');
    setSelectedDeptForModal(dept || 'Operations');
    setIsRoleDeptModalOpen(true);
  };

  const closeRoleDeptDetail = () => {
    setIsRoleDeptModalOpen(false);
  };

  const openEmployeeDirectory = (roleFilterParam = 'all', title = 'All Organization Personnel Directory') => {
    setEmployeeDirectoryRoleFilter(roleFilterParam);
    setEmployeeDirectoryTitle(title);
    setIsEmployeeDirectoryOpen(true);
  };

  const closeEmployeeDirectory = () => {
    setIsEmployeeDirectoryOpen(false);
  };

  const openTasksOverview = (filter = 'all', title = 'All Assigned Organization Tasks') => {
    setTasksOverviewFilter(filter);
    setTasksOverviewTitle(title);
    setIsTasksOverviewOpen(true);
  };

  const closeTasksOverview = () => {
    setIsTasksOverviewOpen(false);
  };

  // Form state for Add/Edit employee
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
      setFormData({
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

  // Prevent background scrolling when any modal is active
  useEffect(() => {
    if (
      isUserModalOpen ||
      isDeleteModalOpen ||
      isWorkModalOpen ||
      isUserDetailModalOpen ||
      isSuperiorModalOpen ||
      isRoleDeptModalOpen ||
      isEmployeeDirectoryOpen ||
      isTasksOverviewOpen
    ) {
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
  }, [
    isUserModalOpen,
    isDeleteModalOpen,
    isWorkModalOpen,
    isUserDetailModalOpen,
    isSuperiorModalOpen,
    isRoleDeptModalOpen,
    isEmployeeDirectoryOpen,
    isTasksOverviewOpen,
  ]);

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
              cursor: 'pointer',
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
              cursor: 'pointer',
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
              cursor: 'pointer',
            }}
          >
            User
          </span>
        );
    }
  };

  const startEntry = totalUsers > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
  const endEntry = Math.min(currentPage * itemsPerPage, totalUsers);

  // Available managers/seniors to report to
  const managerOptions = users.filter(
    (u) =>
      u.status !== 'Rejected' &&
      u.status !== 'Pending' &&
      (u.role === 'Super Admin' || u.role === 'Manager' || u.role === 'Executive' || u.role === 'Administrator') &&
      (!selectedUser || (selectedUser._id !== u._id && selectedUser.id !== u._id))
  );

  // Active Approved Users
  const activeUsers = (users || []).filter((u) => u && u.status !== 'Rejected' && u.status !== 'Pending');

  // Role-Based Scoping
  const currentUserId = (currentUser?._id || currentUser?.id || '').toString();
  const currentUserName = (currentUser?.name || '').toLowerCase().trim();
  const currentUserUsername = (currentUser?.username || '').toLowerCase().trim();
  const subordinateIds = getSubordinateUserIds(currentUser, activeUsers);

  let scopedUsers = activeUsers;
  if (!isSuperAdmin && currentUser) {
    scopedUsers = activeUsers.filter((u) => {
      const uId = (u._id || u.id || '').toString();
      const repId = (u.reportsTo ? (u.reportsTo._id ? u.reportsTo._id.toString() : u.reportsTo.toString()) : '').trim();
      const repName = (u.reportsToName || '').toLowerCase().trim();
      return uId === currentUserId || subordinateIds.has(uId) || repId === currentUserId || (currentUserName && repName.includes(currentUserName));
    });
  }

  const scopedNames = new Set(scopedUsers.map((u) => (u.name || '').toLowerCase().trim()));
  const scopedUsernames = new Set(scopedUsers.map((u) => (u.username || '').toLowerCase().trim()));
  if (currentUserName) scopedNames.add(currentUserName);
  if (currentUserUsername) scopedUsernames.add(currentUserUsername);

  // Calculated overall task metrics for summary metric cards
  const safeTasks = Array.isArray(tasks) ? tasks : [];
  let scopedTasks = safeTasks;
  if (!isSuperAdmin && currentUser) {
    scopedTasks = safeTasks.filter((t) => {
      if (!t) return false;
      const assigned = (t.assignedTo || '').toLowerCase().trim();
      const taskUserId = t.user ? (t.user._id ? t.user._id.toString() : t.user.toString()) : '';
      const assignedBy = (t.assignedBy || '').toLowerCase().trim();

      const isSelf = assigned === currentUserName || assigned === currentUserUsername || taskUserId === currentUserId || assigned === 'current user';
      const isSub = scopedNames.has(assigned) || scopedUsernames.has(assigned) || subordinateIds.has(taskUserId);
      const isBySelf = currentUserName && assignedBy.includes(currentUserName);

      return isSelf || isSub || isBySelf;
    });
  }

  const totalTasksCount = scopedTasks.length;
  const totalCompletedTasksCount = scopedTasks.filter((t) => t.status === 'Completed').length;
  const totalInProgressTasksCount = scopedTasks.filter((t) => t.status === 'In Progress').length;
  const totalPendingTasksCount = scopedTasks.filter((t) => t.status === 'To Do' || !t.status).length;

  const personnelCardTitle = isSuperAdmin ? 'Total Personnel' : isManager ? 'Reporting Team' : 'My Team Personnel';
  const personnelCardSubtitle = isSuperAdmin ? 'Registered & Active Roster' : isManager ? 'Direct & Reporting Subordinates' : 'My Reporting Team';
  const personnelDirectoryTitle = isSuperAdmin ? 'All Organization Personnel Directory' : isManager ? 'My Reporting Team Directory' : 'My Team Directory';

  return (
    <div className="user-management-page">
      {/* Top Header - Curvy Card Container */}
      <div className="user-curvy-header-card" style={{ marginBottom: '16px' }}>
        <div className="user-curvy-title-box">
          <div className="user-curvy-icon">
            <Users size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h2 className="section-title" style={{ margin: 0, fontSize: '1.35rem', fontWeight: 700 }}>
                {isSuperAdmin ? 'User Management' : isManager ? 'Team Management' : 'My Team Directory'}
              </h2>
              <span className="user-count-pill">
                {scopedUsers.length} {scopedUsers.length === 1 ? 'User' : 'Users'}
              </span>
            </div>
            <p className="section-subtitle" style={{ margin: '3px 0 0 0', fontSize: '0.85rem' }}>
              {isSuperAdmin
                ? 'View, add, edit, and assign reporting structures for all users across the organization'
                : isManager
                ? 'Manage and monitor your reporting team members and workload structures'
                : 'View your team and subordinate personnel details'}
            </p>
          </div>
        </div>

        <button
          type="button"
          className="btn btn-primary btn-curvy-action"
          onClick={openCreateModal}
          id="btn-add-new-user"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'linear-gradient(135deg, #1d68f7, #1d4ed8)',
            backgroundColor: '#1d68f7',
            color: '#ffffff',
            borderRadius: '999px',
            padding: '8px 20px',
            fontSize: '0.86rem',
            fontWeight: 700,
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(29, 104, 247, 0.35)',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1.5px)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(29, 104, 247, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 14px rgba(29, 104, 247, 0.35)';
          }}
        >
          <UserPlus size={16} />
          <span>Add User</span>
        </button>
      </div>

      {/* 4 Interactive Curved Metric Cards - Click any card for instant Pop-Up Reference */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: '16px',
          marginBottom: '20px',
        }}
      >
        {/* Card 1: Personnel */}
        <MetricCard
          title={personnelCardTitle}
          value={scopedUsers.length}
          subtitle={personnelCardSubtitle}
          icon={Users}
          color="#0f172a"
          bgLight="#f8fafc"
          isClickable={true}
          onClick={() => openEmployeeDirectory('all', personnelDirectoryTitle)}
        />

        {/* Card 2: Total Assigned Work */}
        <MetricCard
          title="Total Assigned Work"
          value={totalTasksCount}
          subtitle={isSuperAdmin ? 'All active organizational workflows' : 'Assigned workflows'}
          icon={Briefcase}
          color="#2563eb"
          bgLight="#eff6ff"
          isClickable={true}
          onClick={() => openTasksOverview('all', isSuperAdmin ? 'Total Assigned Organization Work' : 'Assigned Work')}
        />

        {/* Card 3: Completed Tasks */}
        <MetricCard
          title="Completed Work"
          value={totalCompletedTasksCount}
          subtitle="Successfully finalized deliverables"
          icon={CheckCircle2}
          color="#059669"
          bgLight="#ecfdf5"
          isClickable={true}
          onClick={() => openTasksOverview('Completed', 'Completed Tasks')}
        />

        {/* Card 4: Pending & In Progress */}
        <MetricCard
          title="Pending / In Progress"
          value={totalPendingTasksCount + totalInProgressTasksCount}
          subtitle="Active execution & to-do tasks"
          icon={Clock}
          color="#d97706"
          bgLight="#fffbeb"
          isClickable={true}
          onClick={() => openTasksOverview('To Do', 'Pending & In Progress Tasks')}
        />
      </div>

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '16px', borderRadius: '14px' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}



      {/* Pop-Up Reference 1: 1-Click User Work Modal */}
      <UserWorkModal
        user={selectedUserForWork}
        initialFilter={userWorkFilter}
        isOpen={isWorkModalOpen}
        onClose={closeUserWork}
      />

      {/* Pop-Up Reference 2: Dedicated User Detail Profile Reference Modal */}
      <UserDetailModal
        user={selectedUserForDetail}
        isOpen={isUserDetailModalOpen}
        onClose={closeUserDetail}
        onOpenWork={(targetUser, filter) => openUserWork(targetUser, filter)}
        onOpenEdit={(targetUser) => openEditModal(targetUser)}
        onViewManager={(mgrName) => openSuperiorDetail(mgrName)}
      />

      {/* Pop-Up Reference 3: Superior / Manager Profile Reference Modal */}
      <SuperiorDetailModal
        isOpen={isSuperiorModalOpen}
        onClose={closeSuperiorDetail}
        superiorName={selectedSuperiorName}
        currentUser={currentUser}
        onOpenWork={(targetUser, filter) => openUserWork(targetUser, filter)}
      />

      {/* Pop-Up Reference 4: Role & Department Breakdown Reference Modal */}
      <RoleDeptModal
        role={selectedRoleForModal}
        department={selectedDeptForModal}
        isOpen={isRoleDeptModalOpen}
        onClose={closeRoleDeptDetail}
        onFilterRole={(r) => setRoleFilter(r)}
      />

      {/* Pop-Up Reference 5: Full Organization Personnel Directory Modal */}
      <EmployeeDrilldownModal
        isOpen={isEmployeeDirectoryOpen}
        onClose={closeEmployeeDirectory}
        roleFilter={employeeDirectoryRoleFilter}
        modalTitle={employeeDirectoryTitle}
        onOpenUserWork={(targetUser, filter) => openUserWork(targetUser, filter)}
      />

      {/* Pop-Up Reference 6: Organization Tasks Overview Modal (for Top Cards) */}
      <ManagerTasksDrilldownModal
        isOpen={isTasksOverviewOpen}
        onClose={closeTasksOverview}
        initialFilter={tasksOverviewFilter}
        modalTitle={tasksOverviewTitle}
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
                          color: '#fff',
                          fontWeight: 700,
                        }}
                      >
                        {formData.name ? formData.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                    )}
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        id="user-avatar-upload"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            if (file.size > 2 * 1024 * 1024) {
                              setModalServerError('Image size must be under 2MB');
                              return;
                            }
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setFormData((prev) => ({ ...prev, avatar: reader.result }));
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <label
                          htmlFor="user-avatar-upload"
                          className="btn btn-secondary"
                          style={{
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 12px',
                            fontSize: '0.8rem',
                          }}
                        >
                          <Camera size={14} />
                          <span>Choose Photo</span>
                        </label>
                        {formData.avatar && (
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => setFormData((prev) => ({ ...prev, avatar: '' }))}
                            style={{ padding: '6px 12px', fontSize: '0.8rem', color: '#dc2626' }}
                          >
                            Remove
                          </button>
                        )}
                      </div>
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
                    placeholder="e.g. Sarah Jenkins"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                  {formErrors.name && <span className="form-error-msg">{formErrors.name}</span>}
                </div>

                {/* Email Address */}
                <div className="form-group">
                  <label className="form-label" htmlFor="emp-email">
                    Email Address <span className="required">*</span>
                  </label>
                  <input
                    id="emp-email"
                    type="email"
                    className="form-control"
                    placeholder="e.g. sarah.j@company.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                  {formErrors.email && <span className="form-error-msg">{formErrors.email}</span>}
                </div>

                {/* Username */}
                <div className="form-group">
                  <label className="form-label" htmlFor="emp-username">
                    Username <span className="required">*</span>
                  </label>
                  <input
                    id="emp-username"
                    type="text"
                    className="form-control"
                    placeholder="e.g. sarah_j"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  />
                  {formErrors.username && <span className="form-error-msg">{formErrors.username}</span>}
                </div>

                {/* Role & Department Row */}
                <div className="form-row-2">
                  <div className="form-group">
                    <label className="form-label" htmlFor="emp-role">
                      Organization Role <span className="required">*</span>
                    </label>
                    <select
                      id="emp-role"
                      className="form-control select-filter"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    >
                      <option value="User">User / Regular Employee</option>
                      <option value="Manager">Manager</option>
                      <option value="Executive">Executive</option>
                      <option value="Administrator">Administrator</option>
                      <option value="Super Admin">Super Admin</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="emp-dept">
                      Department <span className="required">*</span>
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
                    onChange={(e) => {
                      const selectedVal = e.target.value;
                      if (!selectedVal) {
                        setFormData({ ...formData, reportsTo: '', reportsToName: '' });
                      } else {
                        const targetMgr = users.find((u) => (u._id && u._id.toString() === selectedVal) || u.name === selectedVal);
                        setFormData({
                          ...formData,
                          reportsTo: targetMgr?._id || selectedVal,
                          reportsToName: targetMgr ? `${targetMgr.name} (${targetMgr.role})` : selectedVal,
                        });
                      }
                    }}
                  >
                    <option value="">Direct to Super Admin (Root)</option>
                    {managerOptions.map((u) => (
                      <option key={u._id} value={u._id}>
                        {u.name} ({u.role} — {u.department || 'Operations'})
                      </option>
                    ))}
                  </select>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px', display: 'block' }}>
                    Selecting a manager attaches this user to their branch in the organizational hierarchy.
                  </span>
                </div>

                {/* Password (Optional for Edit) */}
                <div className="form-group">
                  <label className="form-label" htmlFor="emp-password">
                    Password {modalMode === 'edit' ? '(Leave blank to keep unchanged)' : <span className="required">*</span>}
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

export default UserSection;
