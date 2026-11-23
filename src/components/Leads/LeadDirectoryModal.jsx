import React, { useState, useEffect } from 'react';
import { EnhancedLeadTable } from './EnhancedLeadTable';
import { LeadKanbanBoard } from './LeadKanbanBoard';
import { SLAMonitorTab } from './SLAMonitorTab';
import { DispositionMatrixTab } from './DispositionMatrixTab';
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
  Zap,
  PhoneCall,
} from 'lucide-react';

export const LeadDirectoryModal = ({ isOpen, onClose }) => {
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'kanban' | 'sla' | 'matrix'
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
        padding: '24px',
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '14px',
          width: '92%',
          maxWidth: '960px',
          maxHeight: '75vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 45px -10px rgba(15, 23, 42, 0.25)',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '12px 18px',
            paddingRight: '56px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(to right, #ffffff, #f8fafc)',
            gap: '12px',
            flexShrink: 0,
            position: 'relative',
          }}
        >
          {/* Left Title & Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: '#eff6ff',
                color: '#2563eb',
                border: '1.5px solid #bfdbfe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(37, 99, 235, 0.12)',
                flexShrink: 0,
              }}
            >
              <Layers size={18} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                <h2
                  style={{
                    margin: 0,
                    fontSize: '1.05rem',
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
                    padding: '2px 8px',
                    borderRadius: '999px',
                    backgroundColor: '#eff6ff',
                    color: '#2563eb',
                    border: '1px solid #bfdbfe',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                  }}
                >
                  CRM Registry
                </span>
              </div>
              <p
                style={{
                  margin: '1px 0 0 0',
                  fontSize: '0.76rem',
                  color: '#64748b',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                Prospect registry, pipeline stages, SLAs, and outreach matrix.
              </p>
            </div>
          </div>

          {/* Right Action Area: 4-Pill View Mode Switcher + Import + Export */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            {/* 4-Pill View Mode Switcher */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
                background: '#f1f5f9',
                padding: '2px',
                borderRadius: '8px',
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
                  padding: '4px 9px',
                  borderRadius: '6px',
                  border: 'none',
                  background: viewMode === 'table' ? '#ffffff' : 'transparent',
                  color: viewMode === 'table' ? '#2563eb' : '#64748b',
                  fontWeight: 700,
                  fontSize: '0.74rem',
                  cursor: 'pointer',
                  boxShadow: viewMode === 'table' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <TableIcon size={12} />
                <span>Table</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('kanban')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 9px',
                  borderRadius: '6px',
                  border: 'none',
                  background: viewMode === 'kanban' ? '#ffffff' : 'transparent',
                  color: viewMode === 'kanban' ? '#2563eb' : '#64748b',
                  fontWeight: 700,
                  fontSize: '0.74rem',
                  cursor: 'pointer',
                  boxShadow: viewMode === 'kanban' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <LayoutGrid size={12} />
                <span>Kanban</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('sla')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 9px',
                  borderRadius: '6px',
                  border: 'none',
                  background: viewMode === 'sla' ? '#ffffff' : 'transparent',
                  color: viewMode === 'sla' ? '#d97706' : '#64748b',
                  fontWeight: 700,
                  fontSize: '0.74rem',
                  cursor: 'pointer',
                  boxShadow: viewMode === 'sla' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <Zap size={12} color={viewMode === 'sla' ? '#d97706' : '#64748b'} />
                <span>SLA Monitor</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('matrix')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 9px',
                  borderRadius: '6px',
                  border: 'none',
                  background: viewMode === 'matrix' ? '#ffffff' : 'transparent',
                  color: viewMode === 'matrix' ? '#059669' : '#64748b',
                  fontWeight: 700,
                  fontSize: '0.74rem',
                  cursor: 'pointer',
                  boxShadow: viewMode === 'matrix' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <PhoneCall size={12} color={viewMode === 'matrix' ? '#059669' : '#64748b'} />
                <span>Outreach Matrix</span>
              </button>
            </div>

            {/* Separator */}
            <div style={{ width: '1px', height: '18px', backgroundColor: '#e2e8f0', margin: '0 1px' }} />

            {/* Import Leads */}
            <button
              type="button"
              onClick={openImportModal}
              id="btn-lead-dir-import-leads"
              title="Bulk import leads from Excel or CSV file"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '5px 10px',
                borderRadius: '7px',
                fontWeight: 700,
                fontSize: '0.75rem',
                backgroundColor: '#ffffff',
                color: '#059669',
                border: '1px solid #a7f3d0',
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#ecfdf5';
                e.currentTarget.style.borderColor = '#6ee7b7';
                e.currentTarget.style.color = '#047857';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#ffffff';
                e.currentTarget.style.borderColor = '#a7f3d0';
                e.currentTarget.style.color = '#059669';
              }}
            >
              <Upload size={13} />
              <span>Import Leads</span>
            </button>

            {/* Export */}
            <button
              type="button"
              onClick={openExportModal}
              id="btn-lead-dir-export-leads"
              title="Export leads to Excel spreadsheet"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '5px 10px',
                borderRadius: '7px',
                fontWeight: 700,
                fontSize: '0.75rem',
                backgroundColor: '#ffffff',
                color: '#475569',
                border: '1px solid #e2e8f0',
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f8fafc';
                e.currentTarget.style.borderColor = '#cbd5e1';
                e.currentTarget.style.color = '#1e293b';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#ffffff';
                e.currentTarget.style.borderColor = '#e2e8f0';
                e.currentTarget.style.color = '#475569';
              }}
            >
              <Download size={13} />
              <span>Export</span>
            </button>
          </div>

          {/* Dedicated Top-Right Corner Close Button (Permanently Fixed in Corner) */}
          <button
            type="button"
            onClick={onClose}
            id="btn-close-lead-dir-modal"
            style={{
              position: 'absolute',
              top: '12px',
              right: '16px',
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              border: 'none',
              backgroundColor: '#f1f5f9',
              color: '#64748b',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
              zIndex: 10,
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
            <X size={15} />
          </button>
        </div>

        {/* Modal Body */}
        <div
          style={{
            padding: '14px 18px',
            backgroundColor: '#f8fafc',
            overflowY: 'auto',
            flex: '1 1 auto',
            minHeight: 0,
          }}
        >
          {viewMode === 'table' && <EnhancedLeadTable />}
          {viewMode === 'kanban' && <LeadKanbanBoard />}
          {viewMode === 'sla' && <SLAMonitorTab />}
          {viewMode === 'matrix' && <DispositionMatrixTab />}
        </div>
      </div>
    </div>
  );
};

export default LeadDirectoryModal;
