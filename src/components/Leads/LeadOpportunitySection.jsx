import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  TrendingUp,
  DollarSign,
  Calendar,
  User as UserIcon,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  ArrowRight,
  X,
  Check,
  Flag,
  RotateCcw,
  Building,
  Phone,
  Mail,
  Share2,
  Tag,
  Clock,
  HelpCircle,
} from 'lucide-react';
import { useLeads } from '../../context/LeadContext';
import { useOpportunities, STAGES, LOST_REASONS, normalizeStage } from '../../context/OpportunityContext';
import { api } from '../../services/api';

const OPPORTUNITY_STAGES = [
  'New Opportunity',
  'Contacted',
  'Requirement Understanding',
  'Proposal / Quotation',
  'Negotiation',
  'Won',
  'Lost',
];

const STAGE_DEFAULT_PROBABILITIES = {
  'New Opportunity': 10,
  Contacted: 25,
  'Requirement Understanding': 40,
  'Proposal / Quotation': 60,
  Negotiation: 80,
  Won: 100,
  Lost: 0,
};

export const LeadOpportunitySection = ({ lead, onStageUpdated }) => {
  const { updateLeadOpportunityStage } = useLeads();
  const { opportunities, updateOpportunityStage } = useOpportunities();

  const [oppData, setOppData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Lost Reason Modal State
  const [showLostDialog, setShowLostDialog] = useState(false);
  const [lostReason, setLostReason] = useState('Price too high');
  const [lostRemarks, setLostRemarks] = useState('');

  // Find linked opportunity from opportunities context or fetch via API
  useEffect(() => {
    if (!lead) return;

    const leadIdStr = lead.leadId || lead.lead_id || (lead._id ? lead._id.toString() : '');
    const oppIdStr = lead.opportunityId || (lead.convertedOpportunityId ? lead.convertedOpportunityId.toString() : '');

    // 1. Try finding in context first
    const matched = (opportunities || []).find((o) => {
      const oId = (o._id ? o._id.toString() : '') || o.opportunityId || o.opportunity_id;
      const oLeadId = o.originalLeadId || o.leadId || (o.relatedLead ? o.relatedLead.toString() : '');
      return (
        (oppIdStr && (oId === oppIdStr || o.opportunityId === oppIdStr)) ||
        (leadIdStr && (oLeadId === leadIdStr || o.originalLeadId === leadIdStr))
      );
    });

    if (matched) {
      setOppData(matched);
    } else if (oppIdStr || leadIdStr) {
      // 2. Fetch fresh from backend
      setLoading(true);
      const fetchPromise = api.getOpportunityById
        ? api.getOpportunityById(oppIdStr || leadIdStr)
        : api.getOpportunity
        ? api.getOpportunity(oppIdStr || leadIdStr)
        : Promise.reject(new Error('Opportunity API not available'));

      fetchPromise
        .then((res) => {
          if (res && res.success && res.opportunity) {
            setOppData(res.opportunity);
          }
        })
        .catch((err) => {
          console.warn('Opportunity fetch for lead notice:', err?.message);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [lead, opportunities]);

  if (!lead) return null;

  const isConverted = lead.status === 'Converted' || !!lead.opportunityId || !!lead.convertedOpportunityId;
  if (!isConverted) return null;

  // Resolve current active stage
  const rawStage = oppData?.stage || 'New Opportunity';
  const currentStage = normalizeStage ? normalizeStage(rawStage) : rawStage;

  const currentProb = oppData?.probability !== undefined ? oppData.probability : STAGE_DEFAULT_PROBABILITIES[currentStage] || 10;
  const dealValue = oppData?.amount !== undefined ? oppData.amount : (lead.estimatedValue || lead.dealValue || 0);
  const expectedDate = oppData?.expectedCloseDate ? new Date(oppData.expectedCloseDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Not specified';
  const dealOwner = oppData?.assignedTo || lead.assignedSalesUser || lead.assignedTo || 'Unassigned';
  const remarksText = oppData?.notes || oppData?.remarks || lead.remarks || lead.notes || 'Converted from qualified lead.';
  const oppReadableId = oppData?.opportunityId || lead.opportunityId || 'OP-001';

  const isWon = currentStage === 'Won';
  const isLost = currentStage === 'Lost';
  const currentLostReason = oppData?.lostReason || '';
  const currentLostDetails = oppData?.lostReasonDetails || '';

  // Handle stage change
  const handleStageSelect = async (targetStage) => {
    if (targetStage === currentStage || updating) return;

    if (targetStage === 'Lost') {
      setShowLostDialog(true);
      return;
    }

    setUpdating(true);
    setError('');
    setSuccessMessage('');

    try {
      const oppIdentifier = oppData?._id || lead.convertedOpportunityId || lead.opportunityId || lead.leadId || lead._id;
      if (updateOpportunityStage) {
        await updateOpportunityStage(oppIdentifier, targetStage);
      } else {
        await updateLeadOpportunityStage(oppIdentifier, targetStage);
      }

      setOppData((prev) => ({
        ...(prev || {}),
        stage: targetStage,
        probability: STAGE_DEFAULT_PROBABILITIES[targetStage] || 10,
        lostReason: '',
        lostReasonDetails: '',
      }));

      setSuccessMessage(`Stage updated to "${targetStage}"`);
      setTimeout(() => setSuccessMessage(''), 3000);

      if (onStageUpdated) onStageUpdated(targetStage);
    } catch (err) {
      setError(err.message || 'Failed to update opportunity stage');
    } finally {
      setUpdating(false);
    }
  };

  // Submit Lost reason
  const handleConfirmLost = async (e) => {
    if (e) e.preventDefault();
    setUpdating(true);
    setError('');
    setShowLostDialog(false);

    try {
      const oppIdentifier = oppData?._id || lead.convertedOpportunityId || lead.opportunityId || lead.leadId || lead._id;
      if (updateOpportunityStage) {
        await updateOpportunityStage(oppIdentifier, 'Lost', lostReason, lostRemarks);
      } else {
        await updateLeadOpportunityStage(oppIdentifier, 'Lost', lostReason, lostRemarks);
      }

      setOppData((prev) => ({
        ...(prev || {}),
        stage: 'Lost',
        probability: 0,
        lostReason,
        lostReasonDetails: lostRemarks,
      }));

      setSuccessMessage('Opportunity marked as Lost');
      setTimeout(() => setSuccessMessage(''), 3000);

      if (onStageUpdated) onStageUpdated('Lost');
    } catch (err) {
      setError(err.message || 'Failed to mark opportunity as lost');
    } finally {
      setUpdating(false);
    }
  };

  // Lifecycle visual steps
  // 1. Converted -> 2. New Opportunity -> 3. Contacted -> 4. Requirement Understanding -> 5. Proposal / Quotation -> 6. Negotiation -> 7. Won / Lost
  const pipelineSteps = [
    { key: 'Converted', label: 'Converted', desc: 'Lead Converted' },
    { key: 'New Opportunity', label: 'New Opportunity', desc: 'Initial Stage' },
    { key: 'Contacted', label: 'Contacted', desc: 'Initial Outreach' },
    { key: 'Requirement Understanding', label: 'Requirement Understanding', desc: 'Scope Definition' },
    { key: 'Proposal / Quotation', label: 'Proposal / Quotation', desc: 'Quote Delivered' },
    { key: 'Negotiation', label: 'Negotiation', desc: 'Commercial Review' },
    { key: isLost ? 'Lost' : 'Won', label: isLost ? 'Lost' : 'Won', desc: isLost ? 'Closed Lost' : 'Closed Won' },
  ];

  const getStepStatus = (stepKey, index) => {
    // Step 0: "Converted" is always completed for converted leads
    if (stepKey === 'Converted') return 'completed';

    const stageOrder = [
      'New Opportunity',
      'Contacted',
      'Requirement Understanding',
      'Proposal / Quotation',
      'Negotiation',
      'Won',
    ];

    if (currentStage === 'Lost') {
      if (stepKey === 'Lost') return 'current-lost';
      return 'past-lost';
    }

    if (currentStage === 'Won') {
      if (stepKey === 'Won') return 'current-won';
      return 'completed';
    }

    const currentIndex = stageOrder.indexOf(currentStage);
    const stepIndex = stageOrder.indexOf(stepKey);

    if (stepIndex === -1) return 'upcoming';
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'upcoming';
  };

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      {/* 1. Header with Opportunity Status & Identification */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          paddingBottom: '14px',
          borderBottom: '1px solid #f1f5f9',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: isWon ? '#ecfdf5' : isLost ? '#fef2f2' : '#f5f3ff',
              color: isWon ? '#059669' : isLost ? '#dc2626' : '#7c3aed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Sparkles size={18} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                Opportunity Details
              </h4>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '6px',
                  background: '#eff6ff',
                  color: '#2563eb',
                  border: '1px solid #bfdbfe',
                }}
              >
                {oppReadableId}
              </span>
            </div>
            <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#64748b' }}>
              Post-conversion pipeline workflow linked to Lead {lead.leadId || 'LD-001'}
            </p>
          </div>
        </div>

        {/* Status Pill & Stage Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span
            style={{
              fontSize: '0.76rem',
              fontWeight: 700,
              padding: '4px 12px',
              borderRadius: '999px',
              background: isWon ? '#ecfdf5' : isLost ? '#fef2f2' : '#f5f3ff',
              color: isWon ? '#059669' : isLost ? '#dc2626' : '#7c3aed',
              border: isWon ? '1px solid #a7f3d0' : isLost ? '1px solid #fecaca' : '1px solid #ddd6fe',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: isWon ? '#059669' : isLost ? '#dc2626' : '#7c3aed',
              }}
            />
            Status: {isWon ? 'Won (Deal Closed)' : isLost ? 'Lost (Deal Closed)' : 'Active Opportunity'}
          </span>

          {/* Quick Stage Switcher Dropdown */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <label style={{ fontSize: '0.76rem', fontWeight: 700, color: '#475569', margin: 0 }}>
              Update Stage:
            </label>
            <select
              className="form-control select-filter"
              value={currentStage}
              disabled={updating}
              onChange={(e) => handleStageSelect(e.target.value)}
              style={{
                fontSize: '0.78rem',
                padding: '4px 10px',
                height: 'auto',
                minWidth: '150px',
                fontWeight: 600,
                borderColor: '#cbd5e1',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              <option value="New Opportunity">New Opportunity</option>
              <option value="Contacted">Contacted</option>
              <option value="Requirement Understanding">Requirement Understanding</option>
              <option value="Proposal / Quotation">Proposal / Quotation</option>
              <option value="Negotiation">Negotiation</option>
              <option value="Won">Won</option>
              <option value="Lost">Lost</option>
            </select>
          </div>
        </div>
      </div>

      {/* Status Feedback Banners */}
      {successMessage && (
        <div className="alert alert-success" style={{ margin: 0, padding: '8px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <CheckCircle2 size={14} />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="alert alert-danger" style={{ margin: 0, padding: '8px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <AlertTriangle size={14} />
          <span>{error}</span>
        </div>
      )}

      {/* 2. Visual Stage Progress Lifecycle UI */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Opportunity Lifecycle & Progress
          </div>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: isWon ? '#059669' : isLost ? '#dc2626' : '#2563eb' }}>
            Current: {currentStage} ({currentProb}%)
          </div>
        </div>

        {/* Interactive Responsive Stage Progress Bar */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(105px, 1fr))',
            gap: '6px',
            background: '#f8fafc',
            padding: '10px',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
          }}
        >
          {pipelineSteps.map((step, idx) => {
            const status = getStepStatus(step.key, idx);
            const isClickable = step.key !== 'Converted';

            let bg = '#ffffff';
            let color = '#64748b';
            let borderColor = '#e2e8f0';
            let icon = null;

            if (status === 'completed') {
              bg = '#ecfdf5';
              color = '#059669';
              borderColor = '#a7f3d0';
              icon = <Check size={12} strokeWidth={3} />;
            } else if (status === 'current') {
              bg = '#eff6ff';
              color = '#1d4ed8';
              borderColor = '#3b82f6';
              icon = <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#2563eb' }} />;
            } else if (status === 'current-won') {
              bg = '#ecfdf5';
              color = '#047857';
              borderColor = '#10b981';
              icon = <CheckCircle2 size={12} />;
            } else if (status === 'current-lost') {
              bg = '#fef2f2';
              color = '#b91c1c';
              borderColor = '#ef4444';
              icon = <X size={12} strokeWidth={3} />;
            } else if (status === 'past-lost') {
              bg = '#f8fafc';
              color = '#94a3b8';
              borderColor = '#e2e8f0';
              icon = <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#cbd5e1' }} />;
            } else {
              bg = '#ffffff';
              color = '#64748b';
              borderColor = '#e2e8f0';
              icon = <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#cbd5e1' }} />;
            }

            return (
              <div
                key={step.key}
                onClick={() => isClickable && handleStageSelect(step.key)}
                title={isClickable ? `Click to advance opportunity to ${step.label}` : 'Source Lead Converted'}
                style={{
                  background: bg,
                  border: `1.5px solid ${borderColor}`,
                  borderRadius: '8px',
                  padding: '8px 6px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  cursor: isClickable ? 'pointer' : 'default',
                  transition: 'all 0.15s ease',
                  boxShadow: status.startsWith('current') ? '0 2px 4px rgba(59, 130, 246, 0.12)' : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color, marginBottom: '2px' }}>
                  {icon}
                  <span style={{ fontSize: '0.72rem', fontWeight: 800 }}>
                    {idx === 0 ? 'Start' : `0${idx}`}
                  </span>
                </div>
                <div style={{ fontSize: '0.74rem', fontWeight: 700, color, lineHeight: 1.2 }}>
                  {step.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Lost Reason Banner / Alert (If marked Lost) */}
      {isLost && (
        <div
          style={{
            padding: '12px 16px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '10px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#b91c1c', fontWeight: 800, fontSize: '0.85rem' }}>
              <AlertTriangle size={16} />
              <span>Deal Marked as Lost</span>
            </div>
            {currentLostReason && (
              <span
                style={{
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '6px',
                  background: '#ffffff',
                  color: '#dc2626',
                  border: '1px solid #fca5a5',
                }}
              >
                Reason: {currentLostReason}
              </span>
            )}
          </div>
          {currentLostDetails && (
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#7f1d1d', lineHeight: 1.4 }}>
              <strong>Lost Remarks / Feedback:</strong> {currentLostDetails}
            </p>
          )}
        </div>
      )}

      {/* Won Celebration Banner */}
      {isWon && (
        <div
          style={{
            padding: '12px 16px',
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <CheckCircle2 size={20} color="#059669" />
          <div>
            <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#065f46' }}>
              Deal Won & Successfully Closed
            </div>
            <div style={{ fontSize: '0.78rem', color: '#047857' }}>
              Contract agreement secured and revenue realized for ₹{Number(dealValue).toLocaleString('en-IN')}.
            </div>
          </div>
        </div>
      )}

      {/* 4. Opportunity Key Details Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '14px',
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '10px',
          padding: '14px 16px',
        }}
      >
        {/* Deal Value */}
        <div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <DollarSign size={12} color="#059669" />
            <span>EXPECTED / DEAL VALUE</span>
          </div>
          <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#059669', marginTop: '2px' }}>
            ₹{Number(dealValue).toLocaleString('en-IN')}
          </div>
        </div>

        {/* Current Stage */}
        <div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Flag size={12} color="#2563eb" />
            <span>CURRENT STAGE</span>
          </div>
          <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#1e293b', marginTop: '2px' }}>
            {currentStage}
          </div>
        </div>

        {/* Expected Closing Date */}
        <div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Calendar size={12} color="#d97706" />
            <span>EXPECTED CLOSING DATE</span>
          </div>
          <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#334155', marginTop: '2px' }}>
            {expectedDate}
          </div>
        </div>

        {/* Assigned Sales Representative / Owner */}
        <div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <UserIcon size={12} color="#7c3aed" />
            <span>ASSIGNED SALES OWNER</span>
          </div>
          <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#334155', marginTop: '2px' }}>
            {dealOwner}
          </div>
        </div>
      </div>

      {/* 5. Opportunity Remarks / Conversion Notes */}
      <div
        style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '10px',
          padding: '12px 16px',
        }}
      >
        <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#475569', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <FileText size={12} color="#64748b" />
          <span>OPPORTUNITY REMARKS & DEAL NOTES</span>
        </div>
        <p style={{ margin: 0, fontSize: '0.84rem', color: '#334155', lineHeight: 1.4 }}>
          {remarksText}
        </p>
      </div>

      {/* 6. Lost Reason Capture Dialog Modal */}
      {showLostDialog && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            zIndex: 1300,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => setShowLostDialog(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              maxWidth: '480px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
              border: '1px solid #e2e8f0',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#dc2626' }}>
                <AlertTriangle size={20} />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Record Lost Reason</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowLostDialog(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ margin: '0 0 16px 0', fontSize: '0.84rem', color: '#64748b' }}>
              Specify the primary reason why Opportunity <strong>{oppReadableId}</strong> was lost to maintain CRM attribution.
            </p>

            <form onSubmit={handleConfirmLost}>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.82rem' }}>
                  Primary Lost Reason <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  className="form-control"
                  value={lostReason}
                  onChange={(e) => setLostReason(e.target.value)}
                  style={{ fontSize: '0.85rem' }}
                >
                  <option value="Price too high">Price too high</option>
                  <option value="Competitor selected">Competitor selected</option>
                  <option value="Budget unavailable">Budget unavailable</option>
                  <option value="Requirement changed">Requirement changed</option>
                  <option value="Not interested">Not interested</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '18px' }}>
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.82rem' }}>
                  Lost Remarks / Feedback (Optional)
                </label>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="Add details, competitor pricing, customer feedback..."
                  value={lostRemarks}
                  onChange={(e) => setLostRemarks(e.target.value)}
                  style={{ fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowLostDialog(false)}
                  disabled={updating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-danger"
                  disabled={updating}
                  style={{ background: '#dc2626', borderColor: '#dc2626', minWidth: '120px' }}
                >
                  {updating ? 'Saving...' : 'Confirm Lost'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadOpportunitySection;
