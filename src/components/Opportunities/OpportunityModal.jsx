import React, { useState, useEffect } from 'react';
import { useOpportunities, STAGES } from '../../context/OpportunityContext';
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
} from 'lucide-react';

const STAGE_DEFAULT_PROBABILITIES = {
  Qualification: 20,
  Proposal: 50,
  Negotiation: 80,
  Won: 100,
  Lost: 0,
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
    relatedLead: '',
    relatedLeadName: '',
    amount: '',
    stage: 'Qualification',
    probability: 20,
    expectedCloseDate: '',
    priority: 'Medium',
    assignedTo: '',
    notes: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  useEffect(() => {
    if (modalMode === 'edit' && selectedOpportunity) {
      setFormData({
        name: selectedOpportunity.name || '',
        company: selectedOpportunity.company || '',
        relatedLead: selectedOpportunity.relatedLead || '',
        relatedLeadName: selectedOpportunity.relatedLeadName || '',
        amount: selectedOpportunity.amount !== undefined ? selectedOpportunity.amount : '',
        stage: selectedOpportunity.stage || 'Qualification',
        probability: selectedOpportunity.probability !== undefined ? selectedOpportunity.probability : 20,
        expectedCloseDate: selectedOpportunity.expectedCloseDate
          ? new Date(selectedOpportunity.expectedCloseDate).toISOString().split('T')[0]
          : '',
        priority: selectedOpportunity.priority || 'Medium',
        assignedTo: selectedOpportunity.assignedTo || '',
        notes: selectedOpportunity.notes || '',
      });
    } else {
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 30);
      setFormData({
        name: '',
        company: '',
        relatedLead: '',
        relatedLeadName: '',
        amount: '',
        stage: 'Qualification',
        probability: 20,
        expectedCloseDate: defaultDate.toISOString().split('T')[0],
        priority: 'Medium',
        assignedTo: currentUser?.name || '',
        notes: '',
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
      setFormData((prev) => ({ ...prev, relatedLead: '', relatedLeadName: '' }));
      return;
    }
    const matchedLead = leads.find((l) => l._id.toString() === leadId);
    if (matchedLead) {
      setFormData((prev) => ({
        ...prev,
        relatedLead: matchedLead._id,
        relatedLeadName: matchedLead.name,
        company: prev.company || matchedLead.company || '',
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
        relatedLead: formData.relatedLead || null,
        relatedLeadName: formData.relatedLeadName.trim(),
        amount: Number(formData.amount) || 0,
        stage: formData.stage,
        probability: Number(formData.probability) || 20,
        expectedCloseDate: formData.expectedCloseDate || null,
        priority: formData.priority,
        assignedTo: formData.assignedTo || currentUser?.name || 'Current User',
        notes: formData.notes.trim(),
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

  return (
    <div className="modal-backdrop active" onClick={closeOpportunityModal}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '640px', width: '92%' }}
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
                {modalMode === 'edit' ? 'Edit Opportunity' : 'New Sales Opportunity'}
              </h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {modalMode === 'edit' ? 'Update sales deal parameters and status' : 'Add a deal to your revenue pipeline'}
              </p>
            </div>
          </div>
          <button type="button" className="btn-icon" onClick={closeOpportunityModal} aria-label="Close modal">
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
            {/* Opportunity Name */}
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <TrendingUp size={14} color="var(--primary)" />
                <span>Opportunity / Deal Name *</span>
              </label>
              <input
                type="text"
                className={`form-input ${errors.name ? 'is-invalid' : ''}`}
                placeholder="e.g. CloudScale Enterprise Rollout"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                autoFocus
              />
              {errors.name && <span className="error-feedback">{errors.name}</span>}
            </div>

            {/* Company Name */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Building size={14} color="var(--primary)" />
                <span>Company</span>
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. CloudScale Infotech"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              />
            </div>

            {/* Related Lead */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Link size={14} color="var(--primary)" />
                <span>Related Lead</span>
              </label>
              <select
                className="form-select"
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
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <DollarSign size={14} color="var(--primary)" />
                <span>Deal Value / Amount (₹)</span>
              </label>
              <input
                type="number"
                min="0"
                step="1000"
                className={`form-input ${errors.amount ? 'is-invalid' : ''}`}
                placeholder="e.g. 450000"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              />
              {errors.amount && <span className="error-feedback">{errors.amount}</span>}
            </div>

            {/* Stage */}
            <div className="form-group">
              <label className="form-label">Pipeline Stage</label>
              <select
                className="form-select"
                value={formData.stage}
                onChange={(e) => handleStageChange(e.target.value)}
              >
                {STAGES.map((s) => (
                  <option key={s} value={s}>
                    {s} ({STAGE_DEFAULT_PROBABILITIES[s]}%)
                  </option>
                ))}
              </select>
            </div>

            {/* Probability */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Percent size={14} color="var(--primary)" />
                <span>Win Probability (%)</span>
              </label>
              <input
                type="number"
                min="0"
                max="100"
                className="form-input"
                value={formData.probability}
                onChange={(e) => setFormData({ ...formData, probability: e.target.value })}
              />
            </div>

            {/* Expected Close Date */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={14} color="var(--primary)" />
                <span>Expected Close Date</span>
              </label>
              <input
                type="date"
                className="form-input"
                value={formData.expectedCloseDate}
                onChange={(e) => setFormData({ ...formData, expectedCloseDate: e.target.value })}
              />
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
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <UserIcon size={14} color="var(--primary)" />
                <span>Assigned Deal Owner</span>
              </label>
              <select
                className="form-select"
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

            {/* Notes */}
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileText size={14} color="var(--primary)" />
                <span>Opportunity Notes & Next Steps</span>
              </label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="Key requirements, client decision makers, proposal details..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>

          <div className="modal-footer" style={{ padding: '16px 0 0', marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button type="button" className="btn btn-secondary" onClick={closeOpportunityModal} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting} style={{ minWidth: '130px' }}>
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
