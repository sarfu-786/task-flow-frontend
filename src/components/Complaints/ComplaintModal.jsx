import React, { useState, useEffect } from 'react';
import { useComplaints } from '../../context/ComplaintContext';
import { useUserManagement } from '../../context/UserContext';
import { useAuth } from '../../context/AuthContext';
import {
  X,
  AlertCircle,
  Clock,
  User,
  Building,
  Mail,
  Phone,
  Tag,
  Save,
  FileText,
} from 'lucide-react';

export const ComplaintModal = ({ isOpen, onClose, complaintToEdit }) => {
  const { createComplaint, updateComplaint } = useComplaints();
  const { users } = useUserManagement ? useUserManagement() : { users: [] };
  const { user: currentUser } = useAuth();

  const isEdit = !!complaintToEdit;

  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    organization: '',
    subject: '',
    description: '',
    category: 'Technical Glitch',
    priority: 'Medium',
    slaHours: 24,
    status: 'Logged',
    assignedToName: 'Unassigned',
  });

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (complaintToEdit) {
      setFormData({
        customerName: complaintToEdit.customerName || '',
        customerEmail: complaintToEdit.customerEmail || '',
        customerPhone: complaintToEdit.customerPhone || '',
        organization: complaintToEdit.organization || '',
        subject: complaintToEdit.subject || '',
        description: complaintToEdit.description || '',
        category: complaintToEdit.category || 'Technical Glitch',
        priority: complaintToEdit.priority || 'Medium',
        slaHours: complaintToEdit.slaHours || 24,
        status: complaintToEdit.status || 'Logged',
        assignedToName: complaintToEdit.assignedToName || 'Unassigned',
      });
    } else {
      setFormData({
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        organization: '',
        subject: '',
        description: '',
        category: 'Technical Glitch',
        priority: 'Medium',
        slaHours: 24,
        status: 'Logged',
        assignedToName: currentUser?.name || 'Unassigned',
      });
    }
    setError('');
  }, [complaintToEdit, currentUser, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'priority') {
      let hours = 24;
      if (value === 'Urgent') hours = 4;
      else if (value === 'High') hours = 12;
      else if (value === 'Low') hours = 48;
      setFormData((prev) => ({ ...prev, [name]: value, slaHours: hours }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.customerName.trim()) {
      setError('Customer name is required');
      return;
    }
    if (!formData.subject.trim()) {
      setError('Subject is required');
      return;
    }
    if (!formData.description.trim()) {
      setError('Description is required');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      if (isEdit) {
        await updateComplaint(complaintToEdit._id, formData);
      } else {
        await createComplaint(formData);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save complaint');
    } finally {
      setSubmitting(false);
    }
  };

  const eligibleAssignees = (users || []).filter((u) => u.status === 'Approved');

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(5px)',
        WebkitBackdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px',
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '620px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          animation: 'slideUp 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(to right, #ffffff, #f8fafc)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: '#fef2f2',
                color: '#dc2626',
                border: '1px solid #fee2e2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <AlertCircle size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                {isEdit ? 'Edit Complaint' : 'Log New Complaint'}
              </h2>
              <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '2px 0 0 0' }}>
                {isEdit
                  ? `Updating Ticket ${complaintToEdit?.ticketNumber || ''}`
                  : 'Enter customer and ticket details to register a complaint.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              border: 'none',
              background: '#f1f5f9',
              color: '#64748b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form
          onSubmit={handleSubmit}
          style={{
            padding: '22px 24px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {error && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: '10px',
                background: '#fef2f2',
                border: '1px solid #fee2e2',
                color: '#dc2626',
                fontSize: '0.82rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Row 1: Customer Name & Organization */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Customer Name <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                type="text"
                name="customerName"
                value={formData.customerName}
                onChange={handleChange}
                placeholder="e.g. John Doe"
                required
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.88rem',
                  color: '#0f172a',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Company / Organization
              </label>
              <input
                type="text"
                name="organization"
                value={formData.organization}
                onChange={handleChange}
                placeholder="e.g. Acme Corp"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.88rem',
                  color: '#0f172a',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* Row 2: Email & Phone */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Email Address
              </label>
              <input
                type="email"
                name="customerEmail"
                value={formData.customerEmail}
                onChange={handleChange}
                placeholder="e.g. john@example.com"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.88rem',
                  color: '#0f172a',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Phone Number
              </label>
              <input
                type="text"
                name="customerPhone"
                value={formData.customerPhone}
                onChange={handleChange}
                placeholder="e.g. +1 555-0199"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.88rem',
                  color: '#0f172a',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* Row 3: Subject */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
              Complaint Subject / Title <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              placeholder="e.g. Delayed delivery or portal login failure"
              required
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                fontSize: '0.88rem',
                color: '#0f172a',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Row 4: Category, Priority, Assignee */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Category
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.85rem',
                  color: '#0f172a',
                  background: '#ffffff',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              >
                <option value="Technical Glitch">Technical Glitch</option>
                <option value="Product Defect">Product Defect</option>
                <option value="Service Delay">Service Delay</option>
                <option value="Billing Query">Billing Query</option>
                <option value="Hardware Fault">Hardware Fault</option>
                <option value="Account Access">Account Access</option>
                <option value="Quality Assurance">Quality Assurance</option>
                <option value="General Support">General Support</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Priority & SLA
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.85rem',
                  color: '#0f172a',
                  background: '#ffffff',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              >
                <option value="Urgent">🔴 Urgent (4h SLA)</option>
                <option value="High">🟠 High (12h SLA)</option>
                <option value="Medium">🟡 Medium (24h SLA)</option>
                <option value="Low">🟢 Low (48h SLA)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Assign Coordinator
              </label>
              <select
                name="assignedToName"
                value={formData.assignedToName}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.85rem',
                  color: '#0f172a',
                  background: '#ffffff',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              >
                <option value="Unassigned">Unassigned</option>
                {eligibleAssignees.map((u) => (
                  <option key={u._id} value={u.name}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* If edit mode: Status selection */}
          {isEdit && (
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.85rem',
                  color: '#0f172a',
                  background: '#ffffff',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              >
                <option value="Logged">Logged</option>
                <option value="Under Investigation">Under Investigation</option>
                <option value="In Progress">In Progress</option>
                <option value="Awaiting Customer">Awaiting Customer</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
          )}

          {/* Row 5: Detailed Description */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
              Issue Description <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              placeholder="Provide specific details about the customer's problem..."
              required
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                fontSize: '0.88rem',
                color: '#0f172a',
                outline: 'none',
                resize: 'vertical',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
              }}
            />
          </div>

          {/* Footer */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '10px',
              paddingTop: '12px',
              borderTop: '1px solid #f1f5f9',
              marginTop: '4px',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '9px 18px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#475569',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: '9px 20px',
                borderRadius: '10px',
                border: 'none',
                background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
                color: '#ffffff',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: submitting ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 12px rgba(220, 38, 38, 0.25)',
              }}
            >
              <Save size={15} />
              <span>{submitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Log Complaint'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
