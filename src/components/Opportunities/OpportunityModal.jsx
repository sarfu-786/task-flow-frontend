import React, { useState, useEffect } from 'react';
import { useOpportunities, STAGES, LOST_REASONS } from '../../context/OpportunityContext';
import { useLeads } from '../../context/LeadContext';
import { useUserManagement } from '../../context/UserContext';
import { useAuth } from '../../context/AuthContext';
import {
  X,
  Save,
  PlusCircle,
  AlertCircle,
  TrendingUp,
  Building,
  DollarSign,
  Calendar,
  Flag,
  User as UserIcon,
  FileText,
  Percent,
  Link,
  Phone,
  Mail,
  Share2,
  AlertTriangle,
  HelpCircle,
} from 'lucide-react';

const STAGE_DEFAULT_PROBABILITIES = {
  'New Opportunity': 10,
  Contacted: 25,
  'Requirement Understanding': 40,
  'Proposal / Quotation': 60,
  Negotiation: 80,
  Won: 100,
  Lost: 0,
  Qualification: 20,
  'Needs Analysis': 40,
  Proposal: 60,
  'Closed Won': 100,
  'Closed Lost': 0,
};

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

export const OpportunityModal = () => {
  const {
    isOpportunityModalOpen,
    modalMode,
    selectedOpportunity,
    closeOpportunityModal,
    createOpportunity,
    updateOpportunity,
  } = useOpportunities();
  const { leads } = useLeads();
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
    contactPerson: '',
    email: '',
    phone: '',
    leadSource: 'Website',
    originalLeadId: '',
    relatedLead: '',
    relatedLeadName: '',
    amount: '',
    stage: 'New Opportunity',
    probability: 10,
    expectedCloseDate: '',
    priority: 'Medium',
    assignedTo: '',
    notes: '',
    lostReason: 'Price too high',
    lostReasonDetails: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  useEffect(() => {
    if (modalMode === 'edit' && selectedOpportunity) {
      setFormData({
        name: selectedOpportunity.name || selectedOpportunity.opportunityName || '',
        company: selectedOpportunity.company || '',
        contactPerson: selectedOpportunity.contactPerson || '',
        email: selectedOpportunity.email || '',
        phone: selectedOpportunity.phone || '',
        leadSource: selectedOpportunity.leadSource || selectedOpportunity.campaign_source || 'Website',
        originalLeadId: selectedOpportunity.originalLeadId || selectedOpportunity.leadId || '',
        relatedLead: selectedOpportunity.relatedLead || '',
        relatedLeadName: selectedOpportunity.relatedLeadName || '',
        amount: selectedOpportunity.amount !== undefined ? selectedOpportunity.amount : (selectedOpportunity.dealValue || ''),
        stage: selectedOpportunity.stage || 'New Opportunity',
        probability: selectedOpportunity.probability !== undefined ? selectedOpportunity.probability : 10,
        expectedCloseDate: selectedOpportunity.expectedCloseDate
          ? new Date(selectedOpportunity.expectedCloseDate).toISOString().split('T')[0]
          : '',
        priority: selectedOpportunity.priority || 'Medium',
        assignedTo: selectedOpportunity.assignedTo || '',
        notes: selectedOpportunity.notes || selectedOpportunity.remarks || '',
        lostReason: selectedOpportunity.lostReason || 'Price too high',
        lostReasonDetails: selectedOpportunity.lostReasonDetails || '',
      });
    } else {
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 30);
      setFormData({
        name: '',
        company: '',
        contactPerson: '',
        email: '',
        phone: '',
        leadSource: 'Website',
        originalLeadId: '',
        relatedLead: '',
        relatedLeadName: '',
        amount: '',
        stage: 'New Opportunity',
        probability: 10,
        expectedCloseDate: defaultDate.toISOString().split('T')[0],
        priority: 'Medium',
        assignedTo: currentUser?.name || '',
        notes: '',
        lostReason: 'Price too high',
        lostReasonDetails: '',
      });
    }
    setErrors({});
    setServerError('');
  }, [modalMode, selectedOpportunity, isOpportunityModalOpen, currentUser]);

  if (!isOpportunityModalOpen) return null;

  const handleStageChange = (newStage) => {
    setFormData((prev) => ({
      ...prev,
      stage: newStage,
      probability: STAGE_DEFAULT_PROBABILITIES[newStage] !== undefined ? STAGE_DEFAULT_PROBABILITIES[newStage] : prev.probability,
    }));
  };

  const handleLeadSelect = (e) => {
    const leadId = e.target.value;
    if (!leadId) {
      setFormData((prev) => ({ ...prev, relatedLead: '', relatedLeadName: '', originalLeadId: '' }));
      return;
    }
    const matchedLead = leads.find((l) => (l._id && l._id.toString() === leadId) || l.leadId === leadId || l.lead_id === leadId);
    if (matchedLead) {
      setFormData((prev) => ({
        ...prev,
        relatedLead: matchedLead._id,
        relatedLeadName: matchedLead.name || matchedLead.contactPerson,
        company: prev.company || matchedLead.company || '',
        contactPerson: prev.contactPerson || matchedLead.contactPerson || matchedLead.name || '',
        email: prev.email || matchedLead.email || '',
        phone: prev.phone || matchedLead.phone || matchedLead.mobileNumber || '',
        leadSource: prev.leadSource || matchedLead.source || matchedLead.campaign_source || 'Website',
        originalLeadId: matchedLead.leadId || matchedLead.lead_id || '',
        amount: prev.amount || matchedLead.estimatedValue || matchedLead.dealValue || '',
      }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) {
      errs.name = 'Opportunity name is required';
    }
    if (formData.amount && isNaN(Number(formData.amount))) {
      errs.amount = 'Amount must be a valid number';
    }
    if (formData.expectedCloseDate && formData.expectedCloseDate < new Date().toISOString().split('T')[0]) {
      errs.expectedCloseDate = 'Expected close date cannot be in the past';
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
      const isLost = formData.stage === 'Lost' || formData.stage === 'Closed Lost';
      const payload = {
        name: formData.name.trim(),
        opportunityName: formData.name.trim(),
        company: formData.company.trim(),
        contactPerson: formData.contactPerson.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        leadSource: formData.leadSource.trim(),
        originalLeadId: formData.originalLeadId.trim(),
        relatedLead: formData.relatedLead || null,
        relatedLeadName: formData.relatedLeadName.trim(),
        amount: Number(formData.amount) || 0,
        dealValue: Number(formData.amount) || 0,
        stage: formData.stage,
        probability: Number(formData.probability) || 10,
        expectedCloseDate: formData.expectedCloseDate || null,
        priority: formData.priority,
        assignedTo: formData.assignedTo || currentUser?.name || 'Current User',
        notes: formData.notes.trim(),
        remarks: formData.notes.trim(),
        lostReason: isLost ? formData.lostReason : '',
        lostReasonDetails: isLost ? formData.lostReasonDetails.trim() : '',
      };

      if (modalMode === 'edit' && selectedOpportunity) {
        await updateOpportunity(selectedOpportunity._id, payload);
      } else {
        await createOpportunity(payload);
      }
    } catch (err) {
      setServerError(err.message || 'Failed to save opportunity');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLostStage = formData.stage === 'Lost' || formData.stage === 'Closed Lost';

  return (
    <div className="modal-backdrop active" onClick={closeOpportunityModal} style={{ zIndex: 1200 }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '680px', width: '92%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
      >
        <div className="modal-header" style={{ borderBottom: '1px solid #e2e8f0', padding: '16px 24px', flexShrink: 0 }}>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 className="modal-title" style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>
                  {modalMode === 'edit' ? 'Edit Opportunity' : 'New Sales Opportunity'}
                </h3>
                {formData.originalLeadId && (
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, padding: '2px 8px', borderRadius: '6px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' }}>
                    From Lead: {formData.originalLeadId}
                  </span>
                )}
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {modalMode === 'edit' ? 'Update sales deal parameters, pipeline stage and status' : 'Add a deal to your revenue pipeline'}
              </p>
            </div>
          </div>
          <button type="button" className="btn-icon" onClick={closeOpportunityModal} aria-label="Close modal">
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
            <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {/* Opportunity Name */}
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '0.85rem' }}>
                <TrendingUp size={14} color="#059669" />
                <span>Opportunity / Deal Name <span style={{ color: '#ef4444' }}>*</span></span>
              </label>
              <input
                type="text"
                className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                placeholder="e.g. Acme Enterprise Rollout"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                autoFocus
              />
              {errors.name && <span className="form-error-msg">{errors.name}</span>}
            </div>

            {/* Company Name */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '0.85rem' }}>
                <Building size={14} color="#059669" />
                <span>Company Name</span>
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Acme Corp"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              />
            </div>

            {/* Contact Person */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '0.85rem' }}>
                <UserIcon size={14} color="#059669" />
                <span>Contact Person</span>
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Rahul Sharma"
                value={formData.contactPerson}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
              />
            </div>

            {/* Phone */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '0.85rem' }}>
                <Phone size={14} color="#059669" />
                <span>Phone Number</span>
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. +91 98765 43210"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            {/* Email */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '0.85rem' }}>
                <Mail size={14} color="#059669" />
                <span>Email Address</span>
              </label>
              <input
                type="email"
                className="form-control"
                placeholder="e.g. rahul@acme.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            {/* Lead Source */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '0.85rem' }}>
                <Share2 size={14} color="#059669" />
                <span>Lead Source</span>
              </label>
              <select
                className="form-control select-filter"
                value={formData.leadSource}
                onChange={(e) => setFormData({ ...formData, leadSource: e.target.value })}
              >
                <option value="Website">Website</option>
                <option value="Inbound Call">Inbound Call</option>
                <option value="Outbound Call">Outbound Call</option>
                <option value="Referral">Referral</option>
                <option value="LinkedIn">LinkedIn</option>
                <option value="Meta Ads">Meta Ads</option>
                <option value="Google Ads">Google Ads</option>
                <option value="Organic Search">Organic Search</option>
                <option value="Event/Exhibition">Event/Exhibition</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Related Lead */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '0.85rem' }}>
                <Link size={14} color="#059669" />
                <span>Linked Lead Record</span>
              </label>
              <select
                className="form-control select-filter"
                value={formData.relatedLead || ''}
                onChange={handleLeadSelect}
              >
                <option value="">-- Optional / None --</option>
                {leads.map((l) => (
                  <option key={l._id} value={l._id}>
                    {l.name} {l.company ? `(${l.company})` : ''} [{l.status}]
                  </option>
                ))}
              </select>
            </div>

            {/* Deal Amount */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '0.85rem' }}>
                <DollarSign size={14} color="#059669" />
                <span>Deal Value / Amount (₹)</span>
              </label>
              <input
                type="number"
                min="0"
                step="1000"
                className={`form-control ${errors.amount ? 'is-invalid' : ''}`}
                placeholder="e.g. 450000"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              />
              {errors.amount && <span className="form-error-msg">{errors.amount}</span>}
            </div>

            {/* Stage */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '0.85rem' }}>
                <Flag size={14} color="#059669" />
                <span>Pipeline Stage</span>
              </label>
              <select
                className="form-control select-filter"
                value={formData.stage}
                onChange={(e) => handleStageChange(e.target.value)}
              >
                {STAGES.map((s) => (
                  <option key={s} value={s}>
                    {s} ({STAGE_DEFAULT_PROBABILITIES[s] !== undefined ? `${STAGE_DEFAULT_PROBABILITIES[s]}%` : ''})
                  </option>
                ))}
              </select>
            </div>

            {/* Probability */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '0.85rem' }}>
                <Percent size={14} color="#059669" />
                <span>Win Probability (%)</span>
              </label>
              <input
                type="number"
                min="0"
                max="100"
                className="form-control"
                value={formData.probability}
                onChange={(e) => setFormData({ ...formData, probability: e.target.value })}
              />
            </div>

            {/* Expected Close Date */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '0.85rem' }}>
                <Calendar size={14} color="#059669" />
                <span>Expected Close Date</span>
              </label>
              <input
                type="date"
                min={new Date().toISOString().split('T')[0]}
                className={`form-control ${errors.expectedCloseDate ? 'is-invalid' : ''}`}
                value={formData.expectedCloseDate}
                onChange={(e) => setFormData({ ...formData, expectedCloseDate: e.target.value })}
              />
              {errors.expectedCloseDate && <span className="form-error-msg">{errors.expectedCloseDate}</span>}
            </div>

            {/* Priority */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '0.85rem' }}>
                <Flag size={14} color="#059669" />
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
              </select>
            </div>

            {/* Assigned To */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '0.85rem' }}>
                <UserIcon size={14} color="#059669" />
                <span>Assigned Deal Owner</span>
              </label>
              <select
                className="form-control select-filter"
                value={formData.assignedTo}
                onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
              >
                {assignableUsers.map((u) => (
                  <option key={u._id || u.id || u.email} value={u.name || u.username}>
                    {u.name || u.username} ({u.role || 'Member'})
                  </option>
                ))}
              </select>
            </div>

            {/* Conditional Lost Reason Section if stage is Lost */}
            {isLostStage && (
              <div
                style={{
                  gridColumn: 'span 2',
                  padding: '14px 16px',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#b91c1c', fontWeight: 700, fontSize: '0.9rem' }}>
                  <AlertTriangle size={16} />
                  <span>Lost Deal Details & Reason</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem', color: '#991b1b' }}>
                      Primary Lost Reason <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <select
                      className="form-control"
                      value={formData.lostReason}
                      onChange={(e) => setFormData({ ...formData, lostReason: e.target.value })}
                      style={{ background: '#fff', borderColor: '#fca5a5' }}
                    >
                      {LOST_REASONS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem', color: '#991b1b' }}>
                      Lost Reason Details / Feedback
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Budget slashed by 40% / Competitor offered ₹3.2L"
                      value={formData.lostReasonDetails}
                      onChange={(e) => setFormData({ ...formData, lostReasonDetails: e.target.value })}
                      style={{ background: '#fff', borderColor: '#fca5a5' }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '0.85rem' }}>
                <FileText size={14} color="#059669" />
                <span>Opportunity Notes & Next Steps</span>
              </label>
              <textarea
                className="form-control"
                rows={3}
                placeholder="Key requirements, client decision makers, proposal details..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="modal-footer" style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', flexShrink: 0 }}>
            <button type="button" className="btn btn-secondary" onClick={closeOpportunityModal} disabled={isSubmitting}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
              style={{
                minWidth: '130px',
                background: 'linear-gradient(135deg, #059669, #10b981)',
                borderColor: '#059669',
              }}
            >
              {isSubmitting ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div className="spinner-sm" />
                  <span>Saving...</span>
                </div>
              ) : modalMode === 'edit' ? (
                'Save Changes'
              ) : (
                'Create Deal'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

