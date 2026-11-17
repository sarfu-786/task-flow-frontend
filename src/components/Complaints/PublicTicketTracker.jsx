import React, { useState } from 'react';
import { complaintApi } from '../../services/api';
import {
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Flame,
  ArrowLeft,
  ShieldCheck,
  Building,
  User,
  Calendar,
  Layers,
  FileText,
  HelpCircle,
} from 'lucide-react';

export const PublicTicketTracker = ({ onBackToSubmit, initialTicketNumber = '' }) => {
  const [ticketInput, setTicketInput] = useState(initialTicketNumber);
  const [ticketData, setTicketData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    const cleanNum = ticketInput.trim();
    if (!cleanNum) {
      setError('Please enter your Ticket ID (e.g. CMP-2026-00005)');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSearched(true);
      const res = await complaintApi.trackPublicTicket(cleanNum);
      setTicketData(res);
    } catch (err) {
      setError(err.message || 'Ticket not found. Please verify the ID and try again.');
      setTicketData(null);
    } finally {
      setLoading(false);
    }
  };

  // Helper to determine active step in ticket lifecycle
  const getStepIndex = (status) => {
    switch (status) {
      case 'Logged':
        return 0;
      case 'Assigned':
      case 'Under Investigation':
      case 'In Progress':
      case 'Awaiting Customer':
      case 'Escalated':
        return 1;
      case 'Resolved':
        return 2;
      case 'Closed':
        return 3;
      default:
        return 0;
    }
  };

  const steps = [
    { label: 'Ticket Logged', desc: 'Received & Queued' },
    { label: 'In Progress', desc: 'Investigation & Action' },
    { label: 'Resolved', desc: 'Solution Implemented' },
    { label: 'Closed', desc: 'Verified & Completed' },
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f0f4f8 0%, #e2e8f0 100%)',
        padding: '30px 16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      <div style={{ width: '100%', maxWidth: '780px' }}>
        {/* Top Header Card */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px',
          }}
        >
          <button
            type="button"
            onClick={onBackToSubmit}
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
            <ArrowLeft size={16} />
            Back to Support Portal
          </button>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.82rem',
              color: '#64748b',
              fontWeight: 500,
            }}
          >
            <ShieldCheck size={16} color="#059669" />
            Official Public Status Tracker
          </div>
        </div>

        {/* Search Card */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 4px 16px rgba(15, 23, 42, 0.06)',
            border: '1px solid #e2e8f0',
            marginBottom: '20px',
          }}
        >
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0' }}>
            Track Your Complaint Ticket
          </h2>
          <p style={{ fontSize: '0.86rem', color: '#64748b', margin: '0 0 16px 0' }}>
            Enter your unique complaint reference ID to view real-time resolution progress and agent updates.
          </p>

          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                type="text"
                value={ticketInput}
                onChange={(e) => setTicketInput(e.target.value)}
                placeholder="Enter Ticket ID (e.g. CMP-2026-00005)..."
                style={{
                  width: '100%',
                  height: '44px',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e1',
                  padding: '0 14px 0 38px',
                  fontSize: '0.92rem',
                  fontWeight: 600,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <Search
                size={18}
                color="#94a3b8"
                style={{ position: 'absolute', left: '12px', top: '13px' }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                height: '44px',
                padding: '0 24px',
                borderRadius: '10px',
                border: 'none',
                background: '#2563eb',
                color: '#ffffff',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)',
              }}
            >
              {loading ? 'Searching...' : 'Track Ticket'}
            </button>
          </form>

          {error && (
            <div
              style={{
                marginTop: '14px',
                padding: '10px 14px',
                background: '#fef2f2',
                border: '1px solid #fee2e2',
                borderRadius: '8px',
                color: '#dc2626',
                fontSize: '0.84rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <AlertTriangle size={16} />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Results Card */}
        {ticketData && (
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 4px 16px rgba(15, 23, 42, 0.06)',
              border: '1px solid #e2e8f0',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}
          >
            {/* Ticket Header & Status Pill */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                paddingBottom: '16px',
                borderBottom: '1px solid #f1f5f9',
              }}
            >
              <div>
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
                  Reference Ticket Number
                </span>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#2563eb' }}>
                  {ticketData.ticketNumber}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    padding: '6px 14px',
                    borderRadius: '999px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    background:
                      ticketData.status === 'Resolved'
                        ? '#dcfce7'
                        : ticketData.status === 'Closed'
                        ? '#f1f5f9'
                        : '#eff6ff',
                    color:
                      ticketData.status === 'Resolved'
                        ? '#15803d'
                        : ticketData.status === 'Closed'
                        ? '#475569'
                        : '#1d4ed8',
                    border: `1px solid ${
                      ticketData.status === 'Resolved'
                        ? '#86efac'
                        : ticketData.status === 'Closed'
                        ? '#cbd5e1'
                        : '#bfdbfe'
                    }`,
                  }}
                >
                  Status: {ticketData.status}
                </span>

                <span
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    background: '#f8fafc',
                    color: '#475569',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  Priority: {ticketData.priority}
                </span>
              </div>
            </div>

            {/* Stepper Progress Bar */}
            <div style={{ padding: '10px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
                {steps.map((st, i) => {
                  const currentStep = getStepIndex(ticketData.status);
                  const isDone = i <= currentStep;
                  const isCurrent = i === currentStep;

                  return (
                    <div
                      key={st.label}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        flex: 1,
                        position: 'relative',
                        zIndex: 2,
                      }}
                    >
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: isDone ? '#2563eb' : '#ffffff',
                          border: `2px solid ${isDone ? '#2563eb' : '#cbd5e1'}`,
                          color: isDone ? '#ffffff' : '#94a3b8',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          boxShadow: isCurrent ? '0 0 0 4px rgba(37, 99, 235, 0.2)' : 'none',
                        }}
                      >
                        {isDone ? <CheckCircle2 size={16} /> : i + 1}
                      </div>

                      <div
                        style={{
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          color: isDone ? '#0f172a' : '#94a3b8',
                          marginTop: '6px',
                          textAlign: 'center',
                        }}
                      >
                        {st.label}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#94a3b8', textAlign: 'center' }}>
                        {st.desc}
                      </div>
                    </div>
                  );
                })}

                {/* Progress Line behind steps */}
                <div
                  style={{
                    position: 'absolute',
                    top: '16px',
                    left: '12%',
                    right: '12%',
                    height: '2px',
                    background: '#e2e8f0',
                    zIndex: 1,
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      background: '#2563eb',
                      width: `${(getStepIndex(ticketData.status) / (steps.length - 1)) * 100}%`,
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Ticket Subject & Description Card */}
            <div
              style={{
                background: '#f8fafc',
                borderRadius: '12px',
                padding: '16px',
                border: '1px solid #e2e8f0',
              }}
            >
              <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
                Complaint Subject
              </div>
              <div style={{ fontSize: '0.98rem', fontWeight: 700, color: '#0f172a', margin: '2px 0 10px 0' }}>
                {ticketData.subject}
              </div>

              <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
                Description
              </div>
              <div style={{ fontSize: '0.88rem', color: '#334155', lineHeight: 1.5, marginTop: '2px', whiteSpace: 'pre-wrap' }}>
                {ticketData.description}
              </div>
            </div>

            {/* Metadata Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '12px',
              }}
            >
              <div style={{ padding: '10px 14px', background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', display: 'block' }}>LOGGED BY</span>
                <span style={{ fontSize: '0.86rem', fontWeight: 600, color: '#1e293b' }}>{ticketData.customerName}</span>
                <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block' }}>{ticketData.organization}</span>
              </div>

              <div style={{ padding: '10px 14px', background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', display: 'block' }}>SUBMISSION DATE</span>
                <span style={{ fontSize: '0.86rem', fontWeight: 600, color: '#1e293b' }}>
                  {ticketData.createdAt ? new Date(ticketData.createdAt).toLocaleDateString() : '—'}
                </span>
                <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block' }}>
                  {ticketData.createdAt ? new Date(ticketData.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                </span>
              </div>

              <div style={{ padding: '10px 14px', background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', display: 'block' }}>ASSIGNED SUPPORT</span>
                <span style={{ fontSize: '0.86rem', fontWeight: 600, color: '#2563eb' }}>{ticketData.assignedToName}</span>
                <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block' }}>Team: {ticketData.team || 'Support'}</span>
              </div>

              <div style={{ padding: '10px 14px', background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', display: 'block' }}>SLA RESOLUTION STATUS</span>
                <span
                  style={{
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    color: ticketData.slaStatus === 'Breached' ? '#dc2626' : '#16a34a',
                  }}
                >
                  {ticketData.slaStatus || 'On Track'}
                </span>
              </div>
            </div>

            {/* Resolution Box (If Resolved) */}
            {ticketData.resolvedAt && (
              <div
                style={{
                  background: '#f0fdf4',
                  border: '1.5px solid #bbf7d0',
                  borderRadius: '12px',
                  padding: '16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#15803d', fontWeight: 700, fontSize: '0.88rem' }}>
                  <CheckCircle2 size={16} />
                  Resolution Summary
                </div>
                <div style={{ fontSize: '0.86rem', color: '#166534', marginTop: '4px', lineHeight: 1.5 }}>
                  {ticketData.resolutionSummary || 'The reported issue has been resolved by our support team.'}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#4ade80', marginTop: '6px' }}>
                  Resolved on: {new Date(ticketData.resolvedAt).toLocaleString()}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
