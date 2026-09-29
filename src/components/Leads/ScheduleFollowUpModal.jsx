import React, { useState, useEffect } from 'react';
import { useLeads } from '../../context/LeadContext';
import { useAuth } from '../../context/AuthContext';
import { useUserManagement } from '../../context/UserContext';
import {
  X,
  Calendar,
  Clock,
  User,
  FileText,
  AlertCircle,
  Clock3,
  HelpCircle,
} from 'lucide-react';

export const ScheduleFollowUpModal = () => {
  const { isScheduleFollowUpModalOpen, leadForFollowUp, closeScheduleFollowUpModal, scheduleFollowUp } = useLeads();
  const { user: currentUser } = useAuth();
  const { users } = useUserManagement();

  const activeUsers = (users || []).filter((u) => u.status !== 'Rejected');

  const [formData, setFormData] = useState({
    followUpDate: '',
    followUpTime: '',
    reason: '',
    assignedTo: '',
    remarks: '',
    status: 'Pending',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  useEffect(() => {
    if (isScheduleFollowUpModalOpen && leadForFollowUp) {
      setFormData({
        followUpDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        followUpTime: '11:00 AM',
        reason: 'Call back requested by client',
        assignedTo: leadForFollowUp.assignedSalesUser || leadForFollowUp.assignedTo || currentUser?.name || 'Current User',
        remarks: '',
        status: 'Pending',
      });
      setServerError('');
    }
  }, [isScheduleFollowUpModalOpen, leadForFollowUp, currentUser]);

  if (!isScheduleFollowUpModalOpen || !leadForFollowUp) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.followUpDate) {
      setServerError('Please select a valid follow-up date');
      return;
    }
    if (formData.followUpDate < new Date().toISOString().split('T')[0]) {
      setServerError('Follow-up date cannot be in the past');
      return;
    }

    setIsSubmitting(true);
    setServerError('');

    try {
      const payload = {
        followUpDate: formData.followUpDate,
        followUpTime: formData.followUpTime.trim(),
        reason: formData.reason.trim() || 'Scheduled Follow-Up',
        assignedTo: formData.assignedTo.trim() || currentUser?.name || 'Current User',
        remarks: formData.remarks.trim(),
        status: formData.status,
      };

      await scheduleFollowUp(leadForFollowUp._id || leadForFollowUp.leadId, payload);
    } catch (err) {
      setServerError(err.message || 'Failed to schedule follow-up');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop active" onClick={closeScheduleFollowUpModal} style={{ zIndex: 1200 }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '580px', width: '92%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
      >
        <div className="modal-header" style={{ borderBottom: '1px solid #e2e8f0', padding: '16px 24px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: '#fffbeb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#d97706',
              }}
            >
              <Clock3 size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 className="modal-title" style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>
                  Schedule Follow-Up
                </h3>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, padding: '2px 8px', borderRadius: '6px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' }}>
                  {leadForFollowUp.leadId || 'LD-001'}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {leadForFollowUp.company ? `${leadForFollowUp.company} • ` : ''}{leadForFollowUp.name || leadForFollowUp.contactPerson}
              </p>
            </div>
          </div>
          <button type="button" className="btn-icon" onClick={closeScheduleFollowUpModal} aria-label="Close modal">
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
            {/* Follow-Up Date */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '0.85rem' }}>
                <Calendar size={14} color="#2563eb" />
                <span>Follow-Up Date <span style={{ color: '#ef4444' }}>*</span></span>
              </label>
              <input
                type="date"
                min={new Date().toISOString().split('T')[0]}
                className="form-control"
                value={formData.followUpDate}
                onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
                required
              />
            </div>

            {/* Follow-Up Time */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '0.85rem' }}>
                <Clock size={14} color="#2563eb" />
                <span>Follow-Up Time</span>
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. 03:30 PM"
                value={formData.followUpTime}
                onChange={(e) => setFormData({ ...formData, followUpTime: e.target.value })}
              />
            </div>

            {/* Reason */}
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '0.85rem' }}>
                <HelpCircle size={14} color="#2563eb" />
                <span>Reason for Follow-Up</span>
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Lead requested callback after 4 hours, proposal review"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                required
              />
            </div>

            {/* Assigned User */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '0.85rem' }}>
                <User size={14} color="#2563eb" />
                <span>Assigned Sales User</span>
              </label>
              <select
                className="form-control select-filter"
                value={formData.assignedTo}
                onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
              >
                {activeUsers.map((u) => (
                  <option key={u._id || u.id} value={u.name || u.username}>
                    {u.name || u.username} ({u.role || 'User'})
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '0.85rem' }}>
                <span>Status</span>
              </label>
              <select
                className="form-control select-filter"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="Pending">Pending</option>
                <option value="Completed">Completed</option>
                <option value="Rescheduled">Rescheduled</option>
                <option value="Cancelled">Cancelled</option>
                <option value="No Response">No Response</option>
              </select>
            </div>

            {/* Remarks */}
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '0.85rem' }}>
                <FileText size={14} color="#2563eb" />
                <span>Remarks & Instructions</span>
              </label>
              <textarea
                className="form-control"
                rows={2}
                placeholder="Add background context for the follow-up..."
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="modal-footer" style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', flexShrink: 0 }}>
            <button type="button" className="btn btn-secondary" onClick={closeScheduleFollowUpModal} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting} style={{ minWidth: '140px' }}>
              {isSubmitting ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div className="spinner-sm" />
                  <span>Scheduling...</span>
                </div>
              ) : (
                'Schedule Follow-Up'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
