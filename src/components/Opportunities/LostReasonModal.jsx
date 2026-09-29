import React, { useState, useEffect } from 'react';
import { useOpportunities, LOST_REASONS } from '../../context/OpportunityContext';
import { X, AlertTriangle, FileText, CheckCircle } from 'lucide-react';

export const LostReasonModal = () => {
  const {
    isLostReasonModalOpen,
    opportunityToMarkLost,
    closeLostReasonModal,
    submitMarkLost,
  } = useOpportunities();

  const [lostReason, setLostReason] = useState('Price too high');
  const [lostReasonDetails, setLostReasonDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isLostReasonModalOpen && opportunityToMarkLost) {
      setLostReason(opportunityToMarkLost.lostReason || 'Price too high');
      setLostReasonDetails(opportunityToMarkLost.lostReasonDetails || '');
      setError('');
    }
  }, [isLostReasonModalOpen, opportunityToMarkLost]);

  if (!isLostReasonModalOpen || !opportunityToMarkLost) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!lostReason) {
      setError('Please select a reason for marking this opportunity as Lost.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await submitMarkLost(lostReason, lostReasonDetails);
    } catch (err) {
      setError(err.message || 'Failed to update opportunity status');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop active" onClick={closeLostReasonModal} style={{ zIndex: 1200 }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '520px', width: '92%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
      >
        <div className="modal-header" style={{ borderBottom: '1px solid #fee2e2', background: '#fef2f2', padding: '16px 20px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: '#fee2e2',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #fecaca',
              }}
            >
              <AlertTriangle size={20} />
            </div>
            <div>
              <h3 className="modal-title" style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#991b1b' }}>
                Record Lost Deal Reason
              </h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#b91c1c' }}>
                Capture feedback and reason for moving this deal to Lost
              </p>
            </div>
          </div>
          <button type="button" className="btn-icon" onClick={closeLostReasonModal} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: '1 1 auto', minHeight: 0, overflow: 'hidden' }}>
          <div className="modal-body custom-scrollbar" style={{ padding: '16px 20px', overflowY: 'auto', flex: '1 1 auto', minHeight: 0 }}>
            {error && (
              <div className="alert alert-danger" style={{ marginBottom: '14px', display: 'flex', gap: '8px' }}>
                <span>{error}</span>
              </div>
            )}

            {/* Opportunity Summary Card */}
            <div
              style={{
                marginBottom: '14px',
                padding: '12px 14px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
              }}
            >
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>OPPORTUNITY</div>
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#1e293b', marginTop: '2px' }}>
                {opportunityToMarkLost.name} {opportunityToMarkLost.company ? `(${opportunityToMarkLost.company})` : ''}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>
                Deal Value:{' '}
                <strong style={{ color: '#059669' }}>
                  ₹{Number(opportunityToMarkLost.amount || opportunityToMarkLost.dealValue || 0).toLocaleString('en-IN')}
                </strong>{' '}
                • Owner: {opportunityToMarkLost.assignedTo || 'Unassigned'}
              </div>
            </div>

            {/* Lost Reason Dropdown */}
            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem', color: '#1e293b', marginBottom: '6px' }}>
                Primary Reason for Loss <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                className="form-control select-filter"
                value={lostReason}
                onChange={(e) => setLostReason(e.target.value)}
                style={{ padding: '8px 12px', fontSize: '0.88rem' }}
                autoFocus
              >
                {LOST_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {/* Details / Comments */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '0.85rem', color: '#1e293b' }}>
                <FileText size={14} color="#64748b" />
                <span>Additional Notes / Competitive Context (Optional)</span>
              </label>
              <textarea
                className="form-control"
                rows={3}
                placeholder="e.g. Selected competitor X due to custom SLA requirements. May reconnect in Q3..."
                value={lostReasonDetails}
                onChange={(e) => setLostReasonDetails(e.target.value)}
                style={{ fontSize: '0.85rem' }}
              />
            </div>
          </div>

          <div className="modal-footer" style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid #f1f5f9', background: '#f8fafc', flexShrink: 0 }}>
            <button type="button" className="btn btn-secondary" onClick={closeLostReasonModal} disabled={isSubmitting}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-danger"
              disabled={isSubmitting}
              style={{
                minWidth: '130px',
                background: '#dc2626',
                borderColor: '#dc2626',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              {isSubmitting ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div className="spinner-sm" />
                  <span>Saving...</span>
                </div>
              ) : (
                'Mark as Lost'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
