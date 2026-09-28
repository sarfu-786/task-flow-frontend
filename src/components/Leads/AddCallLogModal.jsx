import React, { useState, useEffect } from 'react';
import { useLeads } from '../../context/LeadContext';
import { useAuth } from '../../context/AuthContext';
import {
  X,
  PhoneCall,
  PhoneOutgoing,
  PhoneIncoming,
  Calendar,
  Clock,
  User,
  MessageSquare,
  FileText,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Tag,
} from 'lucide-react';

export const AddCallLogModal = () => {
  const { isAddCallModalOpen, leadForCall, closeAddCallModal, recordCall } = useLeads();
  const { user: currentUser } = useAuth();

  const [formData, setFormData] = useState({
    salesUser: '',
    callType: 'Outgoing',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    callStatus: 'Connected Successfully',
    duration: '',
    callOutcome: 'Interested',
    leadResponse: '',
    remarks: '',
    nextAction: 'Call Back',
    nextFollowUpDate: '',
    nextFollowUpTime: '',
    updateStatus: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  useEffect(() => {
    if (isAddCallModalOpen && leadForCall) {
      const now = new Date();
      setFormData({
        salesUser: currentUser?.name || 'Sales Representative',
        callType: 'Outgoing',
        date: now.toISOString().split('T')[0],
        time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        callStatus: 'Connected Successfully',
        duration: '',
        callOutcome: 'Interested',
        leadResponse: '',
        remarks: '',
        nextAction: '',
        nextFollowUpDate: '',
        nextFollowUpTime: '',
        updateStatus: '',
      });
      setServerError('');
    }
  }, [isAddCallModalOpen, leadForCall, currentUser]);

  if (!isAddCallModalOpen || !leadForCall) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setServerError('');

    try {
      const payload = {
        salesUser: formData.salesUser.trim() || currentUser?.name || 'Sales Representative',
        callType: formData.callType,
        date: formData.date,
        time: formData.time,
        callStatus: formData.callStatus,
        duration: formData.duration.trim(),
        callOutcome: formData.callOutcome,
        leadResponse: formData.leadResponse.trim(),
        remarks: formData.remarks.trim(),
        nextAction: formData.nextAction.trim(),
        nextFollowUpDate: formData.nextFollowUpDate || '',
        nextFollowUpTime: formData.nextFollowUpTime || '',
        updateStatus: formData.updateStatus || '',
      };

      await recordCall(leadForCall._id || leadForCall.leadId, payload);
    } catch (err) {
      setServerError(err.message || 'Failed to record communication call log');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop active" onClick={closeAddCallModal} style={{ zIndex: 1200 }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '640px', width: '92%', maxHeight: '90vh', overflowY: 'auto' }}
      >
        {/* Header */}
        <div className="modal-header" style={{ borderBottom: '1px solid #e2e8f0', padding: '16px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: '#eff6ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#2563eb',
              }}
            >
              <PhoneCall size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 className="modal-title" style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>
                  Record Call / Communication Log
                </h3>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, padding: '2px 8px', borderRadius: '6px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' }}>
                  {leadForCall.leadId || 'LD-001'}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {leadForCall.company ? `${leadForCall.company} • ` : ''}{leadForCall.name || leadForCall.contactPerson} ({leadForCall.phone || leadForCall.mobileNumber || 'No phone'})
              </p>
            </div>
          </div>
          <button type="button" className="btn-icon" onClick={closeAddCallModal} aria-label="Close modal">
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
            {/* Sales User */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '0.85rem' }}>
                <User size={14} color="#2563eb" />
                <span>Sales User</span>
              </label>
              <input
                type="text"
                className="form-control"
                value={formData.salesUser}
                onChange={(e) => setFormData({ ...formData, salesUser: e.target.value })}
                required
              />
            </div>

            {/* Call Type */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '0.85rem' }}>
                {formData.callType === 'Incoming' ? <PhoneIncoming size={14} color="#059669" /> : <PhoneOutgoing size={14} color="#2563eb" />}
                <span>Call Type</span>
              </label>
              <select
                className="form-control select-filter"
                value={formData.callType}
                onChange={(e) => setFormData({ ...formData, callType: e.target.value })}
              >
                <option value="Outgoing">Outgoing Call</option>
                <option value="Incoming">Incoming Call</option>
              </select>
            </div>

            {/* Date */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '0.85rem' }}>
                <Calendar size={14} color="#2563eb" />
                <span>Date</span>
              </label>
              <input
                type="date"
                className="form-control"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>

            {/* Exact Time */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '0.85rem' }}>
                <Clock size={14} color="#2563eb" />
                <span>Exact Time</span>
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. 10:00 AM, 03:30 PM"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                required
              />
            </div>

            {/* Call Status */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '0.85rem' }}>
                <PhoneCall size={14} color="#2563eb" />
                <span>Call Status</span>
              </label>
              <select
                className="form-control select-filter"
                value={formData.callStatus}
                onChange={(e) => {
                  const newStatus = e.target.value;
                  let autoAction = formData.nextAction;
                  if (newStatus === 'No Answer' || newStatus === 'Busy' || newStatus === 'Switched Off' || newStatus === 'Number Not Reachable') {
                    autoAction = 'Call Again';
                  } else if (newStatus === 'Call Back Requested') {
                    autoAction = 'Call Back';
                  }
                  setFormData({ ...formData, callStatus: newStatus, nextAction: autoAction });
                }}
              >
                <option value="No Answer">No Answer</option>
                <option value="Call Received">Call Received</option>
                <option value="Busy">Busy</option>
                <option value="Switched Off">Switched Off</option>
                <option value="Number Not Reachable">Number Not Reachable</option>
                <option value="Call Back Requested">Call Back Requested</option>
                <option value="Connected Successfully">Connected Successfully</option>
              </select>
            </div>

            {/* Call Outcome */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '0.85rem' }}>
                <CheckCircle2 size={14} color="#2563eb" />
                <span>Call Outcome</span>
              </label>
              <select
                className="form-control select-filter"
                value={formData.callOutcome}
                onChange={(e) => setFormData({ ...formData, callOutcome: e.target.value })}
              >
                <option value="Interested">Interested</option>
                <option value="Not Interested">Not Interested</option>
                <option value="Need More Information">Need More Information</option>
                <option value="Call Later">Call Later</option>
                <option value="Meeting Requested">Meeting Requested</option>
                <option value="Proposal Requested">Proposal Requested</option>
                <option value="Qualified">Qualified</option>
                <option value="Not Qualified">Not Qualified</option>
                <option value="No Response">No Response</option>
              </select>
            </div>

            {/* Call Duration (optional) */}
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '0.85rem' }}>
                <Clock size={14} color="#64748b" />
                <span>Call Duration (Optional)</span>
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. 1m 15s or 6m 40s"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              />
            </div>

            {/* Lead Response (Quote) */}
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '0.85rem' }}>
                <MessageSquare size={14} color="#2563eb" />
                <span>Lead Response (Client's exact words / feedback)</span>
              </label>
              <input
                type="text"
                className="form-control"
                placeholder='e.g. "Abhi busy hoon, 4 ghante baad call kijiye."'
                value={formData.leadResponse}
                onChange={(e) => setFormData({ ...formData, leadResponse: e.target.value })}
              />
            </div>

            {/* Remarks */}
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '0.85rem' }}>
                <FileText size={14} color="#2563eb" />
                <span>Sales Remarks & Interaction Notes</span>
              </label>
              <textarea
                className="form-control"
                rows={2}
                placeholder="e.g. Lead is interested in the product and wants pricing details for 50 seats."
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              />
            </div>

            {/* Next Action */}
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '0.85rem' }}>
                <ArrowRight size={14} color="#2563eb" />
                <span>Next Action</span>
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Call Again, Call Back, Send Proposal, Schedule Demo"
                value={formData.nextAction}
                onChange={(e) => setFormData({ ...formData, nextAction: e.target.value })}
              />
            </div>

            {/* Next Follow-Up Date & Time */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '0.85rem' }}>
                <Calendar size={14} color="#2563eb" />
                <span>Next Follow-Up Date (Optional)</span>
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
                placeholder="e.g. 03:30 PM"
                value={formData.nextFollowUpTime}
                onChange={(e) => setFormData({ ...formData, nextFollowUpTime: e.target.value })}
              />
            </div>

            {/* Optional status update */}
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '0.85rem' }}>
                <Tag size={14} color="#2563eb" />
                <span>Update Lead Status (Optional)</span>
              </label>
              <select
                className="form-control select-filter"
                value={formData.updateStatus}
                onChange={(e) => setFormData({ ...formData, updateStatus: e.target.value })}
              >
                <option value="">Keep Current Status ({leadForCall.status || 'New'})</option>
                <option value="Contacted">Contacted</option>
                <option value="Follow-Up">Follow-Up</option>
                <option value="Interested">Interested</option>
                <option value="Qualified">Qualified</option>
                <option value="Not Interested">Not Interested</option>
              </select>
            </div>
          </div>

          <div className="modal-footer" style={{ padding: '16px 0 0', marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid #f1f5f9' }}>
            <button type="button" className="btn btn-secondary" onClick={closeAddCallModal} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting} style={{ minWidth: '140px' }}>
              {isSubmitting ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div className="spinner-sm" />
                  <span>Saving...</span>
                </div>
              ) : (
                'Save Call Log'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
