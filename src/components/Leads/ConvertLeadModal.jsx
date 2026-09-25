import React, { useState, useEffect } from 'react';
import { useLeads } from '../../context/LeadContext';
import { useUserManagement } from '../../context/UserContext';
import { useAuth } from '../../context/AuthContext';
import {
  X,
  TrendingUp,
  AlertCircle,
  Building,
  DollarSign,
  Calendar,
  Flag,
  User as UserIcon,
  FileText,
  Percent,
  CheckCircle2,
} from 'lucide-react';

const STAGE_DEFAULT_PROBABILITIES = {
  Qualification: 20,
  Proposal: 50,
  Negotiation: 80,
  Won: 100,
  Lost: 0,
};

export const ConvertLeadModal = () => {
  const { isConvertModalOpen, leadToConvert, closeConvertModal, convertLeadToOpportunity } = useLeads();
  const { users } = useUserManagement();
  const { user: currentUser } = useAuth();

  const [oppName, setOppName] = useState('');
  const [company, setCompany] = useState('');
  const [amount, setAmount] = useState('');
  const [stage, setStage] = useState('Qualification');
  const [probability, setProbability] = useState(20);
  const [expectedCloseDate, setExpectedCloseDate] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [assignedTo, setAssignedTo] = useState('');
  const [notes, setNotes] = useState('');

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  useEffect(() => {
    if (leadToConvert) {
      setOppName(`${leadToConvert.name} - Deal`);
      setCompany(leadToConvert.company || '');
      setAmount('');
      setStage('Qualification');
      setProbability(20);

      // Default close date 30 days in future
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 30);
      setExpectedCloseDate(defaultDate.toISOString().split('T')[0]);

      setPriority(leadToConvert.priority || 'Medium');
      setAssignedTo(leadToConvert.assignedTo || currentUser?.name || '');
      setNotes(leadToConvert.notes ? `Converted from Lead: ${leadToConvert.notes}` : '');
    }
    setErrors({});
    setServerError('');
  }, [leadToConvert, isConvertModalOpen, currentUser]);

  if (!isConvertModalOpen || !leadToConvert) return null;

  const handleStageChange = (newStage) => {
    setStage(newStage);
    if (STAGE_DEFAULT_PROBABILITIES[newStage] !== undefined) {
      setProbability(STAGE_DEFAULT_PROBABILITIES[newStage]);
    }
  };

  const validate = () => {
    const errs = {};
    if (!oppName.trim()) {
      errs.oppName = 'Opportunity name is required';
    }
    if (amount && isNaN(Number(amount))) {
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
        opportunityName: oppName.trim(),
        company: company.trim(),
        amount: Number(amount) || 0,
        stage,
        probability: Number(probability) || 20,
        expectedCloseDate: expectedCloseDate || null,
        priority,
        assignedTo: assignedTo || leadToConvert.assignedTo || currentUser?.name || 'Current User',
        notes: notes.trim(),
      };

      await convertLeadToOpportunity(leadToConvert._id, payload);
    } catch (err) {
      setServerError(err.message || 'Failed to convert lead to opportunity');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop active" onClick={closeConvertModal}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '640px', width: '92%' }}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
              }}
            >
              <TrendingUp size={20} />
            </div>
            <div>
              <h3 className="modal-title" style={{ margin: 0, fontSize: '1.25rem' }}>
                Convert Lead to Opportunity
              </h3>
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Elevate qualified lead <strong>"{leadToConvert.name}"</strong> into an active deal in your sales pipeline.
              </p>
            </div>
          </div>
          <button type="button" className="btn-icon" onClick={closeConvertModal} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

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
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Converting Lead:</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {leadToConvert.name} {leadToConvert.company ? `(${leadToConvert.company})` : ''}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                padding: '3px 8px',
                borderRadius: '999px',
                background: '#ecfdf5',
                color: '#059669',
                border: '1px solid #a7f3d0',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <CheckCircle2 size={12} />
              Qualified Lead
            </span>
          </div>
        </div>

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
                className={`form-input ${errors.oppName ? 'is-invalid' : ''}`}
                placeholder="e.g. TechNova Enterprise Rollout"
                value={oppName}
                onChange={(e) => setOppName(e.target.value)}
                autoFocus
              />
              {errors.oppName && <span className="error-feedback">{errors.oppName}</span>}
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
                placeholder="e.g. TechNova Solutions"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
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
                placeholder="e.g. 350000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              {errors.amount && <span className="error-feedback">{errors.amount}</span>}
            </div>

            {/* Initial Stage */}
            <div className="form-group">
              <label className="form-label">Initial Stage</label>
              <select
                className="form-select"
                value={stage}
                onChange={(e) => handleStageChange(e.target.value)}
              >
                <option value="Qualification">Qualification (20%)</option>
                <option value="Proposal">Proposal (50%)</option>
                <option value="Negotiation">Negotiation (80%)</option>
                <option value="Won">Won (100%)</option>
                <option value="Lost">Lost (0%)</option>
              </select>
            </div>

            {/* Probability % */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Percent size={14} color="var(--primary)" />
                <span>Probability (%)</span>
              </label>
              <input
                type="number"
                min="0"
                max="100"
                className="form-input"
                value={probability}
                onChange={(e) => setProbability(e.target.value)}
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
                value={expectedCloseDate}
                onChange={(e) => setExpectedCloseDate(e.target.value)}
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
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
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
                <span>Assigned Deal Owner</span>
              </label>
              <select
                className="form-select"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
              >
                {(users || [])
                  .filter((u) => u.status !== 'Rejected' && u.status !== 'Pending')
                  .map((u) => (
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
                <span>Opportunity Notes</span>
              </label>
              <textarea
                className="form-textarea"
                rows={2}
                placeholder="Add deal context, proposal specifics, timeline..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer" style={{ padding: '16px 0 0', marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button type="button" className="btn btn-secondary" onClick={closeConvertModal} disabled={isSubmitting}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
              style={{
                background: 'linear-gradient(135deg, #059669, #10b981)',
                borderColor: '#059669',
                minWidth: '150px',
              }}
            >
              {isSubmitting ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div className="spinner-sm" />
                  <span>Converting...</span>
                </div>
              ) : (
                'Create Opportunity'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
