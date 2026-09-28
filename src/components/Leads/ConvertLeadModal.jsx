import React, { useState, useEffect } from 'react';
import { useLeads } from '../../context/LeadContext';
import { useUserManagement } from '../../context/UserContext';
import { useAuth } from '../../context/AuthContext';
import {
  X,
  Sparkles,
  AlertCircle,
  Building,
  DollarSign,
  Calendar,
  Flag,
  User as UserIcon,
  FileText,
  CheckCircle2,
  Lock,
} from 'lucide-react';

const STAGE_DEFAULT_PROBABILITIES = {
  Qualification: 20,
  'Needs Analysis': 40,
  Proposal: 60,
  Negotiation: 80,
  'Closed Won': 100,
  'Closed Lost': 0,
};

export const ConvertLeadModal = () => {
  const { isConvertModalOpen, leadToConvert, closeConvertModal, convertLeadToOpportunity } = useLeads();
  const { users } = useUserManagement();
  const { user: currentUser } = useAuth();

  const [oppName, setOppName] = useState('');
  const [dealValue, setDealValue] = useState('');
  const [stage, setStage] = useState('Qualification');
  const [expectedCloseDate, setExpectedCloseDate] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [remarks, setRemarks] = useState('');

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  const isAlreadyConverted = leadToConvert?.status === 'Converted' || !!leadToConvert?.opportunityId;
  const isEligibleStatus = leadToConvert?.status === 'Qualified' || leadToConvert?.status === 'Interested';

  useEffect(() => {
    if (leadToConvert) {
      const defaultName = `${leadToConvert.company || leadToConvert.name || leadToConvert.contactPerson} - Enterprise Opportunity`;
      setOppName(defaultName);
      setDealValue(leadToConvert.estimatedValue || leadToConvert.dealValue || '');
      setStage('Qualification');

      // Default expected close date: +30 days
      const d = new Date();
      d.setDate(d.getDate() + 30);
      setExpectedCloseDate(d.toISOString().split('T')[0]);

      setAssignedTo(leadToConvert.assignedSalesUser || leadToConvert.assignedTo || currentUser?.name || '');
      setRemarks(leadToConvert.remarks || leadToConvert.notes || '');
    }
    setErrors({});
    setServerError('');
  }, [leadToConvert, isConvertModalOpen, currentUser]);

  if (!isConvertModalOpen || !leadToConvert) return null;

  const validate = () => {
    const errs = {};
    if (!oppName.trim()) {
      errs.oppName = 'Opportunity name is required';
    }
    if (dealValue && isNaN(Number(dealValue))) {
      errs.dealValue = 'Deal value must be a valid number';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    if (isAlreadyConverted) {
      setServerError(`This Lead has already been converted to Opportunity ${leadToConvert.opportunityId || ''}.`);
      return;
    }

    if (!isEligibleStatus) {
      setServerError(`A Lead can be converted into an Opportunity only when its status is Qualified or Interested. Current status is '${leadToConvert.status}'.`);
      return;
    }

    setIsSubmitting(true);
    setServerError('');

    try {
      const payload = {
        opportunityName: oppName.trim(),
        dealValue: Number(dealValue) || 0,
        amount: Number(dealValue) || 0,
        stage,
        probability: STAGE_DEFAULT_PROBABILITIES[stage] || 20,
        expectedCloseDate: expectedCloseDate || null,
        assignedTo: assignedTo.trim() || currentUser?.name || 'Current User',
        remarks: remarks.trim(),
      };

      await convertLeadToOpportunity(leadToConvert._id || leadToConvert.leadId, payload);
    } catch (err) {
      setServerError(err.message || 'Failed to convert lead to opportunity');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop active" onClick={closeConvertModal} style={{ zIndex: 1200 }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '640px', width: '92%', maxHeight: '90vh', overflowY: 'auto' }}
      >
        <div className="modal-header" style={{ borderBottom: '1px solid #e2e8f0', padding: '16px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: '#ecfdf5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#059669',
              }}
            >
              <Sparkles size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 className="modal-title" style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>
                  Convert Lead to Opportunity
                </h3>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, padding: '2px 8px', borderRadius: '6px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' }}>
                  {leadToConvert.leadId || 'LD-001'}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Elevate qualified lead into an active sales opportunity in the pipeline.
              </p>
            </div>
          </div>
          <button type="button" className="btn-icon" onClick={closeConvertModal} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Status validation notices */}
        {isAlreadyConverted ? (
          <div className="alert alert-warning" style={{ margin: '16px 24px 0', display: 'flex', alignItems: 'center', gap: '8px', background: '#fef3c7', border: '1px solid #fde68a', color: '#b45309' }}>
            <Lock size={18} />
            <span>
              <strong>Duplicate Conversion Notice:</strong> This Lead has already been converted to Opportunity{' '}
              <strong>{leadToConvert.opportunityId || 'OP-001'}</strong>. Duplicate conversion is prohibited.
            </span>
          </div>
        ) : !isEligibleStatus ? (
          <div className="alert alert-danger" style={{ margin: '16px 24px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={18} />
            <span>
              A Lead can be converted into an Opportunity only when its status is <strong>Qualified</strong> or <strong>Interested</strong>. Current status is <strong>'{leadToConvert.status}'</strong>.
            </span>
          </div>
        ) : null}

        {serverError && (
          <div className="alert alert-danger" style={{ margin: '16px 24px 0', display: 'flex', gap: '8px' }}>
            <AlertCircle size={18} />
            <span>{serverError}</span>
          </div>
        )}

        {/* Lead Summary Info Card */}
        <div
          style={{
            margin: '16px 24px 0',
            padding: '12px 16px',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Source Lead:</div>
            <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#1e293b' }}>
              {leadToConvert.name || leadToConvert.contactPerson} {leadToConvert.company ? `(${leadToConvert.company})` : ''}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '3px 10px',
                borderRadius: '999px',
                background: leadToConvert.status === 'Qualified' ? '#ecfdf5' : '#f0fdf4',
                color: leadToConvert.status === 'Qualified' ? '#059669' : '#16a34a',
                border: '1px solid #bbf7d0',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <CheckCircle2 size={12} />
              Status: {leadToConvert.status}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="modal-body" style={{ padding: '20px 24px' }}>
          <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {/* Opportunity Name */}
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '0.85rem' }}>
                <Sparkles size={14} color="#059669" />
                <span>Opportunity Name <span style={{ color: '#ef4444' }}>*</span></span>
              </label>
              <input
                type="text"
                className={`form-control ${errors.oppName ? 'is-invalid' : ''}`}
                placeholder="e.g. Acme Enterprise Rollout"
                value={oppName}
                disabled={isAlreadyConverted || !isEligibleStatus}
                onChange={(e) => setOppName(e.target.value)}
                autoFocus
              />
              {errors.oppName && <span className="form-error-msg">{errors.oppName}</span>}
            </div>

            {/* Estimated Deal Value */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '0.85rem' }}>
                <DollarSign size={14} color="#059669" />
                <span>Estimated Deal Value (₹)</span>
              </label>
              <input
                type="number"
                min="0"
                className={`form-control ${errors.dealValue ? 'is-invalid' : ''}`}
                placeholder="e.g. 450000"
                value={dealValue}
                disabled={isAlreadyConverted || !isEligibleStatus}
                onChange={(e) => setDealValue(e.target.value)}
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
                className="form-control"
                value={expectedCloseDate}
                disabled={isAlreadyConverted || !isEligibleStatus}
                onChange={(e) => setExpectedCloseDate(e.target.value)}
              />
            </div>

            {/* Opportunity Stage (Default Qualification) */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '0.85rem' }}>
                <Flag size={14} color="#059669" />
                <span>Opportunity Stage</span>
              </label>
              <select
                className="form-control select-filter"
                value={stage}
                disabled={isAlreadyConverted || !isEligibleStatus}
                onChange={(e) => setStage(e.target.value)}
              >
                <option value="Qualification">Qualification (Default)</option>
                <option value="Needs Analysis">Needs Analysis</option>
                <option value="Proposal">Proposal</option>
                <option value="Negotiation">Negotiation</option>
                <option value="Closed Won">Closed Won</option>
                <option value="Closed Lost">Closed Lost</option>
              </select>
            </div>

            {/* Assigned User */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '0.85rem' }}>
                <UserIcon size={14} color="#059669" />
                <span>Assigned Representative</span>
              </label>
              <select
                className="form-control select-filter"
                value={assignedTo}
                disabled={isAlreadyConverted || !isEligibleStatus}
                onChange={(e) => setAssignedTo(e.target.value)}
              >
                {(users || []).map((u) => (
                  <option key={u._id || u.id} value={u.name || u.username}>
                    {u.name || u.username} ({u.role || 'Member'})
                  </option>
                ))}
              </select>
            </div>

            {/* Remarks */}
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '0.85rem' }}>
                <FileText size={14} color="#059669" />
                <span>Remarks & Conversion Notes</span>
              </label>
              <textarea
                className="form-control"
                rows={3}
                placeholder="Add conversion rationale, client timeline, deal notes..."
                value={remarks}
                disabled={isAlreadyConverted || !isEligibleStatus}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer" style={{ padding: '16px 0 0', marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid #f1f5f9' }}>
            <button type="button" className="btn btn-secondary" onClick={closeConvertModal} disabled={isSubmitting}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting || isAlreadyConverted || !isEligibleStatus}
              style={{
                minWidth: '160px',
                background: isAlreadyConverted || !isEligibleStatus ? '#94a3b8' : '#059669',
                borderColor: isAlreadyConverted || !isEligibleStatus ? '#94a3b8' : '#059669',
              }}
            >
              {isSubmitting ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div className="spinner-sm" />
                  <span>Converting...</span>
                </div>
              ) : isAlreadyConverted ? (
                'Already Converted'
              ) : (
                'Convert to Opportunity'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
