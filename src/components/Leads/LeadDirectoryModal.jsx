import React, { useState, useEffect } from 'react';
import { EnhancedLeadTable } from './EnhancedLeadTable';
import { LeadKanbanBoard } from './LeadKanbanBoard';
import { LeadImportModal } from './LeadImportModal';
import { LeadExportModal } from './LeadExportModal';
import { useLeads } from '../../context/LeadContext';
import {
  Layers,
  X,
  Table as TableIcon,
  LayoutGrid,
  Plus,
  Upload,
  Download,
} from 'lucide-react';

export const LeadDirectoryModal = ({ isOpen, onClose }) => {
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'kanban'
  const {
    openCreateModal,
    isImportModalOpen,
    openImportModal,
    closeImportModal,
    isExportModalOpen,
    openExportModal,
    closeExportModal,
  } = useLeads();

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
          borderRadius: '24px',
          width: '100%',
          maxWidth: '1240px',
          maxHeight: '94vh',
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
            padding: '18px 26px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(to right, #ffffff, #f8fafc)',
            flexWrap: 'wrap',
            gap: '12px',
            flexShrink: 0,
          }}
        >
          {/* Left Title & Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '13px',
                backgroundColor: '#eff6ff',
                color: '#2563eb',
                border: '1.5px solid #bfdbfe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.15)',
                flexShrink: 0,
              }}
            >
              <Layers size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h2
                  style={{
                    margin: 0,
                    fontSize: '1.22rem',
                    fontWeight: 800,
                    color: '#0f172a',
                    letterSpacing: '-0.01em',
                  }}
                >
                  Lead Directory & Actions
                </h2>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '2px 9px',
                    borderRadius: '999px',
                    backgroundColor: '#eff6ff',
                    color: '#2563eb',
                    border: '1px solid #bfdbfe',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                  }}
                >
                  CRM Registry
                </span>
              </div>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                Comprehensive CRM prospect registry, call scheduling, disposition management, and conversion pipeline.
              </p>
            </div>
          </div>

          {/* Right Action Area: + Add Lead | Import Leads | Export | View Mode | Close */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {/* 1. Primary Action: + Add Lead */}
            <button
              type="button"
              onClick={openCreateModal}
              id="btn-lead-dir-add-lead"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '7px 13px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.78rem',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(37, 99, 235, 0.2)',
                transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#1d4ed8';
                e.currentTarget.style.boxShadow = '0 4px 10px rgba(37, 99, 235, 0.3)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#2563eb';
                e.currentTarget.style.boxShadow = '0 2px 6px rgba(37, 99, 235, 0.2)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <Plus size={14} />
              <span>Add Lead</span>
            </button>

            {/* 2. Compact Action: Import Leads */}
            <button
              type="button"
              onClick={openImportModal}
              id="btn-lead-dir-import-leads"
              title="Bulk import leads from Excel or CSV file"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '7px 12px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.78rem',
                backgroundColor: '#ffffff',
                color: '#059669',
                border: '1px solid #a7f3d0',
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#ecfdf5';
                e.currentTarget.style.borderColor = '#6ee7b7';
                e.currentTarget.style.color = '#047857';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 3px 8px rgba(5, 150, 105, 0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#ffffff';
                e.currentTarget.style.borderColor = '#a7f3d0';
                e.currentTarget.style.color = '#059669';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.04)';
              }}
            >
              <Upload size={14} />
              <span>Import Leads</span>
            </button>

            {/* 3. Compact Action: Export */}
            <button
              type="button"
              onClick={openExportModal}
              id="btn-lead-dir-export-leads"
              title="Export leads to Excel spreadsheet"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '7px 12px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.78rem',
                backgroundColor: '#ffffff',
                color: '#475569',
                border: '1px solid #e2e8f0',
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f8fafc';
                e.currentTarget.style.borderColor = '#cbd5e1';
                e.currentTarget.style.color = '#1e293b';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 3px 8px rgba(0, 0, 0, 0.06)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#ffffff';
                e.currentTarget.style.borderColor = '#e2e8f0';
                e.currentTarget.style.color = '#475569';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.04)';
              }}
            >
              <Download size={14} />
              <span>Export</span>
            </button>

            {/* Separator */}
            <div style={{ width: '1px', height: '22px', backgroundColor: '#e2e8f0', margin: '0 2px' }} />

            {/* View Mode Toggle */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                background: '#f1f5f9',
                padding: '3px',
                borderRadius: '9px',
                border: '1px solid #e2e8f0',
              }}
            >
              <button
                type="button"
                onClick={() => setViewMode('table')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '5px 10px',
                  borderRadius: '7px',
                  border: 'none',
                  background: viewMode === 'table' ? '#ffffff' : 'transparent',
                  color: viewMode === 'table' ? '#2563eb' : '#64748b',
                  fontWeight: 700,
                  fontSize: '0.76rem',
                  cursor: 'pointer',
                  boxShadow: viewMode === 'table' ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <TableIcon size={13} />
                <span>Table</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('kanban')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '5px 10px',
                  borderRadius: '7px',
                  border: 'none',
                  background: viewMode === 'kanban' ? '#ffffff' : 'transparent',
                  color: viewMode === 'kanban' ? '#2563eb' : '#64748b',
                  fontWeight: 700,
                  fontSize: '0.76rem',
                  cursor: 'pointer',
                  boxShadow: viewMode === 'kanban' ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <LayoutGrid size={13} />
                <span>Kanban</span>
              </button>
            </div>

            {/* Separator */}
            <div style={{ width: '1px', height: '22px', backgroundColor: '#e2e8f0', margin: '0 2px' }} />

            {/* Dedicated Top-Right Close Button */}
            <button
              type="button"
              onClick={onClose}
              id="btn-close-lead-dir-modal"
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
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div
          style={{
            padding: '24px 28px',
            backgroundColor: '#f8fafc',
            overflowY: 'auto',
            flex: '1 1 auto',
            minHeight: 0,
          }}
        >
          {viewMode === 'table' ? <EnhancedLeadTable /> : <LeadKanbanBoard />}
        </div>
      </div>

      {/* Nested CRM Import & Export Modals */}
      <LeadImportModal
        isOpen={isImportModalOpen}
        onClose={closeImportModal}
      />
      <LeadExportModal
        isOpen={isExportModalOpen}
        onClose={closeExportModal}
      />
    </div>
  );
};

export default LeadDirectoryModal;
