import React, { useState, useEffect } from 'react';
import { useLeads } from '../../context/LeadContext';
import {
  X,
  CheckCircle2,
  AlertCircle,
  FileText,
  DollarSign,
  Calendar,
  MessageSquare,
} from 'lucide-react';

export const QualifyLeadModal = () => {
  const { isQualifyModalOpen, leadToQualify, closeQualifyModal, qualifyLead } = useLeads();

  const [requirement, setRequirement] = useState('');
  const [dealValue, setDealValue] = useState('');
  const [expectedCloseDate, setExpectedCloseDate] = useState('');
  const [remarks, setRemarks] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  useEffect(() => {
    if (leadToQualify && isQualifyModalOpen) {
      setRequirement(leadToQualify.requirement || '');
      setDealValue(leadToQualify.estimatedValue || leadToQualify.dealValue || '');

      let fDate = '';
      if (leadToQualify.nextFollowUpDate || leadToQualify.next_followup_at) {
        try {
          fDate = new Date(leadToQualify.nextFollowUpDate || leadToQualify.next_followup_at).toISOString().split('T')[0];
        } catch {}
      }
      if (!fDate) {
        const d = new Date();
        d.setDate(d.getDate() + 30);
        fDate = d.toISOString().split('T')[0];
      }
      setExpectedCloseDate(fDate);
      setRemarks(leadToQualify.remarks || leadToQualify.notes || '');
      setServerError('');
    }
  }, [leadToQualify, isQualifyModalOpen]);

  if (!isQualifyModalOpen || !leadToQualify) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setServerError('');

    try {
      const payload = {
        requirement: requirement.trim(),
        estimatedValue: dealValue ? Number(dealValue) : 0,
        dealValue: dealValue ? Number(dealValue) : 0,
        expectedCloseDate: expectedCloseDate || null,
        nextFollowUpDate: expectedCloseDate || null,
        remarks: remarks.trim(),
      };

      await qualifyLead(leadToQualify._id || leadToQualify.leadId, payload);
    } catch (err) {
      setServerError(err.message || 'Failed to qualify lead');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop active" onClick={closeQualifyModal} style={{ zIndex: 1200 }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '580px', width: '92%', maxHeight: '90vh', overflowY: 'auto' }}
      >
        {/* Header */}
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
              <CheckCircle2 size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 className="modal-title" style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>
                  Qualify Lead
                </h3>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, padding: '2px 8px', borderRadius: '6px', background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' }}>
                  {leadToQualify.leadId || 'LD-001'}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {leadToQualify.company ? `${leadToQualify.company} • ` : ''}{leadToQualify.name || leadToQualify.contactPerson}
              </p>
            </div>
          </div>
          <button type="button" className="btn-icon" onClick={closeQualifyModal} aria-label="Close modal">
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
          <div style={{ marginBottom: '16px', padding: '10px 14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.82rem', color: '#475569' }}>
            Verify client intent and requirement details to advance this lead to <strong>Qualified</strong> status for opportunity conversion.
          </div>

          {/* Customer Requirement */}
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '0.85rem' }}>
              <FileText size={14} color="#059669" />
              <span>Customer Requirement / Needs</span>
            </label>
            <textarea
              className="form-control"
              rows={3}
              placeholder="e.g. Enterprise CRM migration, 50 user licenses, Q3 deployment target..."
              value={requirement}
              onChange={(e) => setRequirement(e.target.value)}
            />
          </div>

          <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            {/* Estimated Deal Value */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '0.85rem' }}>
                <DollarSign size={14} color="#059669" />
                <span>Estimated Deal Value (₹)</span>
              </label>
              <input
                type="number"
                min="0"
                step="any"
                className="form-control"
                placeholder="e.g. 250000"
                value={dealValue}
                onChange={(e) => setDealValue(e.target.value)}
              />
            </div>

            {/* Expected Closing Date */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '0.85rem' }}>
                <Calendar size={14} color="#059669" />
                <span>Expected Closing Date</span>
              </label>
              <input
                type="date"
                className="form-control"
                value={expectedCloseDate}
                onChange={(e) => setExpectedCloseDate(e.target.value)}
              />
            </div>
          </div>

          {/* Qualification Remarks */}
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '0.85rem' }}>
              <MessageSquare size={14} color="#059669" />
              <span>Qualification Remarks</span>
            </label>
            <textarea
              className="form-control"
              rows={2}
              placeholder="e.g. Budget approved by decision maker, ready for proposal stage."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={closeQualifyModal}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
              style={{
                backgroundColor: '#059669',
                borderColor: '#059669',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <CheckCircle2 size={16} />
              <span>{isSubmitting ? 'Qualifying...' : 'Mark as Qualified'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QualifyLeadModal;
