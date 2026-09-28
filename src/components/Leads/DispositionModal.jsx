import React, { useState, useEffect } from 'react';
import { useLeads } from '../../context/LeadContext';
import {
  PhoneCall,
  PhoneOff,
  Clock,
  UserX,
  Sparkles,
  X,
  AlertCircle,
  Calendar,
  CheckCircle2,
  FileText,
  DollarSign,
  ShieldCheck,
} from 'lucide-react';

const DISPOSITIONS_CONFIG = [
  {
    code: 'NO_ANSWER',
    label: 'No Answer',
    icon: PhoneOff,
    color: '#d97706',
    bgColor: '#fffbeb',
    borderColor: '#fde68a',
    parentStatus: 'IN_PROGRESS',
    description: 'Increment retry count. Auto-reschedule callback in +120 minutes.',
    slaRule: 'Max 5 retries in 48 hours',
    defaultNextMins: 120,
  },
  {
    code: 'BUSY',
    label: 'Busy / Busy Tone',
    icon: PhoneCall,
    color: '#ea580c',
    bgColor: '#fff7ed',
    borderColor: '#fed7aa',
    parentStatus: 'IN_PROGRESS',
    description: 'Queue for auto-dialer retry pool after 30 minutes.',
    slaRule: 'Max 3 retries per day',
    defaultNextMins: 30,
  },
  {
    code: 'CALL_BACK',
    label: 'Call Back Scheduled',
    icon: Clock,
    color: '#2563eb',
    bgColor: '#eff6ff',
    borderColor: '#bfdbfe',
    parentStatus: 'IN_PROGRESS',
    description: 'Inject record to calendar provider. Set next_followup_at timestamp.',
    slaRule: 'Enforce strict +/- 5m window',
    requiresDateTime: true,
  },
  {
    code: 'NOT_INTERESTED',
    label: 'Not Interested',
    icon: UserX,
    color: '#dc2626',
    bgColor: '#fef2f2',
    borderColor: '#fecaca',
    parentStatus: 'LOST',
    description: 'Trigger suppression list update. Terminate outbound queuing rules.',
    slaRule: 'Instant suppression within 1s',
  },
  {
    code: 'QUALIFIED_OPPORTUNITY',
    label: 'Qualified to Opportunity',
    icon: Sparkles,
    color: '#059669',
    bgColor: '#ecfdf5',
    borderColor: '#a7f3d0',
    parentStatus: 'CONVERTED',
    description: 'Provision workspace. Instantiate Opportunity pipeline entry.',
    slaRule: 'Immediate handoff (<2s)',
    requiresDealValue: true,
  },
];

