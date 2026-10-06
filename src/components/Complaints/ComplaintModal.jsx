import React, { useState, useEffect, useMemo } from 'react';
import { useComplaints } from '../../context/ComplaintContext';
import { useUserManagement } from '../../context/UserContext';
import { useAuth } from '../../context/AuthContext';
import { useOpportunities } from '../../context/OpportunityContext';
import { useProjects } from '../../context/ProjectContext';
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
  Calendar,
  Layers,
  Shield,
  HelpCircle,
  Briefcase,
  FolderKanban,
  CheckCircle2,
} from 'lucide-react';

const SUB_CATEGORIES = {
  'Technical Glitch': [
    'System Crash',
    'Page Freeze',
    'Sync Error',
    'API Timeout',
    'Database Connection',
    'Performance Lag',
    'Other Technical',
  ],
  'Product Defect': [
    'Physical Damage',
    'Missing Component',
    'Packaging Issue',
    'Firmware Error',
    'Manufacturing Flaw',
    'Specification Mismatch',
    'Other Defect',
  ],
  'Service Delay': [
    'Delayed Onboarding',
    'Response SLA Lag',
    'Late Delivery',
    'Maintenance Overrun',
    'Appointment Missed',
    'Other Delay',
  ],
  'Billing Query': [
    'Incorrect Invoice',
    'Duplicate Charge',
    'Refund Request',
    'Tax Discrepancy',
    'Payment Gateway Failure',
    'Subscription Renewal Issue',
    'Other Billing',
  ],
  'Hardware Fault': [
    'Power Supply Failure',
    'Screen Display Issue',
    'Sensor Malfunction',
    'Overheating',
    'Connector Broken',
    'Other Hardware',
  ],
  'Account Access': [
    'Password Reset',
    '2FA Authentication Failure',
    'Permission Denied',
    'SSO SAML Failure',
    'Account Locked',
    'User De-provisioning',
    'Other Access',
  ],
  'Quality Assurance': [
    'Code Standard Defect',
    'Process Non-Compliance',
    'Audit Finding',
    'Documentation Gap',
    'Security Vulnerability',
    'Other QA',
  ],
  'General Support': [
    'How-To Inquiry',
    'Feature Request',
    'Product Feedback',
    'Configuration Assistance',
    'Training Request',
    'Other Support',
  ],
};

const TEAMS = [
  'Technical Support',
  'Customer Success',
  'Billing & Accounts',
  'Quality Assurance',
  'Engineering & DevOps',
  'Field Operations',
  'Executive Escalations',
];

const PRODUCTS = [
  'CRM Platform',
  'TaskFlow Pro Enterprise',
  'Payment Gateway API',
  'Mobile Application (iOS/Android)',
  'Cloud Hosting & Infrastructure',
  'User Workspace & SSO',
  'Lead & Opportunity Management',
  'Custom Integration Service',
];

const SOURCES = [
  'Web Portal',
  'Email',
  'Phone',
  'Chat',
  'In-Person',
  'Mobile App',
  'Social Media',
  'Executive Escalation',
];

