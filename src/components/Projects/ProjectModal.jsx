import React, { useState, useEffect } from 'react';
import { useProjects } from '../../context/ProjectContext';
import { useUserManagement } from '../../context/UserContext';
import { useAuth } from '../../context/AuthContext';
import {
  X,
  FolderKanban,
  Save,
  AlertCircle,
  Sparkles,
  Layers,
  Calendar,
  DollarSign,
  Users,
  Copy,
  Plus,
  Trash2,
  CheckCircle2,
  ChevronDown,
} from 'lucide-react';

export const ProjectModal = ({ isOpen, onClose, projectToEdit }) => {
  const { createProject, updateProject, templates } = useProjects();
  const { users, assignableUsers, fetchAssignableUsers } = useUserManagement ? useUserManagement() : { users: [], assignableUsers: [] };
  const { user: currentUser } = useAuth();

  const isEdit = !!projectToEdit;
  const [activeTab, setActiveTab] = useState('basic'); // 'basic' | 'timeline' | 'financial' | 'team' | 'template'

  // Fetch all assignable organization members when modal opens
  useEffect(() => {
    if (isOpen && typeof fetchAssignableUsers === 'function') {
      fetchAssignableUsers();
    }
  }, [isOpen, fetchAssignableUsers]);

  // Combine assignable users, directory users, and current user into a complete, deduplicated list
  const allCandidateUsers = React.useMemo(() => {
    const rawList = [
      ...(Array.isArray(assignableUsers) ? assignableUsers : []),
      ...(Array.isArray(users) ? users : []),
    ];

    if (currentUser && currentUser.name) {
      rawList.push({
        _id: currentUser._id || currentUser.id || 'current_user',
        name: currentUser.name,
        role: currentUser.role || (Array.isArray(currentUser.roles) && currentUser.roles[0]) || 'User',
        department: currentUser.department || '',
        email: currentUser.email || '',
        status: currentUser.status || 'Approved',
      });
    }

    const uniqueMap = new Map();
    rawList.forEach((u) => {
      if (!u || !u.name) return;
      const cleanName = u.name.trim();
      if (!cleanName) return;

      const userRole = u.role || (Array.isArray(u.roles) && u.roles[0]) || 'User';
      if (!uniqueMap.has(cleanName)) {
        uniqueMap.set(cleanName, {
          _id: u._id || u.id || cleanName,
          name: cleanName,
          role: userRole,
          department: u.department || '',
          email: u.email || '',
          status: u.status || 'Approved',
        });
      }
    });

    // Group or sort users: Super Admin first, then Managers, then others alphabetically
    return Array.from(uniqueMap.values()).sort((a, b) => {
      const getRoleWeight = (r) => {
        const roleLower = (r || '').toLowerCase();
        if (roleLower.includes('super admin')) return 1;
        if (roleLower.includes('admin')) return 2;
        if (roleLower.includes('manager') || roleLower.includes('lead')) return 3;
        return 4;
      };
      const weightA = getRoleWeight(a.role);
      const weightB = getRoleWeight(b.role);
      if (weightA !== weightB) return weightA - weightB;
      return a.name.localeCompare(b.name);
    });
  }, [assignableUsers, users, currentUser]);

  const [formData, setFormData] = useState({
    name: '',
    client: '',
    projectType: 'Client Delivery',
    department: 'Engineering',
    priority: 'Medium',
    status: 'Draft',
    description: '',
    startDate: new Date().toISOString().split('T')[0],
    targetDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    actualStartDate: '',
    actualEndDate: '',
    budget: 25000,
    currency: 'USD',
    budgetedHours: 160,
    billingType: 'Fixed Cost',
    billingMethod: 'Milestone Based',
    estimatedCost: 20000,
    projectOwner: currentUser?.name || '',
    ownerName: currentUser?.name || '',
    projectManager: currentUser?.name || '',
    managerName: currentUser?.name || '',
    teamMembers: [],
    phases: [],
    milestones: [],
    tasks: [],
  });

  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('Developer');

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (projectToEdit) {
      const resolvedMgr =
        projectToEdit.managerName ||
        projectToEdit.projectManager ||
        (typeof projectToEdit.manager === 'object' && projectToEdit.manager?.name ? projectToEdit.manager.name : '') ||
        currentUser?.name ||
        '';
      const resolvedOwn =
        projectToEdit.ownerName ||
        projectToEdit.projectOwner ||
        (typeof projectToEdit.owner === 'object' && projectToEdit.owner?.name ? projectToEdit.owner.name : '') ||
        currentUser?.name ||
        '';

      setFormData({
        name: projectToEdit.name || projectToEdit.title || '',
        client: projectToEdit.client || projectToEdit.clientName || '',
        projectType: projectToEdit.projectType || 'Client Delivery',
        department: projectToEdit.department || 'Engineering',
        priority: projectToEdit.priority || 'Medium',
        status: projectToEdit.status || 'Draft',
        description: projectToEdit.description || '',
        startDate: projectToEdit.startDate
          ? new Date(projectToEdit.startDate).toISOString().split('T')[0]
          : '',
        targetDate: (projectToEdit.targetDate || projectToEdit.endDate)
          ? new Date(projectToEdit.targetDate || projectToEdit.endDate).toISOString().split('T')[0]
          : '',
        actualStartDate: projectToEdit.actualStartDate
          ? new Date(projectToEdit.actualStartDate).toISOString().split('T')[0]
          : '',
        actualEndDate: projectToEdit.actualEndDate
          ? new Date(projectToEdit.actualEndDate).toISOString().split('T')[0]
          : '',
        budget: projectToEdit.budget || 0,
        currency: projectToEdit.currency || 'USD',
        budgetedHours: projectToEdit.budgetedHours || 0,
        billingType: projectToEdit.billingType || 'Fixed Cost',
        billingMethod: projectToEdit.billingMethod || 'Milestone Based',
        estimatedCost: projectToEdit.estimatedCost || 0,
        projectOwner: resolvedOwn,
        ownerName: resolvedOwn,
        projectManager: resolvedMgr,
        managerName: resolvedMgr,
        teamMembers: projectToEdit.teamMembers || [],
        phases: projectToEdit.phases || [],
        milestones: projectToEdit.milestones || [],
        tasks: projectToEdit.tasks || [],
      });
      setActiveTab('basic');
    } else {
      const defaultMgr = currentUser?.name || '';
      setFormData({
        name: '',
        client: '',
        projectType: 'Client Delivery',
        department: 'Engineering',
        priority: 'Medium',
        status: 'Draft',
        description: '',
        startDate: new Date().toISOString().split('T')[0],
        targetDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        actualStartDate: '',
        actualEndDate: '',
        budget: 25000,
        currency: 'USD',
        budgetedHours: 160,
        billingType: 'Fixed Cost',
        billingMethod: 'Milestone Based',
        estimatedCost: 20000,
        projectOwner: defaultMgr,
        ownerName: defaultMgr,
        projectManager: defaultMgr,
        managerName: defaultMgr,
        teamMembers: [
          { name: defaultMgr || 'Lead', role: 'Project Manager', department: 'Engineering' },
        ],
        phases: [
          { name: 'Phase 1: Planning & Scope', status: 'In Progress', order: 1 },
          { name: 'Phase 2: UI/UX & Design', status: 'Pending', order: 2 },
          { name: 'Phase 3: Core Development', status: 'Pending', order: 3 },
          { name: 'Phase 4: QA & Testing', status: 'Pending', order: 4 },
          { name: 'Phase 5: Production Handover', status: 'Pending', order: 5 },
        ],
        milestones: [
          { name: 'Kickoff & Requirements Approval', status: 'Completed', progress: 100 },
          { name: 'UI/UX Interactive Prototypes', status: 'In Progress', progress: 50 },
          { name: 'Backend API & Database Deployment', status: 'Pending', progress: 0 },
          { name: 'Client Final Sign-off', status: 'Pending', progress: 0 },
        ],
        tasks: [],
      });
      setActiveTab('basic');
    }
    setError('');
  }, [projectToEdit, currentUser, isOpen]);

  if (!isOpen) return null;

  const handleApplyTemplate = (tmpl) => {
    if (!tmpl) return;
    setFormData((prev) => ({
      ...prev,
      projectType: tmpl.category || prev.projectType,
      budget: tmpl.defaultBudget || prev.budget,
      budgetedHours: tmpl.defaultEstimatedHours || prev.budgetedHours,
      phases: (tmpl.phases || []).map((p, idx) => ({
        name: p.name,
        status: idx === 0 ? 'In Progress' : 'Pending',
        order: p.order || idx + 1,
      })),
      milestones: (tmpl.milestones || []).map((m) => ({
        name: m.name,
        status: 'Pending',
        progress: 0,
        phase: m.phase,
      })),
      tasks: (tmpl.tasks || []).map((t) => ({
        taskName: t.name,
        phase: t.phase,
        estimatedHours: t.estimatedHours || 8,
        priority: t.priority || 'Medium',
        status: 'To Do',
      })),
    }));
    setActiveTab('basic');
  };

  const handleAddTeamMember = () => {
    if (!newMemberName.trim()) return;
    setFormData((prev) => ({
      ...prev,
      teamMembers: [
        ...prev.teamMembers,
        { name: newMemberName.trim(), role: newMemberRole, department: formData.department },
      ],
    }));
    setNewMemberName('');
  };

  const handleRemoveTeamMember = (index) => {
    setFormData((prev) => ({
      ...prev,
      teamMembers: prev.teamMembers.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Project Name is required.');
      setActiveTab('basic');
      return;
    }
    if (!formData.client.trim()) {
      setError('Client / Account is required.');
      setActiveTab('basic');
      return;
    }
    if (!formData.targetDate) {
      setError('Planned End Date is required.');
      setActiveTab('timeline');
      return;
    }
    if (formData.startDate && formData.targetDate && formData.targetDate < formData.startDate) {
      setError('Planned End Date cannot be earlier than Planned Start Date.');
      setActiveTab('timeline');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const chosenManagerName =
        (formData.projectManager || formData.managerName || '').trim() ||
        currentUser?.name ||
        'Unassigned';
      const chosenOwnerName =
        (formData.projectOwner || formData.ownerName || '').trim() ||
        currentUser?.name ||
        'Unassigned';

      const matchedMgr = allCandidateUsers.find(
        (u) =>
          (u.name && u.name.toLowerCase() === chosenManagerName.toLowerCase()) ||
          (u.username && u.username.toLowerCase() === chosenManagerName.toLowerCase())
      );
      const matchedOwner = allCandidateUsers.find(
        (u) =>
          (u.name && u.name.toLowerCase() === chosenOwnerName.toLowerCase()) ||
          (u.username && u.username.toLowerCase() === chosenOwnerName.toLowerCase())
      );

      const payload = {
        ...formData,
        clientName: formData.client,
        client: formData.client,
        managerName: chosenManagerName,
        projectManager: chosenManagerName,
        manager: matchedMgr ? (matchedMgr._id || matchedMgr.id) : null,
        ownerName: chosenOwnerName,
        projectOwner: chosenOwnerName,
        owner: matchedOwner ? (matchedOwner._id || matchedOwner.id) : null,
        budget: Number(formData.budget) || 0,
        budgetedHours: Number(formData.budgetedHours) || 0,
        estimatedCost: Number(formData.estimatedCost) || 0,
      };

      if (isEdit) {
        await updateProject(projectToEdit._id, payload);
      } else {
        await createProject(payload);
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to save project.');
    } finally {
      setSubmitting(false);
    }
  };

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
          maxWidth: '740px',
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
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1.5px solid #e2e8f0',
            backgroundColor: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                backgroundColor: '#eff6ff',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #bfdbfe',
                flexShrink: 0,
              }}
            >
              <FolderKanban size={22} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                {isEdit ? 'Edit Project Specifications' : 'Create New Project'}
              </h2>
              <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: '#64748b' }}>
                {isEdit
                  ? `Updating Project ID: ${projectToEdit?.projectId || projectToEdit?.projectCode || ''}`
                  : 'Configure project portfolio, deliverables, phases, timeline, and team.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '6px',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '8px',
              color: '#94a3b8',
              cursor: 'pointer',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
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
            { id: 'basic', label: 'Basic Info', icon: FolderKanban },
            { id: 'timeline', label: 'Timeline & Phases', icon: Calendar },
            { id: 'financial', label: 'Financial & Budget', icon: DollarSign },
            { id: 'team', label: 'Team & Roles', icon: Users },
            ...(!isEdit ? [{ id: 'template', label: 'Templates', icon: Sparkles }] : []),
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
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
                <Icon size={15} style={{ color: tab.id === 'template' ? '#f59e0b' : isActive ? '#2563eb' : '#94a3b8' }} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {error && (
            <div
              style={{
                padding: '12px 16px',
                backgroundColor: '#fef2f2',
                border: '1px solid #fee2e2',
                borderRadius: '10px',
                color: '#dc2626',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* TAB 1: BASIC INFO */}
          {activeTab === 'basic' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748b', marginBottom: '6px' }}>
                    Project Name <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Next-Gen Enterprise Billing Portal"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    style={{
                      width: '100%',
                      height: '40px',
                      padding: '0 14px',
                      backgroundColor: '#ffffff',
                      border: '1.5px solid #cbd5e1',
                      borderRadius: '10px',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#0f172a',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748b', marginBottom: '6px' }}>
                    Client / Account <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Global Logistics Corp"
                    value={formData.client}
                    onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                    style={{
                      width: '100%',
                      height: '40px',
                      padding: '0 14px',
                      backgroundColor: '#ffffff',
                      border: '1.5px solid #cbd5e1',
                      borderRadius: '10px',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#0f172a',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748b', marginBottom: '6px' }}>
                    Project Type
                  </label>
                  <div style={{ position: 'relative' }}>
                    <select
                      value={formData.projectType}
                      onChange={(e) => setFormData({ ...formData, projectType: e.target.value })}
                      style={{
                        width: '100%',
                        height: '40px',
                        padding: '0 36px 0 14px',
                        backgroundColor: '#ffffff',
                        border: '1.5px solid #cbd5e1',
                        borderRadius: '10px',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#1e293b',
                        cursor: 'pointer',
                        appearance: 'none',
                        outline: 'none',
                      }}
                    >
                      <option value="Client Delivery">Client Delivery</option>
                      <option value="Internal Product">Internal Product</option>
                      <option value="Cloud Migration">Cloud Migration</option>
                      <option value="Mobile App">Mobile App</option>
                      <option value="Consulting & Audit">Consulting & Audit</option>
                      <option value="Infrastructure">Infrastructure</option>
                    </select>
                    <ChevronDown size={14} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', pointerEvents: 'none' }} />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748b', marginBottom: '6px' }}>
                    Department
                  </label>
                  <div style={{ position: 'relative' }}>
                    <select
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      style={{
                        width: '100%',
                        height: '40px',
                        padding: '0 36px 0 14px',
                        backgroundColor: '#ffffff',
                        border: '1.5px solid #cbd5e1',
                        borderRadius: '10px',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#1e293b',
                        cursor: 'pointer',
                        appearance: 'none',
                        outline: 'none',
                      }}
                    >
                      <option value="Engineering">Engineering</option>
                      <option value="Product">Product</option>
                      <option value="Operations">Operations</option>
                      <option value="Marketing">Marketing</option>
                      <option value="IT Infrastructure">IT Infrastructure</option>
                    </select>
                    <ChevronDown size={14} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', pointerEvents: 'none' }} />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748b', marginBottom: '6px' }}>
                    Priority
                  </label>
                  <div style={{ position: 'relative' }}>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      style={{
                        width: '100%',
                        height: '40px',
                        padding: '0 36px 0 14px',
                        backgroundColor: '#ffffff',
                        border: '1.5px solid #cbd5e1',
                        borderRadius: '10px',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#1e293b',
                        cursor: 'pointer',
                        appearance: 'none',
                        outline: 'none',
                      }}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                    <ChevronDown size={14} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', pointerEvents: 'none' }} />
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748b', marginBottom: '6px' }}>
                    Project Manager
                  </label>
                  <div style={{ position: 'relative' }}>
                    <select
                      value={formData.projectManager || formData.managerName || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData((prev) => ({ ...prev, projectManager: val, managerName: val }));
                      }}
                      style={{
                        width: '100%',
                        height: '42px',
                        padding: '0 36px 0 14px',
                        backgroundColor: '#ffffff',
                        border: '1.5px solid #cbd5e1',
                        borderRadius: '10px',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#1e293b',
                        cursor: 'pointer',
                        appearance: 'none',
                        outline: 'none',
                      }}
                    >
                      <option value="">-- Select Project Manager --</option>
                      {formData.projectManager &&
                        !allCandidateUsers.some((u) => u.name === formData.projectManager) && (
                          <option value={formData.projectManager}>
                            {formData.projectManager} (Current Assigned)
                          </option>
                        )}
                      {allCandidateUsers.map((u) => {
                        const isMe = currentUser?.name && u.name.toLowerCase() === currentUser.name.toLowerCase();
                        return (
                          <option key={u._id || u.name} value={u.name}>
                            {u.name} ({u.role || 'Member'}{isMe ? ' • You' : ''}{u.department ? ` • ${u.department}` : ''})
                          </option>
                        );
                      })}
                    </select>
                    <ChevronDown size={14} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', pointerEvents: 'none' }} />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748b', marginBottom: '6px' }}>
                    Lifecycle Status
                  </label>
                  <div style={{ position: 'relative' }}>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      style={{
                        width: '100%',
                        height: '40px',
                        padding: '0 36px 0 14px',
                        backgroundColor: '#ffffff',
                        border: '1.5px solid #cbd5e1',
                        borderRadius: '10px',
                        fontSize: '13px',
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
                    <ChevronDown size={14} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', pointerEvents: 'none' }} />
                  </div>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748b', marginBottom: '6px' }}>
                  Project Description & Scope
                </label>
                <textarea
                  rows={3}
                  placeholder="Outline key objectives, deliverables, and technical parameters..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    backgroundColor: '#ffffff',
                    border: '1.5px solid #cbd5e1',
                    borderRadius: '10px',
                    fontSize: '13px',
                    color: '#0f172a',
                    outline: 'none',
                    resize: 'vertical',
                  }}
                />
              </div>
            </div>
          )}

          {/* TAB 2: TIMELINE & PHASES */}
          {activeTab === 'timeline' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748b', marginBottom: '6px' }}>
                    Planned Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    style={{
                      width: '100%',
                      height: '40px',
                      padding: '0 14px',
                      backgroundColor: '#ffffff',
                      border: '1.5px solid #cbd5e1',
                      borderRadius: '10px',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#0f172a',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748b', marginBottom: '6px' }}>
                    Planned End Date <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.targetDate}
                    onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                    style={{
                      width: '100%',
                      height: '40px',
                      padding: '0 14px',
                      backgroundColor: '#ffffff',
                      border: '1.5px solid #cbd5e1',
                      borderRadius: '10px',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#0f172a',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              {/* Starter Phases Preview */}
              <div style={{ borderTop: '1.5px solid #e2e8f0', paddingTop: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748b', marginBottom: '10px' }}>
                  <Layers size={14} style={{ color: '#2563eb' }} /> Configured Delivery Phases ({formData.phases.length})
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {formData.phases.map((ph, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        backgroundColor: '#f8fafc',
                        borderRadius: '10px',
                        border: '1px solid #e2e8f0',
                        fontSize: '13px',
                      }}
                    >
                      <span style={{ fontWeight: 600, color: '#334155' }}>
                        {ph.name}
                      </span>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 700,
                          backgroundColor: '#eff6ff',
                          color: '#2563eb',
                          border: '1px solid #bfdbfe',
                        }}
                      >
                        {ph.status || 'Pending'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: FINANCIAL & BUDGET */}
          {activeTab === 'financial' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748b', marginBottom: '6px' }}>
                    Total Budget ({formData.currency})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    style={{
                      width: '100%',
                      height: '40px',
                      padding: '0 14px',
                      backgroundColor: '#ffffff',
                      border: '1.5px solid #cbd5e1',
                      borderRadius: '10px',
                      fontSize: '13px',
                      fontWeight: 700,
                      color: '#0f172a',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748b', marginBottom: '6px' }}>
                    Budgeted Hours
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={formData.budgetedHours}
                    onChange={(e) => setFormData({ ...formData, budgetedHours: e.target.value })}
                    style={{
                      width: '100%',
                      height: '40px',
                      padding: '0 14px',
                      backgroundColor: '#ffffff',
                      border: '1.5px solid #cbd5e1',
                      borderRadius: '10px',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#0f172a',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748b', marginBottom: '6px' }}>
                    Billing Type
                  </label>
                  <div style={{ position: 'relative' }}>
                    <select
                      value={formData.billingType}
                      onChange={(e) => setFormData({ ...formData, billingType: e.target.value })}
                      style={{
                        width: '100%',
                        height: '40px',
                        padding: '0 36px 0 14px',
                        backgroundColor: '#ffffff',
                        border: '1.5px solid #cbd5e1',
                        borderRadius: '10px',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#1e293b',
                        cursor: 'pointer',
                        appearance: 'none',
                        outline: 'none',
                      }}
                    >
                      <option value="Fixed Cost">Fixed Cost</option>
                      <option value="Time and Material">Time and Material</option>
                      <option value="Retainer">Retainer</option>
                      <option value="Non-Billable">Non-Billable</option>
                    </select>
                    <ChevronDown size={14} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', pointerEvents: 'none' }} />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748b', marginBottom: '6px' }}>
                    Billing Method
                  </label>
                  <div style={{ position: 'relative' }}>
                    <select
                      value={formData.billingMethod}
                      onChange={(e) => setFormData({ ...formData, billingMethod: e.target.value })}
                      style={{
                        width: '100%',
                        height: '40px',
                        padding: '0 36px 0 14px',
                        backgroundColor: '#ffffff',
                        border: '1.5px solid #cbd5e1',
                        borderRadius: '10px',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#1e293b',
                        cursor: 'pointer',
                        appearance: 'none',
                        outline: 'none',
                      }}
                    >
                      <option value="Milestone Based">Milestone Based</option>
                      <option value="Monthly Cycle">Monthly Cycle</option>
                      <option value="Hourly Rate">Hourly Rate</option>
                      <option value="Upon Completion">Upon Completion</option>
                    </select>
                    <ChevronDown size={14} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', pointerEvents: 'none' }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: TEAM & ROLES */}
          {activeTab === 'team' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748b', marginBottom: '6px' }}>
                    Project Manager
                  </label>
                  <div style={{ position: 'relative' }}>
                    <select
                      value={formData.projectManager || formData.managerName || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData((prev) => ({ ...prev, projectManager: val, managerName: val }));
                      }}
                      style={{
                        width: '100%',
                        height: '42px',
                        padding: '0 36px 0 14px',
                        backgroundColor: '#ffffff',
                        border: '1.5px solid #cbd5e1',
                        borderRadius: '10px',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#1e293b',
                        cursor: 'pointer',
                        appearance: 'none',
                        outline: 'none',
                      }}
                    >
                      <option value="">-- Select Project Manager --</option>
                      {formData.projectManager &&
                        !allCandidateUsers.some((u) => u.name === formData.projectManager) && (
                          <option value={formData.projectManager}>
                            {formData.projectManager} (Current Assigned)
                          </option>
                        )}
                      {allCandidateUsers.map((u) => {
                        const isMe = currentUser?.name && u.name.toLowerCase() === currentUser.name.toLowerCase();
                        return (
                          <option key={u._id || u.name} value={u.name}>
                            {u.name} ({u.role || 'Member'}{isMe ? ' • You' : ''}{u.department ? ` • ${u.department}` : ''})
                          </option>
                        );
                      })}
                    </select>
                    <ChevronDown size={14} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', pointerEvents: 'none' }} />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748b', marginBottom: '6px' }}>
                    Project Owner / Sponsor
                  </label>
                  <div style={{ position: 'relative' }}>
                    <select
                      value={formData.projectOwner || formData.ownerName || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData((prev) => ({ ...prev, projectOwner: val, ownerName: val }));
                      }}
                      style={{
                        width: '100%',
                        height: '42px',
                        padding: '0 36px 0 14px',
                        backgroundColor: '#ffffff',
                        border: '1.5px solid #cbd5e1',
                        borderRadius: '10px',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#1e293b',
                        cursor: 'pointer',
                        appearance: 'none',
                        outline: 'none',
                      }}
                    >
                      <option value="">-- Select Project Owner / Sponsor --</option>
                      {formData.projectOwner &&
                        !allCandidateUsers.some((u) => u.name === formData.projectOwner) && (
                          <option value={formData.projectOwner}>
                            {formData.projectOwner} (Current Assigned)
                          </option>
                        )}
                      {allCandidateUsers.map((u) => {
                        const isMe = currentUser?.name && u.name.toLowerCase() === currentUser.name.toLowerCase();
                        return (
                          <option key={u._id || u.name} value={u.name}>
                            {u.name} ({u.role || 'Member'}{isMe ? ' • You' : ''}{u.department ? ` • ${u.department}` : ''})
                          </option>
                        );
                      })}
                    </select>
                    <ChevronDown size={14} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', pointerEvents: 'none' }} />
                  </div>
                </div>
              </div>

              {/* Add Team Member Section */}
              <div style={{ borderTop: '1.5px solid #e2e8f0', paddingTop: '16px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748b', marginBottom: '10px' }}>
                  Assign Team Members ({formData.teamMembers.length})
                </label>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                  {formData.teamMembers.map((member, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        backgroundColor: '#f8fafc',
                        borderRadius: '10px',
                        border: '1px solid #e2e8f0',
                        fontSize: '13px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            backgroundColor: '#2563eb',
                            color: '#ffffff',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '10px',
                          }}
                        >
                          {member.name.charAt(0)}
                        </div>
                        <span style={{ fontWeight: 700, color: '#0f172a' }}>{member.name}</span>
                        <span style={{ color: '#64748b' }}>({member.role})</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveTeamMember(idx)}
                        style={{
                          padding: '4px',
                          backgroundColor: 'transparent',
                          border: 'none',
                          color: '#94a3b8',
                          cursor: 'pointer',
                        }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    list="assignable-team-users-list"
                    placeholder="Member Name or Email..."
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    style={{
                      flex: 1,
                      minWidth: '180px',
                      height: '38px',
                      padding: '0 12px',
                      backgroundColor: '#ffffff',
                      border: '1.5px solid #cbd5e1',
                      borderRadius: '8px',
                      fontSize: '13px',
                      color: '#0f172a',
                      outline: 'none',
                    }}
                  />
                  <datalist id="assignable-team-users-list">
                    {allCandidateUsers.map((u) => (
                      <option key={u._id || u.name} value={u.name}>
                        {u.role || 'Member'}{u.department ? ` • ${u.department}` : ''}
                      </option>
                    ))}
                  </datalist>
                  <div style={{ position: 'relative' }}>
                    <select
                      value={newMemberRole}
                      onChange={(e) => setNewMemberRole(e.target.value)}
                      style={{
                        height: '38px',
                        padding: '0 32px 0 12px',
                        backgroundColor: '#ffffff',
                        border: '1.5px solid #cbd5e1',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#1e293b',
                        cursor: 'pointer',
                        appearance: 'none',
                        outline: 'none',
                      }}
                    >
                      <option value="Project Manager">Project Manager</option>
                      <option value="Lead Architect">Lead Architect</option>
                      <option value="Developer">Developer</option>
                      <option value="UI/UX Designer">UI/UX Designer</option>
                      <option value="QA Engineer">QA Engineer</option>
                      <option value="DevOps Engineer">DevOps Engineer</option>
                    </select>
                    <ChevronDown size={14} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', pointerEvents: 'none' }} />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddTeamMember}
                    style={{
                      height: '38px',
                      padding: '0 16px',
                      backgroundColor: '#2563eb',
                      color: '#ffffff',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: 700,
                      border: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                    }}
                  >
                    <Plus size={15} />
                    <span>Add</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: TEMPLATES */}
          {activeTab === 'template' && !isEdit && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                Choose a pre-configured template to bootstrap delivery phases, milestone gates, and task dependencies:
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
                {(templates || []).map((tmpl) => (
                  <div
                    key={tmpl.id}
                    onClick={() => handleApplyTemplate(tmpl)}
                    style={{
                      padding: '16px',
                      borderRadius: '14px',
                      border: '1.5px solid #e2e8f0',
                      backgroundColor: '#ffffff',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.borderColor = '#2563eb';
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(37, 99, 235, 0.08)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.borderColor = '#e2e8f0';
                      e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.02)';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>
                        {tmpl.name}
                      </h4>
                      <Copy size={15} style={{ color: '#2563eb' }} />
                    </div>
                    <p style={{ margin: '6px 0 10px 0', fontSize: '12px', color: '#64748b', lineHeight: 1.4 }}>
                      {tmpl.description}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: 600, color: '#94a3b8' }}>
                      <span>{tmpl.phases?.length || 0} Phases</span>
                      <span>•</span>
                      <span>{tmpl.milestones?.length || 0} Milestones</span>
                      <span>•</span>
                      <span>{tmpl.tasks?.length || 0} Tasks</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div
            style={{
              paddingTop: '16px',
              borderTop: '1.5px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '12px',
              flexShrink: 0,
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                height: '40px',
                padding: '0 18px',
                borderRadius: '10px',
                border: '1.5px solid #cbd5e1',
                backgroundColor: '#ffffff',
                color: '#475569',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                height: '40px',
                padding: '0 22px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                borderRadius: '10px',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 700,
                border: 'none',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)',
                cursor: 'pointer',
              }}
            >
              <Save size={16} />
              <span>{submitting ? 'Saving Project...' : isEdit ? 'Save Changes' : 'Create Project'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectModal;
