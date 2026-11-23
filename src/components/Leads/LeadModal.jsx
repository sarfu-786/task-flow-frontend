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
  Calendar,
  Clock,
  Briefcase,
  Shield,
  AlertTriangle,
  ArrowRight,
  MapPin,
  IndianRupee,
  CheckCircle2,
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
  const {
    leads,
    isLeadModalOpen,
    modalMode,
    selectedLead,
    closeLeadModal,
    createLead,
    updateLead,
    checkDuplicate,
    openLeadDetailModal,
  } = useLeads();
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

  // Smart Sales Department Matching & Live Lead Workload calculation
  const isSalesDepartment = (dept = '') => {
    const d = (dept || '').toLowerCase();
    return (
      d.includes('sales') ||
      d.includes('sell') ||
      d.includes('business development') ||
      d.includes('marketing') ||
      d.includes('commercial')
    );
  };

  const getActiveLeadCount = (u) => {
    const uName = (u?.name || u?.username || '').toLowerCase().trim();
    if (!uName) return 0;
    const closedStatuses = ['Converted', 'Not Interested', 'Invalid', 'Lost'];
    return (leads || []).filter((l) => {
      if (!l || closedStatuses.includes(l.status)) return false;
      const lOwner = (l.assignedSalesUser || l.assignedTo || '').toLowerCase().trim();
      return lOwner === uName;
    }).length;
  };

  const resolveManagerNameForUser = (userName) => {
    if (!userName) return 'Executive Leadership';
    const target = activeUsers.find(
      (u) => (u.name || '').toLowerCase() === userName.toLowerCase() || (u.username || '').toLowerCase() === userName.toLowerCase()
    );
    if (!target) return 'Executive Leadership';
    if (target.reportsToName) return target.reportsToName;
    if (target.reportsTo) {
      const mgr = activeUsers.find((m) => (m._id || m.id || '').toString() === target.reportsTo.toString());
      if (mgr) return `${mgr.name} (${mgr.role || 'Manager'})`;
    }
    return 'Executive Leadership';
  };

  const evaluatedAssignees = assignableUsers.map((u) => {
    const activeCount = getActiveLeadCount(u);
    const isSales = isSalesDepartment(u.department);
    const loadLabel =
      activeCount === 0
        ? '🟢 Free'
        : activeCount <= 4
        ? `🟢 ${activeCount} active`
        : `🟡 ${activeCount} active`;
    return { user: u, isSales, activeCount, loadLabel };
  });

  const recommendedSalesReps = evaluatedAssignees
    .filter((item) => item.isSales)
    .sort((a, b) => a.activeCount - b.activeCount);

  const otherTeamMembers = evaluatedAssignees
    .filter((item) => !item.isSales)
    .sort((a, b) => a.activeCount - b.activeCount);

  const managerOptions = activeUsers.filter((u) =>
    ['Super Admin', 'Administrator', 'Executive', 'Manager'].includes(u.role)
  );

  const [formData, setFormData] = useState({
    contactPerson: '',
    company: '',
    mobileNumber: '',
    email: '',
    city: '',
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
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);

  // Debounced real-time duplicate detection strictly for identical email or phone number
  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      const email = formData.email?.trim();
      const phone = formData.mobileNumber?.trim();

      // Only check if email or phone is entered
      if (!email && !phone) {
        setDuplicateWarning(null);
        return;
      }

      try {
        setIsCheckingDuplicate(true);
        const excludeId = modalMode === 'edit' && selectedLead
          ? (selectedLead._id ? selectedLead._id.toString() : (selectedLead.leadId || selectedLead.lead_id || ''))
          : null;
        const res = await checkDuplicate({
          email,
          phone,
          excludeLeadId: excludeId,
          excludeId,
        });

        if (active) {
          if (res && res.isDuplicate) {
            setDuplicateWarning(res);
          } else {
            setDuplicateWarning(null);
          }
        }
      } catch (err) {
        // Non-blocking catch
      } finally {
        if (active) setIsCheckingDuplicate(false);
      }
    }, 450);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [formData.email, formData.mobileNumber, modalMode, selectedLead, checkDuplicate]);

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
          (l.leadId && selectedLead.leadId && l.leadId.toString().toLowerCase() === selectedLead.leadId.toString().toLowerCase()) ||
          (l.lead_id && selectedLead.lead_id && l.lead_id.toString().toLowerCase() === selectedLead.lead_id.toString().toLowerCase()) ||
          (l.leadId && selectedLead.lead_id && l.leadId.toString().toLowerCase() === selectedLead.lead_id.toString().toLowerCase()) ||
          (l.lead_id && selectedLead.leadId && l.lead_id.toString().toLowerCase() === selectedLead.leadId.toString().toLowerCase());
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

      const existingVal = selectedLead.estimatedValue || selectedLead.dealValue || selectedLead.pipeline_value || '';
      setFormData({
        contactPerson: selectedLead.contactPerson || selectedLead.name || '',
        company: selectedLead.company || '',
        mobileNumber: selectedLead.mobileNumber || selectedLead.phone || '',
        email: selectedLead.email || '',
        city: selectedLead.city || '',
        source: selectedLead.source || 'Website',
        requirement: selectedLead.requirement || '',
        status: selectedLead.status || 'New',
        priority: selectedLead.priority || 'Medium',
        estimatedValue: existingVal ? String(existingVal) : '',
        assignedSalesUser: selectedLead.assignedSalesUser || selectedLead.assignedTo || '',
        assignedManager: selectedLead.assignedManagerName || selectedLead.assignedManager || '',
        remarks: selectedLead.remarks || selectedLead.notes || '',
        nextFollowUpDate: fDate,
        nextFollowUpTime: selectedLead.nextFollowUpTime || '',
      });
    } else {
      const defaultSalesRep = recommendedSalesReps[0]?.user?.name || currentUser?.name || '';
      setFormData({
        contactPerson: '',
        company: '',
        mobileNumber: '',
        email: '',
        city: '',
        source: 'Website',
        requirement: '',
        status: 'New',
        priority: 'Medium',
        estimatedValue: '',
        assignedSalesUser: defaultSalesRep,
        assignedManager: resolveManagerNameForUser(defaultSalesRep),
        remarks: '',
        nextFollowUpDate: '',
        nextFollowUpTime: '',
      });
    }
    setErrors({});
    setServerError('');
    setDuplicateWarning(null);
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
    if (formData.nextFollowUpDate && formData.nextFollowUpDate < new Date().toISOString().split('T')[0]) {
      errs.nextFollowUpDate = 'Follow-up date cannot be in the past';
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
      const parsedVal = formData.estimatedValue !== '' ? Math.max(0, Number(formData.estimatedValue) || 0) : 0;

      const payload = {
        name: formData.contactPerson.trim(),
        contactPerson: formData.contactPerson.trim(),
        company: formData.company.trim(),
        phone: formData.mobileNumber.trim(),
        mobileNumber: formData.mobileNumber.trim(),
        email: formData.email.trim().toLowerCase(),
        city: (formData.city || '').trim(),
        source: formData.source,
        requirement: formData.requirement.trim(),
        status: formData.status,
        priority: formData.priority,
        estimatedValue: parsedVal,
        dealValue: parsedVal,
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
        style={{ maxWidth: '680px', width: '92%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
      >
        <div className="modal-header" style={{ borderBottom: '1px solid #e2e8f0', padding: '16px 24px', flexShrink: 0 }}>
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

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: '1 1 auto', minHeight: 0, overflow: 'hidden' }}>
          <div className="modal-body custom-scrollbar" style={{ padding: '20px 24px', overflowY: 'auto', flex: '1 1 auto', minHeight: 0 }}>
            {serverError && (
              <div className="alert alert-danger" style={{ marginBottom: '16px', display: 'flex', gap: '8px' }}>
                <AlertCircle size={18} />
                <span>{serverError}</span>
              </div>
            )}

            {/* Real-Time Duplicate Warning Alert */}
            {duplicateWarning && (
              <div
                style={{
                  marginBottom: '16px',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  backgroundColor: '#fffbeb',
                  border: '1.5px solid #fde68a',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  animation: 'fadeIn 0.2s ease',
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: '#fef3c7',
                    color: '#d97706',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <AlertTriangle size={18} />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                    <strong style={{ fontSize: '0.86rem', color: '#92400e' }}>
                      ⚠️ Duplicate Lead Warning
                    </strong>
                    {duplicateWarning.matchedBy && (
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          backgroundColor: '#fef3c7',
                          color: '#b45309',
                          border: '1px solid #fde68a',
                          textTransform: 'uppercase',
                        }}
                      >
                        Matched by {duplicateWarning.matchedBy}
                      </span>
                    )}
                  </div>

                  <p style={{ margin: '4px 0 6px', fontSize: '0.78rem', color: '#78350f', lineHeight: 1.4 }}>
                    {duplicateWarning.message || 'An existing lead matches this contact information.'}
                    {duplicateWarning.matchedLead && (
                      <span>
                        {' '}(<strong>{duplicateWarning.matchedLead.leadId || 'LD-MATCH'}</strong> — {duplicateWarning.matchedLead.name || duplicateWarning.matchedLead.contactPerson}{duplicateWarning.matchedLead.company ? ` at ${duplicateWarning.matchedLead.company}` : ''}{duplicateWarning.matchedLead.assignedTo ? ` • Owner: ${duplicateWarning.matchedLead.assignedTo}` : ''})
                      </span>
                    )}
                  </p>

                  {duplicateWarning.matchedLead && (
                    <button
                      type="button"
                      onClick={() => {
                        closeLeadModal();
                        openLeadDetailModal(duplicateWarning.matchedLead);
                      }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        backgroundColor: '#ffffff',
                        color: '#b45309',
                        border: '1px solid #fde68a',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        marginTop: '2px',
                      }}
                    >
                      <span>Review Existing Lead Details</span>
                      <ArrowRight size={12} />
                    </button>
                  )}
                </div>
              </div>
            )}

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

            {/* Estimated Deal Value (₹) */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '0.85rem' }}>
                <IndianRupee size={14} color="#059669" />
                <span>Estimated Deal Value (₹)</span>
              </label>
              <input
                type="number"
                min="0"
                step="any"
                className="form-control"
                placeholder="e.g. 50000"
                value={formData.estimatedValue}
                onChange={(e) => setFormData({ ...formData, estimatedValue: e.target.value })}
              />
            </div>

            {/* City / Location */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '0.85rem' }}>
                <MapPin size={14} color="#2563eb" />
                <span>City / Territory</span>
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Delhi, Noida, Patna, Mumbai"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
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
                <option value="Justdial">Justdial</option>
                <option value="IndiaMART">IndiaMART</option>
                <option value="TradeIndia">TradeIndia</option>
                <option value="Google Search Ads">Google Search Ads</option>
                <option value="Facebook / Instagram Ads">Facebook / Instagram Ads</option>
                <option value="LinkedIn">LinkedIn</option>
                <option value="WhatsApp">WhatsApp</option>
                <option value="Referral">Referral</option>
                <option value="Cold Call">Cold Call</option>
                <option value="Inbound Call">Inbound Call</option>
                <option value="Email Campaign">Email Campaign</option>
                <option value="Event / Expo">Event / Expo</option>
                <option value="Direct Outreach">Direct Outreach</option>
                <option value="Walk-In">Walk-In</option>
                <option value="Partner / Affiliate">Partner / Affiliate</option>
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
                disabled={modalMode === 'edit' && selectedLead?.status === 'Converted'}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="New">New</option>
                <option value="Contacted">Contacted</option>
                <option value="Follow-Up">Follow-Up</option>
                <option value="Qualified">Qualified</option>
                <option value="Interested">Interested</option>
                {modalMode === 'edit' && selectedLead?.status === 'Converted' && (
                  <option value="Converted">Converted (Linked to Opportunity)</option>
                )}
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

            {/* Assigned Sales User (Smart Sales Team Routing & Live Workload) */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '0.85rem' }}>
                <UserIcon size={14} color="#2563eb" />
                <span>Assigned Sales User</span>
              </label>
              <select
                className="form-control select-filter"
                value={formData.assignedSalesUser}
                onChange={(e) => {
                  const nextRep = e.target.value;
                  setFormData({
                    ...formData,
                    assignedSalesUser: nextRep,
                    assignedManager: resolveManagerNameForUser(nextRep),
                  });
                }}
              >
                {recommendedSalesReps.length > 0 && (
                  <optgroup label="⭐ Recommended (Sales & BD Team)">
                    {recommendedSalesReps.map(({ user: u, loadLabel }) => (
                      <option key={u._id || u.id || u.email} value={u.name || u.username}>
                        {u.name || u.username} ({u.department || 'Sales'}) — {loadLabel}
                      </option>
                    ))}
                  </optgroup>
                )}
                <optgroup label={recommendedSalesReps.length > 0 ? 'Other Authorized Members' : 'All Authorized Members'}>
                  {otherTeamMembers.map(({ user: u, loadLabel }) => (
                    <option key={u._id || u.id || u.email} value={u.name || u.username}>
                      {u.name || u.username} ({u.department || u.role || 'Member'}) — {loadLabel}
                    </option>
                  ))}
                </optgroup>
              </select>
              {(() => {
                const selectedEval = evaluatedAssignees.find(
                  (item) => (item.user.name || item.user.username) === formData.assignedSalesUser
                );
                if (!selectedEval) return null;
                if (selectedEval.isSales) {
                  return (
                    <span style={{ fontSize: '0.71rem', color: '#059669', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                      <CheckCircle2 size={12} />
                      <span>Sales Team Match ({selectedEval.loadLabel})</span>
                    </span>
                  );
                }
                return (
                  <span style={{ fontSize: '0.71rem', color: '#b45309', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                    <AlertCircle size={12} />
                    <span>Department: {selectedEval.user.department || 'General'} (Recommended: Sales & BD)</span>
                  </span>
                );
              })()}
            </div>

            {/* Assigned Manager (Auto-derived from Hierarchy + Dropdown) */}
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '0.85rem' }}>
                <Shield size={14} color="#2563eb" />
                <span>Reporting Manager (Auto-synced from Hierarchy)</span>
              </label>
              <select
                className="form-control select-filter"
                value={formData.assignedManager}
                onChange={(e) => setFormData({ ...formData, assignedManager: e.target.value })}
              >
                <option value="Executive Leadership">Executive Leadership (Root)</option>
                {managerOptions.map((m) => {
                  const mgrVal = `${m.name} (${m.role || 'Manager'})`;
                  return (
                    <option key={m._id || m.id || m.email} value={mgrVal}>
                      {mgrVal}
                    </option>
                  );
                })}
                {formData.assignedManager &&
                  formData.assignedManager !== 'Executive Leadership' &&
                  !managerOptions.some((m) => `${m.name} (${m.role || 'Manager'})` === formData.assignedManager) && (
                    <option value={formData.assignedManager}>{formData.assignedManager}</option>
                  )}
              </select>
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
                min={new Date().toISOString().split('T')[0]}
                className={`form-control ${errors.nextFollowUpDate ? 'is-invalid' : ''}`}
                value={formData.nextFollowUpDate}
                onChange={(e) => setFormData({ ...formData, nextFollowUpDate: e.target.value })}
              />
              {errors.nextFollowUpDate && <span className="form-error-msg">{errors.nextFollowUpDate}</span>}
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '0.85rem' }}>
                <Clock size={14} color="#2563eb" />
                <span>Next Follow-Up Time</span>
              </label>
              <input
                type="time"
                className="form-control"
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
        </div>

        <div className="modal-footer" style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', flexShrink: 0 }}>
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