export const ComplaintModal = ({ isOpen: propIsOpen, onClose: propOnClose, complaintToEdit: propComplaintToEdit }) => {
  const {
    createComplaint,
    updateComplaint,
    isCreateModalOpen,
    setIsCreateModalOpen,
    isEditModalOpen,
    setIsEditModalOpen,
    selectedComplaint,
    setSelectedComplaint,
  } = useComplaints();
  const { users } = useUserManagement ? useUserManagement() : { users: [] };
  const { user: currentUser, isSuperAdmin, isManager } = useAuth();
  const { opportunities } = useOpportunities ? useOpportunities() : { opportunities: [] };
  const { projects } = useProjects ? useProjects() : { projects: [] };

  const isOpen = propIsOpen !== undefined ? propIsOpen : (isCreateModalOpen || isEditModalOpen);
  const complaintToEdit = propComplaintToEdit !== undefined ? propComplaintToEdit : (isEditModalOpen ? selectedComplaint : null);
  const isEdit = !!complaintToEdit;

  const handleClose = () => {
    if (propOnClose) {
      propOnClose();
    } else {
      if (setIsCreateModalOpen) setIsCreateModalOpen(false);
      if (setIsEditModalOpen) setIsEditModalOpen(false);
      if (setSelectedComplaint) setSelectedComplaint(null);
    }
  };

  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    organization: '',
    account: '',
    subject: '',
    description: '',
    category: 'Technical Glitch',
    subCategory: 'System Crash',
    complaintType: 'Complaint',
    productOrService: 'CRM Platform',
    source: 'Web Portal',
    priority: 'Medium',
    severity: 'Moderate',
    slaHours: 24,
    status: 'Logged',
    assignedTo: null,
    assignedToName: 'Unassigned',
    team: 'Technical Support',
    nextFollowUpDate: '',
    nextFollowUpTime: '',
    nextFollowUpPurpose: '',
    linkedOpportunity: '',
    linkedProject: '',
  });

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Scoped list of assignable users based on role hierarchy
  const assignableUsers = useMemo(() => {
    if (!users || !Array.isArray(users)) return [];
    if (isSuperAdmin) return users;
    if (isManager) {
      const myId = (currentUser?._id || currentUser?.id || '').toString();
      const myName = (currentUser?.name || '').toLowerCase();
      return users.filter(
        (u) =>
          u._id === myId ||
          (u.reportsTo && (u.reportsTo === myId || u.reportsTo._id === myId)) ||
          (u.reportsToName && u.reportsToName.toLowerCase().includes(myName))
      );
    }
    // Regular users can only assign to themselves
    const myId = (currentUser?._id || currentUser?.id || '').toString();
    return users.filter((u) => u._id === myId || (currentUser?.name && u.name === currentUser.name));
  }, [users, isSuperAdmin, isManager, currentUser]);

  useEffect(() => {
    if (complaintToEdit) {
      setFormData({
        customerName: complaintToEdit.customerName || '',
        customerEmail: complaintToEdit.customerEmail || '',
        customerPhone: complaintToEdit.customerPhone || '',
        organization: complaintToEdit.organization || complaintToEdit.account || '',
        account: complaintToEdit.account || complaintToEdit.organization || '',
        subject: complaintToEdit.subject || '',
        description: complaintToEdit.description || '',
        category: complaintToEdit.category || 'Technical Glitch',
        subCategory: complaintToEdit.subCategory || 'General',
        complaintType: complaintToEdit.complaintType || 'Complaint',
        productOrService: complaintToEdit.productOrService || 'CRM Platform',
        source: complaintToEdit.source || 'Web Portal',
        priority: complaintToEdit.priority || 'Medium',
        severity: complaintToEdit.severity || 'Moderate',
        slaHours: complaintToEdit.slaHours || 24,
        status: complaintToEdit.status || 'Logged',
        assignedTo: complaintToEdit.assignedTo || null,
        assignedToName: complaintToEdit.assignedToName || 'Unassigned',
        team: complaintToEdit.team || 'Technical Support',
        nextFollowUpDate: complaintToEdit.nextFollowUpDate
          ? new Date(complaintToEdit.nextFollowUpDate).toISOString().slice(0, 10)
          : '',
        nextFollowUpTime: complaintToEdit.nextFollowUpTime || '',
        nextFollowUpPurpose: complaintToEdit.nextFollowUpPurpose || '',
        linkedOpportunity: complaintToEdit.linkedOpportunity || '',
        linkedProject: complaintToEdit.linkedProject || '',
      });
    } else {
      setFormData({
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        organization: '',
        account: '',
        subject: '',
        description: '',
        category: 'Technical Glitch',
        subCategory: 'System Crash',
        complaintType: 'Complaint',
        productOrService: 'CRM Platform',
        source: 'Web Portal',
        priority: 'Medium',
        severity: 'Moderate',
        slaHours: 24,
        status: 'Logged',
        assignedTo: currentUser?._id || null,
        assignedToName: currentUser?.name || 'Unassigned',
        team: 'Technical Support',
        nextFollowUpDate: '',
        nextFollowUpTime: '',
        nextFollowUpPurpose: '',
        linkedOpportunity: '',
        linkedProject: '',
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
    } else if (name === 'category') {
      const defaultSub = SUB_CATEGORIES[value] ? SUB_CATEGORIES[value][0] : 'General';
      setFormData((prev) => ({ ...prev, category: value, subCategory: defaultSub }));
    } else if (name === 'assignedToName') {
      const selectedU = (users || []).find((u) => u.name === value);
      setFormData((prev) => ({
        ...prev,
        assignedToName: value,
        assignedTo: selectedU ? selectedU._id : null,
      }));
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
      handleClose();
    } catch (err) {
      setError(err.message || 'Failed to save complaint');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={handleClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px',
        animation: 'fadeIn 0.2s ease',
      }}
    >
      <div
        className="modal-container-modern"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#ffffff',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '780px',
          maxHeight: '92vh',
          boxShadow: '0 24px 48px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(to right, #f8fafc, #ffffff)',
            borderRadius: '20px 20px 0 0',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: '#fee2e2',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(220, 38, 38, 0.15)',
              }}
            >
              <AlertCircle size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                {isEdit ? `Edit Complaint (${complaintToEdit.ticketNumber})` : 'Log New Customer Complaint'}
              </h2>
              <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '2px 0 0 0' }}>
                {isEdit ? 'Update ticket details and SLA configuration' : 'Register customer issue with automated SLA deadline'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            style={{
              background: '#f1f5f9',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748b',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Error banner */}
        {error && (
          <div
            style={{
              padding: '10px 20px',
              background: '#fef2f2',
              borderBottom: '1px solid #fee2e2',
              color: '#dc2626',
              fontSize: '0.82rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', flex: '1 1 auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Section 1: Customer & Account Info */}
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <User size={15} color="#2563eb" />
              <span>Customer Information</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px', display: 'block' }}>
                  Customer Name <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="text"
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleChange}
                  placeholder="e.g. Rahul Sharma"
                  required
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.86rem',
                    outline: 'none',
                    background: '#f8fafc',
                  }}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px', display: 'block' }}>
                  Organization / Account
                </label>
                <input
                  type="text"
                  name="organization"
                  value={formData.organization}
                  onChange={handleChange}
                  placeholder="e.g. Acme Enterprise"
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.86rem',
                    outline: 'none',
                    background: '#f8fafc',
                  }}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px', display: 'block' }}>
                  Customer Email
                </label>
                <input
                  type="email"
                  name="customerEmail"
                  value={formData.customerEmail}
                  onChange={handleChange}
                  placeholder="e.g. rahul@acme.com"
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.86rem',
                    outline: 'none',
                    background: '#f8fafc',
                  }}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px', display: 'block' }}>
                  Customer Phone
                </label>
                <input
                  type="tel"
                  name="customerPhone"
                  value={formData.customerPhone}
                  onChange={handleChange}
                  placeholder="e.g. +91 98200 12345"
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.86rem',
                    outline: 'none',
                    background: '#f8fafc',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Ticket Summary & Categorization */}
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Tag size={15} color="#2563eb" />
              <span>Issue Details & Categorization</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px', display: 'block' }}>
                  Complaint Subject <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="e.g. Webhook delivery delay during peak load"
                  required
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.86rem',
                    outline: 'none',
                    background: '#f8fafc',
                  }}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px', display: 'block' }}>
                  Detailed Description <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Provide complete step-by-step description of the reported issue..."
                  required
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.86rem',
                    outline: 'none',
                    background: '#f8fafc',
                    resize: 'vertical',
                  }}
                />
              </div>

              {/* Dependent Dropdowns: Category -> Sub-Category */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px', display: 'block' }}>
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
                      fontSize: '0.86rem',
                      outline: 'none',
                      background: '#ffffff',
                    }}
                  >
                    {Object.keys(SUB_CATEGORIES).map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px', display: 'block' }}>
                    Sub-Category
                  </label>
                  <select
                    name="subCategory"
                    value={formData.subCategory}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.86rem',
                      outline: 'none',
                      background: '#ffffff',
                    }}
                  >
                    {(SUB_CATEGORIES[formData.category] || ['General']).map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px', display: 'block' }}>
                    Complaint Type
                  </label>
                  <select
                    name="complaintType"
                    value={formData.complaintType}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.86rem',
                      outline: 'none',
                      background: '#ffffff',
                    }}
                  >
                    <option value="Complaint">Complaint</option>
                    <option value="Bug">Bug / Technical Defect</option>
                    <option value="Service Request">Service Request</option>
                    <option value="Incident">Incident</option>
                    <option value="Inquiry">Inquiry</option>
                    <option value="Billing">Billing Issue</option>
                    <option value="Feedback">Feedback</option>
                  </select>
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px', display: 'block' }}>
                    Product / Service
                  </label>
                  <select
                    name="productOrService"
                    value={formData.productOrService}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.86rem',
                      outline: 'none',
                      background: '#ffffff',
                    }}
                  >
                    {PRODUCTS.map((prod) => (
                      <option key={prod} value={prod}>
                        {prod}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Priority, Severity & SLA */}
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={15} color="#2563eb" />
              <span>Priority, Severity & SLA Target</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px', display: 'block' }}>
                  Priority (SLA Target)
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
                    fontSize: '0.86rem',
                    outline: 'none',
                    background: '#ffffff',
                    fontWeight: 600,
                  }}
                >
                  <option value="Urgent">Urgent (4 Hours SLA)</option>
                  <option value="High">High (12 Hours SLA)</option>
                  <option value="Medium">Medium (24 Hours SLA)</option>
                  <option value="Low">Low (48 Hours SLA)</option>
                </select>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px', display: 'block' }}>
                  Severity
                </label>
                <select
                  name="severity"
                  value={formData.severity}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.86rem',
                    outline: 'none',
                    background: '#ffffff',
                  }}
                >
                  <option value="Critical">Critical (P1)</option>
                  <option value="Major">Major (P2)</option>
                  <option value="Moderate">Moderate (P3)</option>
                  <option value="Minor">Minor (P4)</option>
                </select>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px', display: 'block' }}>
                  Source / Channel
                </label>
                <select
                  name="source"
                  value={formData.source}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.86rem',
                    outline: 'none',
                    background: '#ffffff',
                  }}
                >
                  {SOURCES.map((src) => (
                    <option key={src} value={src}>
                      {src}
                    </option>
                  ))}
                </select>
              </div>

              {isEdit && (
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px', display: 'block' }}>
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
                      fontSize: '0.86rem',
                      outline: 'none',
                      background: '#ffffff',
                    }}
                  >
                    <option value="Logged">Logged</option>
                    <option value="Under Investigation">Under Investigation</option>
                    <option value="Assigned">Assigned</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Awaiting Customer">Awaiting Customer (Paused SLA)</option>
                    <option value="Escalated">Escalated</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Closed">Closed</option>
                    <option value="Reopened">Reopened</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Section 4: Assignment & Hierarchy Scoping */}
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Shield size={15} color="#2563eb" />
              <span>Assignment & Team Routing</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px', display: 'block' }}>
                  Assign To Coordinator / Owner
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
                    fontSize: '0.86rem',
                    outline: 'none',
                    background: '#ffffff',
                  }}
                >
                  <option value="Unassigned">Unassigned</option>
                  {assignableUsers.map((u) => (
                    <option key={u._id} value={u.name}>
                      {u.name} ({u.role || 'Member'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px', display: 'block' }}>
                  Assigned Team / Department
                </label>
                <select
                  name="team"
                  value={formData.team}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.86rem',
                    outline: 'none',
                    background: '#ffffff',
                  }}
                >
                  {TEAMS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px', display: 'block' }}>
                  Schedule Next Follow-Up Date
                </label>
                <input
                  type="date"
                  name="nextFollowUpDate"
                  value={formData.nextFollowUpDate}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.86rem',
                    outline: 'none',
                    background: '#f8fafc',
                  }}
                />
              </div>
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid #f1f5f9',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            background: '#f8fafc',
            borderRadius: '0 0 20px 20px',
            flexShrink: 0,
          }}
        >
          <button
            type="button"
            onClick={handleClose}
            style={{
              padding: '9px 18px',
              borderRadius: '999px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#475569',
              fontSize: '0.86rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              padding: '9px 24px',
              borderRadius: '999px',
              border: 'none',
              background: '#2563eb',
              color: '#ffffff',
              fontSize: '0.86rem',
              fontWeight: 700,
              cursor: submitting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)',
            }}
          >
            <Save size={16} />
            <span>{submitting ? 'Saving...' : isEdit ? 'Update Ticket' : 'Create Complaint Ticket'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ComplaintModal;
