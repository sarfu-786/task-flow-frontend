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
  DollarSign,
  Calendar,
  Clock,
  Briefcase,
  Shield,
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
  const { leads, isLeadModalOpen, modalMode, selectedLead, closeLeadModal, createLead, updateLead } = useLeads();
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
    contactPerson: '',
    company: '',
    mobileNumber: '',
    email: '',
    source: 'Website',
    requirement: '',
    status: 'New',
    priority: 'Medium',
    estimatedValue: '',
    assignedSalesUser: '',
    assignedManager: '',
    remarks: '',
    nextFollowUpDate: '',
    nextFollowUpTime: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  // Check if an email is already used by another lead
  const checkDuplicateEmail = (emailToCheck) => {
    if (!emailToCheck || !emailToCheck.trim()) return null;
    const normalized = emailToCheck.trim().toLowerCase();
    const match = (leads || []).find((l) => {
      if (!l.email) return false;
      const otherEmail = l.email.trim().toLowerCase();
      if (otherEmail !== normalized) return false;
      if (modalMode === 'edit' && selectedLead) {
        const isSame =
          (l._id && selectedLead._id && l._id.toString() === selectedLead._id.toString()) ||
          (l.leadId && selectedLead.leadId && l.leadId === selectedLead.leadId) ||
          (l.lead_id && selectedLead.lead_id && l.lead_id === selectedLead.lead_id);
        return !isSame;
      }
      return true;
    });
    return match;
  };

  useEffect(() => {
    if (modalMode === 'edit' && selectedLead) {
      let fDate = '';
      if (selectedLead.nextFollowUpDate || selectedLead.next_followup_at) {
        try {
          fDate = new Date(selectedLead.nextFollowUpDate || selectedLead.next_followup_at).toISOString().split('T')[0];
        } catch {}
      }

      setFormData({
        contactPerson: selectedLead.contactPerson || selectedLead.name || '',
        company: selectedLead.company || '',
        mobileNumber: selectedLead.mobileNumber || selectedLead.phone || '',
        email: selectedLead.email || '',
        source: selectedLead.source || 'Website',
        requirement: selectedLead.requirement || '',
        status: selectedLead.status || 'New',
        priority: selectedLead.priority || 'Medium',
        estimatedValue: selectedLead.estimatedValue || selectedLead.dealValue || '',
        assignedSalesUser: selectedLead.assignedSalesUser || selectedLead.assignedTo || '',
        assignedManager: selectedLead.assignedManagerName || selectedLead.assignedManager || '',
        remarks: selectedLead.remarks || selectedLead.notes || '',
        nextFollowUpDate: fDate,
        nextFollowUpTime: selectedLead.nextFollowUpTime || '',
      });
    } else {
      setFormData({
        contactPerson: '',
        company: '',
        mobileNumber: '',
        email: '',
        source: 'Website',
        requirement: '',
        status: 'New',
        priority: 'Medium',
        estimatedValue: '',
        assignedSalesUser: currentUser?.name || '',
        assignedManager: currentUser?.reportsToName || 'Executive Leadership',
        remarks: '',
        nextFollowUpDate: '',
        nextFollowUpTime: '',
      });
    }
    setErrors({});
    setServerError('');
  }, [modalMode, selectedLead, isLeadModalOpen, currentUser]);

  if (!isLeadModalOpen) return null;

  const validate = () => {
    const errs = {};
    if (!formData.contactPerson.trim()) {
      errs.contactPerson = 'Contact Person / Lead Name is required';
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errs.email = 'Enter a valid email address';
    } else if (formData.email && formData.email.trim()) {
      const duplicate = checkDuplicateEmail(formData.email);
      if (duplicate) {
        errs.email = `This email already exists on lead ${duplicate.leadId || duplicate.name}. Lead email must be unique.`;
      }
    }
    setErrors(errs);
    if (errs.email && checkDuplicateEmail(formData.email)) {
      setServerError(`This email already exists (${formData.email.trim().toLowerCase()}). Lead emails must be unique.`);
    }
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setServerError('');

    try {
      const payload = {
        name: formData.contactPerson.trim(),
        contactPerson: formData.contactPerson.trim(),
        company: formData.company.trim(),
        phone: formData.mobileNumber.trim(),
        mobileNumber: formData.mobileNumber.trim(),
        email: formData.email.trim().toLowerCase(),
        source: formData.source,
        requirement: formData.requirement.trim(),
        status: formData.status,
        priority: formData.priority,
        estimatedValue: formData.estimatedValue ? Number(formData.estimatedValue) : 0,
        dealValue: formData.estimatedValue ? Number(formData.estimatedValue) : 0,
        assignedTo: formData.assignedSalesUser || currentUser?.name || 'Current User',
        assignedSalesUser: formData.assignedSalesUser || currentUser?.name || 'Current User',
        assignedManager: formData.assignedManager || '',
        assignedManagerName: formData.assignedManager || '',
        remarks: formData.remarks.trim(),
        notes: formData.remarks.trim(),
        nextFollowUpDate: formData.nextFollowUpDate || null,
        nextFollowUpTime: formData.nextFollowUpTime || '',
      };

      if (modalMode === 'edit' && selectedLead) {
        await updateLead(selectedLead._id || selectedLead.leadId, payload);
      } else {
        await createLead(payload);
      }
    } catch (err) {
      const msg = err.message || 'Failed to save lead details';
      setServerError(msg);
      if (msg.toLowerCase().includes('email already exists') || msg.toLowerCase().includes('email must be unique')) {
        setErrors((prev) => ({
          ...prev,
          email: msg,
        }));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop active" onClick={closeLeadModal} style={{ zIndex: 1200 }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '680px', width: '92%', maxHeight: '90vh', overflowY: 'auto' }}
      >
        <div className="modal-header" style={{ borderBottom: '1px solid #e2e8f0', padding: '16px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: modalMode === 'edit' ? '#eff6ff' : '#ecfdf5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: modalMode === 'edit' ? '#2563eb' : '#059669',
              }}
            >
              {modalMode === 'edit' ? <Save size={20} /> : <PlusCircle size={20} />}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 className="modal-title" style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>
                  {modalMode === 'edit' ? 'Edit Lead' : 'Add New Lead'}
                </h3>
                {selectedLead?.leadId && (
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, padding: '2px 8px', borderRadius: '6px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' }}>
                    {selectedLead.leadId}
                  </span>
                )}
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {modalMode === 'edit' ? 'Update prospect information and CRM metadata' : 'Register a new customer lead into TaskFlow'}
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
            {/* Contact Person */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '0.85rem' }}>
                <UserIcon size={14} color="#2563eb" />
                <span>Contact Person <span style={{ color: '#ef4444' }}>*</span></span>
              </label>
              <input
                type="text"
                className={`form-control ${errors.contactPerson ? 'is-invalid' : ''}`}
                placeholder="e.g. Rohan Sharma"
                value={formData.contactPerson}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                autoFocus
              />
              {errors.contactPerson && <span className="form-error-msg" style={{ color: '#ef4444', fontSize: '0.75rem' }}>{errors.contactPerson}</span>}
            </div>

            {/* Company Name */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '0.85rem' }}>
                <Building size={14} color="#2563eb" />
                <span>Company Name</span>
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Acme Enterprise Solutions"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              />
            </div>

            {/* Mobile Number */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '0.85rem' }}>
                <Phone size={14} color="#2563eb" />
                <span>Mobile Number</span>
              </label>
              <input
                type="tel"
                className="form-control"
                placeholder="e.g. +91 98200 45678"
                value={formData.mobileNumber}
                onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
              />
            </div>

            {/* Email */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '0.85rem' }}>
                <Mail size={14} color="#2563eb" />
                <span>Email Address</span>
              </label>
              <input
                type="email"
                className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                placeholder="e.g. rohan@acme.com"
                value={formData.email}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData({ ...formData, email: val });
                  if (errors.email) {
                    setErrors((prev) => ({ ...prev, email: '' }));
                  }
                  if (serverError && serverError.toLowerCase().includes('email')) {
                    setServerError('');
                  }
                  if (val.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim())) {
                    const duplicate = checkDuplicateEmail(val);
                    if (duplicate) {
                      setErrors((prev) => ({
                        ...prev,
                        email: `This email already exists on lead ${duplicate.leadId || duplicate.name}. Lead email must be unique.`,
                      }));
                    }
                  }
                }}
              />
              {errors.email && (
                <div
                  style={{
                    marginTop: '5px',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fecaca',
                    color: '#dc2626',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <AlertCircle size={14} style={{ flexShrink: 0 }} />
                  <span>{errors.email}</span>
                </div>
              )}
            </div>

            {/* Lead Source */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '0.85rem' }}>
                <Share2 size={14} color="#2563eb" />
                <span>Lead Source</span>
              </label>
              <select
                className="form-control select-filter"
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
              >
                <option value="Website">Website</option>
                <option value="LinkedIn">LinkedIn</option>
                <option value="Referral">Referral</option>
                <option value="Google Search Ads">Google Search Ads</option>
                <option value="Cold Call">Cold Call</option>
                <option value="Event / Expo">Event / Expo</option>
                <option value="Email Campaign">Email Campaign</option>
                <option value="Direct Outreach">Direct Outreach</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Lead Status */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '0.85rem' }}>
                <Tag size={14} color="#2563eb" />
                <span>Lead Status</span>
              </label>
              <select
                className="form-control select-filter"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="New">New</option>
                <option value="Contacted">Contacted</option>
                <option value="Follow-Up">Follow-Up</option>
                <option value="Qualified">Qualified</option>
                <option value="Interested">Interested</option>
                <option value="Converted">Converted</option>
                <option value="Not Interested">Not Interested</option>
                <option value="Invalid">Invalid</option>
              </select>
            </div>

            {/* Priority */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '0.85rem' }}>
                <Flag size={14} color="#2563eb" />
                <span>Priority</span>
              </label>
              <select
                className="form-control select-filter"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>

            {/* Estimated Value */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '0.85rem' }}>
                <DollarSign size={14} color="#2563eb" />
                <span>Estimated Value (₹)</span>
              </label>
              <input
                type="number"
                min="0"
                className="form-control"
                placeholder="e.g. 450000"
                value={formData.estimatedValue}
                onChange={(e) => setFormData({ ...formData, estimatedValue: e.target.value })}
              />
            </div>

            {/* Assigned Sales User */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '0.85rem' }}>
                <UserIcon size={14} color="#2563eb" />
                <span>Assigned Sales User</span>
              </label>
              <select
                className="form-control select-filter"
                value={formData.assignedSalesUser}
                onChange={(e) => setFormData({ ...formData, assignedSalesUser: e.target.value })}
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
            </div>

            {/* Assigned Manager */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '0.85rem' }}>
                <Shield size={14} color="#2563eb" />
                <span>Assigned Manager</span>
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Executive Leadership"
                value={formData.assignedManager}
                onChange={(e) => setFormData({ ...formData, assignedManager: e.target.value })}
              />
            </div>

            {/* Requirement */}
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '0.85rem' }}>
                <Briefcase size={14} color="#2563eb" />
                <span>Customer Requirement / Specification</span>
              </label>
              <textarea
                className="form-control"
                rows={2}
                placeholder="Describe product requirements, seat requirements, integrations..."
                value={formData.requirement}
                onChange={(e) => setFormData({ ...formData, requirement: e.target.value })}
              />
            </div>

            {/* Next Follow-Up Date & Time */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '0.85rem' }}>
                <Calendar size={14} color="#2563eb" />
                <span>Next Follow-Up Date</span>
              </label>
              <input
                type="date"
                className="form-control"
                value={formData.nextFollowUpDate}
                onChange={(e) => setFormData({ ...formData, nextFollowUpDate: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '0.85rem' }}>
                <Clock size={14} color="#2563eb" />
                <span>Next Follow-Up Time</span>
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. 11:00 AM or 03:30 PM"
                value={formData.nextFollowUpTime}
                onChange={(e) => setFormData({ ...formData, nextFollowUpTime: e.target.value })}
              />
            </div>

            {/* Remarks */}
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '0.85rem' }}>
                <FileText size={14} color="#2563eb" />
                <span>Remarks & Context</span>
              </label>
              <textarea
                className="form-control"
                rows={2}
                placeholder="Add conversation notes, client feedback, next steps..."
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              />
            </div>
          </div>

          <div className="modal-footer" style={{ padding: '16px 0 0', marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid #f1f5f9' }}>
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
