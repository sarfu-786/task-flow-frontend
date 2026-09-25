import React, { useState, useEffect } from 'react';
import { useComplaints } from '../../context/ComplaintContext';
import {
  X,
  CheckCircle2,
  AlertCircle,
  Star,
  FileText,
  ShieldCheck,
  Send,
} from 'lucide-react';

export const ResolveComplaintModal = ({ isOpen, onClose, complaint }) => {
  const { resolveComplaint } = useComplaints();

  const [resolutionNotes, setResolutionNotes] = useState('');
  const [rootCause, setRootCause] = useState('');
  const [csatRating, setCsatRating] = useState(5);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.classList.add('modal-open');
    } else {
      document.body.style.overflow = 'unset';
      document.body.classList.remove('modal-open');
    }
    return () => {
      document.body.style.overflow = 'unset';
      document.body.classList.remove('modal-open');
    };
  }, [isOpen]);

  if (!isOpen || !complaint) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!resolutionNotes.trim()) {
      setError('Please provide resolution notes describing how the issue was fixed.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      await resolveComplaint(complaint._id, {
        resolutionNotes,
        rootCause,
        csatRating: Number(csatRating),
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to mark ticket as resolved');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.7)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '16px',
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '560px',
          maxHeight: '92vh',
          boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.35)',
          border: '1px solid #d1fae5',
          overflow: 'hidden',
          animation: 'slideUp 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #d1fae5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(to right, #f0fdf4, #ffffff)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                backgroundColor: '#ecfdf5',
                color: '#059669',
                border: '1.5px solid #a7f3d0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(5, 150, 105, 0.15)',
                flexShrink: 0,
              }}
            >
              <CheckCircle2 size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.18rem', fontWeight: 800, color: '#065f46', margin: 0 }}>
                Resolve Ticket {complaint.ticketNumber}
              </h2>
              <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '2px 0 0 0' }}>
                Log resolution details and Root Cause Analysis (RCA)
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
              backgroundColor: '#f1f5f9',
              color: '#64748b',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#e2e8f0';
              e.currentTarget.style.color = '#0f172a';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#f1f5f9';
              e.currentTarget.style.color = '#64748b';
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          style={{
            padding: '24px',
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
                backgroundColor: '#fef2f2',
                border: '1px solid #fee2e2',
                color: '#dc2626',
                fontSize: '0.84rem',
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

          {/* Ticket Context Overview */}
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: '#f8fafc',
              borderRadius: '14px',
              border: '1px solid #e2e8f0',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
              <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' }}>
                {complaint.subject}
              </span>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: '#2563eb',
                  backgroundColor: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  padding: '2px 8px',
                  borderRadius: '999px',
                }}
              >
                {complaint.category || 'General'}
              </span>
            </div>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Customer: <strong style={{ color: '#334155' }}>{complaint.customerName}</strong> ({complaint.organization || 'Direct Customer'})
            </div>
          </div>

          {/* Resolution Notes */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
              Resolution Summary & Fix Actions <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <textarea
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              rows="3"
              placeholder="Detail the technical fix, configuration update, or customer clarification provided..."
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '12px',
                border: '1.5px solid #e2e8f0',
                fontSize: '0.86rem',
                color: '#0f172a',
                outline: 'none',
                resize: 'vertical',
                transition: 'border 0.15s ease',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#059669')}
              onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}
              required
            />
          </div>

          {/* Root Cause Analysis */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
              Root Cause Analysis (RCA)
            </label>
            <input
              type="text"
              value={rootCause}
              onChange={(e) => setRootCause(e.target.value)}
              placeholder="e.g. Memory leak in background worker / Network gateway timeout"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '12px',
                border: '1.5px solid #e2e8f0',
                fontSize: '0.86rem',
                color: '#0f172a',
                outline: 'none',
                transition: 'border 0.15s ease',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#059669')}
              onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}
            />
          </div>

          {/* Customer Satisfaction Rating */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
              Customer Satisfaction (CSAT Rating)
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setCsatRating(star)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'transform 0.1s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.2)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  <Star
                    size={22}
                    fill={csatRating >= star ? '#f59e0b' : 'none'}
                    color={csatRating >= star ? '#f59e0b' : '#cbd5e1'}
                  />
                </button>
              ))}
              <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#d97706', marginLeft: '6px' }}>
                {csatRating === 5 ? '★ 5.0 (Excellent)' : csatRating === 4 ? '★ 4.0 (Good)' : csatRating === 3 ? '★ 3.0 (Average)' : `★ ${csatRating}.0`}
              </span>
            </div>
          </div>

          {/* Footer Actions */}
          <div
            style={{
              paddingTop: '16px',
              borderTop: '1px solid #f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '10px',
              marginTop: '8px',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              style={{
                padding: '9px 18px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                color: '#475569',
                fontWeight: 600,
                fontSize: '0.86rem',
                cursor: submitting ? 'not-allowed' : 'pointer',
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
                backgroundColor: '#059669',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.86rem',
                cursor: submitting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (!submitting) e.currentTarget.style.backgroundColor = '#047857';
              }}
              onMouseLeave={(e) => {
                if (!submitting) e.currentTarget.style.backgroundColor = '#059669';
              }}
            >
              <CheckCircle2 size={16} />
              <span>{submitting ? 'Resolving...' : 'Confirm Resolution'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResolveComplaintModal;
