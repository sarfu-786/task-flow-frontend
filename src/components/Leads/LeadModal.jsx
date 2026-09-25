import React, { useState, useEffect } from 'react';
import { useLeads } from '../../context/LeadContext';
import { useUserManagement } from '../../context/UserContext';
import { useAuth } from '../../context/AuthContext';
import {
  X,
  Save,
  PlusCircle,
  AlertCircle,
  Building,
  User as UserIcon,
  Phone,
  Mail,
  Share2,
  Tag,
  Flag,
  FileText,
} from 'lucide-react';

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

export const LeadModal = () => {
  const { isLeadModalOpen, modalMode, selectedLead, closeLeadModal, createLead, updateLead } = useLeads();
  const { users } = useUserManagement();
  const { user: currentUser } = useAuth();

  const isSuperAdmin = currentUser && currentUser.role === 'Super Admin';
  const currentUserId = (currentUser?._id || currentUser?.id || '').toString();
  const currentUserName = (currentUser?.name || '').toLowerCase().trim();

  // Active Approved Users
  const activeUsers = (users || []).filter((u) => u.status !== 'Rejected' && u.status !== 'Pending');

  // Hierarchy filter
  const subordinateIds = getSubordinateUserIds(currentUser, activeUsers);

  let assignableUsers = [];
  if (isSuperAdmin) {
    assignableUsers = activeUsers;
  } else {
    assignableUsers = activeUsers.filter((u) => {
      const uId = (u._id || u.id || '').toString();
      const isSelf =
        (currentUserId && uId === currentUserId) ||
        (currentUser?.email && u.email && u.email.toLowerCase() === currentUser.email.toLowerCase()) ||
        (currentUserName && (u.name || '').toLowerCase().trim() === currentUserName);
      return isSelf || subordinateIds.has(uId);
    });
  }

  if (
    currentUser &&
    !assignableUsers.some(
      (u) => (u._id || u.id || '').toString() === currentUserId || (u.email && u.email === currentUser.email)
    )
  ) {
    assignableUsers = [currentUser, ...assignableUsers];
  }

  const [formData, setFormData] = useState({
    name: '',
    company: '',
    phone: '',
    email: '',
    source: 'Website',
    status: 'New',
    priority: 'Medium',
    assignedTo: '',
    notes: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  useEffect(() => {
    if (modalMode === 'edit' && selectedLead) {
      setFormData({
        name: selectedLead.name || '',
        company: selectedLead.company || '',
        phone: selectedLead.phone || '',
        email: selectedLead.email || '',
        source: selectedLead.source || 'Website',
        status: selectedLead.status || 'New',
        priority: selectedLead.priority || 'Medium',
        assignedTo: selectedLead.assignedTo || '',
        notes: selectedLead.notes || '',
      });
    } else {
      setFormData({
        name: '',
        company: '',
        phone: '',
        email: '',
        source: 'Website',
        status: 'New',
        priority: 'Medium',
        assignedTo: currentUser?.name || '',
        notes: '',
      });
    }
    setErrors({});
    setServerError('');
  }, [modalMode, selectedLead, isLeadModalOpen, currentUser]);

  if (!isLeadModalOpen) return null;

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) {
      errs.name = 'Lead name is required';
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errs.email = 'Enter a valid email address';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setServerError('');

    try {
      const payload = {
        name: formData.name.trim(),
        company: formData.company.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim().toLowerCase(),
        source: formData.source,
        status: formData.status,
        priority: formData.priority,
        assignedTo: formData.assignedTo || currentUser?.name || 'Current User',
        notes: formData.notes.trim(),
      };

      if (modalMode === 'edit' && selectedLead) {
        await updateLead(selectedLead._id, payload);
      } else {
        await createLead(payload);
      }
    } catch (err) {
      setServerError(err.message || 'Failed to save lead details');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop active" onClick={closeLeadModal}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '620px', width: '92%' }}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: modalMode === 'edit' ? '#eff6ff' : '#ecfdf5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: modalMode === 'edit' ? '#2563eb' : '#059669',
              }}
            >
              {modalMode === 'edit' ? <Save size={18} /> : <PlusCircle size={18} />}
            </div>
            <div>
              <h3 className="modal-title" style={{ margin: 0, fontSize: '1.2rem' }}>
                {modalMode === 'edit' ? 'Edit Lead' : 'Add New Lead'}
              </h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {modalMode === 'edit' ? 'Update prospective customer details' : 'Register a new customer lead into the CRM'}
              </p>
            </div>
          </div>
          <button type="button" className="btn-icon" onClick={closeLeadModal} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {serverError && (
          <div className="alert alert-danger" style={{ margin: '16px 24px 0', display: 'flex', gap: '8px' }}>
            <AlertCircle size={18} />
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="modal-body" style={{ padding: '20px 24px' }}>
          <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {/* Lead Name */}
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <UserIcon size={14} color="var(--primary)" />
                <span>Contact / Lead Name *</span>
              </label>
              <input
                type="text"
                className={`form-input ${errors.name ? 'is-invalid' : ''}`}
                placeholder="e.g. Rajesh Kumar"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                autoFocus
              />
              {errors.name && <span className="error-feedback">{errors.name}</span>}
            </div>

            {/* Company */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Building size={14} color="var(--primary)" />
                <span>Company Name</span>
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. TechNova Solutions"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              />
            </div>

            {/* Phone */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Phone size={14} color="var(--primary)" />
                <span>Phone Number</span>
              </label>
              <input
                type="tel"
                className="form-input"
                placeholder="e.g. +91 98765 43210"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            {/* Email */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Mail size={14} color="var(--primary)" />
                <span>Email Address</span>
              </label>
              <input
                type="email"
                className={`form-input ${errors.email ? 'is-invalid' : ''}`}
                placeholder="e.g. rajesh@technova.in"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
              {errors.email && <span className="error-feedback">{errors.email}</span>}
            </div>

            {/* Source */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Share2 size={14} color="var(--primary)" />
                <span>Lead Source</span>
              </label>
              <select
                className="form-select"
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
              >
                <option value="Website">Website</option>
                <option value="Referral">Referral</option>
                <option value="Social Media">Social Media</option>
                <option value="Cold Call">Cold Call</option>
                <option value="Campaign">Marketing Campaign</option>
                <option value="Partner">Partner</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Status */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Tag size={14} color="var(--primary)" />
                <span>Lead Status</span>
              </label>
              <select
                className="form-select"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="New">New</option>
                <option value="Contacted">Contacted</option>
                <option value="Qualified">Qualified</option>
                <option value="Converted">Converted</option>
                <option value="Lost">Lost</option>
              </select>
            </div>

            {/* Priority */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Flag size={14} color="var(--primary)" />
                <span>Priority</span>
              </label>
              <select
                className="form-select"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>

            {/* Assigned To */}
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <UserIcon size={14} color="var(--primary)" />
                <span>Assigned Representative</span>
              </label>
              <select
                className="form-select"
                value={formData.assignedTo}
                onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
              >
                {assignableUsers.map((u) => {
                  const label = `${u.name || u.username} (${u.role || 'Member'})`;
                  return (
                    <option key={u._id || u.id || u.email} value={u.name || u.username}>
                      {label}
                    </option>
                  );
                })}
              </select>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                Hierarchy rule: Assigned members must be in your reporting line or your own account.
              </span>
            </div>

            {/* Notes */}
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileText size={14} color="var(--primary)" />
                <span>Notes & Client Background</span>
              </label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="Add background notes, budget signals, requirements..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>

          <div className="modal-footer" style={{ padding: '16px 0 0', marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button type="button" className="btn btn-secondary" onClick={closeLeadModal} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting} style={{ minWidth: '120px' }}>
              {isSubmitting ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div className="spinner-sm" />
                  <span>Saving...</span>
                </div>
              ) : modalMode === 'edit' ? (
                'Save Changes'
              ) : (
                'Create Lead'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