export const DispositionModal = () => {
  const { isDispositionModalOpen, leadForDisposition, closeDispositionModal, logDisposition } = useLeads();

  const [selectedCode, setSelectedCode] = useState('NO_ANSWER');
  const [notes, setNotes] = useState('');
  const [durationSeconds, setDurationSeconds] = useState(45);
  const [callbackDateTime, setCallbackDateTime] = useState('');
  const [customDealValue, setCustomDealValue] = useState(10000);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (leadForDisposition) {
      setSelectedCode('NO_ANSWER');
      setNotes('');
      setDurationSeconds(45);
      // Default callback 24 hours from now
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      setCallbackDateTime(tomorrow.toISOString().slice(0, 16));
      setCustomDealValue(leadForDisposition.pipeline_value || leadForDisposition.dealValue || 15000);
      setError('');
    }
  }, [leadForDisposition]);

  if (!isDispositionModalOpen || !leadForDisposition) return null;

  const currentConfig = DISPOSITIONS_CONFIG.find((d) => d.code === selectedCode) || DISPOSITIONS_CONFIG[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const payload = {
        disposition_code: selectedCode,
        notes,
        duration_seconds: Number(durationSeconds) || 0,
        next_followup_at: selectedCode === 'CALL_BACK' ? callbackDateTime : null,
        custom_deal_value: selectedCode === 'QUALIFIED_OPPORTUNITY' ? Number(customDealValue) : undefined,
      };

      await logDisposition(leadForDisposition._id || leadForDisposition.lead_id, payload);
      closeDispositionModal();
    } catch (err) {
      setError(err.message || 'Failed to log disposition');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="modal-overlay active"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(6px)',
        zIndex: 1200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) closeDispositionModal();
      }}
    >
      <div
        className="modal-content"
        style={{
          background: '#ffffff',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '680px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
          animation: 'modalSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '20px 24px',
            background: 'linear-gradient(135deg, #1e293b, #0f172a)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)',
              }}
            >
              <PhoneCall size={22} color="#ffffff" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
                Log Call Outreach & Disposition
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: '#94a3b8' }}>
                Lead: <strong style={{ color: '#f8fafc' }}>{leadForDisposition.name}</strong> • {leadForDisposition.company || 'Enterprise Prospect'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeDispositionModal}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '10px',
              width: '34px',
              height: '34px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#cbd5e1',
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {error && (
            <div
              style={{
                padding: '12px 16px',
                borderRadius: '10px',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#991b1b',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Disposition Code Selection Matrix */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Select Outreach Disposition Outcome
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '10px' }}>
              {DISPOSITIONS_CONFIG.map((d) => {
                const Icon = d.icon;
                const isSelected = selectedCode === d.code;
                return (
                  <button
                    key={d.code}
                    type="button"
                    onClick={() => setSelectedCode(d.code)}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '12px',
                      border: `2px solid ${isSelected ? d.color : '#e2e8f0'}`,
                      background: isSelected ? d.bgColor : '#ffffff',
                      cursor: 'pointer',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      transition: 'all 0.15s ease',
                      boxShadow: isSelected ? `0 4px 12px ${d.color}25` : 'none',
                    }}
                  >
                    <div
                      style={{
                        padding: '6px',
                        borderRadius: '8px',
                        background: isSelected ? d.color : '#f1f5f9',
                        color: isSelected ? '#ffffff' : '#64748b',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Icon size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.86rem', fontWeight: 700, color: isSelected ? d.color : '#1e293b' }}>
                        {d.label}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                        Status: <strong>{d.parentStatus}</strong>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Automated System Trigger Notice Banner */}
          <div
            style={{
              padding: '14px 16px',
              borderRadius: '12px',
              background: currentConfig.bgColor,
              border: `1px solid ${currentConfig.borderColor}`,
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: currentConfig.color, textTransform: 'uppercase' }}>
                ⚡ Triggered System Event Actions
              </span>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, background: '#ffffff', color: currentConfig.color, padding: '2px 8px', borderRadius: '999px', border: `1px solid ${currentConfig.borderColor}` }}>
                {currentConfig.slaRule}
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '0.84rem', color: '#334155', fontWeight: 500 }}>
              {currentConfig.description}
            </p>
          </div>

          {/* Conditional Inputs */}
          {currentConfig.requiresDateTime && (
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                <Calendar size={14} style={{ display: 'inline', marginRight: '4px' }} />
                Scheduled Call Back Date & Time (Strict +/-5m Window Enforced)
              </label>
              <input
                type="datetime-local"
                value={callbackDateTime}
                onChange={(e) => setCallbackDateTime(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.9rem',
                  outline: 'none',
                }}
              />
            </div>
          )}

          {currentConfig.requiresDealValue && (
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                <DollarSign size={14} style={{ display: 'inline', marginRight: '4px' }} />
                Expected Pipeline Opportunity Value ($)
              </label>
              <input
                type="number"
                min="0"
                step="100"
                value={customDealValue}
                onChange={(e) => setCustomDealValue(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.9rem',
                  outline: 'none',
                }}
              />
            </div>
          )}

          {/* Call Duration & Agent Notes */}
          <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                Duration (Sec)
              </label>
              <input
                type="number"
                min="0"
                value={durationSeconds}
                onChange={(e) => setDurationSeconds(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.9rem',
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                <FileText size={14} style={{ display: 'inline', marginRight: '4px' }} />
                Outreach Notes & Conversation Summary
              </label>
              <input
                type="text"
                placeholder="Spoke with decision maker, agreed to review proposal..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.9rem',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          {/* Modal Footer Buttons */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '12px',
              paddingTop: '16px',
              borderTop: '1px solid #f1f5f9',
            }}
          >
            <button
              type="button"
              onClick={closeDispositionModal}
              disabled={isSubmitting}
              style={{
                padding: '10px 18px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#475569',
                fontWeight: 600,
                fontSize: '0.88rem',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: '10px 22px',
                borderRadius: '10px',
                border: 'none',
                background: currentConfig.color,
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: `0 4px 14px ${currentConfig.color}40`,
                transition: 'opacity 0.2s',
              }}
            >
              <CheckCircle2 size={16} />
              <span>{isSubmitting ? 'Logging...' : `Confirm & Log ${currentConfig.label}`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DispositionModal;
