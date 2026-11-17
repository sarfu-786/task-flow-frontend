import React, { useState, useEffect } from 'react';
import { complaintApi } from '../../services/api';
import { captureSubmitterLocation } from '../../utils/locationService';
import { AttachmentUploader } from './AttachmentUploader';
import { PublicTicketTracker } from './PublicTicketTracker';
import {
  LifeBuoy,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Search,
  LogIn,
  Send,
  Building,
  User,
  Mail,
  Phone,
  HelpCircle,
  ShieldCheck,
  MapPin,
} from 'lucide-react';

import { COMPLAINT_CATEGORIES, PRIMARY_CATEGORY_NAMES } from '../../utils/complaintCategories';

const CATEGORIES = COMPLAINT_CATEGORIES;

export const PublicComplaintPortal = ({ onGoToLogin }) => {
  const [view, setView] = useState('form'); // 'form' | 'success' | 'track'
  const [formData, setFormData] = useState({
    customerName: '',
    organization: '',
    customerEmail: '',
    customerPhone: '',
    category: 'Customer Support & Helpdesk',
    subCategory: 'General Inquiry / Help',
    priority: 'Medium',
    subject: '',
    description: '',
  });

  const [attachments, setAttachments] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [createdTicket, setCreatedTicket] = useState(null);
  const [copied, setCopied] = useState(false);
  const [capturedLocation, setCapturedLocation] = useState(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  const handleDetectLocation = async () => {
    setIsDetectingLocation(true);
    try {
      const loc = await captureSubmitterLocation(9000);
      if (loc && loc.type === 'GPS') {
        setCapturedLocation(loc);
      } else if (loc) {
        setCapturedLocation(loc);
      }
    } catch (_) {
    } finally {
      setIsDetectingLocation(false);
    }
  };

  useEffect(() => {
    handleDetectLocation();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'category' ? { subCategory: (CATEGORIES[value] || [])[0] || 'General' } : {}),
    }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = {};

    const nameTrimmed = formData.customerName.trim();
    if (!nameTrimmed) errors.customerName = 'Please enter your Full Name.';

    const orgTrimmed = formData.organization.trim();
    if (!orgTrimmed) errors.organization = 'Please enter your Company / Organization.';

    const emailTrimmed = formData.customerEmail.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailTrimmed || !emailRegex.test(emailTrimmed)) {
      errors.customerEmail = 'Please enter a valid Email Address.';
    }

    const phoneTrimmed = formData.customerPhone.trim();
    const phoneDigits = phoneTrimmed.replace(/\D/g, '');
    if (!phoneTrimmed || phoneDigits.length < 7 || phoneDigits.length > 15) {
      errors.customerPhone = 'Please enter a valid Phone number (7-15 digits).';
    }

    const subjectTrimmed = formData.subject.trim();
    if (!subjectTrimmed) errors.subject = 'Please enter a brief Complaint Subject.';

    const descTrimmed = formData.description.trim();
    if (!descTrimmed) errors.description = 'Please describe the issue in detail.';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setErrorMsg('Please complete all mandatory fields with valid information.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');

      // High-precision Submitter Location capture
      let locationData = capturedLocation;
      if (!locationData || locationData.type !== 'GPS') {
        try {
          const fresh = await captureSubmitterLocation(6000);
          if (fresh && fresh.type === 'GPS') {
            locationData = fresh;
            setCapturedLocation(fresh);
          } else if (!locationData) {
            locationData = fresh;
          }
        } catch (_) {
          locationData = locationData || { type: 'IP' };
        }
      }

      const payload = {
        ...formData,
        customerName: nameTrimmed,
        organization: orgTrimmed,
        customerEmail: emailTrimmed,
        customerPhone: phoneTrimmed,
        subject: subjectTrimmed,
        description: descTrimmed,
        location: locationData,
        attachments: attachments.map((a) => ({
          name: a.name,
          size: a.size,
          type: a.type,
          dataUrl: a.dataUrl,
        })),
      };

      const res = await complaintApi.createPublicComplaint(payload);

      setCreatedTicket({
        ticketNumber: res.ticketNumber,
        status: res.status || 'Logged',
        assignedToName: res.assignedToName || 'Support Team',
        customerName: nameTrimmed,
        customerEmail: emailTrimmed,
        subject: subjectTrimmed,
      });

      setView('success');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to submit complaint. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (view === 'track') {
    return (
      <PublicTicketTracker
        onBackToSubmit={() => setView('form')}
        initialTicketNumber={createdTicket?.ticketNumber || ''}
      />
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
        padding: '24px 16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      <div style={{ width: '100%', maxWidth: '780px' }}>
        {/* Top Navbar Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: '#2563eb',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)',
              }}
            >
              <LifeBuoy size={22} />
            </div>
            <div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                Customer Support & Helpdesk
              </div>
              <div style={{ fontSize: '0.76rem', color: '#64748b' }}>
                Public Grievance Resolution & Tracking Portal
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={() => setView('track')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                padding: '8px 14px',
                fontSize: '0.84rem',
                fontWeight: 600,
                color: '#334155',
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}
            >
              <Search size={15} />
              Track Ticket
            </button>

            {onGoToLogin && (
              <button
                type="button"
                onClick={onGoToLogin}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '8px 14px',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  color: '#64748b',
                  cursor: 'pointer',
                }}
              >
                <LogIn size={15} />
                Staff Login
              </button>
            )}
          </div>
        </div>

        {/* Success Screen */}
        {view === 'success' && createdTicket && (
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              padding: '36px 28px',
              boxShadow: '0 4px 20px rgba(15, 23, 42, 0.08)',
              border: '1px solid #e2e8f0',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: '#dcfce7',
                color: '#16a34a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto',
              }}
            >
              <CheckCircle2 size={36} />
            </div>

            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: '0 0 8px 0' }}>
              Complaint Registered Successfully!
            </h2>
            <p style={{ fontSize: '0.9rem', color: '#64748b', margin: '0 0 24px 0', lineHeight: 1.5 }}>
              Your ticket has been logged and assigned to our resolution team. Please save your reference ID for tracking.
            </p>

            {/* Reference Ticket Card */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '12px',
                background: '#f8fafc',
                border: '1.5px dashed #2563eb',
                borderRadius: '12px',
                padding: '12px 24px',
                marginBottom: '20px',
              }}
            >
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                  Your Ticket Reference ID
                </span>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#2563eb', letterSpacing: '0.04em' }}>
                  {createdTicket.ticketNumber}
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleCopy(createdTicket.ticketNumber)}
                style={{
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  padding: '6px 12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: '#334155',
                }}
              >
                {copied ? <Check size={14} color="#16a34a" /> : <Copy size={14} />}
                {copied ? 'Copied!' : 'Copy ID'}
              </button>
            </div>

            {/* Email Confirmation Notice Banner (10/10 Enterprise UX) */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '12px',
                padding: '12px 18px',
                margin: '0 auto 24px auto',
                maxWidth: '520px',
                textAlign: 'left',
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: '#dcfce7',
                  color: '#15803d',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Mail size={18} />
              </div>
              <div style={{ fontSize: '0.85rem', lineHeight: 1.45, color: '#166534' }}>
                <div>
                  A confirmation email with ticket details and tracking link has been sent to{' '}
                  <strong style={{ color: '#0f172a', wordBreak: 'break-all' }}>
                    {createdTicket.customerEmail || 'your email'}
                  </strong>.
                </div>
                <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px' }}>
                  If you don't see it in your inbox, please check your Spam or Junk folder.
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setView('track')}
                style={{
                  padding: '10px 24px',
                  borderRadius: '10px',
                  border: 'none',
                  background: '#2563eb',
                  color: '#ffffff',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)',
                }}
              >
                <Search size={16} />
                Track Ticket Status
              </button>

              <button
                type="button"
                onClick={() => {
                  setFormData({
                    customerName: '',
                    organization: '',
                    customerEmail: '',
                    customerPhone: '',
                    category: 'Customer Support & Helpdesk',
                    subCategory: 'General Inquiry / Help',
                    priority: 'Medium',
                    subject: '',
                    description: '',
                  });
                  setAttachments([]);
                  setView('form');
                }}
                style={{
                  padding: '10px 20px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#475569',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Submit Another Complaint
              </button>
            </div>
          </div>
        )}

        {/* Complaint Submission Form Card */}
        {view === 'form' && (
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              padding: '28px',
              boxShadow: '0 4px 20px rgba(15, 23, 42, 0.08)',
              border: '1px solid #e2e8f0',
            }}
          >
            <div style={{ marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0' }}>
                Submit a Support Ticket
              </h2>
              <p style={{ fontSize: '0.86rem', color: '#64748b', margin: 0 }}>
                Please provide detailed information below. Our technical support team will investigate and respond according to our priority SLAs.
              </p>
            </div>

            {errorMsg && (
              <div
                style={{
                  padding: '12px 16px',
                  background: '#fef2f2',
                  border: '1px solid #fee2e2',
                  borderRadius: '10px',
                  color: '#dc2626',
                  fontSize: '0.86rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '18px',
                }}
              >
                <AlertCircle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Row 1: Customer Contact Details (2 columns) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '5px' }}>
                    Full Name <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="customerName"
                    value={formData.customerName}
                    onChange={handleChange}
                    placeholder="e.g. Rahul Sharma"
                    style={{
                      width: '100%',
                      height: '40px',
                      borderRadius: '8px',
                      border: `1.5px solid ${fieldErrors.customerName ? '#ef4444' : '#cbd5e1'}`,
                      padding: '0 12px',
                      fontSize: '0.9rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  {fieldErrors.customerName && (
                    <span style={{ fontSize: '0.74rem', color: '#ef4444', marginTop: '2px', display: 'block' }}>
                      {fieldErrors.customerName}
                    </span>
                  )}
                </div>

                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '5px' }}>
                    Company / Organization <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="organization"
                    value={formData.organization}
                    onChange={handleChange}
                    placeholder="e.g. Acme Enterprises / Self"
                    style={{
                      width: '100%',
                      height: '40px',
                      borderRadius: '8px',
                      border: `1.5px solid ${fieldErrors.organization ? '#ef4444' : '#cbd5e1'}`,
                      padding: '0 12px',
                      fontSize: '0.9rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  {fieldErrors.organization && (
                    <span style={{ fontSize: '0.74rem', color: '#ef4444', marginTop: '2px', display: 'block' }}>
                      {fieldErrors.organization}
                    </span>
                  )}
                </div>
              </div>

              {/* Row 2: Email & Phone (2 columns) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '5px' }}>
                    Email Address <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="email"
                    name="customerEmail"
                    value={formData.customerEmail}
                    onChange={handleChange}
                    placeholder="rahul@example.com"
                    style={{
                      width: '100%',
                      height: '40px',
                      borderRadius: '8px',
                      border: `1.5px solid ${fieldErrors.customerEmail ? '#ef4444' : '#cbd5e1'}`,
                      padding: '0 12px',
                      fontSize: '0.9rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  {fieldErrors.customerEmail && (
                    <span style={{ fontSize: '0.74rem', color: '#ef4444', marginTop: '2px', display: 'block' }}>
                      {fieldErrors.customerEmail}
                    </span>
                  )}
                </div>

                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '5px' }}>
                    Contact Phone Number <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="tel"
                    name="customerPhone"
                    value={formData.customerPhone}
                    onChange={handleChange}
                    placeholder="e.g. 9876543210"
                    style={{
                      width: '100%',
                      height: '40px',
                      borderRadius: '8px',
                      border: `1.5px solid ${fieldErrors.customerPhone ? '#ef4444' : '#cbd5e1'}`,
                      padding: '0 12px',
                      fontSize: '0.9rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  {fieldErrors.customerPhone && (
                    <span style={{ fontSize: '0.74rem', color: '#ef4444', marginTop: '2px', display: 'block' }}>
                      {fieldErrors.customerPhone}
                    </span>
                  )}
                </div>
              </div>

              {/* Row 3: Category, Subcategory, Priority (3 columns) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '5px' }}>
                    Issue Category
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      height: '40px',
                      borderRadius: '8px',
                      border: '1.5px solid #cbd5e1',
                      padding: '0 10px',
                      fontSize: '0.88rem',
                      outline: 'none',
                      background: '#ffffff',
                      boxSizing: 'border-box',
                    }}
                  >
                    {PRIMARY_CATEGORY_NAMES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '5px' }}>
                    Sub-Category
                  </label>
                  <select
                    name="subCategory"
                    value={formData.subCategory}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      height: '40px',
                      borderRadius: '8px',
                      border: '1.5px solid #cbd5e1',
                      padding: '0 10px',
                      fontSize: '0.88rem',
                      outline: 'none',
                      background: '#ffffff',
                      boxSizing: 'border-box',
                    }}
                  >
                    {(CATEGORIES[formData.category] || []).map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '5px' }}>
                    Urgency / Priority
                  </label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      height: '40px',
                      borderRadius: '8px',
                      border: '1.5px solid #cbd5e1',
                      padding: '0 10px',
                      fontSize: '0.88rem',
                      outline: 'none',
                      background: '#ffffff',
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="Low">Low (General Query - 48h SLA)</option>
                    <option value="Medium">Medium (Standard Issue - 24h SLA)</option>
                    <option value="High">High (Impacting Operations - 12h SLA)</option>
                    <option value="Critical">Critical (System Down - 4h SLA)</option>
                  </select>
                </div>
              </div>

              {/* Row 4: Subject */}
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '5px' }}>
                  Complaint Subject / Summary <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="e.g. Payment deducted but invoice not received"
                  style={{
                    width: '100%',
                    height: '40px',
                    borderRadius: '8px',
                    border: `1.5px solid ${fieldErrors.subject ? '#ef4444' : '#cbd5e1'}`,
                    padding: '0 12px',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                {fieldErrors.subject && (
                  <span style={{ fontSize: '0.74rem', color: '#ef4444', marginTop: '2px', display: 'block' }}>
                    {fieldErrors.subject}
                  </span>
                )}
              </div>

              {/* Row 5: Detailed Description */}
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '5px' }}>
                  Detailed Description <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <textarea
                  name="description"
                  rows={4}
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Please describe what happened, steps to reproduce, error codes, or invoice numbers..."
                  style={{
                    width: '100%',
                    borderRadius: '8px',
                    border: `1.5px solid ${fieldErrors.description ? '#ef4444' : '#cbd5e1'}`,
                    padding: '10px 12px',
                    fontSize: '0.88rem',
                    lineHeight: 1.5,
                    outline: 'none',
                    boxSizing: 'border-box',
                    resize: 'vertical',
                  }}
                />
                {fieldErrors.description && (
                  <span style={{ fontSize: '0.74rem', color: '#ef4444', marginTop: '2px', display: 'block' }}>
                    {fieldErrors.description}
                  </span>
                )}
              </div>

              {/* Row 6: File & Screenshot Attachment Uploader */}
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '6px' }}>
                  Attachments (Screenshots / Invoices / PDFs)
                </label>
                <AttachmentUploader
                  attachments={attachments}
                  setAttachments={setAttachments}
                  maxFiles={3}
                  maxSizeMB={5}
                />
              </div>

              {/* Submitter Real-Time Location Status (Shows submitter where they are registering from) */}
              <div
                style={{
                  background: capturedLocation?.type === 'GPS' ? '#f0fdf4' : '#f8fafc',
                  border: `1.5px solid ${capturedLocation?.type === 'GPS' ? '#86efac' : '#e2e8f0'}`,
                  borderRadius: '12px',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '10px',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: capturedLocation?.type === 'GPS' ? '#dcfce7' : '#eff6ff',
                      color: capturedLocation?.type === 'GPS' ? '#16a34a' : '#2563eb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <MapPin size={16} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a' }}>
                      {capturedLocation?.type === 'GPS'
                        ? 'Submitter Location Verified (GPS Live Fix)'
                        : isDetectingLocation
                        ? 'Detecting Submitter Location...'
                        : 'Submitter Location at Submission Time'}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {capturedLocation?.type === 'GPS'
                        ? `${capturedLocation.address || capturedLocation.city} (${capturedLocation.accuracy || 'High Precision'})`
                        : isDetectingLocation
                        ? 'Requesting browser GPS location coordinates...'
                        : 'Click detect to attach exact physical location to this ticket'}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDetectLocation}
                  disabled={isDetectingLocation}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: capturedLocation?.type === 'GPS' ? '#16a34a' : '#2563eb',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    cursor: isDetectingLocation ? 'wait' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                  }}
                >
                  <MapPin size={12} />
                  <span>{capturedLocation?.type === 'GPS' ? 'GPS Captured ✓' : isDetectingLocation ? 'Detecting...' : 'Detect Exact Location'}</span>
                </button>
              </div>

              {/* Submit Button & Assurance note */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '12px',
                  borderTop: '1px solid #f1f5f9',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.76rem', color: '#64748b' }}>
                    <ShieldCheck size={16} color="#059669" />
                    <span>Secure 256-bit encrypted</span>
                  </div>
                  {capturedLocation && (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        background: capturedLocation.type === 'GPS' ? '#ecfdf5' : '#eff6ff',
                        color: capturedLocation.type === 'GPS' ? '#047857' : '#1d4ed8',
                        border: `1px solid ${capturedLocation.type === 'GPS' ? '#a7f3d0' : '#bfdbfe'}`,
                      }}
                    >
                      <MapPin size={11} />
                      <span>{capturedLocation.city ? `Origin: ${capturedLocation.city}` : capturedLocation.type === 'GPS' ? 'GPS Active' : 'Network Detected'}</span>
                    </span>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    height: '44px',
                    padding: '0 28px',
                    borderRadius: '10px',
                    border: 'none',
                    background: '#2563eb',
                    color: '#ffffff',
                    fontSize: '0.92rem',
                    fontWeight: 700,
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 2px 10px rgba(37, 99, 235, 0.28)',
                  }}
                >
                  <Send size={16} />
                  <span>{submitting ? 'Submitting Ticket...' : 'Register Complaint'}</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
