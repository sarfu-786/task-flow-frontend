import React, { useState, useEffect } from 'react';
import { ProjectReportsView } from './ProjectReportsView';
import { ProjectMISDashboard } from './ProjectMISDashboard';
import { ProjectExportModal } from './ProjectExportModal';
import {
  FileSpreadsheet,
  BarChart3,
  FileText,
  X,
  Download,
  Sparkles,
} from 'lucide-react';

export const ProjectReportsModal = ({ isOpen, onClose, initialTab = 'reports', onViewProject }) => {
  const [activeTab, setActiveTab] = useState(initialTab); // 'reports' | 'mis'
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, isOpen]);

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
        zIndex: 1050,
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
          boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.35)',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          animation: 'slideUp 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(to right, #ffffff, #f8fafc)',
            flexShrink: 0,
            gap: '16px',
            position: 'relative',
          }}
        >
          {/* Left Title & Subtitle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0, flex: 1 }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                backgroundColor: '#f0f9ff',
                color: '#0284c7',
                border: '1.5px solid #bae6fd',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(2, 132, 199, 0.12)',
                flexShrink: 0,
              }}
            >
              <FileSpreadsheet size={22} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h2
                  style={{
                    margin: 0,
                    fontSize: '1.2rem',
                    fontWeight: 800,
                    color: '#0f172a',
                    letterSpacing: '-0.015em',
                  }}
                >
                  Project Reports & Portfolio MIS
                </h2>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '2px 9px',
                    borderRadius: '999px',
                    backgroundColor: '#e0f2fe',
                    color: '#0369a1',
                    border: '1px solid #bae6fd',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    letterSpacing: '0.02em',
                  }}
                >
                  <Sparkles size={11} />
                  <span>Executive MIS Hub</span>
                </span>
              </div>
              <p
                style={{
                  margin: '3px 0 0 0',
                  fontSize: '0.82rem',
                  color: '#64748b',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  lineHeight: '1.3',
                }}
              >
                Access all project status breakdowns, milestone velocity, resource capacity, financial variances, and other project insights.
              </p>
            </div>
          </div>

          {/* Top-Right Action Controls: Tabs + Export + Dedicated Close Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
            {/* View Mode Switcher */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: '#f1f5f9',
                padding: '3px',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
              }}
            >
              <button
                type="button"
                id="btn-modal-tab-reports"
                onClick={() => setActiveTab('reports')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  fontWeight: activeTab === 'reports' ? 800 : 600,
                  color: activeTab === 'reports' ? '#0284c7' : '#64748b',
                  backgroundColor: activeTab === 'reports' ? '#ffffff' : 'transparent',
                  border: 'none',
                  boxShadow: activeTab === 'reports' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <FileText size={14} />
                <span>Reports Register</span>
              </button>

              <button
                type="button"
                id="btn-modal-tab-mis"
                onClick={() => setActiveTab('mis')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  fontWeight: activeTab === 'mis' ? 800 : 600,
                  color: activeTab === 'mis' ? '#0284c7' : '#64748b',
                  backgroundColor: activeTab === 'mis' ? '#ffffff' : 'transparent',
                  border: 'none',
                  boxShadow: activeTab === 'mis' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <BarChart3 size={14} />
                <span>Executive MIS</span>
              </button>
            </div>

            {/* Top-Level Export Button */}
            <button
              type="button"
              onClick={() => setIsExportModalOpen(true)}
              id="btn-project-modal-export"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                padding: '7px 14px',
                borderRadius: '10px',
                backgroundColor: '#ffffff',
                color: '#059669',
                border: '1.5px solid #a7f3d0',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#ecfdf5';
                e.currentTarget.style.borderColor = '#6ee7b7';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#ffffff';
                e.currentTarget.style.borderColor = '#a7f3d0';
              }}
              title="Export Projects Dataset"
            >
              <Download size={14} color="#059669" />
              <span>Export</span>
            </button>

            {/* Separator */}
            <div style={{ width: '1px', height: '22px', backgroundColor: '#e2e8f0' }} />

            {/* Dedicated Top-Right Close Button */}
            <button
              type="button"
              onClick={onClose}
              id="btn-close-project-reports-modal"
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                border: 'none',
                backgroundColor: '#f1f5f9',
                color: '#64748b',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
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
              <X size={17} />
            </button>
          </div>
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
          {activeTab === 'reports' ? (
            <ProjectReportsView />
          ) : (
            <ProjectMISDashboard
              onViewProject={(p) => {
                if (onViewProject) {
                  onClose();
                  onViewProject(p);
                }
              }}
            />
          )}
        </div>
      </div>

      {/* Embedded Export Modal */}
      <ProjectExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />
    </div>
  );
};

export default ProjectReportsModal;
