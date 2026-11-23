import React, { useState, useEffect } from 'react';
import { MISReportsDashboard } from './MISReportsDashboard';
import { ExecutiveWidgets } from './ExecutiveWidgets';
import { LeadExportModal } from './LeadExportModal';
import {
  FileSpreadsheet,
  X,
  Download,
  TrendingUp,
  BarChart3,
} from 'lucide-react';

export const MISReportsModal = ({ isOpen, onClose }) => {
  const [misViewMode, setMisViewMode] = useState('widgets'); // 'widgets' | 'reports'
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Lock body scroll and handle ESC key
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = 'unset';
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          width: '89vw',
          maxWidth: '1350px',
          height: '81vh',
          maxHeight: '82vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.3)',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '14px 22px',
            paddingRight: '56px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(to right, #ffffff, #f8fafc)',
            flexShrink: 0,
            gap: '14px',
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
            <div
              style={{
                width: '40px',
                height: '40px',
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
              <FileSpreadsheet size={22} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h2
                  style={{
                    margin: 0,
                    fontSize: '1.15rem',
                    fontWeight: 800,
                    color: '#0f172a',
                    letterSpacing: '-0.01em',
                  }}
                >
                  MIS Reports & Analytics
                </h2>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '2px 8px',
                    borderRadius: '999px',
                    backgroundColor: '#ecfdf5',
                    color: '#059669',
                    border: '1px solid #a7f3d0',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                  }}
                >
                  Management Information System
                </span>
              </div>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Funnel velocity, agent efficiency, disposition breakdown, pipeline aging, and channel attribution analytics.
              </p>
            </div>
          </div>

          {/* Top-Right Action Controls: View Switcher + Primary [ Export ] + Dedicated Close Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            {/* View Switcher: Executive Widgets vs MIS Reports */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                background: '#f1f5f9',
                padding: '3px',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
              }}
            >
              <button
                type="button"
                onClick={() => setMisViewMode('widgets')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '5px 11px',
                  borderRadius: '7px',
                  border: 'none',
                  background: misViewMode === 'widgets' ? '#ffffff' : 'transparent',
                  color: misViewMode === 'widgets' ? '#059669' : '#64748b',
                  fontWeight: 700,
                  fontSize: '0.76rem',
                  cursor: 'pointer',
                  boxShadow: misViewMode === 'widgets' ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <TrendingUp size={13} />
                <span>Executive Analytics</span>
              </button>
              <button
                type="button"
                onClick={() => setMisViewMode('reports')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '5px 11px',
                  borderRadius: '7px',
                  border: 'none',
                  background: misViewMode === 'reports' ? '#ffffff' : 'transparent',
                  color: misViewMode === 'reports' ? '#059669' : '#64748b',
                  fontWeight: 700,
                  fontSize: '0.76rem',
                  cursor: 'pointer',
                  boxShadow: misViewMode === 'reports' ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <BarChart3 size={13} />
                <span>MIS Operational Reports</span>
              </button>
            </div>

            {/* Separator */}
            <div style={{ width: '1px', height: '20px', backgroundColor: '#e2e8f0', margin: '0 2px' }} />

            {/* Primary Export Button */}
            <button
              type="button"
              onClick={() => setIsExportModalOpen(true)}
              id="btn-lead-mis-export"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '8px',
                backgroundColor: '#ffffff',
                color: '#059669',
                border: '1.5px solid #a7f3d0',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#ecfdf5';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#ffffff';
              }}
              title="Export Leads to Excel (.xlsx only)"
            >
              <Download size={15} />
              <span>Export</span>
            </button>
          </div>

          {/* Dedicated Top-Right Cut/Close Button - Permanently Locked */}
          <button
            type="button"
            onClick={onClose}
            id="btn-close-lead-mis-modal"
            style={{
              position: 'absolute',
              top: '12px',
              right: '14px',
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
              flexShrink: 0,
              zIndex: 10,
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#fee2e2';
              e.currentTarget.style.color = '#dc2626';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#f1f5f9';
              e.currentTarget.style.color = '#64748b';
            }}
            aria-label="Close modal"
            title="Close modal"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div
          style={{
            padding: '20px 24px',
            backgroundColor: '#f8fafc',
            overflowY: 'auto',
            flex: '1 1 auto',
            minHeight: 0,
          }}
        >
          {misViewMode === 'widgets' ? (
            <ExecutiveWidgets />
          ) : (
            <MISReportsDashboard />
          )}
        </div>
      </div>

      {/* Separate Lead Export Modal (.xlsx only) */}
      <LeadExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />
    </div>
  );
};

export default MISReportsModal;
